import React from 'react';
import { render, screen } from '@testing-library/react';
import TransactionsList from './TransactionsList';

// --- MOCKS ---

// Mock UI components that are not focus of this test
jest.mock('../../ui/table', () => ({
  Table: ({ children }) => <table>{children}</table>,
  TableHeader: ({ children }) => <thead>{children}</thead>,
  TableBody: ({ children }) => <tbody>{children}</tbody>,
  TableRow: ({ children }) => <tr>{children}</tr>,
  TableHead: ({ children }) => <th>{children}</th>,
  TableCell: ({ children }) => <td>{children}</td>,
}));

jest.mock('../../ui/checkbox', () => ({
  Checkbox: () => <input type="checkbox" />
}));

jest.mock('../../ui/skeleton', () => ({
  Skeleton: () => <div data-testid="skeleton" />
}));

jest.mock('../../ui/button', () => ({
  Button: ({ children, onClick }) => <button onClick={onClick}>{children}</button>
}));

jest.mock('../../ui/input', () => ({
  Input: (props) => <input {...props} />
}));

jest.mock('lucide-react', () => ({
  Search: () => 'SearchIcon',
  Filter: () => 'FilterIcon',
  CreditCard: () => 'CreditCardIcon',
  Layers: () => 'LayersIcon',
  Settings2: () => 'SettingsIcon',
  ChevronsUpDown: () => 'SortIcon',
  ArrowUp: () => 'Asc',
  ArrowDown: () => 'Desc',
  ChevronDown: () => 'Down',
  X: () => 'X',
  Inbox: () => 'Inbox',
  ArrowUpDown: () => 'Sort'
}));

// --- CRITICAL: Mock Select to render actual options ---
jest.mock('../../ui/select', () => ({
  Select: ({ value, onValueChange, children }) => (
    <select
      data-testid="mock-select"
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
    >
      {children}
    </select>
  ),
  SelectTrigger: () => null, // Hide trigger, we look at the select options directly
  SelectContent: ({ children }) => <>{children}</>,
  SelectItem: ({ value, children }) => <option value={value}>{children}</option>,
  SelectValue: () => null
}));

// Mock DropdownMenu for columns (ignore it)
jest.mock('../../ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }) => <button>{children}</button>,
  DropdownMenuContent: () => null,
  DropdownMenuLabel: () => null,
  DropdownMenuSeparator: () => null,
  DropdownMenuCheckboxItem: () => null,
}));

// Mock Child Components
jest.mock('../../shared/MobileTransactionItem', () => () => <div>MobileItem</div>);
jest.mock('../../shared/MethodIndicator', () => () => <div>Method</div>);
jest.mock('./TransactionRow', () => () => <tr><td>Row</td></tr>);

describe('TransactionsList - Category Logic', () => {
  const mockCards = [{ id: 'card-1', name: 'Test Card' }];
  const mockCardMap = new Map([['card-1', { name: 'Test Card' }]]);
  const mockFmtYMShortFn = jest.fn((m) => m);

  test('uses derived categories from transactions when "categories" prop is empty', () => {
    const transactions = [
      { id: '1', 'Category': 'Food', 'Transaction Name': 'Tx1', Amount: 100 },
      { id: '2', 'Category': 'Transport', 'Transaction Name': 'Tx2', Amount: 200 }
    ];

    render(
      <TransactionsList
        transactions={transactions}
        allCards={mockCards}
        cardMap={mockCardMap}
        isDesktop={true}
        categories={[]} // Empty prop
        activeMonth="live"
        fmtYMShortFn={mockFmtYMShortFn}
      />
    );

    // Find the Category select.
    // Since there are multiple selects (Card, Category, Method, Group, Sort),
    // we need to identify the one with 'Food' and 'Transport' options.
    const selects = screen.getAllByTestId('mock-select');
    const categorySelect = selects.find(select => {
        return Array.from(select.options).some(opt => opt.value === 'Food');
    });

    expect(categorySelect).toBeInTheDocument();
    expect(categorySelect).toHaveTextContent('Food');
    expect(categorySelect).toHaveTextContent('Transport');
    expect(categorySelect).toHaveTextContent('All Categories'); // 'all' maps to 'All Categories' in code
  });

  test('uses provided "categories" prop when available', () => {
    const transactions = [
      { id: '1', 'Category': 'Food', 'Transaction Name': 'Tx1', Amount: 100 }
    ];
    // Prop has EXTRA categories not in transactions
    const providedCategories = ['Dining', 'Travel', 'Food'];

    render(
      <TransactionsList
        transactions={transactions}
        allCards={mockCards}
        cardMap={mockCardMap}
        isDesktop={true}
        categories={providedCategories}
        activeMonth="live"
        fmtYMShortFn={mockFmtYMShortFn}
      />
    );

    const selects = screen.getAllByTestId('mock-select');
    // Find select containing 'Travel' (which is only in prop, not in transactions)
    const categorySelect = selects.find(select => {
        return Array.from(select.options).some(opt => opt.value === 'Travel');
    });

    expect(categorySelect).toBeInTheDocument();
    expect(categorySelect).toHaveTextContent('Dining');
    expect(categorySelect).toHaveTextContent('Travel');
    expect(categorySelect).toHaveTextContent('Food');
  });

  test('uses provided "categories" prop even if transactions are empty (Server-Side case)', () => {
    const transactions = [];
    const providedCategories = ['Utilities', 'Groceries'];

    render(
      <TransactionsList
        transactions={transactions}
        allCards={mockCards}
        cardMap={mockCardMap}
        isDesktop={true}
        isServerSide={true} // Simulate server side
        categories={providedCategories}
        activeMonth="live"
        fmtYMShortFn={mockFmtYMShortFn}
      />
    );

    const selects = screen.getAllByTestId('mock-select');
    const categorySelect = selects.find(select => {
        return Array.from(select.options).some(opt => opt.value === 'Groceries');
    });

    expect(categorySelect).toBeInTheDocument();
    expect(categorySelect).toHaveTextContent('Utilities');
    expect(categorySelect).toHaveTextContent('Groceries');
  });
});
