// server.js

const express = require('express');
const { Client } = require('@notionhq/client');
const cors = require('cors');
const fs = require('fs'); // ADDED: To read the MCC.json file
const path = require('path'); // ADDED: To help locate the MCC.json file
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 3001;


const notion = new Client({ auth: process.env.NOTION_API_KEY });

const transactionsDbId = process.env.NOTION_TRANSACTIONS_DB_ID;
const cardsDbId = process.env.NOTION_CARDS_DB_ID;
const rulesDbId = process.env.NOTION_RULES_DB_ID;
const monthlySummaryDbId = process.env.NOTION_MONTHLY_SUMMARY_DB_ID; // ADDED: For the new database
const monthlyCategoryDbId = process.env.NOTION_MONTHLY_CATEGORY_DB_ID;

const mapTransaction = (tx) => ({
    id: tx.id,
    'Transaction Name': tx.properties['Transaction Name']?.title[0]?.plain_text || 'N/A',
    'Amount': tx.properties['Amount']?.number,
    'Transaction Date': tx.properties['Transaction Date']?.date?.start,
    'Card': tx.properties['Card']?.relation?.map(r => r.id),
    'Category': tx.properties['Category']?.select?.name,
    'MCC Code': tx.properties['MCC Code']?.rich_text[0]?.plain_text || null,
    'estCashback': tx.properties['estCashback']?.formula?.number,
});


// Helper function to safely extract properties from a Notion page
const parseNotionPageProperties = (page) => {
    const props = page.properties;
    const result = { id: page.id };

    for (const key in props) {
        const prop = props[key];
        switch (prop.type) {
            case 'title':
                result[key] = prop.title[0]?.plain_text || null;
                break;
            case 'rich_text':
            case 'text': // Note: The Notion API often uses 'text' for Text properties
                result[key] = prop[prop.type][0]?.plain_text || null;
                break;
            case 'number':
                result[key] = prop.number;
                break;
            case 'select':
                result[key] = prop.select?.name || null;
                break;
            case 'date':
                result[key] = prop.date?.start || null;
                break;
            case 'formula':
                // Formulas can return different types
                if (prop.formula.type === 'number') result[key] = prop.formula.number;
                else if (prop.formula.type === 'string') result[key] = prop.formula.string;
                else if (prop.formula.type === 'date') result[key] = prop.formula.date?.start;
                break;
            case 'relation':
                 // Return an array of related page IDs
                result[key] = prop.relation.map(rel => rel.id);
                break;
            // ADD THIS NEW CASE FOR ROLLUPS
            case 'rollup':
                // Rollups can also return different types, we'll handle number for now
                if (prop.rollup.type === 'number') {
                    result[key] = prop.rollup.number;
                }
                // You could add more handlers here for other rollup types if needed
                break;
            default:
                result[key] = prop; // Keep the original object for unhandled types
        }
    }
    return result;
};


// Fetch Transactions (UPDATED to filter by month)
app.get('/api/transactions', async (req, res) => {
    // Get the month from the query parameters (e.g., "202508")
    const { month } = req.query;

    if (!month || month.length !== 6) {
        return res.status(400).json({ error: 'A month query parameter in YYYYMM format is required.' });
    }

    try {
        const year = parseInt(month.substring(0, 4), 10);
        const monthIndex = parseInt(month.substring(4, 6), 10) - 1; // JS months are 0-indexed

        const startDate = new Date(year, monthIndex, 1);
        const endDate = new Date(year, monthIndex + 1, 0); // The 0th day of the next month is the last day of the current month

        const allResults = [];
        let nextCursor = undefined;

        // This is the updated filter that we send to Notion
        const filter = {
            // The key is now the actual property name from Notion
            'Transaction Date': { 
                date: {
                    on_or_after: startDate.toISOString().split('T')[0],
                    on_or_before: endDate.toISOString().split('T')[0],
                }
            },
        };

        do {
            const response = await notion.databases.query({
                database_id: transactionsDbId,
                filter: filter, // Apply the updated filter to the query
                start_cursor: nextCursor,
                sorts: [{ property: 'Transaction Date', direction: 'descending' }],
            });

            allResults.push(...response.results);
            nextCursor = response.next_cursor;
        } while (nextCursor);

        const results = allResults.map(page => {
            const props = parseNotionPageProperties(page);
            return {
                ...props, // Keep all original properties
                estCashback: props['Estimated Cashback'] || 0, // Create the 'estCashback' property
            };
        });
        res.json(results);

    } catch (error) {
        console.error('Failed to fetch transactions:', error);
        res.status(500).json({ error: 'Failed to fetch data from Notion' });
    }
});


