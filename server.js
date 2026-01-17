// server.js

const express = require('express');
const { Client } = require('@notionhq/client');
const cors = require('cors');
const fs = require('fs'); // ADDED: To read the MCC.json file
const path = require('path'); // ADDED: To help locate the MCC.json file
const crypto = require('crypto'); // ADDED: For secure PIN comparison
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cheerio = require('cheerio'); // ADDED: for scraping rcgv.vn
const helmet = require('helmet');
require('dotenv').config();

const mccDataPath = path.join(__dirname, 'MCC.json');
const mccData = JSON.parse(fs.readFileSync(mccDataPath, 'utf8'));

const app = express();
// Enable proxy trust to correctly identify client IP from Netlify's load balancer
// 1 hop is sufficient for Netlify Functions/Edge
app.set('trust proxy', 1);

// SECURITY: Allow configuring the CORS origin via environment variable to support production domains
// Defaults to localhost:3000 for development
const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:3000';
app.use(cors({
    origin: allowedOrigin,
    credentials: true
}));
app.use(helmet());
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

// --- SECURITY CONSTANTS ---
const MAX_BULK_LIMIT = 50; // Prevent DoS by limiting bulk operations

// --- RATE LIMITING (In-Memory) ---
const createRateLimiter = (windowMs, maxAttempts, message) => {
    const attempts = new Map();

    return (req, res, next) => {
        // Use req.ip which is now safe because 'trust proxy' is enabled
        const ip = req.ip;

        const current = attempts.get(ip) || { count: 0, windowStart: Date.now() };

        // Reset window if expired
        if (Date.now() - current.windowStart > windowMs) {
            current.count = 0;
            current.windowStart = Date.now();
        }

        if (current.count >= maxAttempts) {
            return res.status(429).json({
                success: false,
                message: message
            });
        }

        // Increment count
        current.count++;
        attempts.set(ip, current);

        // Memory Cleanup: Delete entry after window expires to prevent memory leaks
        // Only set timeout if it's a new entry or reset
        if (current.count === 1) {
            setTimeout(() => {
                attempts.delete(ip);
            }, windowMs);
        }

        next();
    };
};

const loginRateLimiter = createRateLimiter(15 * 60 * 1000, 5, 'Too many login attempts. Please try again later.');
const lookupRateLimiter = createRateLimiter(60 * 1000, 30, 'Too many lookups. Please wait a moment.'); // 30 per min

// --- SECURE LOGGING HELPER ---
const secureLog = (message, error) => {
    let errorDetails = error;

    // Notion API errors often contain a 'body' string with the full response
    if (error && error.body) {
        try {
            const body = typeof error.body === 'string' ? JSON.parse(error.body) : error.body;
            // Create a sanitized error object
            errorDetails = {
                message: error.message || body.message || 'Unknown Error',
                code: error.code || body.code,
                status: error.status || body.status,
                // Omit the full 'body' to prevent leaking data (e.g. PII in failed transaction properties)
            };
        } catch (e) {
            // If body isn't JSON, fall back to message
            errorDetails = { message: error.message || String(error) };
        }
    }
    // Handle standard Error objects
    else if (error instanceof Error) {
        errorDetails = {
            message: error.message,
            name: error.name,
            stack: error.stack, // Include stack trace for debugging
        };
    }

    console.error(message, JSON.stringify(errorDetails));
};

// NEW: Simple in-memory cache for transaction DB schema to avoid redundant fetches
let transactionDbSchemaCache = {
    data: null,
    timestamp: 0,
    ttl: 60 * 1000 // 60 seconds
};

const getTransactionDatabaseSchema = async () => {
    const now = Date.now();
    if (transactionDbSchemaCache.data && (now - transactionDbSchemaCache.timestamp < transactionDbSchemaCache.ttl)) {
        return transactionDbSchemaCache.data;
    }
    const db = await notion.databases.retrieve({ database_id: transactionsDbId });
    transactionDbSchemaCache = {
        data: db,
        timestamp: now,
        ttl: 60 * 1000 // Reset TTL
    };
    return db;
};

// Helper to resolve property name case-insensitively from schema
const resolvePropertyName = async (targetName) => {
    const db = await getTransactionDatabaseSchema();
    const key = Object.keys(db.properties).find(k => k.toLowerCase() === targetName.toLowerCase());
    return key || targetName;
};

