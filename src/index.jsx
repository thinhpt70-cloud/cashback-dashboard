import React from 'react';
import { createRoot } from 'react-dom/client';
import SharedTransactionsDialog from './components/shared/SharedTransactionsDialog';
import { TooltipProvider } from './components/ui/tooltip';
import './styles/global.css';

const App = () => {
    const transactions = [
        {
            id: '1',
            'Transaction Name': '9PAY*TIKTOKSHOP 19...',
            'Transaction Date': '2026-04-06',
            'Amount': 264000,
            estCashback: 50000,
            rate: 0.189,
            'Category': 'Food & Dining',
            'Applicable Rule': ['rule1'],
        },
        {
            id: '2',
            'Transaction Name': 'Vanguard',
            'Transaction Date': '2026-04-06',
            'Amount': 236350,
            estCashback: 47270,
            rate: 0.2,
            'Category': 'Shopping',
            'Applicable Rule': ['rule1'],
        }
    ];

    const ruleMap = new Map();
    ruleMap.set('rule1', { id: 'rule1', name: 'CAKE FREELANCE - Groceries' });

    const cardMap = new Map();

    const currencyFn = (val) => `${val.toLocaleString()} đ`;

    return (
        <TooltipProvider>
            <SharedTransactionsDialog
                isOpen={true}
                onClose={() => {}}
                transactions={transactions}
                title="Transactions for Cake - Thời trang"
                description="Here are the transactions for the selected category."
                currencyFn={currencyFn}
                rules={[{ id: 'rule1', name: 'CAKE FREELANCE - Groceries' }]}
                cardMap={cardMap}
                allCards={[]}
                monthlyCategorySummary={[]}
            />
        </TooltipProvider>
    );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
