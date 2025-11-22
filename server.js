// server.js

const express = require('express');
const { Client } = require('@notionhq/client');
const cors = require('cors');
const fs = require('fs'); // ADDED: To read the MCC.json file
const path = require('path'); // ADDED: To help locate the MCC.json file
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const mccDataPath = path.join(__dirname, 'MCC.json');
const mccData = JSON.parse(fs.readFileSync(mccDataPath, 'utf8'));

const app = express();
app.use(cors({
    origin: 'http://localhost:3000', // Or your frontend URL
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());
const port = process.env.PORT || 3001;


const notion = new Client({ auth: process.env.NOTION_API_KEY });

const transactionsDbId = process.env.NOTION_TRANSACTIONS_DB_ID;
const cardsDbId = process.env.NOTION_CARDS_DB_ID;
const rulesDbId = process.env.NOTION_RULES_DB_ID;
const monthlySummaryDbId = process.env.NOTION_MONTHLY_SUMMARY_DB_ID; // ADDED: For the new database
const monthlyCategoryDbId = process.env.NOTION_MONTHLY_CATEGORY_DB_ID;
const vendorsDbId = process.env.NOTION_VENDORS_DB_ID;

// Helper function to map Notion transaction page to a simpler object
const mapTransaction = (tx) => {
    const props = parseNotionPageProperties(tx);
    
    // Map Notion property names to the camelCase keys used in the frontend
    return {
        id: tx.id,
        'Transaction Name': props['Transaction Name'],
        'Amount': props['Amount'],
        'Transaction Date': props['Transaction Date'],
        'Card': props['Card'],
        'Category': props['Category'],
        'MCC Code': props['MCC Code'],
        'estCashback': props['Estimated Cashback'] || 0, // Formula field
        'Cashback Month': props['Cashback Month'], // Formula field
        'merchantLookup': props['Merchant'], // This is the Merchant Name field
        'notes': props['Notes'],
        'otherDiscounts': props['Other Discounts'],
        'otherFees': props['Other Fees'],
        'foreignCurrencyAmount': props['Foreign Currency'],
        'conversionFee': props['Conversion Fee'],
        'paidFor': props['Paid for'],
        'subCategory': props['Sub Category'],
        'billingDate': props['Billing Date'],
        'Applicable Rule': props['Applicable Rule'],
        'Card Summary Category': props['Card Summary Category'],
        'Match': props['Match'],
        'Automated': props['Automated'],
    };
};

// HELPER: Reusable function to find or create a Card Summary Category
const getOrCreateSummaryId = async (cardId, month, ruleId) => {
    try {
        // Get names for titles
        const cardPage = await notion.pages.retrieve({ page_id: cardId });
        const bankName = cardPage.properties['Bank']?.select?.name || 'Untitled Bank';
        
        const rulePage = await notion.pages.retrieve({ page_id: ruleId });
        const ruleName = rulePage.properties['Rule Name']?.title[0]?.plain_text || 'Untitled Rule';

        const summaryName = `${month} - ${ruleName}`;
        const trackerId = `${bankName} - ${month}`;

        // 1. Check if Summary exists
        const existingSummaryResponse = await notion.databases.query({
            database_id: process.env.NOTION_MONTHLY_CATEGORY_DB_ID,
            filter: {
                and: [
                    { property: 'Summary ID', title: { equals: summaryName } },
                    { property: 'Card', relation: { contains: cardId } },
                    { property: 'Month', select: { equals: month } },
                ],
            },
            page_size: 1,
        });

        if (existingSummaryResponse.results.length > 0) {
            return existingSummaryResponse.results[0].id;
        }

        // 2. If not, find/create Parent Tracker
        let trackerPageId;
        const trackerResponse = await notion.databases.query({
            database_id: process.env.NOTION_MONTHLY_SUMMARY_DB_ID,
            filter: { property: 'Tracker ID', title: { equals: trackerId } },
        });

        if (trackerResponse.results.length > 0) {
            trackerPageId = trackerResponse.results[0].id;
        } else {
            const newTracker = await notion.pages.create({
                parent: { database_id: process.env.NOTION_MONTHLY_SUMMARY_DB_ID },
                properties: {
                    'Tracker ID': { title: [{ text: { content: trackerId } }] },
                    'Card': { relation: [{ id: cardId }] },
                    'Month': { select: { name: month } },
                },
            });
            trackerPageId = newTracker.id;
        }

        // 3. Create new Summary
        const newSummary = await notion.pages.create({
            parent: { database_id: process.env.NOTION_MONTHLY_CATEGORY_DB_ID },
            properties: {
                'Summary ID': { title: [{ text: { content: summaryName } }] },
                'Card': { relation: [{ id: cardId }] },
                'Month': { select: { name: month } },
                'Cashback Rule': { relation: [{ id: ruleId }] },
                'Cashback Tracker': { relation: [{ id: trackerPageId }] },
            },
        });
        return newSummary.id;
    } catch (error) {
        console.error("Error in getOrCreateSummaryId", error);
        return null;
    }
};


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
                else if (prop.formula.type === 'boolean') result[key] = prop.formula.boolean; // <--- ADD THIS LINE
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
            case 'checkbox':
                result[key] = prop.checkbox; // This will be true or false
                break;
            case 'status':
                result[key] = prop.status?.name || null;
                break;
            case 'multi_select':
                result[key] = prop.multi_select.map(option => option.name);
                break;
            case 'created_time':
                result[key] = prop.created_time;
                break;
            default:
                console.warn(`Unhandled Notion property type: '${prop.type}' for key '${key}'`);
                result[key] = prop; // Keep the original object for unhandled types
        }
    }
    return result;
};

