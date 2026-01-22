import React from 'react';
import { render, screen } from '@testing-library/react';
import CardSpendsCap from '../components/dashboard/overview/CardSpendsCap';

// Mock dependencies
jest.mock('lucide-react', () => ({
  ChevronDown: () => <div data-testid="ChevronDown" />,
  CheckCircle2: () => <div data-testid="CheckCircle2" />,
  Circle: () => <div data-testid="Circle" />,
  Unlock: () => <div data-testid="Unlock" />,
  Lock: () => <div data-testid="Lock" />,
  Infinity: () => <div data-testid="Infinity" />,
  Eye: () => <div data-testid="Eye" />,
  Snowflake: () => <div data-testid="Snowflake" />,
}));

jest.mock('@/components/ui/card', () => ({
    Card: ({ children, className }) => <div className={`card ${className}`}>{children}</div>,
    CardContent: ({ children, className }) => <div className={`card-content ${className}`}>{children}</div>,
}));

jest.mock('@/components/ui/badge', () => ({
    Badge: ({ children, className }) => <div className={`badge ${className}`}>{children}</div>,
}));

jest.mock('@/components/ui/progress', () => ({
    Progress: ({ value, className }) => <div className={`progress ${className}`} data-value={value} />,
}));

jest.mock('@/components/ui/button', () => ({
    Button: ({ children }) => <button>{children}</button>,
}));

jest.mock('@/components/ui/skeleton', () => ({
    Skeleton: () => <div data-testid="skeleton" />,
}));

jest.mock('@/lib/date', () => ({
    calculateDaysLeftInCashbackMonth: () => ({ days: 10, status: 'Active' }),
    calculateDaysUntilStatement: () => ({ days: 10, status: 'Active' }),
}));

jest.mock('@/components/shared/SharedTransactionsDialog', () => () => <div data-testid="shared-transactions-dialog" />);

// Mock currency function
const mockCurrencyFn = (val) => `$${val}`;

describe('CardSpendsCap', () => {
    const mockCards = [
        {
            id: '1',
            name: 'Active Card',
            status: 'Active',
            overallMonthlyLimit: 1000,
            minimumMonthlySpend: 0,
            cashbackType: 'Standard'
        },
        {
            id: '2',
            name: 'Frozen Card',
            status: 'Frozen',
            overallMonthlyLimit: 1000,
            minimumMonthlySpend: 0,
            cashbackType: 'Standard'
        }
    ];

    const mockRules = [];
    const mockMonthlySummary = [
        { cardId: '1', month: '2023-10', cashback: 100, spend: 1000, monthlyCashbackLimit: 1000 },
        { cardId: '2', month: '2023-10', cashback: 50, spend: 500, monthlyCashbackLimit: 1000 }
    ];

    const defaultProps = {
        cards: mockCards,
        rules: mockRules,
        activeMonth: '2023-10',
        monthlySummary: mockMonthlySummary,
        monthlyCategorySummary: [],
        currencyFn: mockCurrencyFn,
        getCurrentCashbackMonthForCard: () => '2023-10',
        onEditTransaction: jest.fn(),
        onTransactionDeleted: jest.fn(),
        onBulkDelete: jest.fn(),
        onViewTransactionDetails: jest.fn(),
        cardMap: {},
        isLoading: false
    };

    test('renders Frozen card correctly', () => {
        render(<CardSpendsCap {...defaultProps} />);

        // Check if Frozen Card name is rendered
        expect(screen.getByText('Frozen Card')).toBeInTheDocument();

        // Check for Snowflake icon (it appears twice: title and badge)
        const snowflakes = screen.getAllByTestId('Snowflake');
        expect(snowflakes.length).toBeGreaterThanOrEqual(1);

        // Check for "Frozen" badge text
        const frozenTexts = screen.getAllByText('Frozen');
        expect(frozenTexts.length).toBeGreaterThanOrEqual(1);
    });

    test('renders Active card correctly', () => {
        render(<CardSpendsCap {...defaultProps} />);

        // Check if Active Card name is rendered
        expect(screen.getByText('Active Card')).toBeInTheDocument();

        // Check that Active Card does NOT have Snowflake (should only be those for the frozen card)
        // Since we have 1 frozen card with 2 snowflakes, we expect 2 total.
        const snowflakes = screen.getAllByTestId('Snowflake');
        expect(snowflakes).toHaveLength(2);
    });

    test('renders Frozen card with opacity and grayscale classes', () => {
         const { container } = render(<CardSpendsCap {...defaultProps} />);
         // The frozen card should have opacity-60 and grayscale classes.
         // Since we mocked Card as a div with className, we can search for it.
         // We need to find the specific card element.

         // Assuming the order (Frozen at bottom) or searching by content.
         // Let's find the parent of "Frozen Card"
         const frozenCardTitle = screen.getByText('Frozen Card');
         // We need to traverse up to the Card wrapper.
         // In the mock, Card is a div with class 'card'.
         // Since we can't easily traverse up in RTL without a specific query, let's look at the container's HTML or select by class.

         const cards = container.querySelectorAll('.card');
         // Based on sorting, Frozen should be last.
         const lastCard = cards[cards.length - 1];

         expect(lastCard).toHaveClass('opacity-60');
         expect(lastCard).toHaveClass('grayscale');
    });
});
