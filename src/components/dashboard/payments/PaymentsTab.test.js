import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PaymentsTab from './PaymentsTab';
import { TooltipProvider } from '../../ui/tooltip';

// Mock PaymentsCalendarView to avoid date-fns/react-day-picker ESM issues in Jest
jest.mock('./PaymentsCalendarView', () => {
  return function MockPaymentsCalendarView() {
    return <div data-testid="mock-calendar-view">Statement Issued</div>;
  };
});

// Mock dependencies
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([{ Amount: 1000, estCashback: 0 }]), // Mock transactions
  })
);

const mockCurrencyFn = (val) => `$${val}`;
const mockFmtYMShortFn = (ym) => ym; // Simple pass-through
const mockDaysLeftFn = (dateStr) => {
  if (dateStr === '2023-07-15') return null; // Past
  return 10; // Upcoming
};

const mockCards = [
  {
    id: 'c1',
    name: 'Test Card',
    last4: '1234',
    statementDay: 1,
    paymentDueDay: 15,
    tier1PaymentType: 'M+1',
    overallMonthlyLimit: 1000,
    useStatementMonthForPayments: false,
    status: 'Active'
  }
];

const mockSummaries = [
  {
    id: 's1',
    cardId: 'c1',
    month: '2023-07',
    actualCashback: 100, // Earned in July
    adjustment: 0,
    spend: 500,
    statementAmount: 0,
    paidAmount: 500
  },
  {
    id: 's2',
    cardId: 'c1',
    month: '2023-08',
    actualCashback: 0,
    adjustment: 0,
    spend: 1000, // Spend in Aug
    statementAmount: 0,
    paidAmount: 0
  }
];

// Helper to wrap in providers
const renderComponent = (props = {}) => {
  return render(
    <TooltipProvider>
      <PaymentsTab
        cards={mockCards}
        monthlySummary={mockSummaries}
        currencyFn={mockCurrencyFn}
        fmtYMShortFn={mockFmtYMShortFn}
        daysLeftFn={mockDaysLeftFn}
        onViewTransactions={jest.fn()}
        {...props}
      />
    </TooltipProvider>
  );
};

describe('PaymentsTab', () => {
  beforeAll(() => {
    jest.useFakeTimers('modern');
    jest.setSystemTime(new Date('2023-07-20T00:00:00Z')); // Before Aug 1 statement
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('calculates applicable cashback correctly for M+1', async () => {
    // Explanation:
    // Card uses M+1.
    // July (2023-07) cashback of 100 lands in August.
    // Aug Statement (2023-08): Statement Date Aug 1, Due Aug 15.
    // July Cashback T1 Date: Aug 1 (based on M+1 logic and statement day 1).
    // Window for Aug Statement: [July 1 (approx), Aug 15].
    // So Aug 1 falls in window.
    // Expected Balance for Aug Statement = Spend (1000) - Credits (100) = 900.

    const { container } = renderComponent();

    // Wait for loading to finish
    await waitFor(() => expect(screen.queryByText(/Calculating payment schedules/i)).not.toBeInTheDocument());

    // Check for "Test Card"
    expect(screen.getByText('Test Card')).toBeInTheDocument();

    console.log(container.innerHTML);

    // Using specific text matchers might be tricky due to formatting, so we check for presence of values
    const balanceElements = screen.queryAllByText('$900');
    expect(balanceElements.length).toBeGreaterThan(0); // 1000 - 100
    expect(screen.getAllByText('-$100').length).toBeGreaterThan(0); // Credit
  });

  test('renders list and calendar toggle', async () => {
    renderComponent();
    await waitFor(() => expect(screen.queryByText(/Calculating/i)).not.toBeInTheDocument());

    expect(screen.getByText('List')).toBeInTheDocument();
    expect(screen.getByText('Calendar')).toBeInTheDocument();
  });

  test('switching to calendar view', async () => {
    renderComponent();
    await waitFor(() => expect(screen.queryByText(/Calculating/i)).not.toBeInTheDocument());

    const calendarBtn = screen.getByText('Calendar');
    fireEvent.click(calendarBtn);

    expect(screen.getByText('Statement Issued')).toBeInTheDocument();
  });
});