// Fetch All Cards
app.get('/api/cards', async (req, res) => {
    try {
        const response = await notion.databases.query({ database_id: cardsDbId });
        // UPDATED: Renaming properties to be more JS-friendly
        const results = response.results.map(page => {
            const parsed = parseNotionPageProperties(page);
            return {
                id: parsed.id,
                name: parsed['Card Name'],
                bank: parsed['Bank'],
                cardType: parsed['Card Type'],
                creditLimit: parsed['Credit Limit'],
                last4: parsed['Last 4 Digits'],
                statementDay: parsed['Statement Day'],
                paymentDueDay: parsed['Payment Due Day'],
                interestRateMonthly: parsed['Interest Rate (Monthly)'],
                estYtdCashback: parsed['Total Cashback - Formula'], // Formula (YTD)
                limitPerCategory: parsed['Limit per Category'],
                overallMonthlyLimit: parsed['Overall Monthly Limit'],
                annualFee: parsed['Annual Fee'],
                totalSpendingYtd: parsed['Total Spending - Formula'],
                minimumMonthlySpend: parsed['Minimum Monthly Spend'],
                nextAnnualFeeDate: parsed['Next Annual Payment Date'],
                cardOpenDate: parsed['Card Open Date'],
            };
        });
        res.json(results);
    } catch (error) {
        console.error('Failed to fetch cards:', error);
        res.status(500).json({ error: 'Failed to fetch data from Notion' });
    }
});


// Fetch All Rules
app.get('/api/rules', async (req, res) => {
    try {
        const response = await notion.databases.query({ database_id: rulesDbId });
         // UPDATED: Renaming properties to be more JS-friendly
        const results = response.results.map(page => {
            const parsed = parseNotionPageProperties(page);
            return {
                id: parsed.id,
                ruleName: parsed['Rule Name'],
                cardId: parsed['Card'] ? parsed['Card'][0] : null, // Assuming one card per rule
                category: parsed['Category'],
                rate: parsed['Cashback Rate'],
                capPerTransaction: parsed['Limit per Transaction'],
            };
        });
        res.json(results);
    } catch (error) {
        console.error('Failed to fetch rules:', error);
        res.status(500).json({ error: 'Failed to fetch data from Notion' });
    }
});

// ADDED: Fetch Monthly Summary for Trend Chart
app.get('/api/monthly-summary', async (req, res) => {
    try {
        const response = await notion.databases.query({
            database_id: monthlySummaryDbId,
            sorts: [{ property: 'Month', direction: 'ascending' }] // Sort by month
        });
        const results = response.results.map(page => {

            const parsed = parseNotionPageProperties(page);
            return {
                id: parsed.id,
                month: parsed['Month'],
                cardId: parsed['Card'] ? parsed['Card'][0] : null,
                spend: parsed['Total Spend - Formula'],
                cashback: parsed['Calculated Cashback'],
                actualCashback: parsed['Actual Cashback'],
            };
        });
        res.json(results);
    } catch (error) {
        console.error('Failed to fetch monthly summary:', error);
        res.status(500).json({ error: 'Failed to fetch data from Notion' });
    }
});


// ADDED: Fetch MCC Codes from local JSON file
app.get('/api/mcc-codes', (req, res) => {
    try {
        const mccPath = path.join(__dirname, 'MCC.json');
        const mccData = fs.readFileSync(mccPath, 'utf8');
        res.setHeader('Content-Type', 'application/json');
        res.send(mccData);
    } catch (error) {
        console.error('Failed to read MCC.json:', error);
        res.status(500).json({ error: 'Failed to load MCC data' });
    }
});


app.get('/api/monthly-category-summary', async (req, res) => {
    try {
        // This endpoint doesn't need pagination as category summaries are unlikely to exceed 100 per month
        const response = await notion.databases.query({
            database_id: monthlyCategoryDbId,
        });
        const results = response.results.map(page => {

            const parsed = parseNotionPageProperties(page);
            return {
                id: parsed.id,
                month: parsed['Month'],
                cardId: parsed['Card'] ? parsed['Card'][0] : null,
                cashback: parsed['Final Monthly Cashback'],
                summaryId: parsed['Summary ID'], 
                categoryLimit: parsed['Category Limit'],
            };
        });
        res.json(results);
    } catch (error) {
        console.error('Failed to fetch monthly category summary:', error);
        res.status(500).json({ error: 'Failed to fetch data from Notion' });
    }
});

app.get('/api/recent-transactions', async (req, res) => {
    try {
        const response = await notion.databases.query({
            database_id: transactionsDbId,
            // 1. Set the page size to 20 to get more items for the carousel
            page_size: 20, 
            // 2. Sort by the transaction date to ensure the newest ones are first
            sorts: [{
                property: 'Transaction Date',
                direction: 'descending',
            }],
        });

        // 3. Map over the results to clean up the data for the frontend
        const results = response.results.map(page => {
            const props = parseNotionPageProperties(page);
            return {
                ...props, // Keep all original properties from the parser
                // 4. Rename "Estimated Cashback" to "estCashback" for consistency
                estCashback: props['Estimated Cashback'] || 0, 
            };
        });
        
        res.json(results);

    } catch (error) {
        console.error('Failed to fetch recent transactions:', error);
        res.status(500).json({ error: 'Failed to fetch recent transactions' });
    }
});

