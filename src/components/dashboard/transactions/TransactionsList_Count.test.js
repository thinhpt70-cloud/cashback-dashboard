import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TransactionsList from './TransactionsList';

// Mock child components
jest.mock('../../ui/table', () => ({
  Table: ({ children }) => <table>{children}</table>,
  TableHeader: ({ children }) => <thead>{children}</thead>,
  TableBody: ({ children }) => <tbody>{children}</tbody>,
  TableRow: ({ children, className }) => <tr className={className}>{children}</tr>,
  TableHead: ({ children, className, onClick }) => <th className={className} onClick={onClick}>{children}</th>,
  TableCell: ({ children, colSpan, className }) => <td colSpan={colSpan} className={className}>{children}</td>,
}));

jest.mock('../../ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }) => <div>{children}</div>,
  DropdownMenuCheckboxItem: ({ children, onCheckedChange, checked }) => (
    <div onClick={() => onCheckedChange && onCheckedChange(!checked)}>
      {checked ? '[x] ' : '[ ] '}{children}
    </div>
  ),
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuLabel: ({ children }) => <div>{children}</div>,
}));

jest.mock('../../ui/checkbox', () => ({
  Checkbox: ({ onCheckedChange, checked, ...props }) => (
    <input
      type="checkbox"
      checked={checked || false}
      onChange={(e) => onCheckedChange && onCheckedChange(e.target.checked)}
      {...props}
    />
  )
}));

jest.mock('../../ui/select', () => ({
  Select: ({ value, onValueChange, children }) => (
    <div data-testid="select-root">
      <select
        data-testid="test-select"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
      >
          <option value="all">All</option>
          <option value="category">Category</option>
          <option value="date">Date</option>
      </select>
      <div style={{ display: 'none' }}>{children}</div>
    </div>
  ),
  SelectTrigger: ({ children }) => <div>{children}</div>,
  SelectContent: ({ children }) => <div>{children}</div>,
  SelectItem: ({ value, children }) => <div data-value={value}>{children}</div>,
  SelectValue: ({ placeholder }) => <span>{placeholder}</span>
}));

jest.mock('lucide-react', () => ({
  ChevronsUpDown: () => <span>Sort</span>,
  ArrowUp: () => <span>Asc</span>,
  ArrowDown: () => <span>Desc</span>,
  Trash2: () => <span>Delete</span>,
  Search: () => <span>Search</span>,
  X: () => <span>Clear</span>,
  Filter: () => <span>Filter</span>,
  Layers: () => <span>Group</span>,
  Settings2: () => <span data-testid="settings-icon">SettingsIcon</span>,
  CreditCard: () => <span>Card</span>,
  ArrowUpDown: () => <span>Sort</span>,
  ChevronDown: () => <span>Down</span>,
  Inbox: () => <span>Inbox</span>
}));

jest.mock('./TransactionRow', () => ({ transaction }) => (
  <tr>
    <td>{transaction['Transaction Name']}</td>
  </tr>
));

describe('TransactionsList - Loaded Items Count', () => {
  const mockTransactions = [
    {
      id: 'tx-1',
      'Transaction Name': 'Alpha',
      'Amount': 100,
      'Transaction Date': '2023-01-01', // Date Group 1
      'Category': 'Cat1',
      'Card': ['card-1']
    },
    {
      id: 'tx-2',
      'Transaction Name': 'Beta',
      'Amount': 200,
      'Transaction Date': '2023-01-02', // Date Group 2
      'Category': 'Cat2',
      'Card': ['card-1']
    }
  ];

  const mockCards = [{ id: 'card-1', name: 'Test Card' }];
  const mockCardMap = new Map([['card-1', { name: 'Test Card' }]]);

  test('Shows correct loaded item count (excluding headers) when grouped', () => {
    // Render in server-side mode (Live Mode)
    render(
      <TransactionsList
        transactions={mockTransactions}
        isLoading={false}
        activeMonth="live"
        isServerSide={true} // Triggers "Showing X loaded items"
        cardMap={mockCardMap}
        allCards={mockCards}
        isDesktop={true}
        rules={[]}
        fmtYMShortFn={(m) => m}
      />
    );

    // Initial State: Group by Date (default).
    // Should have 2 items and 2 headers (since dates are different).
    // Total flattened length = 4.
    // Displayed count should be 2.

    const countText = screen.getByText(/Showing/);
    expect(countText).toHaveTextContent('Showing 2 loaded items');
  });

  test('Shows correct loaded item count (excluding headers) in client mode', () => {
    render(
      <TransactionsList
        transactions={mockTransactions}
        isLoading={false}
        activeMonth="2023-01"
        isServerSide={false} // Triggers "Showing X of Y items"
        cardMap={mockCardMap}
        allCards={mockCards}
        isDesktop={true}
        rules={[]}
        fmtYMShortFn={(m) => m}
      />
    );

    // Initial State: Group by Date.
    // Displayed count should be 2 of 2 items.

    // Note: The text is formatted as "Showing X of Y items".
    // We expect both X and Y to be 2.
    const countText = screen.getByText(/Showing/);
    expect(countText).toHaveTextContent('Showing 2 of 2 items');
  });
});
