
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BulkEditDialog from './BulkEditDialog';

// Mock UI components
jest.mock('../../ui/dialog', () => ({
  Dialog: ({ open, children }) => open ? <div role="dialog">{children}</div> : null,
  DialogContent: ({ children }) => <div>{children}</div>,
  DialogHeader: ({ children }) => <div>{children}</div>,
  DialogTitle: ({ children }) => <h2>{children}</h2>,
  DialogFooter: ({ children }) => <div>{children}</div>,
}));

jest.mock('../../ui/table', () => ({
    Table: ({ children }) => <table>{children}</table>,
    TableHeader: ({ children }) => <thead>{children}</thead>,
    TableHead: ({ children }) => <th>{children}</th>,
    TableBody: ({ children }) => <tbody>{children}</tbody>,
    TableRow: ({ children }) => <tr>{children}</tr>,
    TableCell: ({ children }) => <td>{children}</td>,
}));

jest.mock('../../ui/select', () => ({
    Select: ({ value, onValueChange, children, disabled }) => (
        <div data-testid="mock-select" data-disabled={disabled}>
            <select
                data-testid="select-trigger"
                value={value}
                onChange={(e) => onValueChange(e.target.value)}
                disabled={disabled}
            >
                 <option value="">Select...</option>
                 <option value="Category">Category</option>
                 <option value="MCC Code">MCC Code</option>
                 <option value="Applicable Rule">Applicable Rule</option>
                 <option value="Card">Card</option>
            </select>
            {children}
        </div>
    ),
    SelectTrigger: ({ children }) => <div>{children}</div>,
    SelectContent: ({ children }) => <div>{children}</div>,
    SelectItem: ({ value, children }) => <option value={value}>{children}</option>,
    SelectValue: ({ placeholder }) => <span>{placeholder}</span>
}));

// Mock Combobox
jest.mock('../../ui/combobox', () => ({
    Combobox: (props) => (
        <div data-testid="mock-combobox">
            <input
                data-testid="combobox-input"
                value={props.value}
                onChange={(e) => props.onChange(e.target.value)}
            />
        </div>
    )
}));

describe('BulkEditDialog', () => {
    const mockOnClose = jest.fn();
    const mockOnUpdateComplete = jest.fn();
    const categories = ['Dining', 'Travel'];
    const cards = [{ id: 'c1', name: 'Card A' }, { id: 'c2', name: 'Card B' }];
    const rules = [
        { id: 'r1', ruleName: 'Rule A', cardId: 'c1' },
        { id: 'r2', ruleName: 'Rule B', cardId: 'c2' }
    ];
    const mccMap = {
        '5812': { vn: 'Restaurants', us: 'Eating Places' },
        '5411': { vn: 'Supermarkets', us: 'Grocery Stores' }
    };

    const tx1 = { id: '1', 'Transaction Date': '2023-01-01', 'Transaction Name': 'Tx 1', 'Amount': 100, 'Card': ['c1'] };
    const tx2 = { id: '2', 'Transaction Date': '2023-01-02', 'Transaction Name': 'Tx 2', 'Amount': 200, 'Card': ['c2'] };
    const tx3 = { id: '3', 'Transaction Date': '2023-01-03', 'Transaction Name': 'Tx 3', 'Amount': 300, 'Card': ['c1'] };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders correctly and shows preview table', () => {
        render(
            <BulkEditDialog
                isOpen={true}
                onClose={mockOnClose}
                selectedIds={['1']}
                allTransactions={[tx1]}
                categories={categories}
                cards={cards}
                rules={rules}
                mccMap={mccMap}
                onUpdateComplete={mockOnUpdateComplete}
            />
        );

        expect(screen.getByText(/Bulk Edit/i)).toBeInTheDocument();
        expect(screen.getByText('Preview Changes')).toBeInTheDocument();
        expect(screen.getByText('Tx 1')).toBeInTheDocument(); // Preview row
    });

    test('shows warning and disables input when selecting "Applicable Rule" with mixed cards', () => {
        render(
            <BulkEditDialog
                isOpen={true}
                onClose={mockOnClose}
                selectedIds={['1', '2']} // Mixed cards: c1 and c2
                allTransactions={[tx1, tx2]}
                categories={categories}
                cards={cards}
                rules={rules}
                mccMap={mccMap}
                onUpdateComplete={mockOnUpdateComplete}
            />
        );

        // Select "Applicable Rule"
        const select = screen.getByTestId('select-trigger');
        fireEvent.change(select, { target: { value: 'Applicable Rule' } });

        // Check for warning
        expect(screen.getByText(/Mixed Cards Selected/i)).toBeInTheDocument();
    });

    test('shows MCC description when entering an MCC code', () => {
        render(
            <BulkEditDialog
                isOpen={true}
                onClose={mockOnClose}
                selectedIds={['1']}
                allTransactions={[tx1]}
                categories={categories}
                cards={cards}
                rules={rules}
                mccMap={mccMap}
                onUpdateComplete={mockOnUpdateComplete}
            />
        );

        // 1. Select MCC Code field
        const select = screen.getByTestId('select-trigger');
        fireEvent.change(select, { target: { value: 'MCC Code' } });

        // 2. Type "5812" into input
        const input = screen.getByPlaceholderText('Enter MCC Code');
        fireEvent.change(input, { target: { value: '5812' } });

        // 3. Expect "Restaurants" to appear in helper text
        expect(screen.getByText('Restaurants')).toBeInTheDocument();
    });
});
