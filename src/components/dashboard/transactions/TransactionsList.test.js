import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
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
      {/* Hidden select for testing interactions */}
      <select
        data-testid="test-select"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        style={{ display: 'block', opacity: 0.5 }}
      >
          {/* We provide enough options to cover our test cases */}
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
  Inbox: () => <span>Inbox</span>,
  Calendar: () => <span>CalendarIcon</span>
}));

// Mock DatePickerWithRange
jest.mock('../../ui/date-range-picker', () => ({
  DatePickerWithRange: ({ date, setDate }) => (
    <div data-testid="date-range-picker">
      <button onClick={() => setDate({ from: new Date('2023-01-01'), to: new Date('2023-01-05') })}>
        Select Date Range
      </button>
      <span>{date?.from ? 'Date Selected' : 'No Date'}</span>
    </div>
  )
}));

// Mock useDebounce
jest.mock('../../../hooks/useDebounce', () => (value) => value);

// Mock TransactionRow to avoid complexity
jest.mock('./TransactionRow', () => ({ transaction }) => (
  <tr>
    <td>{transaction['Transaction Name']}</td>
  </tr>
));

describe('TransactionsList', () => {
  const mockTransactions = [
    {
      id: 'tx-1',
      'Transaction Name': 'Alpha Transaction',
      'Amount': 100,
      'Transaction Date': '2023-01-01',
      'Category': 'Alpha',
      'Card': ['card-1']
    },
    {
      id: 'tx-2',
      'Transaction Name': 'Beta Transaction',
      'Amount': 200,
      'Transaction Date': '2023-01-02',
      'Category': 'Beta',
      'Card': ['card-1']
    }
  ];

  const mockCards = [{ id: 'card-1', name: 'Test Card' }];
  const mockCardMap = new Map([['card-1', { name: 'Test Card' }]]);

  test('Group by Category and Sort by Category Descending renders groups in Z-A order', () => {
    render(
      <TransactionsList
        transactions={mockTransactions}
        isLoading={false}
        activeMonth="live"
        cardMap={mockCardMap}
        allCards={mockCards}
        isDesktop={true}
        rules={[]}
      />
    );

    // 1. Enable Category Column
    const columnsBtn = screen.getByText('Columns'); // From Button text

    // In our new mock, DropdownMenuContent renders children directly.
    // So "Category" checkbox item should be present.
    // The mock renders "[ ] Category" for unchecked items.
    const categoryOption = screen.getByText((content) => content.includes('[ ] Category'));
    fireEvent.click(categoryOption);

    // 2. Sort by Category (Desc)
    // Find the header specifically. There are other "Category" texts in Selects.
    // The header is inside a <th>
    const categoryHeader = screen.getAllByText('Category')
        .find(el => el.closest('th'));

    fireEvent.click(categoryHeader); // Asc
    fireEvent.click(categoryHeader); // Desc

    expect(within(categoryHeader.closest('th')).getByText('Desc')).toBeInTheDocument();

    // 3. Group by Category
    // We have multiple selects. We need to find the one that has "category" value.
    // In our mock, we hardcoded options for all selects.
    // So all 5 selects have "Category" option.
    // But only one controls Grouping.
    // The component initializes groupBy="date". So initial value is "date".
    // We look for select with value="date" (or whatever default).
    // Actually, we can just fire change on ALL selects? No.
    // We can identify by some parent context?
    // "Group: Date" text is in SelectTrigger.
    // But our mock hides children? `style={{ display: 'none' }}`

    // Let's rely on the fact that `groupBy` state is "date" initially.
    // So the correct select has value="date".
    const selects = screen.getAllByTestId('test-select');
    const groupSelect = selects.find(s => s.value === 'date');

    // Trigger change
    fireEvent.change(groupSelect, { target: { value: 'category' } });

    // 4. Check Group Order
    const rows = screen.getAllByRole('row');

    // Find Headers. Group Headers are in a cell with colSpan > 1.
    const cells = screen.getAllByRole('cell');

    const alphaGroupCell = cells.find(cell => cell.textContent.includes('Alpha') && cell.getAttribute('colSpan'));
    const betaGroupCell = cells.find(cell => cell.textContent.includes('Beta') && cell.getAttribute('colSpan'));

    expect(alphaGroupCell).toBeInTheDocument();
    expect(betaGroupCell).toBeInTheDocument();

    const betaIndex = rows.findIndex(row => row.contains(betaGroupCell));
    const alphaIndex = rows.findIndex(row => row.contains(alphaGroupCell));

    // EXPECT FAIL: Current code sorts Alpha < Beta (Ascending).
    // We want Beta < Alpha (Descending).
    expect(betaIndex).toBeLessThan(alphaIndex);
  });
});
