import React, { useState, useMemo, useEffect } from 'react';
import { Loader2, Trash2, MoreVertical } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import TransactionCard from './TransactionCard';


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
    onViewDetails
}) {
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [isSelectionActive, setIsSelectionActive] = useState(false);
    const [expandedCardId, setExpandedCardId] = useState(null);

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

                {/* This bar now appears/disappears based on isSelectionActive */}
                {isSelectionActive && selectedRows.size > 0 && onBulkDelete && (
                    <div className="flex items-center justify-between p-2 bg-slate-100 dark:bg-slate-800 rounded-md">
                        <span className="text-sm font-semibold">{selectedRows.size} selected</span>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleSelectAll(false)}>Cancel</Button>
                            <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Bulk Delete
                            </Button>
                        </div>
                    </div>
                )}

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
                                            <th className="text-left p-2">Date</th>
                                            <th className="text-left p-2">Transaction</th>
                                            <th className="text-right p-2">Amount</th>
                                            <th className="text-right p-2">Cashback</th>
                                            <th className="text-center p-2 w-12">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.map(t => (
                                            <tr key={t.id} className="border-b">
                                                <td className="p-2">
                                                    <Checkbox
                                                        checked={selectedRows.has(t.id)}
                                                        onCheckedChange={(checked) => handleSelectRow(t.id, checked)}
                                                    />
                                                </td>
                                                <td className="p-2">{t['Transaction Date']}</td>
                                                <td className="p-2">{t['Transaction Name']}</td>
                                                <td className="text-right p-2">{currencyFn(t['Amount'])}</td>
                                                <td className="text-right p-2">{currencyFn(t.estCashback)}</td>
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
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t-2 font-semibold">
                                            <td colSpan="3" className="text-right p-2">Total</td>
                                            <td className="text-right p-2">{currencyFn(totals.amount)}</td>
                                            <td className="text-right p-2">{currencyFn(totals.cashback)}</td>
                                            <td></td>
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