app.post('/api/login', (req, res) => {
  const pin = String((req.body && req.body.pin) ?? '').trim();
  const correct = String(process.env.ACCESS_PASSWORD ?? '').trim();
  if (pin && pin === correct) return res.status(200).json({ success: true });
  return res.status(401).json({ success: false, message: 'Incorrect PIN' });
});

app.get('/api/mcc-search', async (req, res) => {
  const { keyword } = req.query;
  if (!keyword) {
    return res.status(400).json({ error: 'Search keyword is required' });
  }
  try {
    const fetch = (await import('node-fetch')).default;
    const mccResponse = await fetch(`https://tc-mcc.tungpun.site/mcc?keyword=${encodeURIComponent(keyword)}`);
    if (!mccResponse.ok) {
      throw new Error('Failed to fetch from external MCC API');
    }
    const data = await mccResponse.json();

    if (data.results) {
      data.results = data.results.slice(0, 10);
    }

    res.json(data);
  } catch (error) {
    console.error('MCC Search Error:', error);
    res.status(500).json({ error: 'Failed to search for MCC code' });
  }
});

// POST /api/transactions - Add a new transaction
app.post('/api/transactions', async (req, res) => {
    try {
        const {
            merchant,
            amount,
            date,
            cardId,
            category,
            mccCode,
            applicableRuleId,
            cardSummaryCategoryId, // This ID is now correctly used
        } = req.body;

        // 1. Start building the properties object for the Notion API
        const properties = {
            'Transaction Name': { title: [{ text: { content: merchant } }] },
            'Amount': { number: Number(String(amount).replace(/,/g, '')) },
            'Transaction Date': { date: { start: date } },
            'Card': { relation: [{ id: cardId }] },
        };

        // 2. Conditionally add optional properties to avoid errors
        
        // Only add Category if one was actually selected
        if (category) {
            properties['Category'] = { select: { name: category } };
        }
        
        if (mccCode) {
            properties['MCC Code'] = { rich_text: [{ text: { content: String(mccCode) } }] };
        }
        
        if (applicableRuleId) {
            properties['Applicable Rule'] = { relation: [{ id: applicableRuleId }] };
        }

        // FIX: Add the relation to the Monthly Summary table if an ID is provided
        if (cardSummaryCategoryId) {
            // Ensure this property name matches your Notion database exactly
            properties['Card Summary Category'] = { relation: [{ id: cardSummaryCategoryId }] };
        }

        // 3. Create the new page (transaction) in Notion
        const newPage = await notion.pages.create({
            parent: { database_id: transactionsDbId },
            properties,
        });

        // 4. Retrieve and return the newly created transaction
        const populatedPage = await notion.pages.retrieve({ page_id: newPage.id });
        const formattedTransaction = mapTransaction(populatedPage);
        
        res.status(201).json(formattedTransaction);

    } catch (error) {
        console.error('Error adding transaction to Notion:', error.body || error);
        res.status(500).json({ error: 'Failed to add transaction. Check server logs.' });
    }
});

// GET /api/categories - Retrieve all unique category options from the Transactions database
app.get('/api/categories', async (req, res) => {
    try {
        // Retrieve the database's schema information
        const database = await notion.databases.retrieve({ database_id: transactionsDbId });
        
        // Get the specific property for "Category"
        const categoryProperty = database.properties['Category'];

        // Check if it's a 'select' type and extract the options
        if (categoryProperty && categoryProperty.type === 'select') {
            const categories = categoryProperty.select.options.map(option => option.name);
            res.json(categories);
        } else {
            res.status(404).json({ error: 'Category property not found or is not a select property' });
        }
    } catch (error) {
        console.error('Error fetching categories from Notion:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// POST /api/summaries - Create a new monthly summary category
app.post('/api/summaries', async (req, res) => {
    try {
        const { cardId, month, ruleId } = req.body;

        if (!cardId || !month || !ruleId) {
            return res.status(400).json({ error: 'cardId, month, and ruleId are required' });
        }

        // You might want to fetch the rule name here to create a more descriptive summary name
        // For now, we'll use a simple name
        const rulePage = await notion.pages.retrieve({ page_id: ruleId });
        const ruleName = rulePage.properties['Rule Name']?.title[0]?.plain_text || 'Untitled Rule';

        const summaryName = `${month} - ${ruleName}`; 

        const newSummary = await notion.pages.create({
            parent: { database_id: monthlyCategoryDbId }, // Make sure you have a constant for your Summary DB ID
            properties: {
                'Summary ID': { title: [{ text: { content: summaryName } }] },
                'Card': { relation: [{ id: cardId }] },
                'Month': { select: { name: month } },
                // Add any other required fields for a new summary
            },
        });

        res.status(201).json({ id: newSummary.id, name: summaryName, cardId, month });
    } catch (error) {
        console.error('Error creating summary:', error);
        res.status(500).json({ error: 'Failed to create summary' });
    }
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
}

module.exports = { app };