const getSelectOptions = async (propertyName) => {
    const db = await notion.databases.retrieve({ database_id: transactionsDbId });
    return db.properties[propertyName].select.options;
};

const addSelectOption = async (propertyName, optionName) => {
    const currentOptions = await getSelectOptions(propertyName);
    currentOptions.push({ name: optionName });
    await notion.databases.update({
        database_id: transactionsDbId,
        properties: {
            [propertyName]: {
                select: {
                    options: currentOptions,
                },
            },
        },
    });
};

app.post('/api/login', (req, res) => {
    const pin = String((req.body && req.body.pin) ?? '').trim();
    const correctPin = String(process.env.ACCESS_PASSWORD ?? '').trim();

    if (pin && pin === correctPin) {
        // Create a token that expires in 8 hours
        const token = jwt.sign({ user: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' });

        // Send token back in a secure, httpOnly cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 8 hours in milliseconds
        });

        return res.status(200).json({ success: true });
    }
    return res.status(401).json({ success: false, message: 'Incorrect PIN' });
});

app.post('/api/logout', (req, res) => {
    // Clear the cookie to log the user out
    res.clearCookie('token');
    res.status(200).json({ success: true, message: 'Logged out successfully.' });
});

// --- NEW: AUTH VERIFICATION MIDDLEWARE ---
const verifyToken = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }
        req.user = decoded; // Attach user info to the request
        next(); // Proceed to the protected route
    });
};

// This simple endpoint is for the frontend to check if a session is valid on page load
app.get('/api/verify-auth', verifyToken, (req, res) => {
    res.status(200).json({ success: true });
});


// --- APPLY MIDDLEWARE TO PROTECTED ROUTES ---
// All API routes below this point will require a valid token.

app.use(verifyToken);

app.get('/api/transactions', async (req, res) => {
    // Get 'month', 'filterBy', and 'cardId' from the query parameters.
    // 'filterBy' defaults to 'date' if not provided.
    const { month, filterBy = 'date', cardId } = req.query;

    // Validate that the 'month' parameter is present and correctly formatted.
    if (!month || month.length !== 6) {
        return res.status(400).json({ error: 'A month query parameter in YYYYMM format is required.' });
    }

    try {
        let filter; // This variable will hold the final filter object for the Notion API call.

        // This block builds the filter if the user wants to filter by "Cashback Month".
        if (filterBy === 'cashbackMonth') {
            const monthFilter = {
                property: 'Cashback Month',
                formula: {
                    string: {
                        equals: month,
                    },
                },
            };

            // If a specific cardId is also provided, we add it to the filter.
            if (cardId) {
                filter = {
                    and: [
                        monthFilter,
                        {
                            property: 'Card',
                            relation: {
                                contains: cardId,
                            },
                        }
                    ]
                };
            } else {
                filter = monthFilter;
            }
        } 
        else if (filterBy === 'statementMonth') {
            const monthFilter = {
                property: 'Statement Month', // Target the 'Statement Month' property
                formula: {
                    string: {
                        equals: month,
                    },
                },
            };

            if (cardId) {
                filter = {
                    and: [
                        monthFilter,
                        {
                            property: 'Card',
                            relation: {
                                contains: cardId,
                            },
                        }
                    ]
                };
            } else {
                filter = monthFilter;
            }
        }
        // This is the default block, which builds the filter for "Transaction Date".
        else {
            // Calculate the first and last day of the given month.
            const year = parseInt(month.substring(0, 4), 10);
            const monthIndex = parseInt(month.substring(4, 6), 10) - 1;
            const monthString = month.substring(4, 6);
            const lastDayOfMonth = new Date(year, monthIndex + 1, 0).getDate();
            const startDate = `${year}-${monthString}-01`;
            const endDate = `${year}-${monthString}-${String(lastDayOfMonth).padStart(2, '0')}`;

            // Create the base conditions for the date range.
            const conditions = [
                {
                    property: 'Transaction Date',
                    date: { on_or_after: startDate },
                },
                {
                    property: 'Transaction Date',
                    date: { on_or_before: endDate },
                },
            ];

            // If a specific cardId is also provided, add that condition.
            if (cardId) {
                conditions.push({
                    property: 'Card',
                    relation: {
                        contains: cardId,
                    },
                });
            }

            filter = { and: conditions };
        }

        const allResults = [];
        let nextCursor = undefined;

        // Loop to handle Notion's pagination, ensuring all results are fetched.
        do {
            const response = await notion.databases.query({
                database_id: transactionsDbId,
                filter: filter,
                start_cursor: nextCursor,
                sorts: [{ property: 'Transaction Date', direction: 'descending' }],
            });

            allResults.push(...response.results);
            nextCursor = response.next_cursor;
        } while (nextCursor);

        const results = allResults.map(mapTransaction);
        
        res.json(results);

    } catch (error) {
        console.error(`Failed to fetch transactions with filterBy='${filterBy}':`, error.body || error);
        res.status(500).json({ error: 'Failed to fetch data from Notion' });
    }
});

