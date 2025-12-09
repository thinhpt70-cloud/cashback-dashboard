import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CashbackTracker from './CashbackTracker';
import { toast } from 'sonner';

// Mock child components to simplify testing
jest.mock('../../ui/badge', () => ({
  Badge: ({ children, variant, className }) => <div data-testid="badge" className={`${variant} ${className}`}>{children}</div>,
}));
jest.mock('../../ui/button', () => ({
  Button: ({ children, onClick, variant, className }) => <button data-testid="button" onClick={onClick} className={`${variant} ${className}`}>{children}</button>,
}));
jest.mock('../../ui/input', () => ({
  Input: (props) => <input data-testid="input" {...props} />,
}));
jest.mock('../../ui/textarea', () => ({
  Textarea: (props) => <textarea data-testid="textarea" {...props} />,
}));
jest.mock('../../ui/dialog', () => ({
  Dialog: ({ children, open }) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }) => <div>{children}</div>,
  DialogHeader: ({ children }) => <div>{children}</div>,
  DialogTitle: ({ children }) => <div>{children}</div>,
  DialogDescription: ({ children }) => <div>{children}</div>,
  DialogFooter: ({ children }) => <div>{children}</div>,
}));
jest.mock('../../ui/tabs', () => ({
  Tabs: ({ children, onValueChange }) => <div onClick={() => onValueChange('card')}>{children}</div>, // Mock trigger
  TabsList: ({ children }) => <div>{children}</div>,
  TabsTrigger: ({ children, value }) => <button data-testid={`tab-${value}`}>{children}</button>,
}));
jest.mock('../../ui/select', () => ({
    Select: ({ children }) => <div>{children}</div>,
    SelectTrigger: ({ children }) => <div>{children}</div>,
    SelectContent: ({ children }) => <div>{children}</div>,
    SelectItem: ({ children }) => <div>{children}</div>,
    SelectValue: () => <div>Value</div>
}));
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock API
global.fetch = jest.fn();

const SAMPLE_CARDS = [
    { id: 'c1', name: 'Cash Card', bank: 'Bank A', overallMonthlyLimit: 100, statementDay: 20, paymentDueDay: 15, tier1PaymentType: 'M+1', tier2PaymentType: 'M+1' },
    { id: 'c2', name: 'Points Card', bank: 'Bank B', overallMonthlyLimit: 0, statementDay: 15, paymentDueDay: 10, tier1PaymentType: 'Points', tier2PaymentType: 'Points' },
];

const SAMPLE_SUMMARY = [
    { id: 's1', cardId: 'c1', month: '2025-10', actualCashback: 50, adjustment: 0, amountRedeemed: 0 },
    { id: 's2', cardId: 'c2', month: '2025-10', actualCashback: 100, adjustment: 0, amountRedeemed: 0, notes: '' },
    { id: 's3', cardId: 'c2', month: '2025-09', actualCashback: 200, adjustment: 0, amountRedeemed: 0, notes: 'Old' },
    // Case for checking total calculation (actualCashback should include adjustment)
    { id: 's5', cardId: 'c1', month: '2025-11', actualCashback: 120, adjustment: 20, amountRedeemed: 0 },
];