// Helper to get property value case-insensitively from object
const getProp = (obj, key) => {
    if (obj[key] !== undefined) return obj[key];
    const found = Object.keys(obj).find(k => k.toLowerCase() === key.toLowerCase());
    return found ? obj[found] : undefined;
};

// Helper function to map Notion transaction page to a simpler object
const mapTransaction = (tx) => {
    const props = parseNotionPageProperties(tx);
    
    // Map Notion property names to the camelCase keys used in the frontend
    return {
        id: tx.id,
        'Transaction Name': getProp(props, 'Transaction Name'),
        'Amount': getProp(props, 'Final Amount'),
        'grossAmount': getProp(props, 'Amount'),
        'Transaction Date': getProp(props, 'Transaction Date'),
        'Card': getProp(props, 'Card'),
        'Category': getProp(props, 'Category'),
        'MCC Code': getProp(props, 'MCC Code'),
        'estCashback': getProp(props, 'Estimated Cashback') || 0, // Formula field
        'Cashback Month': getProp(props, 'Cashback Month'), // Formula field
        'merchantLookup': getProp(props, 'Merchant'), // This is the Merchant Name field
        'notes': getProp(props, 'Notes'),
        'otherDiscounts': getProp(props, 'Other Discounts'),
        'otherFees': getProp(props, 'Other Fees'),
        'foreignCurrencyAmount': getProp(props, 'Foreign Amount'), // Renamed from Foreign Currency
        'exchangeRate': getProp(props, 'Exchange Rate'),
        'foreignCurrency': getProp(props, 'Foreign Currency'),
        'conversionFee': getProp(props, 'Conversion Fee'),
        'paidFor': getProp(props, 'Paid for'),
        'subCategory': getProp(props, 'Sub Category'),
        'billingDate': getProp(props, 'Billing Date'),
        'Applicable Rule': getProp(props, 'Applicable Rule'),
        'Card Summary Category': getProp(props, 'Card Summary Category'),
        'Match': getProp(props, 'Match'),
        'Automated': getProp(props, 'Automated'),
        'Method': getProp(props, 'Method'),
        'Statement Month': getProp(props, 'Statement Month'),
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
                result[key] = prop.title.map(t => t.plain_text).join('') || null;
                break;
            case 'rich_text':
            case 'text': // Note: The Notion API often uses 'text' for Text properties
                result[key] = prop[prop.type].map(t => t.plain_text).join('') || null;
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
    const db = await getTransactionDatabaseSchema();
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
    // Invalidate cache
    transactionDbSchemaCache.data = null;
};

// --- SHARED SMART LOGIC HELPERS ---

// Search Internal Notion History (Name OR Merchant)
const searchInternalTransactions = async (keyword, excludeId = null) => {
    const trimmedKeyword = keyword.trim();
    if (!trimmedKeyword) return [];

    try {
        // 1. Try EXACT/Strict Contains Search first (Existing Logic)
        let response = await notion.databases.query({
            database_id: transactionsDbId,
            page_size: 100,
            filter: {
                or: [
                    { property: 'Transaction Name', title: { contains: trimmedKeyword } },
                    { property: 'Merchant', rich_text: { contains: trimmedKeyword } }
                ]
            },
            sorts: [{ property: 'Transaction Date', direction: 'descending' }],
        });

        let results = response.results;

        // 2. Fallback: Tokenized Broad Search (New Logic)
        if (results.length === 0) {
            // Split into tokens, ignoring short words/numbers to avoid noise
            const tokens = trimmedKeyword.split(/[\s,.-]+/)
                .filter(t => t.length > 2 && isNaN(t)); // >2 chars, not a number

            if (tokens.length > 0) {
                // Limit to first 3 significant tokens to avoid massive queries
                const searchTokens = tokens.slice(0, 3);

                const orConditions = [];
                searchTokens.forEach(token => {
                    orConditions.push({ property: 'Transaction Name', title: { contains: token } });
                    orConditions.push({ property: 'Merchant', rich_text: { contains: token } });
                });

                if (orConditions.length > 0) {
                    const tokenResponse = await notion.databases.query({
                        database_id: transactionsDbId,
                        page_size: 100,
                        filter: { or: orConditions },
                        sorts: [{ property: 'Transaction Date', direction: 'descending' }],
                    });
                    results = tokenResponse.results;
                }
            }
        }

        // Filter out the excluded ID if provided
        return results
            .filter(r => !excludeId || r.id !== excludeId)
            .map(page => mapTransaction(page));

    } catch (error) {
        console.error("Error in searchInternalTransactions:", error);
        return [];
    }
};

// Search External MCC API (Primary - Vercel App)
const searchExternalMcc = async (keyword) => {
    const trimmedKeyword = keyword.trim();
    if (!trimmedKeyword) return [];

    try {
        const response = await fetch(`https://tra-cuu-mcc.vercel.app/mcc?keyword=${encodeURIComponent(trimmedKeyword)}`);

        if (response.ok) {
            const data = await response.json();
            // Map to a consistent format
            return (data.results || []).map(result => ({
                merchant: result[1], // Merchant name
                mcc: result[2],      // MCC code
                method: result[3]
            }));
        }
        return [];
    } catch (error) {
        console.error("Error in searchExternalMcc (Vercel):", error);
        return [];
    }
};

// Search External MCC API (Fallback - RCGV.vn)
const searchExternalMccFallback = async (keyword) => {
    const trimmedKeyword = keyword.trim();
    if (!trimmedKeyword) return [];

    console.log(`Searching RCGV (Fallback) for: ${trimmedKeyword}`);

    try {
        const url = `https://rcgv.vn/check-mcc/?rvq=${encodeURIComponent(trimmedKeyword)}`;
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            console.error(`RCGV fetch failed: ${response.status} ${response.statusText}`);
            return [];
        }

        const html = await response.text();
        const $ = cheerio.load(html);
        const results = [];

        // Select the table rows in the tbody
        $('.rv-table tbody tr').each((i, el) => {
            const $row = $(el);
            // Extracted logic from test_rcgv_lookup.js
            const merchant = $row.data('title') || $row.find('td').eq(1).text().trim();
            const mcc = $row.data('code') || $row.find('td').eq(4).text().trim();
            const method = $row.data('method') || $row.find('td').eq(3).text().trim();

            if (merchant && mcc) {
                results.push({
                    merchant: merchant,
                    mcc: String(mcc),
                    method: method === '...' ? '' : method
                });
            }
        });

        return results;

    } catch (error) {
        console.error("Error in searchExternalMccFallback (RCGV):", error);
        return []; // Fail-safe: return empty array on error
    }
};