app.post('/api/transactions/batch-update', async (req, res) => {
    const { updates } = req.body; // Expecting [{ id, properties }]

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({ error: 'An array of updates is required.' });
    }

    try {
        const results = await Promise.all(updates.map(async (update) => {
            const { id, properties } = update;

            // Construct Notion properties object
            const propertiesToUpdate = {};

            // Map fields supported by bulk edit
            if (properties.mccCode !== undefined) propertiesToUpdate['MCC Code'] = { rich_text: [{ text: { content: String(properties.mccCode) } }] };
            if (properties.category !== undefined) propertiesToUpdate['Category'] = { select: { name: properties.category } };
            if (properties.cardId !== undefined) propertiesToUpdate['Card'] = { relation: [{ id: properties.cardId }] };
            if (properties.applicableRuleId !== undefined) propertiesToUpdate['Applicable Rule'] = properties.applicableRuleId ? { relation: [{ id: properties.applicableRuleId }] } : { relation: [] };
            if (properties.cardSummaryCategoryId !== undefined) propertiesToUpdate['Card Summary Category'] = properties.cardSummaryCategoryId ? { relation: [{ id: properties.cardSummaryCategoryId }] } : { relation: [] };

            // Perform Update
            await notion.pages.update({
                page_id: id,
                properties: propertiesToUpdate,
            });

            const updatedPage = await notion.pages.retrieve({ page_id: id });
            return mapTransaction(updatedPage);
        }));

        res.status(200).json(results);

    } catch (error) {
        console.error('Error batch updating transactions:', error.body || error);
        res.status(500).json({ error: 'Failed to batch update transactions.' });
    }
});

app.post('/api/transactions/bulk-approve', async (req, res) => {
    const { ids, items } = req.body;

    // CASE 1: Specific Approval (from "Analyze" dialog)
    // The frontend sent specific updates to apply
    if (items && Array.isArray(items)) {
        try {
            const results = await Promise.all(items.map(async (item) => {
                await notion.pages.update({
                    page_id: item.id,
                    properties: item.updates
                });
                return item.id;
            }));
            return res.status(200).json(results);
        } catch (error) {
            console.error('Error applying specific updates:', error.body || error);
            return res.status(500).json({ error: 'Failed to apply specific updates.' });
        }
    }

    // CASE 2: Simple/Quick Approval (Direct button click)
    // The frontend just sent IDs, so we calculate the standard logic here
    if (ids && Array.isArray(ids)) {
        try {
            const approvedTransactions = await Promise.all(ids.map(async (id) => {
                const page = await notion.pages.retrieve({ page_id: id });

                // --- Logic to Determine New Name ---
                let newName = null;
                // Priority 1: Existing Merchant Field
                if (page.properties.Merchant && page.properties.Merchant.rich_text && page.properties.Merchant.rich_text.length > 0) {
                     newName = page.properties.Merchant.rich_text[0].plain_text;
                }

                // Priority 2: Strip "Email_" prefix
                if (!newName) {
                    const oldName = page.properties['Transaction Name'].title[0]?.plain_text || "";
                    if (oldName.startsWith("Email_")) {
                        newName = oldName.substring(6);
                    } else {
                        newName = oldName; 
                    }
                }

                // --- Perform Update ---
                await notion.pages.update({
                    page_id: id,
                    properties: {
                        'Transaction Name': {
                            title: [{ text: { content: newName } }]
                        },
                        'Automated': { checkbox: false },
                    }
                });
                
                // Return mapped object
                const updatedPage = await notion.pages.retrieve({ page_id: id });
                return mapTransaction(updatedPage);
            }));

            return res.status(200).json(approvedTransactions);

        } catch (error) {
            console.error('Error in simple bulk approve:', error.body || error);
            return res.status(500).json({ error: 'Failed to approve transactions.' });
        }
    }

    // If neither 'ids' nor 'items' was provided
    return res.status(400).json({ error: 'Invalid payload. Request must contain "ids" or "items".' });
});

app.post('/api/transactions/bulk-edit', async (req, res) => {
    const { ids, field, value } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'An array of transaction IDs is required.' });
    }

    if (!field || !value) {
        return res.status(400).json({ error: 'A field and value are required.' });
    }

    try {
        const updatedTransactions = await Promise.all(ids.map(async (id) => {
            const propertiesToUpdate = {};
            propertiesToUpdate[field] = { rich_text: [{ text: { content: String(value) } }] };
            await notion.pages.update({
                page_id: id,
                properties: propertiesToUpdate,
            });
            const updatedPage = await notion.pages.retrieve({ page_id: id });
            return mapTransaction(updatedPage);
        }));

        res.status(200).json(updatedTransactions);
    } catch (error) {
        console.error('Error bulk editing transactions in Notion:', error.body || error);
        res.status(500).json({ error: 'Failed to edit transactions.' });
    }
});

// DELETE /api/transactions/:id - Delete (archive) a transaction
app.delete('/api/transactions/:id', async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ error: 'Transaction ID is required.' });
    }

    try {
        // Notion's API "deletes" pages by archiving them.
        await notion.pages.update({
            page_id: id,
            archived: true,
        });

        res.status(200).json({ success: true, message: 'Transaction deleted successfully.' });
    } catch (error) {
        console.error('Error deleting transaction in Notion:', error.body || error);
        res.status(500).json({ error: 'Failed to delete transaction.' });
    }
});

