import React from 'react';
import { render, screen } from '@testing-library/react';
import TransactionsList from './TransactionsList';

// Mock dependencies if needed
jest.mock("lucide-react", () => ({
    ...jest.requireActual("lucide-react"),
    ChevronsUpDown: () => <div data-testid="icon-chevrons" />,
    ArrowUp: () => <div data-testid="icon-arrow-up" />,
    ArrowDown: () => <div data-testid="icon-arrow-down" />,
    X: () => <div data-testid="icon-x" />,
}));

describe('TransactionsList', () => {
    const mockTransactions = [
        {
            id: '1',
            'Transaction Name': 'Test Merchant',
            'Transaction Date': '2023-01-01',
            Amount: 100000,
            estCashback: 1000,
            Card: ['card1'],
            Category: 'Food'
        }
    ];
    const mockCardMap = new Map([['card1', { name: 'Test Card' }]]);

    it('renders transactions', () => {
        render(
            <TransactionsList
                transactions={mockTransactions}
                isLoading={false}
                activeMonth="2023-01"
                cardMap={mockCardMap}
                allCards={[{id: 'card1', name: 'Test Card'}]}
                filterType="date"
                onFilterTypeChange={() => {}}
                statementMonths={[]}
                isDesktop={true}
                onTransactionDeleted={() => {}}
                onEditTransaction={() => {}}
                fmtYMShortFn={(m) => m}
            />
        );
        expect(screen.getByText('Test Merchant')).toBeInTheDocument();
        expect(screen.getAllByText('Test Card').length).toBeGreaterThan(0);
    });
});
