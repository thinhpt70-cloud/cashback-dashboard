import React from 'react';
import { render, screen } from '@testing-library/react';
import TransactionDetailSheet from './TransactionDetailSheet';
import '@testing-library/jest-dom';

// Mock Lucide icons
jest.mock('lucide-react', () => ({
    Calendar: () => <span data-testid="icon-calendar" />,
    CreditCard: () => <span data-testid="icon-credit-card" />,
    Tag: () => <span data-testid="icon-tag" />,
    Store: () => <span data-testid="icon-store" />,
    Layers: () => <span data-testid="icon-layers" />,
    FileText: () => <span data-testid="icon-file-text" />,
    Receipt: () => <span data-testid="icon-receipt" />,
    Globe: () => <span data-testid="icon-globe" />,
    AlertCircle: () => <span data-testid="icon-alert-circle" />,
    CheckCircle2: () => <span data-testid="icon-check-circle" />,
    Check: () => <span data-testid="icon-check" />,
    Percent: () => <span data-testid="icon-percent" />,
    ArrowLeft: () => <span data-testid="icon-arrow-left" />,
}));

// Mock Shadcn Sheet components to just render children immediately
jest.mock('../ui/sheet', () => ({
    Sheet: ({ children, open }) => open ? <div>{children}</div> : null,
    SheetContent: ({ children }) => <div>{children}</div>,
    SheetHeader: ({ children }) => <div>{children}</div>,
    SheetTitle: ({ children }) => <div>{children}</div>,
    SheetDescription: ({ children }) => <div>{children}</div>,
    SheetFooter: ({ children }) => <div>{children}</div>,
}));

describe('TransactionDetailSheet', () => {
    const mockTransaction = {
        id: 'tx1',
        'Transaction Name': 'Test Transaction',
        'Amount': 80000, // Final
        'grossAmount': 100000, // Gross
        'Transaction Date': '2023-10-01',
        'Card': ['card1'],
        'notes': 'Discounts: [{"description": "Promo", "amount": 20000}]',
        'otherDiscounts': 20000,
    };

    test('renders Gross Amount in Discounts section', () => {
        render(
            <TransactionDetailSheet
                transaction={mockTransaction}
                isOpen={true}
                onClose={() => {}}
                currencyFn={(n) => `${n} VND`}
            />
        );

        // Look for Gross Amount text
        expect(screen.getByText('Gross Amount')).toBeInTheDocument();
        expect(screen.getByText('100000 VND')).toBeInTheDocument();
    });

    test('renders Gross Amount (VND) in International section', () => {
        const intlTransaction = {
            ...mockTransaction,
            notes: '',
            otherDiscounts: 0,
            foreignCurrencyAmount: 10,
            foreignCurrency: 'USD',
            exchangeRate: 23000,
            conversionFee: 5000,
            'grossAmount': 230000,
            'Amount': 235000 // Gross + Fee
        };

        render(
            <TransactionDetailSheet
                transaction={intlTransaction}
                isOpen={true}
                onClose={() => {}}
                currencyFn={(n) => `${n} VND`}
            />
        );

        expect(screen.getByText('Gross Amount (VND)')).toBeInTheDocument();
        expect(screen.getByText('230000 VND')).toBeInTheDocument();
    });
});
