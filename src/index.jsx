import React from 'react';
import { createRoot } from 'react-dom/client';
import SharedTransactionsDialog from './components/shared/SharedTransactionsDialog';
import { TooltipProvider } from './components/ui/tooltip';
import './styles/global.css';

const transactions = [
    { id: 1, 'Transaction Date': '2023-01-01', 'Transaction Name': 'Test Transaction', Amount: 100 }
];

const TestWrapper = () => {
    return (
        <TooltipProvider>
            <div className="p-10">
                <SharedTransactionsDialog
                    isOpen={true}
                    onClose={() => {}}
                    transactions={transactions}
                    title="Test Dialog"
                    description="Test description"
                    currencyFn={(val) => '$' + val}
                />
            </div>
        </TooltipProvider>
    );
};

const root = createRoot(document.getElementById('root'));
root.render(<TestWrapper />);