describe('CashbackTracker', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders cashback tab by default', () => {
        render(<CashbackTracker cards={SAMPLE_CARDS} monthlySummary={SAMPLE_SUMMARY} />);
        const cashCards = screen.getAllByText('Cash Card');
        expect(cashCards.length).toBeGreaterThan(0);
        expect(screen.queryByText('Points Card')).not.toBeInTheDocument();
    });

    test('switches to points tab', () => {
        render(<CashbackTracker cards={SAMPLE_CARDS} monthlySummary={SAMPLE_SUMMARY} />);
        const pointsTabBtn = screen.getByText(/Rewards Points/i);
        fireEvent.click(pointsTabBtn);
        expect(screen.getByText('Points Card')).toBeInTheDocument();
        // 300 appears in Total Stats AND on the Card.
        expect(screen.getAllByText('300').length).toBeGreaterThanOrEqual(2);
    });

    test('FIFO redemption logic', async () => {
        render(<CashbackTracker cards={SAMPLE_CARDS} monthlySummary={SAMPLE_SUMMARY} />);

        // Go to points tab
        const pointsTabBtn = screen.getByText(/Rewards Points/i);
        fireEvent.click(pointsTabBtn);

        // Click Redeem
        const redeemBtn = screen.getByText(/Redeem Points/i);
        fireEvent.click(redeemBtn);

        // Dialog should open
        expect(screen.getByTestId('dialog')).toBeInTheDocument();

        // Enter amount 150
        const input = screen.getByPlaceholderText(/Enter points amount.../i);
        fireEvent.change(input, { target: { value: '150' } });

        // Enter notes
        const notesInput = screen.getByPlaceholderText(/e.g., Agoda voucher/i);
        fireEvent.change(notesInput, { target: { value: 'Test Redeem' } });

        // Confirm
        const confirmBtn = screen.getByText('Confirm Redemption');

        // Mock fetch success
        fetch.mockResolvedValue({ ok: true });

        await fireEvent.click(confirmBtn);

        // Expect 2 API calls (FIFO: s3 (Sep) first, then s2 (Oct))
        // s3: 200 available. Redeem 150? No, we redeem 150 total.
        // Wait, s3 is Sep (2025-09), s2 is Oct (2025-10).
        // FIFO order: Sep, then Oct.
        // Sep has 200. We need 150.
        // So we take 150 from Sep.

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledTimes(1);
        });

        // Check payload of first call (should be s3)
        const call1 = fetch.mock.calls[0];
        expect(call1[0]).toContain('/api/monthly-summary/s3');
        const body1 = JSON.parse(call1[1].body);
        expect(body1.amountRedeemed).toBe(150); // 0 + 150
        expect(body1.notes).toContain('Test Redeem');
    });

    test('FIFO redemption logic across multiple months', async () => {
        // Sep: 100 (Redeem 100) -> 0 remaining
        // Oct: 100 (Redeem 50) -> 50 remaining
        // Total redeem: 150

        const MULTI_SUMMARY = [
            { id: 's2', cardId: 'c2', month: '2025-10', actualCashback: 100, adjustment: 0, amountRedeemed: 0 },
            { id: 's3', cardId: 'c2', month: '2025-09', actualCashback: 100, adjustment: 0, amountRedeemed: 0 },
        ];

        render(<CashbackTracker cards={SAMPLE_CARDS} monthlySummary={MULTI_SUMMARY} />);

        fireEvent.click(screen.getByText(/Rewards Points/i));
        fireEvent.click(screen.getByText(/Redeem Points/i));

        fireEvent.change(screen.getByPlaceholderText(/Enter points amount.../i), { target: { value: '150' } });

        fetch.mockResolvedValue({ ok: true });
        await fireEvent.click(screen.getByText('Confirm Redemption'));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledTimes(2);
        });

        // Call 1: Sep (s3) - Full 100
        const call1 = fetch.mock.calls.find(call => call[0].includes('s3'));
        expect(JSON.parse(call1[1].body).amountRedeemed).toBe(100);

        // Call 2: Oct (s2) - Partial 50
        const call2 = fetch.mock.calls.find(call => call[0].includes('s2'));
        expect(JSON.parse(call2[1].body).amountRedeemed).toBe(50);
    });

    test('handles non-string tier1PaymentType gracefully', () => {
        const BROKEN_CARDS = [
            { id: 'c3', name: 'Broken Card', bank: 'Bank C', overallMonthlyLimit: 0, statementDay: 15, tier1PaymentType: 123, tier2PaymentType: 'M+1' },
        ];
        const BROKEN_SUMMARY = [
            { id: 's4', cardId: 'c3', month: '2025-10', actualCashback: 100, adjustment: 0, amountRedeemed: 0 },
        ];

        render(<CashbackTracker cards={BROKEN_CARDS} monthlySummary={BROKEN_SUMMARY} />);
        expect(screen.getByText('Broken Card')).toBeInTheDocument();
        // Should not crash
    });

    test('calculates correct total earned avoiding double counting of adjustment', () => {
        render(<CashbackTracker cards={SAMPLE_CARDS} monthlySummary={SAMPLE_SUMMARY} />);
        // s5: actualCashback 120, adjustment 20. Total should be 120 (not 140).
        // It's displayed in the "Total Earned" column/area.
        // Look for 120 formatted as currency.
        // Note: 120 might appear multiple times or not?
        // Let's rely on text content.
        expect(screen.getByText('120')).toBeInTheDocument();
        // Ensure 140 is NOT present
        expect(screen.queryByText('140')).not.toBeInTheDocument();
    });

    test('calculates correct due date with rollover logic', () => {
        render(<CashbackTracker cards={SAMPLE_CARDS} monthlySummary={SAMPLE_SUMMARY} />);
        // Card c1 (Cash Card). Month 2025-10. M+1.
        // Target Month: 2025-11.
        // Statement Day: 20. Payment Due Day: 15.
        // 15 < 20 -> Rollover to next month -> 2025-12.
        // Due Date: 15 Dec 2025.

        // Check if "15 Dec" is rendered.
        // Use getAllByText in case multiple cards show it (though s1 is the only one for Oct)
        const dueDates = screen.getAllByText(/15 Dec/);
        expect(dueDates.length).toBeGreaterThan(0);
    });
});
