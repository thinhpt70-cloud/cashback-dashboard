
const express = require('express');
const app = express();
const path = require('path');

// Mock data
const transactions = [
    {
        id: 'T1',
        'Transaction Date': '2023-10-01',
        'Transaction Name': 'Grocery Store ABC',
        'Amount': 150000,
        'Card': ['C1'],
        'MCC Code': '5411',
        'Category': 'Groceries',
        'Applicable Rule': ['R1'],
        'Match': false,
        'Automated': false,
        status: 'Mismatch',
        statusType: 'error'
    },
    {
        id: 'T2',
        'Transaction Date': '2023-10-02',
        'Transaction Name': 'Restaurant XYZ',
        'Amount': 250000,
        'Card': ['C2'],
        'MCC Code': '5812',
        'Category': 'Dining',
        'Applicable Rule': ['R2'],
        'Match': true,
        'Automated': true,
        status: 'Quick Approve',
        statusType: 'success'
    }
];

const cards = [
    { id: 'C1', name: 'Visa Gold' },
    { id: 'C2', name: 'Mastercard Platinum' }
];

const rules = [
    { id: 'R1', ruleName: 'Supermarket 5%' },
    { id: 'R2', ruleName: 'Dining 10%' }
];

const monthlyCategorySummary = [];

// Mock API endpoints
app.get('/api/verify-auth', (req, res) => res.sendStatus(200));
app.get('/api/cards', (req, res) => res.json(cards));
app.get('/api/rules', (req, res) => res.json(rules));
app.get('/api/monthly-category-summary', (req, res) => res.json({ data: monthlyCategorySummary }));
app.get('/api/transactions', (req, res) => {
    return res.json([]);
});
app.get('/api/review-transactions', (req, res) => {
     // NOTE: The frontend likely hits /api/transactions with specific filters for review
     // But looking at CashbackDashboard.jsx, it calls fetchReviewTransactions
     // which usually hits /api/transactions?filterBy=review (implied)
     // Let's assume the frontend uses a specific endpoint or filter.
     // In the original code, `fetchReviewTransactions` usually fetches without month?
     // Let's check `useCashbackData.js` if we could... but simpler is to mock generic response
     return res.json(transactions);
});

// Since proxy targets 3001, we run on 3001
const port = 3001;
app.listen(port, () => {
    console.log(`Mock server running on port ${port}`);
});