app.post('/api/transactions/bulk-delete', async (req, res) => {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'An array of transaction IDs is required.' });
    }

    try {
        await Promise.all(ids.map(id =>
            notion.pages.update({
                page_id: id,
                archived: true,
            })
        ));

        res.status(200).json({ success: true, message: 'Transactions deleted successfully.' });
    } catch (error) {
        console.error('Error bulk deleting transactions in Notion:', error.body || error);
        res.status(500).json({ error: 'Failed to delete transactions.' });
    }
});

// PATCH /api/transactions/:id - Update an existing transaction
app.patch('/api/transactions/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const {
            merchant,
            amount,
            date,
            cardId,
            category,
            mccCode,
            merchantLookup,
            applicableRuleId,
            cardSummaryCategoryId,
            notes,
            otherDiscounts,
            otherFees,
            foreignCurrencyAmount,
            conversionFee,
            paidFor,
            subCategory,
            billingDate,
        } = req.body;

        // --- START: NEW "Find-or-Create" Logic ---

        // 1. Check for new 'Category' (select)
        if (category) {
            const categoryOptions = await getSelectOptions('Category');
            if (!categoryOptions.find(o => o.name === category)) {
                await addSelectOption('Category', category);
            }
        }

        // 2. Check for new 'Paid for' (select)
        if (paidFor) {
            const paidForOptions = await getSelectOptions('Paid for');
            if (!paidForOptions.find(o => o.name === paidFor)) {
                await addSelectOption('Paid for', paidFor);
            }
        }

        // 3. Check for new 'Sub Category' (multi-select)
        if (subCategory && subCategory.length > 0) {
            // Get the database's current sub-category properties
            const db = await notion.databases.retrieve({ database_id: transactionsDbId });
            const subCategoryProperty = db.properties['Sub Category'];
            const existingOptions = subCategoryProperty.multi_select.options;
            const existingOptionNames = new Set(existingOptions.map(o => o.name));

            // Find which new tags don't exist yet
            const newOptionNames = subCategory.filter(s => !existingOptionNames.has(s));

            if (newOptionNames.length > 0) {
                // If we have new tags, update the database definition
                await notion.databases.update({
                    database_id: transactionsDbId,
                    properties: {
                        'Sub Category': {
                            multi_select: {
                                options: [
                                    ...existingOptions,
                                    ...newOptionNames.map(name => ({ name }))
                                ]
                            }
                        }
                    }
                });
            }
        }
        // --- END: NEW "Find-or-Create" Logic ---


        // --- Now, build the update object (same as before) ---
        const propertiesToUpdate = {};

        if (merchant) propertiesToUpdate['Transaction Name'] = { title: [{ text: { content: merchant } }] };
        if (typeof amount === 'number') propertiesToUpdate['Amount'] = { number: amount };
        if (date) propertiesToUpdate['Transaction Date'] = { date: { start: date } };
        if (cardId) propertiesToUpdate['Card'] = { relation: [{ id: cardId }] };
        if (category !== undefined) propertiesToUpdate['Category'] = category ? { select: { name: category } } : { select: null };
        if (mccCode !== undefined) propertiesToUpdate['MCC Code'] = { rich_text: [{ text: { content: String(mccCode) } }] };
        if (merchantLookup !== undefined) propertiesToUpdate['Merchant'] = { rich_text: [{ text: { content: merchantLookup } }] };
        if (notes !== undefined) propertiesToUpdate['Notes'] = { rich_text: [{ text: { content: notes || "" } }] };
        if (subCategory !== undefined) propertiesToUpdate['Sub Category'] = { multi_select: subCategory.map(s => ({ name: s })) };
        if (paidFor !== undefined) propertiesToUpdate['Paid for'] = paidFor ? { select: { name: paidFor } } : { select: null };
        if (billingDate !== undefined) propertiesToUpdate['Billing Date'] = billingDate ? { date: { start: billingDate } } : { date: null };
        if (typeof otherDiscounts === 'number') propertiesToUpdate['Other Discounts'] = { number: otherDiscounts };
        if (typeof otherFees === 'number') propertiesToUpdate['Other Fees'] = { number: otherFees };
        if (typeof foreignCurrencyAmount === 'number') propertiesToUpdate['Foreign Currency'] = { number: foreignCurrencyAmount };
        if (typeof conversionFee === 'number') propertiesToUpdate['Conversion Fee'] = { number: conversionFee };
        if (applicableRuleId !== undefined) propertiesToUpdate['Applicable Rule'] = applicableRuleId ? { relation: [{ id: applicableRuleId }] } : { relation: [] };
        if (cardSummaryCategoryId !== undefined) propertiesToUpdate['Card Summary Category'] = cardSummaryCategoryId ? { relation: [{ id: cardSummaryCategoryId }] } : { relation: [] };

        propertiesToUpdate['Automated'] = { checkbox: false };

        if (Object.keys(propertiesToUpdate).length === 0) {
            return res.status(400).json({ error: 'No fields to update were provided.' });
        }

        const updatedPage = await notion.pages.update({
            page_id: id,
            properties: propertiesToUpdate,
        });

        // Retrieve the page again to get the updated formula fields
        const populatedPage = await notion.pages.retrieve({ page_id: updatedPage.id });
        const formattedTransaction = mapTransaction(populatedPage);

        res.status(200).json(formattedTransaction);

    } catch (error) {
        console.error('Error updating transaction in Notion:', error.body || error);
        res.status(500).json({ error: 'Failed to update transaction.' });
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
                overallMonthlyLimit: parsed['Overall Monthly Limit'],
                annualFee: parsed['Annual Fee'],
                totalSpendingYtd: parsed['Total Spending - Formula'],
                minimumMonthlySpend: parsed['Minimum Monthly Spend'],
                nextAnnualFeeDate: parsed['Next Annual Payment Date'],
                cardOpenDate: parsed['Card Open Date'],
                useStatementMonthForPayments: parsed['Cashback <> Statement Month'] || false,
                status: parsed['Status'],
                cashbackType: parsed['Cashback Type'], // 1 Tier, 2 Tier
                tier2MinSpend: parsed['Tier 2 Minimum Monthly Spend'],
                tier2Limit: parsed['Tier 2 Monthly Limit'],
                foreignFee: parsed['Foreign Fee'],
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
                status: parsed['Status'],
                mccCodes: parsed['MCC Code'],

                type: parsed['Type'], // Transaction Limit, 1 Tier, 2 Tier
                transactionLimit: parsed['Transaction Limit'], // Renamed from capPerTransaction conceptually
                categoryLimit: parsed['Category Limit'],
                secondaryTransactionCriteria: parsed['2nd Transaction Criteria'],
                secondaryTransactionLimit: parsed['2nd Transaction Limit'],
                tier2Rate: parsed['Tier 2 Cashback Rate'],
                tier2CategoryLimit: parsed['Tier 2 Category Limit'],
                method: parsed['Method'],
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
                cashback: parsed['Actual Cashback'],
                actualCashback: parsed['Actual Cashback'],
                statementAmount: parsed['Statement Amount'],
                paidAmount: parsed['Paid Amount'],
                monthlyCashbackLimit: parsed['Cashback Limit'],
            };
        });
        res.json(results);
    } catch (error) {
        console.error('Failed to fetch monthly summary:', error);
        res.status(500).json({ error: 'Failed to fetch data from Notion' });
    }
});


