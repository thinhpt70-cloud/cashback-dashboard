import React from 'react';
import { render, screen } from '@testing-library/react';
import TransactionDetailSheet from './TransactionDetailSheet';
import useMediaQuery from '../../hooks/useMediaQuery';

// Mock dependencies
jest.mock('../../hooks/useMediaQuery', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../ui/sheet', () => ({
  Sheet: ({ children, open }) => open ? <div data-testid="sheet">{children}</div> : null,
  SheetContent: ({ children }) => <div data-testid="sheet-content">{children}</div>,
  SheetHeader: ({ children }) => <div>{children}</div>,
  SheetTitle: ({ children }) => <div>{children}</div>,
  SheetDescription: ({ children }) => <div>{children}</div>,
  SheetFooter: ({ children }) => <div>{children}</div>,
}));

jest.mock('../ui/drawer', () => ({
  Drawer: ({ children, open }) => open ? <div data-testid="drawer">{children}</div> : null,
  DrawerContent: ({ children }) => <div data-testid="drawer-content">{children}</div>,
  DrawerHeader: ({ children }) => <div>{children}</div>,
  DrawerTitle: ({ children }) => <div>{children}</div>,
  DrawerDescription: ({ children }) => <div>{children}</div>,
  DrawerFooter: ({ children }) => <div>{children}</div>,
}));

jest.mock('../../lib/utils', () => ({
    cn: (...args) => args.join(' '),
}));

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
  Wallet: () => <span data-testid="icon-wallet" />,
}));

const mockTransaction = {
  id: 'tx-1',
  'Transaction Name': 'Test Transaction',
  'Amount': 100000,
  grossAmount: 100000,
  estCashback: 1000,
  notes: '',
};

describe('TransactionDetailSheet', () => {
  beforeEach(() => {
    // Default to desktop view
    useMediaQuery.mockReturnValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders Gross Amount in Fees section when no foreign data', () => {
    const transaction = {
      ...mockTransaction,
      grossAmount: 100000,
      notes: 'Fees: [{"description": "Test Fee", "amount": 5000}]',
    };

    render(
      <TransactionDetailSheet
        transaction={transaction}
        isOpen={true}
        onClose={() => {}}
      />
    );

    // Should see "Gross Amount" in the fees section
    expect(screen.getByText('Gross Amount')).toBeInTheDocument();
    // Should NOT see "Amount (after conversion)"
    expect(screen.queryByText('Amount (after conversion)')).not.toBeInTheDocument();
  });

  it('renders Amount (after conversion) in Fees section when has foreign data', () => {
    const transaction = {
      ...mockTransaction,
      grossAmount: 100000,
      foreignCurrencyAmount: 10,
      foreignCurrency: 'USD',
      conversionFee: 2000,
      notes: 'Fees: [{"description": "Test Fee", "amount": 5000}]',
    };

    render(
      <TransactionDetailSheet
        transaction={transaction}
        isOpen={true}
        onClose={() => {}}
      />
    );

    // Should see "Amount (after conversion)"
    expect(screen.getByText('Amount (after conversion)')).toBeInTheDocument();
  });

  it('renders mobile Drawer when isDesktop is false', () => {
    useMediaQuery.mockReturnValue(false); // Mobile

    render(
      <TransactionDetailSheet
        transaction={mockTransaction}
        isOpen={true}
        onClose={() => {}}
      />
    );

    expect(screen.getByTestId('drawer')).toBeInTheDocument();
    expect(screen.queryByTestId('sheet')).not.toBeInTheDocument();
  });

  it('renders Desktop Sheet when isDesktop is true', () => {
    useMediaQuery.mockReturnValue(true); // Desktop

    render(
      <TransactionDetailSheet
        transaction={mockTransaction}
        isOpen={true}
        onClose={() => {}}
      />
    );

    expect(screen.getByTestId('sheet')).toBeInTheDocument();
    expect(screen.queryByTestId('drawer')).not.toBeInTheDocument();
  });
});
