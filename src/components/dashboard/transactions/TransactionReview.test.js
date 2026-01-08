import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TransactionReview from './TransactionReview';
import { TooltipProvider } from '../../ui/tooltip';

// Mock child components
jest.mock('../../ui/table', () => ({
  Table: ({ children }) => <table>{children}</table>,
  TableHeader: ({ children }) => <thead>{children}</thead>,
  TableBody: ({ children }) => <tbody>{children}</tbody>,
  TableRow: ({ children }) => <tr>{children}</tr>,
  TableHead: ({ children }) => <th>{children}</th>,
  TableCell: ({ children }) => <td>{children}</td>,
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

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  Check: () => <span>Check</span>,
  Trash2: () => <span>Trash2</span>,
  FilePenLine: () => <span>FilePenLine</span>,
  ChevronDown: () => <span>ChevronDown</span>,
  ChevronUp: () => <span>ChevronUp</span>,
  AlertTriangle: () => <span>AlertTriangle</span>,
  ArrowUp: () => <span>ArrowUp</span>,
  ArrowDown: () => <span>ArrowDown</span>,
  Search: () => <span>Search</span>,
  MoreHorizontal: () => <span>MoreHorizontal</span>,
  Loader2: () => <span>Loader2</span>,
  Filter: () => <span>Filter</span>,
  Layers: () => <span>Layers</span>,
  X: () => <span>X</span>,
  Wand2: () => <span>Wand2</span>,
  CreditCard: () => <span>CreditCard</span>,
  ArrowUpDown: () => <span>ArrowUpDown</span>,
}));

describe('TransactionReview Accessibility', () => {
  const mockTransactions = [
    {
      id: 'tx-1',
      'Transaction Name': 'Test Transaction',
      'Amount': 100000,
      'Transaction Date': '2023-10-26',
      status: 'Review Needed'
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
          isDesktop={false} // Force mobile view
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
});
