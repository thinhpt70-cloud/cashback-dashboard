import React, { useState, useMemo, useEffect } from 'react';
import { Loader2, Trash2, MoreVertical } from 'lucide-react';
import mccData from '@/lib/MCC.json';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import TransactionCard from './TransactionCard';

// Helper function to get MCC description
const getMccDescription = (mcc) => {
    return mccData.mccDescriptionMap[mcc]?.vn || 'N/A';
};


export default function SharedTransactionsDialog({
    isOpen,
    onClose,
    transactions,
    title,
    description,
    currencyFn,
    isLoading,
    onEdit,
    onDelete,
    onBulkDelete,
    onViewDetails,
    cardMap // <-- ADD THIS PROP
}) {
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [isSelectionActive, setIsSelectionActive] = useState(false);
    const [expandedCardId, setExpandedCardId] = useState(null);
    const [visibleColumns, setVisibleColumns] = useState({
        'Transaction Date': true,
        'Transaction Name': true,
        'Amount': true,
        'Estimated Cashback': true,
        'Card Name': false,
        'Category': false,
        'MCC Code': false,
        'Notes': false,
        'Cashback Rate': false,
    });

    // Clear selections when the dialog is closed or transactions change
    useEffect(() => {
        if (!isOpen) {
            setSelectedRows(new Set());
            setIsSelectionActive(false);
            setExpandedCardId(null);
        }
    }, [isOpen, transactions]);

    const handleSelectAll = (checked) => {
        if (checked) {
            const allIds = new Set(transactions.map(t => t.id));
            setSelectedRows(allIds);
            setIsSelectionActive(true); // Activate selection mode
        } else {
            setSelectedRows(new Set());
            setIsSelectionActive(false); // Deactivate selection mode
        }
    };

    const handleSelectRow = (id, checked) => {
        const newSelectedRows = new Set(selectedRows);
        if (checked) {
            newSelectedRows.add(id);
        } else {
            newSelectedRows.delete(id);
        }
        setSelectedRows(newSelectedRows);

        // Toggle selection mode based on count
        if (newSelectedRows.size > 0) {
            setIsSelectionActive(true);
        } else {
            setIsSelectionActive(false);
        }
    };

    const totals = useMemo(() => {
        return transactions.reduce((acc, t) => {
            acc.amount += t['Amount'] || 0;
            acc.cashback += t.estCashback || 0;
            return acc;
        }, { amount: 0, cashback: 0 });
    }, [transactions]);

    const isAllSelected = selectedRows.size > 0 && selectedRows.size === transactions.length;

    const handleDeleteSelected = () => {
        if (onBulkDelete) {
            onBulkDelete(Array.from(selectedRows));
        }
        setSelectedRows(new Set());
        setIsSelectionActive(false); // Deactivate after deletion
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        {description}
                    </DialogDescription>
                </DialogHeader>

                {/* --- START: COMBINED ACTION BAR --- */}
                <div className="flex items-center justify-between mb-2">
                    
                    {/* --- Block 1: Bulk Actions (conditionally rendered) --- */}
                    {isSelectionActive && selectedRows.size > 0 && onBulkDelete ? (
                        <div className="flex items-center justify-between p-2 bg-slate-100 dark:bg-slate-800 rounded-md">
                            <span className="text-sm font-semibold">{selectedRows.size} selected</span>
                            <div className="flex items-center gap-2 ml-4"> {/* Added ml-4 for spacing */}
                                <Button variant="ghost" size="sm" onClick={() => handleSelectAll(false)}>Cancel</Button>
                                <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Bulk Delete
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div /> /* Empty spacer to push columns button to the right */
                    )}

                    {/* --- Block 2: Columns Button (desktop only) --- */}
                    <div className="hidden md:flex">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <MoreVertical className="h-4 w-4 mr-2" />
                                    Columns
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                {Object.keys(visibleColumns).map((column) => (
                                    <DropdownMenuItem key={column}>
                                        <Checkbox
                                            checked={visibleColumns[column]}
                                            onCheckedChange={() =>
                                                setVisibleColumns({
                                                    ...visibleColumns,
                                                    [column]: !visibleColumns[column],
                                                })
                                            }
                                            className="mr-2"
                                        />
                                        {column}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
                {/* --- END: COMBINED ACTION BAR --- */}

                <div className="max-h-[60vh] overflow-y-auto">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-48">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : transactions.length > 0 ? (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden md:block">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="p-2 w-10">
                                                <Checkbox
                                                    checked={isAllSelected}
                                                    onCheckedChange={handleSelectAll}
                                                />
                                            </th>
                                            {visibleColumns['Transaction Date'] && <th className="text-left p-2">Date</th>}
                                            {visibleColumns['Transaction Name'] && <th className="text-left p-2">Transaction</th>}
                                            {visibleColumns['Amount'] && <th className="text-right p-2">Amount</th>}
                                            {visibleColumns['estCashback'] && <th className="text-right p-2">Cashback</th>}
                                            {visibleColumns['Card Name'] && <th className="text-left p-2">Card</th>}
                                            {visibleColumns['Category'] && <th className="text-left p-2">Category</th>}
                                            {visibleColumns['MCC Code'] && <th className="text-left p-2">MCC</th>}
                                            {visibleColumns['Notes'] && <th className="text-left p-2">Notes</th>}
                                            {visibleColumns['Cashback Rate'] && <th className="text-right p-2">Rate</th>}
                                            <th className="text-center p-2 w-12">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.map(t => {
                                            // --- START: MODIFICATION ---
                                            // Use the cardMap to find the card name
                                            const card = t['Card'] ? cardMap.get(t['Card'][0]) : null;
                                            // --- END: MODIFICATION ---

                                            return (
                                                <tr key={t.id} className="border-b">
                                                    <td className="p-2">
                                                        <Checkbox
                                                            checked={selectedRows.has(t.id)}
                                                            onCheckedChange={(checked) => handleSelectRow(t.id, checked)}
                                                        />
                                                    </td>
                                                    {visibleColumns['Transaction Date'] && <td className="p-2">{t['Transaction Date']}</td>}
                                                    {visibleColumns['Transaction Name'] && <td className="p-2">{t['Transaction Name']}</td>}
                                                    {visibleColumns['Amount'] && <td className="text-right p-2">{currencyFn(t['Amount'])}</td>}
                                                    {visibleColumns['estCashback'] && <td className="text-right p-2">{currencyFn(t.estCashback)}</td>}
                                                    
                                                    {/* --- START: MODIFICATION --- */}
                                                    {visibleColumns['Card Name'] && <td className="p-2">{card ? card.name : 'N/A'}</td>}
                                                    {/* --- END: MODIFICATION --- */}
                                                    
                                                    {visibleColumns['Category'] && <td className="p-2">{t['Category'] || 'N/A'}</td>}
                                                    {visibleColumns['MCC Code'] && <td className="p-2">{t['MCC Code']} - {getMccDescription(t['MCC Code'])}</td>}
                                                    {visibleColumns['Notes'] && <td className="p-2">{t['Notes'] || 'N/A'}</td>}
                                                    {visibleColumns['Cashback Rate'] && <td className="text-right p-2">{(t.estCashback / t['Amount'] * 100).toFixed(1)}%</td>}
                                                    <td className="text-center p-2">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent>
                                                                {onEdit && <DropdownMenuItem onClick={() => onEdit(t)}>Edit</DropdownMenuItem>}
                                                                {onViewDetails && <DropdownMenuItem onClick={() => onViewDetails(t)}>View Details</DropdownMenuItem>}
                                                                {onDelete && <DropdownMenuItem onClick={() => onDelete(t.id, t['Transaction Name'])}>Delete</DropdownMenuItem>}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t-2 font-semibold">
                                            {/* --- START: MODIFICATION --- */}
                                            {/* Updated colSpan to account for Card Name column visibility */}
                                            <td colSpan={2 + (visibleColumns['Transaction Date'] ? 1 : 0) + (visibleColumns['Transaction Name'] ? 1 : 0)} className="text-right p-2">Total</td>
                                            {visibleColumns['Amount'] && <td className="text-right p-2">{currencyFn(totals.amount)}</td>}
                                            {visibleColumns['estCashback'] && <td className="text-right p-2">{currencyFn(totals.cashback)}</td>}
                                            <td colSpan={5}></td> {/* Adjust this if more columns are visible by default */}
                                            {/* --- END: MODIFICATION --- */}
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* Mobile Card View */}
                            {/* CHANGED: Added py-1 for vertical padding */}
                            <div className="md:hidden space-y-1 px-1 py-1">
                                {transactions.map(t => (
                                    <TransactionCard
                                        key={t.id}
                                        transaction={t}
                                        currencyFn={currencyFn}
                                        isSelected={selectedRows.has(t.id)}
                                        onSelect={handleSelectRow} 
                                        onClick={() => {
                                            setExpandedCardId(expandedCardId === t.id ? null : t.id);
                                        }}
                                        isExpanded={expandedCardId === t.id}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                        getMccDescription={getMccDescription}
                                        cardMap={cardMap}
                                    />
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex justify-center items-center h-48">
                            <p className="text-muted-foreground">No transactions found for this category.</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}