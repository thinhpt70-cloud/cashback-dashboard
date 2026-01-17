
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RecentTransactions from './RecentTransactions';
import '@testing-library/jest-dom';

// Mock UI components to simplify testing
jest.mock('@/components/ui/card', () => ({
    Card: ({ children, className }) => <div className={`mock-card ${className}`}>{children}</div>,
    CardHeader: ({ children }) => <div className="mock-card-header">{children}</div>,
    CardTitle: ({ children }) => <div className="mock-card-title">{children}</div>,
    CardContent: ({ children }) => <div className="mock-card-content">{children}</div>,
}));

jest.mock('@/components/ui/button', () => ({
    Button: ({ children, onClick, ...props }) => <button onClick={onClick} {...props}>{children}</button>,
}));

jest.mock('@/components/ui/dropdown-menu', () => ({
    DropdownMenu: ({ children }) => <div>{children}</div>,
    DropdownMenuTrigger: ({ children }) => <div>{children}</div>,
    DropdownMenuContent: ({ children }) => <div className="mock-dropdown-content">{children}</div>,
    DropdownMenuItem: ({ children, onSelect }) => <div onClick={onSelect}>{children}</div>,
}));

jest.mock('lucide-react', () => ({
    ChevronDown: () => <span>ChevronDown</span>,
    History: () => <span>History</span>,
}));

// Mock Data
const mockTransactions = [
    {
        id: '1',
        'Transaction Name': 'Grocery Store',
        'Transaction Date': '2023-10-25', // Wednesday
        'Amount': 500000,
        'estCashback': 25000,
        'Card': ['card1']
    },
    {
        id: '2',
        'Transaction Name': 'Online Shop',
        'Transaction Date': '2023-10-24', // Tuesday
        'Amount': 200000,
        'estCashback': 10000,
        'Card': ['card1']
    }
];

const mockCardMap = new Map([
    ['card1', { name: 'My Card' }]
]);

const mockCurrencyFn = (amount) => `$${amount}`;

describe('RecentTransactions', () => {
    beforeEach(() => {
        // Mock date to 2023-10-27 (Friday) so "This Week" includes the mock transactions
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2023-10-27'));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('renders loading state correctly', () => {
        render(<RecentTransactions isLoading={true} transactions={[]} currencyFn={mockCurrencyFn} cardMap={new Map()} />);
        // Assuming Skeleton renders some divs, just check if it doesn't crash and renders something recognizable if we inspected deeper.
        // For now, checking if it renders without error is key.
        expect(screen.queryByText('No activity for this period.')).toBeNull();
    });

    it('renders empty state correctly', () => {
        render(<RecentTransactions isLoading={false} transactions={[]} currencyFn={mockCurrencyFn} cardMap={new Map()} />);
        expect(screen.getByText('No activity for this period.')).toBeInTheDocument();
    });

    it('renders transactions for "This Week"', () => {
        render(
            <RecentTransactions
                isLoading={false}
                transactions={mockTransactions}
                currencyFn={mockCurrencyFn}
                cardMap={mockCardMap}
            />
        );

        expect(screen.getByText('Grocery Store')).toBeInTheDocument();
        expect(screen.getByText('Online Shop')).toBeInTheDocument();
        // Use getAllByText for 'My Card' as it appears for each transaction
        expect(screen.getAllByText('My Card').length).toBe(2);
        expect(screen.getByText('$500000')).toBeInTheDocument();
    });

    it('filters transactions correctly when switching to "Last Week"', () => {
         render(
            <RecentTransactions
                isLoading={false}
                transactions={mockTransactions}
                currencyFn={mockCurrencyFn}
                cardMap={mockCardMap}
            />
        );

        // Initially they are shown because we mocked date to be in same week
        expect(screen.queryByText('Grocery Store')).toBeInTheDocument();

        // Switch filter
        const lastWeekOption = screen.getByText('Last Week');
        fireEvent.click(lastWeekOption);

        // Transactions are from this week, so they should disappear
        expect(screen.queryByText('Grocery Store')).not.toBeInTheDocument();
        expect(screen.getByText('No activity for this period.')).toBeInTheDocument();
    });
});