app.get('/api/mcc-codes', (req, res) => {
    // Simply send the cached data
    res.json(mccData);
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
                cashback: parsed['Final Category Cashback'],
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

        const results = response.results.map(mapTransaction);
        
        res.json(results);

    } catch (error) {
        console.error('Failed to fetch recent transactions:', error);
        res.status(500).json({ error: 'Failed to fetch recent transactions' });
    }
});

app.get('/api/lookup-merchant', async (req, res) => {
    const { keyword } = req.query;
    if (!keyword || keyword.length < 3) {
        // Return a consistent structure for empty queries
        return res.json({ type: 'merchant', bestMatch: null, prediction: null, history: [], external: [] });
    }

    try {
        // Step 1: Perform BOTH lookups concurrently for better performance.
        const [notionResponse, externalApiResponse] = await Promise.all([
            // Query 1: Internal Notion History
            notion.databases.query({
                database_id: transactionsDbId,
                page_size: 100,
                filter: { property: 'Transaction Name', title: { contains: keyword } },
                sorts: [{ property: 'Transaction Date', direction: 'descending' }],
            }),
            // Query 2: External MCC API
            (async () => {
                try {
                    const fetch = (await import('node-fetch')).default;
                    const response = await fetch(`https://tc-mcc.tungpun.site/mcc?keyword=${encodeURIComponent(keyword)}`);
                    // Ensure we handle API errors gracefully
                    if (response.ok) return response.json();
                    return { results: [] }; // Return an empty structure on API error
                } catch (error) {
                    console.error("External MCC API fetch failed:", error);
                    return { results: [] }; // Return an empty structure on network error
                }
            })()
        ]);
        
        // Step 2: Process the results from both sources.

        // Process your internal Notion history results
        const transactions = notionResponse.results.map(page => parseNotionPageProperties(page));
        
        // Process the external API results
        const externalResults = (externalApiResponse.results || []).map(result => ({
            merchant: result[1], // Merchant name from external API
            mcc: result[2],       // MCC code from external API
            method: result[4]
        }));

        // Step 3: Derive the combined logic for suggestions.

        // A. Logic for "Best Match": Prioritize your history, but fall back to external.
        let bestMatch = null;

        // Prioritize your own transaction history for the best match
        if (transactions.length > 0 && transactions[0]['MCC Code'] && transactions[0]['Merchant']) {
            bestMatch = {
                mcc: transactions[0]['MCC Code'],
                merchant: transactions[0]['Merchant'],
                source: 'history'
            };
        } 
        // Fallback to the external API if no history is found
        else if (externalResults.length > 0) {
            bestMatch = {
                mcc: externalResults[0].mcc,
                merchant: externalResults[0].merchant, // <-- FIX: Add merchant name from external API
                source: 'external'
            };
        }
        
        // B. Logic for "Prediction" (always based on your internal history)
        const frequencyMap = new Map();
        transactions.forEach(tx => {
            if (tx['Merchant'] && tx['MCC Code'] && tx['Category']) {
                const key = `${tx['Merchant']}|${tx['MCC Code']}|${tx['Category']}`;
                frequencyMap.set(key, (frequencyMap.get(key) || 0) + 1);
            }
        });

        let mostCommonKey = '';
        let maxCount = 0;
        frequencyMap.forEach((count, key) => {
            if (count > maxCount) {
                maxCount = count;
                mostCommonKey = key;
            }
        });
        
        const [predMerchant, predMcc, predCategory] = mostCommonKey.split('|');
        const prediction = mostCommonKey ? { merchant: predMerchant, mcc: predMcc, category: predCategory } : null;

        // C. Logic for "Historical List" (from your internal history)
        const uniqueHistory = new Map();
        transactions.forEach(tx => {
            if (tx['Merchant'] && tx['MCC Code']) {
                const key = `${tx['Merchant']}|${tx['MCC Code']}`;
                if (!uniqueHistory.has(key)) {
                    uniqueHistory.set(key, { merchant: tx['Merchant'], mcc: tx['MCC Code'] });
                }
            }
        });

        // Step 4: Return the unified object containing BOTH data sets.
        res.json({
            type: 'merchant',
            bestMatch: bestMatch,
            prediction: prediction,
            history: Array.from(uniqueHistory.values()),
            external: externalResults // This will now always contain the results from the external API
        });

    } catch (error) {
        console.error('Unified Merchant Lookup Error:', error.body || error);
        res.status(500).json({ error: 'Failed to perform lookup' });
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
            merchantLookup,
            applicableRuleId,
            cardSummaryCategoryId,
            // --- NEW FIELDS ---
            notes,
            otherDiscounts,
            otherFees,
            foreignCurrencyAmount,
            conversionFee,
            paidFor,
            subCategory,
            billingDate,
        } = req.body;

        const numericAmount = Number(String(amount).replace(/,/g, ''));
        if (isNaN(numericAmount)) {
            return res.status(400).json({ error: 'Invalid amount provided.' });
        }

        const properties = {
            'Transaction Name': { title: [{ text: { content: merchant } }] },
            'Amount': { number: numericAmount },
            'Transaction Date': { date: { start: date } },
            'Card': { relation: [{ id: cardId }] },
        };

        // --- CONDITIONALLY ADD ALL NEW & EXISTING OPTIONAL PROPERTIES ---
        if (category) {
            const categoryOptions = await getSelectOptions('Category');
            if (!categoryOptions.find(o => o.name === category)) {
                await addSelectOption('Category', category);
            }
            properties['Category'] = { select: { name: category } };
        }
        if (mccCode) properties['MCC Code'] = { rich_text: [{ text: { content: String(mccCode) } }] };
        if (merchantLookup) properties['Merchant'] = { rich_text: [{ text: { content: String(merchantLookup) } }] };
        if (applicableRuleId) properties['Applicable Rule'] = { relation: [{ id: applicableRuleId }] };
        if (cardSummaryCategoryId) properties['Card Summary Category'] = { relation: [{ id: cardSummaryCategoryId }] };
        
        // New Properties
        if (notes) properties['Notes'] = { rich_text: [{ text: { content: notes } }] };
        if (otherDiscounts) properties['Other Discounts'] = { number: Number(otherDiscounts) };
        if (otherFees) properties['Other Fees'] = { number: Number(otherFees) };
        if (foreignCurrencyAmount) properties['Foreign Currency'] = { number: Number(foreignCurrencyAmount) };
        if (conversionFee) properties['Conversion Fee'] = { number: Number(conversionFee) };
        if (paidFor) {
            const paidForOptions = await getSelectOptions('Paid for');
            if (!paidForOptions.find(o => o.name === paidFor)) {
                await addSelectOption('Paid for', paidFor);
            }
            properties['Paid for'] = { select: { name: paidFor } };
        }
        if (subCategory && subCategory.length > 0) {
            properties['Sub Category'] = { multi_select: subCategory.map(s => ({ name: s })) };
        }
        if (billingDate) properties['Billing Date'] = { date: { start: billingDate } };

        // 3. Create the new page (transaction) in Notion
        const newPage = await notion.pages.create({
            parent: { database_id: transactionsDbId },
            properties,
        });

        // 4. Retrieve and return the newly created transaction
        const populatedPage = await notion.pages.retrieve({ page_id: newPage.id });
        const formattedTransaction = mapTransaction(newPage);
        
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

        // --- Step 1: Get names needed to build the unique IDs ---
        const cardPage = await notion.pages.retrieve({ page_id: cardId });
        const bankName = cardPage.properties['Bank']?.select?.name || 'Untitled Bank';

        const rulePage = await notion.pages.retrieve({ page_id: ruleId });
        const ruleName = rulePage.properties['Rule Name']?.title[0]?.plain_text || 'Untitled Rule';

        const summaryName = `${month} - ${ruleName}`; // This is the unique name for the category summary
        const trackerId = `${bankName} - ${month}`;   // This is the unique name for the *total* monthly summary

        // --- Step 2: NEW LOGIC - Check if this Category Summary already exists ---
        const existingSummaryResponse = await notion.databases.query({
            database_id: monthlyCategoryDbId,
            filter: {
                and: [
                    {
                        property: 'Summary ID', // The 'Name' or 'Title' property
                        title: {
                            equals: summaryName,
                        },
                    },
                    {
                        property: 'Card',
                        relation: {
                            contains: cardId,
                        },
                    },
                    {
                        property: 'Month',
                        select: {
                            equals: month,
                        },
                    },
                ],
            },
            page_size: 1, // We only need to know if one exists
        });

        // --- Step 3: NEW LOGIC - If it exists, return the existing one ---
        if (existingSummaryResponse.results.length > 0) {
            const existingSummary = existingSummaryResponse.results[0];
            return res.status(200).json({ // Return 200 OK (not 201 Created)
                id: existingSummary.id, 
                name: summaryName, 
                cardId, 
                month 
            });
        }

        // --- Step 4: If it does NOT exist, create it (original logic) ---

        // Build the properties for the new category summary page
        const properties = {
            'Summary ID': { title: [{ text: { content: summaryName } }] },
            'Card': { relation: [{ id: cardId }] },
            'Month': { select: { name: month } },
            'Cashback Rule': { relation: [{ id: ruleId }] },
        };

        // Find-or-create logic for the *parent* tracker (Monthly Summary)
        let trackerPageId;
        const trackerResponse = await notion.databases.query({
            database_id: monthlySummaryDbId,
            filter: {
                property: 'Tracker ID',
                title: {
                    equals: trackerId,
                },
            },
        });

        if (trackerResponse.results.length > 0) {
            trackerPageId = trackerResponse.results[0].id;
        } else {
            const newTrackerPage = await notion.pages.create({
                parent: { database_id: monthlySummaryDbId },
                properties: {
                    'Tracker ID': { title: [{ text: { content: trackerId } }] },
                    'Card': { relation: [{ id: cardId }] },
                    'Month': { select: { name: month } },
                },
            });
            trackerPageId = newTrackerPage.id;
        }

        // Link the new category summary to its parent tracker
        if (trackerPageId) {
            properties['Cashback Tracker'] = { relation: [{ id: trackerPageId }] };
        }

        // Create the new category summary page
        const newSummary = await notion.pages.create({
            parent: { database_id: monthlyCategoryDbId },
            properties,
        });

        // Return 201 Created because we made a new one
        res.status(201).json({ id: newSummary.id, name: summaryName, cardId, month });

    } catch (error) {
        console.error('Error in find-or-create summary:', error.body || error);
        res.status(500).json({ error: 'Failed to find or create summary' });
    }
});