// Removed findBestMatchTransaction, fetchActiveRules, and calculateSmartUpdates as they are no longer used.

// ----------------------------------

app.post('/api/login', loginRateLimiter, (req, res) => {
    const pin = String((req.body && req.body.pin) ?? '').trim();
    const correctPin = String(process.env.ACCESS_PASSWORD ?? '').trim();

    // Use constant-time comparison to prevent timing attacks
    let isValid = false;
    if (pin && correctPin) {
        const hash = (str) => crypto.createHash('sha256').update(str).digest();
        const pinHash = hash(pin);
        const correctPinHash = hash(correctPin);
        isValid = crypto.timingSafeEqual(pinHash, correctPinHash);
    }

    if (isValid) {
        // Create a token that expires in 7 days
        const token = jwt.sign({ user: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' });

        // Send token back in a secure, httpOnly cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
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
app.get('/api/verify-auth', (req, res) => {
    const token = req.cookies.token;

    if (!token) {
        // Return 200 with isAuthenticated: false to avoid console 401 errors
        return res.status(200).json({ isAuthenticated: false });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            // Invalid token -> treated as not authenticated
            return res.status(200).json({ isAuthenticated: false });
        }
        // Valid token
        return res.status(200).json({ isAuthenticated: true, user: decoded });
    });
});


// --- APPLY MIDDLEWARE TO PROTECTED ROUTES ---
// All API routes below this point will require a valid token.

app.use(verifyToken);

app.get('/api/transactions', async (req, res) => {
    // Get 'month', 'filterBy', and 'cardId' from the query parameters.
    // 'filterBy' defaults to 'date' if not provided.
    const { month, filterBy = 'date', cardId } = req.query;

    // Validate that the 'month' parameter is present and correctly formatted.
    if (!month || typeof month !== 'string' || month.length !== 6) {
        return res.status(400).json({ error: 'A month query parameter in YYYYMM format is required.' });
    }

    // Validate cardId type to prevent HTTP Parameter Pollution attacks (e.g., array injection)
    if (cardId && typeof cardId !== 'string') {
        return res.status(400).json({ error: 'Invalid cardId format. Must be a string.' });
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

    if (updates.length > MAX_BULK_LIMIT) {
        return res.status(400).json({ error: `Too many items. Maximum allowed is ${MAX_BULK_LIMIT}.` });
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


app.post('/api/transactions/bulk-edit', async (req, res) => {
    const { ids, field, value } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'An array of transaction IDs is required.' });
    }

    if (ids.length > MAX_BULK_LIMIT) {
        return res.status(400).json({ error: `Too many items. Maximum allowed is ${MAX_BULK_LIMIT}.` });
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

    if (ids.length > MAX_BULK_LIMIT) {
        return res.status(400).json({ error: `Too many items. Maximum allowed is ${MAX_BULK_LIMIT}.` });
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
            exchangeRate,
            foreignCurrency,
            conversionFee,
            paidFor,
            subCategory,
            billingDate,
            method,
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

        // 3. Check for new 'Method' (select)
        if (method) {
            const methodOptions = await getSelectOptions('Method');
            if (!methodOptions.find(o => o.name === method)) {
                await addSelectOption('Method', method);
            }
        }

        // 4. Check for new 'Foreign Currency' (select)
        if (foreignCurrency) {
            const fcOptions = await getSelectOptions('Foreign Currency');
            if (!fcOptions.find(o => o.name === foreignCurrency)) {
                await addSelectOption('Foreign Currency', foreignCurrency);
            }
        }

        // 5. Check for new 'Sub Category' (multi-select)
        if (subCategory && subCategory.length > 0) {
            // Get the database's current sub-category properties
            const db = await getTransactionDatabaseSchema();
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
                // Invalidate cache
                transactionDbSchemaCache.data = null;
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
        if (mccCode !== undefined) propertiesToUpdate['MCC Code'] = { rich_text: mccCode ? [{ text: { content: String(mccCode) } }] : [] };
        if (merchantLookup !== undefined) propertiesToUpdate['Merchant'] = { rich_text: merchantLookup ? [{ text: { content: merchantLookup } }] : [] };
        if (notes !== undefined) propertiesToUpdate['Notes'] = { rich_text: [{ text: { content: notes || "" } }] };
        if (subCategory !== undefined) propertiesToUpdate['Sub Category'] = { multi_select: (subCategory || []).map(s => ({ name: s })) };
        if (paidFor !== undefined) propertiesToUpdate['Paid for'] = paidFor ? { select: { name: paidFor } } : { select: null };
        if (billingDate !== undefined) propertiesToUpdate['Billing Date'] = billingDate ? { date: { start: billingDate } } : { date: null };
        if (typeof otherDiscounts === 'number') propertiesToUpdate['Other Discounts'] = { number: otherDiscounts };
        if (typeof otherFees === 'number') propertiesToUpdate['Other Fees'] = { number: otherFees };
        if (typeof foreignCurrencyAmount === 'number') propertiesToUpdate['Foreign Amount'] = { number: foreignCurrencyAmount };
        if (typeof exchangeRate === 'number') propertiesToUpdate['Exchange Rate'] = { number: exchangeRate };
        if (foreignCurrency) propertiesToUpdate['Foreign Currency'] = { select: { name: foreignCurrency } };
        if (typeof conversionFee === 'number') propertiesToUpdate['Conversion Fee'] = { number: conversionFee };
        if (applicableRuleId !== undefined) propertiesToUpdate['Applicable Rule'] = applicableRuleId ? { relation: [{ id: applicableRuleId }] } : { relation: [] };
        if (cardSummaryCategoryId !== undefined) propertiesToUpdate['Card Summary Category'] = cardSummaryCategoryId ? { relation: [{ id: cardSummaryCategoryId }] } : { relation: [] };
        if (method !== undefined) propertiesToUpdate['Method'] = method ? { select: { name: method } } : { select: null };

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
    const { includeClosed } = req.query;
    try {
        const response = await notion.databases.query({ database_id: cardsDbId });
        // UPDATED: Renaming properties to be more JS-friendly
        let results = response.results.map(page => {
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
                tier1PaymentType: parsed['Tier 1 Cashback Payment Type'],
                tier2PaymentType: parsed['Tier 2 Cashback Payment Type'],
                minPointsRedeem: parsed['Minimum Points Redeem'],
                totalAmountRedeemed: parsed['Total Amount Redeemed'],
            };
        });

        // If 'includeClosed' is NOT 'true', filter out the Closed cards
        if (includeClosed !== 'true') {
            results = results.filter(card => card.status !== 'Closed');
        }

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
                // NEW: Default flag and Excluded MCC Codes
                isDefault: parsed['Default'] || false,
                excludedMccCodes: parsed['Excluded MCC Code'] ? parsed['Excluded MCC Code'].split(',').map(c => c.trim()) : [],
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
                adjustment: parsed['Adjustment'] || 0,
                notes: parsed['Notes'],
                amountRedeemed: parsed['Amount Redeemed'] || 0,
                reviewed: parsed['Reviewed'] || false, // NEW
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
    const { months } = req.query; // Expecting comma-separated YYYYMM

    try {
        let filter;
        if (months) {
            // Validate months type to prevent HTTP Parameter Pollution attacks (e.g., array injection)
            if (typeof months !== 'string') {
                return res.status(400).json({ error: 'Invalid months format. Must be a comma-separated string.' });
            }

            const monthList = months.split(',').map(m => m.trim());
            if (monthList.length > 0) {
                filter = {
                    or: monthList.map(m => ({
                        property: 'Month',
                        select: { equals: m }
                    }))
                };
            }
        }

        const allResults = [];
        let nextCursor = undefined;

        // Loop to handle Notion's pagination, ensuring all results are fetched.
        do {
            const response = await notion.databases.query({
                database_id: monthlyCategoryDbId,
                filter: filter,
                start_cursor: nextCursor,
            });
            allResults.push(...response.results);
            nextCursor = response.next_cursor;
        } while (nextCursor);

        const results = allResults.map(page => {

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

app.get('/api/lookup-merchant', lookupRateLimiter, async (req, res) => {
    const { keyword } = req.query;
    if (!keyword || typeof keyword !== 'string' || keyword.trim().length < 2) {
        // Return a consistent structure for empty queries
        return res.json({ type: 'merchant', bestMatch: null, prediction: null, history: [], external: [] });
    }

    try {
        // Step 1: Perform primary lookups (Internal + External Vercel)
        let [transactions, externalResults] = await Promise.all([
            searchInternalTransactions(keyword),
            searchExternalMcc(keyword)
        ]);

        // Step 2: Fallback logic - If external results are empty, try RCGV
        if (externalResults.length === 0) {
             const rcgvResults = await searchExternalMccFallback(keyword);
             if (rcgvResults.length > 0) {
                 externalResults = rcgvResults;
             }
        }

        // Step 3: Derive the combined logic for suggestions.

        // A. Logic for "Best Match": Prioritize your history, but fall back to external.
        let bestMatch = null;

        // Prioritize your own transaction history for the best match
        // We look for the first valid one with both MCC and Merchant
        const validHistory = transactions.find(t => t['MCC Code'] && t['merchantLookup']);

        if (validHistory) {
            bestMatch = {
                mcc: validHistory['MCC Code'],
                merchant: validHistory['merchantLookup'],
                method: validHistory['Method'],
                source: 'history'
            };
        } 
        // Fallback to the external API if no history is found
        else if (externalResults.length > 0) {
            bestMatch = {
                mcc: externalResults[0].mcc,
                merchant: externalResults[0].merchant,
                method: externalResults[0].method,
                source: 'external'
            };
        }
        
        // B. Logic for "Prediction" (always based on your internal history)
        const frequencyMap = new Map();
        transactions.forEach(tx => {
            if (tx['merchantLookup'] && tx['MCC Code'] && tx['Category']) {
                const key = `${tx['merchantLookup']}|${tx['MCC Code']}|${tx['Category']}`;
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
            if (tx['merchantLookup'] && tx['MCC Code']) {
                const key = `${tx['merchantLookup']}|${tx['MCC Code']}`;
                if (!uniqueHistory.has(key)) {
                    uniqueHistory.set(key, { merchant: tx['merchantLookup'], mcc: tx['MCC Code'], method: tx['Method'] });
                }
            }
        });

        // Step 4: Return the unified object containing BOTH data sets.
        res.json({
            type: 'merchant',
            bestMatch: bestMatch,
            prediction: prediction,
            history: Array.from(uniqueHistory.values()),
            external: externalResults
        });

    } catch (error) {
        console.error('Unified Merchant Lookup Error:', error.body || error);
        res.status(500).json({ error: 'Failed to perform lookup' });
    }
});

// GET /api/transactions/query - Paginated & Searchable Transactions
app.get('/api/transactions/query', async (req, res) => {
    const { search, cursor, limit = 20 } = req.query;

    try {
        const queryOptions = {
            database_id: transactionsDbId,
            page_size: Math.min(parseInt(limit, 10), 100), // Enforce max limit
            sorts: [{ property: 'Transaction Date', direction: 'descending' }],
        };

        if (cursor) {
            queryOptions.start_cursor = cursor;
        }

        // Build filter if 'search' is provided
        if (search && search.trim()) {
            const keyword = search.trim();
            queryOptions.filter = {
                or: [
                    {
                        property: 'Transaction Name',
                        title: {
                            contains: keyword,
                        },
                    },
                    {
                        property: 'Merchant',
                        rich_text: {
                            contains: keyword,
                        },
                    },
                    {
                        property: 'Amount',
                        number: {
                            equals: parseFloat(keyword) || 0, // Simple exact match for amount if it's a number
                        }
                    }
                ],
            };
        }

        const response = await notion.databases.query(queryOptions);

        const results = response.results.map(mapTransaction);

        res.json({
            results,
            nextCursor: response.next_cursor,
            hasMore: response.has_more
        });

    } catch (error) {
        console.error('Failed to query transactions:', error.body || error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
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
            exchangeRate,
            foreignCurrency,
            conversionFee,
            paidFor,
            subCategory,
            billingDate,
            method, // Add method
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
        if (foreignCurrencyAmount) properties['Foreign Amount'] = { number: Number(foreignCurrencyAmount) };
        if (exchangeRate) properties['Exchange Rate'] = { number: Number(exchangeRate) };
        if (conversionFee) properties['Conversion Fee'] = { number: Number(conversionFee) };
        if (foreignCurrency) {
            const fcOptions = await getSelectOptions('Foreign Currency');
            if (!fcOptions.find(o => o.name === foreignCurrency)) {
                await addSelectOption('Foreign Currency', foreignCurrency);
            }
            properties['Foreign Currency'] = { select: { name: foreignCurrency } };
        }
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

        if (method) {
            const methodOptions = await getSelectOptions('Method');
            if (!methodOptions.find(o => o.name === method)) {
                await addSelectOption('Method', method);
            }
            properties['Method'] = { select: { name: method } };
        }

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
        const database = await getTransactionDatabaseSchema();
        
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

// GET /api/definitions - Retrieve all select options for various fields
app.get('/api/definitions', async (req, res) => {
    try {
        const database = await getTransactionDatabaseSchema();
        const definitions = {
            categories: [],
            methods: [],
            paidFor: [],
            foreignCurrencies: [],
            subCategories: []
        };

        const extractOptions = (propName) => {
            // Use case-insensitive property finding
            const resolvedKey = Object.keys(database.properties).find(k => k.toLowerCase() === propName.toLowerCase()) || propName;
            const prop = database.properties[resolvedKey];
            if (prop && prop.select) return prop.select.options.map(o => o.name);
            if (prop && prop.multi_select) return prop.multi_select.options.map(o => o.name);
            return [];
        };

        definitions.categories = extractOptions('Category');
        definitions.methods = extractOptions('Method');
        definitions.paidFor = extractOptions('Paid for');
        definitions.foreignCurrencies = extractOptions('Foreign Currency');
        definitions.subCategories = extractOptions('Sub Category');

        res.json(definitions);
    } catch (error) {
        console.error('Error fetching definitions:', error);
        res.status(500).json({ error: 'Failed to fetch definitions' });
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
    const { paidAmount, statementAmount, adjustment, notes, amountRedeemed, reviewed } = req.body;

    try {
        const propertiesToUpdate = {};

        // Conditionally add properties if they exist in the request
        if (typeof paidAmount === 'number') {
            propertiesToUpdate['Paid Amount'] = { number: paidAmount };
        }
        if (typeof statementAmount === 'number') {
            propertiesToUpdate['Statement Amount'] = { number: statementAmount };
        }
        if (typeof adjustment === 'number') {
            propertiesToUpdate['Adjustment'] = { number: adjustment };
        }
        if (typeof amountRedeemed === 'number') {
            propertiesToUpdate['Amount Redeemed'] = { number: amountRedeemed };
        }
        if (notes !== undefined) {
             propertiesToUpdate['Notes'] = { rich_text: [{ text: { content: notes || "" } }] };
        }
        if (typeof reviewed === 'boolean') {
            propertiesToUpdate['Reviewed'] = { checkbox: reviewed };
        }

        // Check if there's anything to update
        if (Object.keys(propertiesToUpdate).length === 0) {
            return res.status(400).json({ error: 'No valid fields provided to update.' });
        }

        await notion.pages.update({
            page_id: id,
            properties: propertiesToUpdate,
        });
        res.status(200).json({ success: true, message: 'Summary updated successfully.' });
    } catch (error) {
        console.error('Error updating summary in Notion:', error.body || error);
        res.status(500).json({ error: 'Failed to update summary in Notion.' });
    }
});

// POST /api/monthly-summary/bulk-review - Bulk update Reviewed status
app.post('/api/monthly-summary/bulk-review', async (req, res) => {
    const { ids, reviewed } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'An array of summary IDs is required.' });
    }

    if (ids.length > MAX_BULK_LIMIT) {
        return res.status(400).json({ error: `Too many items. Maximum allowed is ${MAX_BULK_LIMIT}.` });
    }

    if (typeof reviewed !== 'boolean') {
        return res.status(400).json({ error: 'A boolean "reviewed" status is required.' });
    }

    try {
        // Notion doesn't have a native bulk update for pages.
        // We process sequentially to avoid hitting rate limits (3 req/sec),
        // as bulk operations might exceed this if done in parallel.
        const results = [];

        for (const id of ids) {
            try {
                await notion.pages.update({
                    page_id: id,
                    properties: {
                        'Reviewed': { checkbox: reviewed }
                    }
                });
                results.push(id);
            } catch (innerError) {
                console.error(`Failed to update summary ${id} in bulk-review`, innerError);
            }
        }

        res.status(200).json({ success: true, updatedIds: results });

    } catch (error) {
        console.error('Error bulk updating summary reviews:', error.body || error);
        res.status(500).json({ error: 'Failed to bulk update reviews.' });
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


// POST /api/transactions/finalize - Simple approval for already-valid transactions
app.post('/api/transactions/finalize', async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) return res.status(400).json({ error: 'IDs required' });

    if (ids.length > MAX_BULK_LIMIT) {
        return res.status(400).json({ error: `Too many items. Maximum allowed is ${MAX_BULK_LIMIT}.` });
    }

    try {
        const results = [];
        for (const id of ids) {
            try {
                // 1. Fetch current to get name
                const page = await notion.pages.retrieve({ page_id: id });
                const currentName = page.properties['Transaction Name']?.title[0]?.plain_text || "";

                // 2. Clean Name
                let newName = currentName;
                if (newName.startsWith("Email_")) {
                    newName = newName.substring(6);
                }
                newName = newName.trim();

                // 3. Update (Name + Uncheck Automated)
                await notion.pages.update({
                    page_id: id,
                    properties: {
                        'Transaction Name': { title: [{ text: { content: newName } }] },
                        'Automated': { checkbox: false }
                    }
                });
                results.push(id);
            } catch (innerErr) {
                console.error(`Failed to finalize ${id}`, innerErr);
            }
        }
        res.status(200).json(results);
    } catch (error) {
        console.error("Finalize Error", error);
        res.status(500).json({ error: "Failed to finalize transactions" });
    }
});

if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
}

module.exports = { app, searchInternalTransactions };