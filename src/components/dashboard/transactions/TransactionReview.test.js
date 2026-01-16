import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import TransactionReview from './TransactionReview';
import { TooltipProvider } from '../../ui/tooltip';

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
  DropdownMenuItem: ({ children }) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
}));

// Improved Checkbox mock to handle Radix UI -> HTML Input mapping
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

// Mock Select to support finding options and triggering changes
jest.mock('../../ui/select', () => ({
  Select: ({ value, onValueChange, children }) => (
    <div data-testid="select-root">
      <select
        data-testid="test-select"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        style={{ display: 'block', opacity: 0.5 }}
      >
          <option value="all">All</option>
          <option value="card">Card</option>
          <option value="date">Date</option>
          <option value="status">Status</option>
          {/* Add more as needed */}
      </select>
      <div style={{ display: 'none' }}>{children}</div>
    </div>
  ),
  SelectTrigger: ({ children }) => <div>{children}</div>,
  SelectContent: ({ children }) => <div>{children}</div>,
  SelectItem: ({ value, children }) => <div data-value={value}>{children}</div>,
  SelectValue: ({ placeholder }) => <span>{placeholder}</span>
}));

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  Check: () => <span>Check</span>,
  Trash2: () => <span>Trash2</span>,
  FilePenLine: () => <span>FilePenLine</span>,
  ChevronDown: () => <span>ChevronDown</span>,
  ChevronUp: () => <span>ChevronUp</span>,
  AlertTriangle: () => <span>AlertTriangle</span>,
  ArrowUp: () => <span>Asc</span>,
  ArrowDown: () => <span>Desc</span>,
  Search: () => <span>Search</span>,
  MoreHorizontal: () => <span>MoreHorizontal</span>,
  Loader2: () => <span>Loader2</span>,
  Filter: () => <span>Filter</span>,
  Layers: () => <span>Group</span>,
  X: () => <span>X</span>,
  Wand2: () => <span>Wand2</span>,
  CreditCard: () => <span>CreditCard</span>,
  ArrowUpDown: () => <span>Sort</span>,
}));

describe('TransactionReview', () => {
  const mockTransactions = [
    {
      id: 'tx-1',
      'Transaction Name': 'Test Transaction',
      'Amount': 100000,
      'Transaction Date': '2023-10-26',
      status: 'Review Needed',
      // Additional fields for desktop view logic
      'MCC Code': '5411',
      'Applicable Rule': ['rule-1'],
      'Match': true,
      'Automated': false,
      'Card': ['card-1']
    }
  ];

  const mockCards = [{ id: 'card-1', name: 'Test Card' }];

  const renderComponent = (props = {}) => {
    return render(
      <TooltipProvider>
        <TransactionReview
          transactions={mockTransactions}
          cards={mockCards}
          rules={[]}
          categories={[]}
          isLoading={false}
          isDesktop={false} // Default to mobile
          mccMap={{}}
          {...props}
        />
      </TooltipProvider>
    );
  };

  test('Mobile item dropdown trigger has aria-label', async () => {
    renderComponent();

    // Open the "Review Needed" section
    const expandButton = screen.getByRole('button', { name: /review needed/i });
    fireEvent.click(expandButton);

    // Wait for content to appear
    await waitFor(() => {
        expect(screen.getByText('Test Transaction')).toBeInTheDocument();
    });

    // Find the "More options" button
    const moreOptionsButton = screen.getByLabelText('More options');
    expect(moreOptionsButton).toBeInTheDocument();
  });

  test('Bulk selection bar clear button has aria-label', async () => {
    renderComponent();

    // Open section
    const expandButton = screen.getByRole('button', { name: /review needed/i });
    fireEvent.click(expandButton);

    await waitFor(() => {
        expect(screen.getByText('Test Transaction')).toBeInTheDocument();
    });

    // Select an item to show the bulk bar
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    // Wait for bulk bar to appear (it has "Smart Process" button)
    await waitFor(() => {
        expect(screen.getByText(/smart process/i)).toBeInTheDocument();
    });

    // Now bulk bar should be visible with the clear button
    const clearSelectionButton = screen.getByLabelText('Clear selection');
    expect(clearSelectionButton).toBeInTheDocument();
  });

  test('Should only render one Edit button for Review Needed transactions on Desktop', async () => {
    // Force desktop view
    renderComponent({ isDesktop: true });

    // Open the "Review Needed" section
    const expandButton = screen.getByRole('button', { name: /review needed/i });

    // Check if collapsed, if so click
    fireEvent.click(expandButton);

    await waitFor(() => {
        expect(screen.getByText('Test Transaction')).toBeInTheDocument();
    });

    // Count Edit Icons (FilePenLine)
    // There should only be 1 (the static Edit button), not 2 (dynamic + static)
    const editIcons = screen.getAllByText('FilePenLine');
    expect(editIcons.length).toBe(1);
  });

  test('Group by Date and Sort by Date Ascending renders groups in Oldest-Newest order', async () => {
    const dates = ['2023-01-01', '2023-01-05'];
    const txs = dates.map((d, i) => ({
      id: `tx-${i}`,
      'Transaction Name': `Tx ${i}`,
      'Amount': 100,
      'Transaction Date': d,
      status: 'Review Needed',
      'MCC Code': '0000',
      'Applicable Rule': ['rule-1'],
      'Match': true,
      'Automated': false,
       'Card': ['card-1']
    }));

    renderComponent({ transactions: txs, isDesktop: true });

    // Open Review Needed
    const expandButton = screen.getByRole('button', { name: /review needed/i });
    fireEvent.click(expandButton);

    await waitFor(() => {
        expect(screen.getByText('Tx 0')).toBeInTheDocument();
    });

    // Sort by Date (Asc)
    // Find Header "Date"
    const dateHeader = screen.getAllByText(/Date/i).find(el => el.closest('th'));
    // Default is Descending. Click once -> Ascending.
    fireEvent.click(dateHeader);

    expect(within(dateHeader.closest('th')).getByText('Asc')).toBeInTheDocument();

    // Verify Order.
    // 2023-01-01 should be before 2023-01-05.

    const rows = screen.getAllByRole('row');
    const cells = screen.getAllByRole('cell');

    const date1Header = cells.find(c => c.textContent.includes('2023-01-01') && c.getAttribute('colSpan'));
    const date2Header = cells.find(c => c.textContent.includes('2023-01-05') && c.getAttribute('colSpan'));

    expect(date1Header).toBeInTheDocument();
    expect(date2Header).toBeInTheDocument();

    const index1 = rows.findIndex(r => r.contains(date1Header));
    const index2 = rows.findIndex(r => r.contains(date2Header));

    // Expect Oldest (Jan 1) < Newest (Jan 5).
    // Current Bug: Hardcoded to Descending (Newest first).
    expect(index1).toBeLessThan(index2);
  });
});