app.patch('/api/monthly-summary/:id', async (req, res) => {
    const { id } = req.params;
    const { paidAmount, statementAmount } = req.body; // <-- Destructure both possible values

    try {
        const propertiesToUpdate = {}; // <-- Create an empty object

        // Conditionally add properties if they exist in the request
        if (typeof paidAmount === 'number') {
            propertiesToUpdate['Paid Amount'] = { number: paidAmount };
        }
        if (typeof statementAmount === 'number') {
            propertiesToUpdate['Statement Amount'] = { number: statementAmount };
        }

        // Check if there's anything to update
        if (Object.keys(propertiesToUpdate).length === 0) {
            return res.status(400).json({ error: 'No valid amount provided to update.' });
        }

        await notion.pages.update({
            page_id: id,
            properties: propertiesToUpdate, // <-- Use the dynamic object here
        });
        res.status(200).json({ success: true, message: 'Summary updated successfully.' });
    } catch (error) {
        console.error('Error updating summary in Notion:', error.body || error);
        res.status(500).json({ error: 'Failed to update summary in Notion.' });
    }
});

app.get('/api/common-vendors', async (req, res) => {
    try {
        const response = await notion.databases.query({
            database_id: vendorsDbId,
            // Filter to only get vendors where the "Active" checkbox is checked
            filter: {
                property: 'Active',
                checkbox: {
                    equals: true,
                },
            },
            // Sort the vendors based on the "Sort Order" column
            sorts: [
                {
                    property: 'Sort Order',
                    direction: 'ascending',
                },
            ],
        });

        // Map the Notion data to a clean JSON format
        const vendors = response.results.map((page) => {
            const parsed = parseNotionPageProperties(page);
            return {
                id: parsed.id,
                name: parsed['Name'],
                transactionName: parsed['Transaction Name'],
                merchant: parsed['Merchant'],
                mcc: parsed['MCC'],
                category: parsed['Category'],
                // Safely extract the first ID from the relation arrays
                preferredCardId: parsed['Preferred Card']?.[0] || null,
                preferredRuleId: parsed['Preferred Cashback Rule']?.[0] || null,
            };
        });

        res.json(vendors);
    } catch (error) {
        console.error('Failed to fetch common vendors:', error.body || error);
        res.status(500).json({ error: 'Failed to fetch data from Notion' });
    }
});

