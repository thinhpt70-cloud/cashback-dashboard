import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import TransactionsList from './TransactionsList';
import { TooltipProvider } from '../../ui/tooltip';

// --- MOCKS ---

// Mock UI Components
jest.mock('../../ui/table', () => ({
  Table: ({ children }) => <table data-testid="table">{children}</table>,
  TableHeader: ({ children }) => <thead data-testid="table-header">{children}</thead>,
  TableBody: ({ children }) => <tbody data-testid="table-body">{children}</tbody>,
  TableRow: ({ children }) => <tr data-testid="table-row">{children}</tr>,
  TableHead: ({ children }) => <th>{children}</th>,
  TableCell: ({ children }) => <td>{children}</td>,
}));

jest.mock('../../ui/checkbox', () => ({
  Checkbox: () => <input type="checkbox" />,
}));

jest.mock('../../ui/badge', () => ({
  Badge: ({ children }) => <span>{children}</span>,
}));

jest.mock('../../ui/button', () => ({
  Button: ({ children, onClick, ...props }) => <button onClick={onClick} {...props}>{children}</button>,
}));

jest.mock('../../ui/input', () => ({
  Input: (props) => <input {...props} />,
}));

jest.mock('../../ui/skeleton', () => ({
  Skeleton: () => <div />,
}));

jest.mock('../../ui/card', () => ({
  Card: ({ children }) => <div>{children}</div>,
  CardHeader: ({ children }) => <div>{children}</div>,
  CardTitle: ({ children }) => <div>{children}</div>,
  CardContent: ({ children }) => <div>{children}</div>,
}));

jest.mock('../../ui/tabs', () => ({
  Tabs: ({ children }) => <div>{children}</div>,
  TabsList: ({ children }) => <div>{children}</div>,
  TabsTrigger: ({ children }) => <div>{children}</div>,
}));

// Mock Select to allow controlling values
jest.mock('../../ui/select', () => ({
  Select: ({ value, onValueChange, children }) => (
    <div className="mock-select">
      {/* We render a native select to control the value in tests */}
      <select
        data-testid="mock-select-native"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        style={{ display: 'block' }} // Ensure it's visible for debugging if needed
      >
        <option value="all">All</option>
        <option value="date">Date</option>
        <option value="card">Card</option>
        <option value="category">Category</option>
        <option value="Newest">Newest</option>
        <option value="Oldest">Oldest</option>
      </select>
      {children}
    </div>
  ),
  SelectTrigger: ({ children }) => <div>{children}</div>,
  SelectContent: ({ children }) => <div>{children}</div>,
  SelectItem: ({ value, children }) => <div data-value={value}>{children}</div>,
}));

jest.mock('../../ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }) => <div>{children}</div>,
  DropdownMenuCheckboxItem: ({ children }) => <div>{children}</div>,
  DropdownMenuLabel: ({ children }) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
}));

// Mock Child Components
jest.mock('../../shared/MobileTransactionItem', () => () => <div>MobileItem</div>);
jest.mock('../../shared/MethodIndicator', () => () => <div>Method</div>);
jest.mock('./TransactionRow', () => ({ transaction }) => (
  <tr>
    <td>Row: {transaction['Transaction Name']}</td>
  </tr>
));

// Mock Lucide Icons
jest.mock('lucide-react', () => ({
  ChevronsUpDown: () => <span>Icon</span>,
  ArrowUp: () => <span>Up</span>,
  ArrowDown: () => <span>Down</span>,
  Trash2: () => <span>Trash</span>,
  Search: () => <span>Search</span>,
  X: () => <span>X</span>,
  Filter: () => <span>Filter</span>,
  Layers: () => <span>Layers</span>,
  Settings2: () => <span>Settings</span>,
  CreditCard: () => <span>Card</span>,
  ArrowUpDown: () => <span>Sort</span>,
  ChevronDown: () => <span>Down</span>,
  Inbox: () => <span>Inbox</span>,
}));

// --- TESTS ---

describe('TransactionsList Group Sorting', () => {
  const mockTransactions = [
    {
      id: 'tx-1',
      'Transaction Name': 'Tx 1',
      'Transaction Date': '2026-01-15', // Newer
      'Amount': 100,
      'Card': ['card-1'],
      effectiveDate: '2026-01-15'
    },
    {
      id: 'tx-2',
      'Transaction Name': 'Tx 2',
      'Transaction Date': '2026-01-13', // Older
      'Amount': 200,
      'Card': ['card-1'],
      effectiveDate: '2026-01-13'
    }
  ];

  const mockCards = [{ id: 'card-1', name: 'Test Card' }];
  const mockCardMap = new Map([['card-1', { name: 'Test Card' }]]);

  const renderComponent = () => {
    return render(
      <TransactionsList
        transactions={mockTransactions}
        isLoading={false}
        activeMonth="live"
        cardMap={mockCardMap}
        allCards={mockCards}
        rules={[]}
        isDesktop={true} // Use desktop view to see headers
        onFilterTypeChange={() => {}}
        fmtYMShortFn={(ym) => ym}
      />
    );
  };

  test('Should respect sort direction when grouping by Date', () => {
    renderComponent();

    // 1. Initial State: Group by 'date' (Default), Sort by 'Newest' (Default)
    // Expect Groups: "15 Jan 2026" then "13 Jan 2026"

    // We expect header rows (mocked as TRs with 1 cell?) and data rows.
    // In TransactionsList, header rows are TableRow with a TableCell colspan.
    // We need to identify them.
    // The header text format is "DD MMM YYYY".

    // Let's find texts directly.
    const headerNewer = screen.getByText(/15 Jan 2026/i);
    const headerOlder = screen.getByText(/13 Jan 2026/i);

    // Check order using compareDocumentPosition
    expect(headerNewer.compareDocumentPosition(headerOlder)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    // Newest (Top) comes before Older (Bottom) -> Older follows Newer. Correct.

    // 2. Change Sort to "Oldest" (Ascending) via Column Header
    // Find the "Date" column header button.
    const dateHeaderButton = screen.getByRole('button', { name: /Date/i });

    // Click it. Default is Descending, so clicking it should switch to Ascending.
    fireEvent.click(dateHeaderButton);

    // 3. Verify Order: Older First
    // Now "13 Jan 2026" should be BEFORE "15 Jan 2026"

    // Re-query elements (they might have re-rendered)
    const headerNewerAfter = screen.getByText(/15 Jan 2026/i);
    const headerOlderAfter = screen.getByText(/13 Jan 2026/i);

    // Assert "13 Jan" comes before "15 Jan" -> Newer follows Older
    // BUG: Currently hardcoded to Descending, so this should fail (Order remains Newer -> Older)
    expect(headerOlderAfter.compareDocumentPosition(headerNewerAfter)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });
});