// GET /api/transactions/needs-review
app.get('/api/transactions/needs-review', async (req, res) => {
    try {
        // REMOVED: Redundant Notion client initialization
        const databaseId = process.env.NOTION_TRANSACTIONS_DB_ID;

        const response = await notion.databases.query({ // Use the global 'notion' client
            database_id: databaseId,
            filter: {
                or: [
                    {
                        property: 'Automated',
                        checkbox: {
                            equals: true,
                        },
                    },
                    {
                        property: 'Match',
                        checkbox: {
                            equals: false,
                        },
                    },
                ]
            },
            sorts: [
                {
                    property: 'Transaction Date',
                    direction: 'descending'
                }
            ]
        });

        const transactions = response.results.map(mapTransaction); // <-- FIXED: Use mapTransaction
        res.json(transactions);

    } catch (error) {
        console.error("Error fetching transactions for review:", error);
        res.status(500).json({ message: "Failed to fetch transactions for review" });
    }
});

// PATCH /api/transactions/:id/approve
app.patch('/api/transactions/:id/approve', async (req, res) => {
    const { id: pageId } = req.params;
    const { newName } = req.body; 

    if (!newName) {
        return res.status(400).json({ message: 'A new name is required.' });
    }

    try {
        await notion.pages.update({
            page_id: pageId,
            properties: {
                'Transaction Name': {
                    title: [{
                        text: {
                            content: newName
                        }
                    }]
                },
                'Automated': { checkbox: false },
            }
        });

        const updatedPage = await notion.pages.retrieve({ page_id: pageId });
        const updatedTransaction = mapTransaction(updatedPage);

        res.json(updatedTransaction);

    } catch (error) {
        console.error('Failed to quick approve transaction:', error);
        res.status(500).json({ message: 'Error updating transaction in Notion.' });
    }
});

// POST /api/transactions/analyze-approval
app.post('/api/transactions/analyze-approval', async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) return res.status(400).json({ error: 'IDs required' });

    try {
        // 1. Fetch all Active Vendors for Lookup
        const vendorsResponse = await notion.databases.query({
            database_id: process.env.NOTION_VENDORS_DB_ID,
            filter: { property: 'Active', checkbox: { equals: true } },
        });
        const vendors = vendorsResponse.results.map(p => parseNotionPageProperties(p));

        const analysisResults = [];

        // 2. Process each transaction
        for (const id of ids) {
            const page = await notion.pages.retrieve({ page_id: id });
            const tx = mapTransaction(page);
            const updates = {};
            const log = [];
            let matchedVendor = null;

            // --- LOGIC A: Merchant Lookup (Priority 1) ---
            // Check if Tx Name contains a Vendor Name
            matchedVendor = vendors.find(v => 
                tx['Transaction Name'].toLowerCase().includes(v['Transaction Name']?.toLowerCase() || "#####") || 
                tx['Transaction Name'].toLowerCase().includes(v['Name']?.toLowerCase() || "#####")
            );

            if (matchedVendor) {
                log.push(`Matched Vendor: ${matchedVendor['Name']}`);
                
                // Update Merchant Name
                updates['Transaction Name'] = { title: [{ text: { content: matchedVendor['Merchant'] || matchedVendor['Name'] } }] };
                updates['Merchant'] = { rich_text: [{ text: { content: matchedVendor['Merchant'] || matchedVendor['Name'] } }] };
                
                // Update MCC
                if (matchedVendor['MCC']) {
                    updates['MCC Code'] = { rich_text: [{ text: { content: String(matchedVendor['MCC']) } }] };
                }

                // Update Rule & Category
                if (matchedVendor['Preferred Cashback Rule'] && matchedVendor['Preferred Cashback Rule'].length > 0) {
                    const ruleId = matchedVendor['Preferred Cashback Rule'][0];
                    updates['Applicable Rule'] = { relation: [{ id: ruleId }] };
                    
                    // Also update Summary Category based on this new Rule
                    if (tx['Cashback Month']) {
                        const summaryId = await getOrCreateSummaryId(tx['Card'][0], tx['Cashback Month'], ruleId);
                        if (summaryId) updates['Card Summary Category'] = { relation: [{ id: summaryId }] };
                    }
                }
            } 
            
            // --- LOGIC B: Mismatch Fix (Priority 2 - Only if not fully handled by Vendor) ---
            else if (!tx['Match'] && tx['Applicable Rule'] && tx['Applicable Rule'].length > 0 && tx['Cashback Month']) {
                log.push("Fixing Mismatch (Syncing Summary Category)");
                const ruleId = tx['Applicable Rule'][0];
                const summaryId = await getOrCreateSummaryId(tx['Card'][0], tx['Cashback Month'], ruleId);
                
                if (summaryId) {
                    updates['Card Summary Category'] = { relation: [{ id: summaryId }] };
                }
            }
            
            // --- LOGIC C: Standard Cleanup (Default) ---
            else {
                // Standard Name cleanup if no vendor match
                const currentName = tx['Transaction Name'];
                if (currentName.startsWith("Email_")) {
                    const cleanName = currentName.substring(6);
                    updates['Transaction Name'] = { title: [{ text: { content: cleanName } }] };
                    log.push("Standard cleanup (Removed Email_ prefix)");
                } else {
                    log.push("Standard approval");
                }
            }

            // Always uncheck Automated
            updates['Automated'] = { checkbox: false };

            analysisResults.push({
                id: tx.id,
                currentName: tx['Transaction Name'],
                newName: updates['Transaction Name']?.title[0]?.text?.content || tx['Transaction Name'],
                updates: updates, // Pass the constructed Notion update object back to frontend
                logs: log
            });
        }

        res.json(analysisResults);

    } catch (error) {
        console.error("Analyze Error", error);
        res.status(500).json({ error: "Failed to analyze" });
    }
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
}

module.exports = { app };