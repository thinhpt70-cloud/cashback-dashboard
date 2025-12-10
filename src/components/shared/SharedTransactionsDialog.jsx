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
    cardMap 
}) {
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [isSelectionActive, setIsSelectionActive] = useState(false);
    const [expandedCardId, setExpandedCardId] = useState(null);
    const [visibleColumns, setVisibleColumns] = useState({
        'Transaction Date': true,
        'Transaction Name': true,
        'Merchant': false, 
        'Amount': true,
        'Estimated Cashback': true,
        'Card Name': false,
        'Category': false,
        'Applicable Rule': false, 
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
            setIsSelectionActive(true); 
        } else {
            setSelectedRows(new Set());
            setIsSelectionActive(false); 
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

        if (newSelectedRows.size > 0) {
            setIsSelectionActive(true);
        } else {
            setIsSelectionActive(false);
        }
    };

    // Calculate totals for ALL transactions (for the table footer)
    const totals = useMemo(() => {
        return transactions.reduce((acc, t) => {
            acc.amount += t['Amount'] || 0;
            acc.cashback += t.estCashback || 0;
            return acc;
        }, { amount: 0, cashback: 0 });
    }, [transactions]);

    // Calculate totals for SELECTED transactions (for the bulk action bar)
    const selectedTotals = useMemo(() => {
        return transactions
            .filter(t => selectedRows.has(t.id))
            .reduce((acc, t) => {
                acc.amount += t['Amount'] || 0;
                acc.cashback += t.estCashback || 0;
                return acc;
            }, { amount: 0, cashback: 0 });
    }, [transactions, selectedRows]);

    const isAllSelected = transactions.length > 0 && selectedRows.size === transactions.length;

    const handleDeleteSelected = () => {
        if (onBulkDelete) {
            onBulkDelete(Array.from(selectedRows));
        }
        setSelectedRows(new Set());
        setIsSelectionActive(false); 
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

                {/* --- COMBINED ACTION BAR --- */}
                <div className="flex items-center justify-between mb-2">
                    
                    {/* Bulk Actions with Summaries */}
                    {isSelectionActive && selectedRows.size > 0 ? (
                        <div className="flex flex-1 items-center justify-between p-2 bg-slate-100 dark:bg-slate-800 rounded-md mr-2">
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-semibold">{selectedRows.size} selected</span>
                                
                                <div className="hidden sm:flex items-center gap-3 border-l border-slate-300 dark:border-slate-600 pl-3">
                                    <span className="text-xs text-muted-foreground">
                                        Total: <span className="font-semibold text-foreground">{currencyFn(selectedTotals.amount)}</span>
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        Cashback: <span className="font-semibold text-emerald-600">{currencyFn(selectedTotals.cashback)}</span>
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" onClick={() => handleSelectAll(false)}>Cancel</Button>
                                {onBulkDelete && (
                                    <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                    </Button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div /> 
                    )}

                    {/* Columns Button */}
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
                                            {visibleColumns['Merchant'] && <th className="text-left p-2">Merchant</th>} 
                                            {visibleColumns['Amount'] && <th className="text-right p-2">Amount</th>}
                                            {visibleColumns['Estimated Cashback'] && <th className="text-right p-2">Cashback</th>}
                                            {visibleColumns['Card Name'] && <th className="text-left p-2">Card</th>}
                                            {visibleColumns['Category'] && <th className="text-left p-2">Category</th>}
                                            {visibleColumns['Applicable Rule'] && <th className="text-left p-2">Rule</th>}
                                            {visibleColumns['MCC Code'] && <th className="text-left p-2">MCC</th>}
                                            {visibleColumns['Notes'] && <th className="text-left p-2">Notes</th>}
                                            {visibleColumns['Cashback Rate'] && <th className="text-right p-2">Rate</th>}
                                            <th className="text-center p-2 w-12">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.map(t => {
                                            const card = t['Card'] ? cardMap?.get(t['Card'][0]) : null;

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
                                                    
                                                    {visibleColumns['Merchant'] && (
                                                        <td className="p-2 text-slate-500">{t.merchantLookup || ''}</td>
                                                    )}
                                                    
                                                    {visibleColumns['Amount'] && <td className="text-right p-2">{currencyFn(t['Amount'])}</td>}
                                                    
                                                    {visibleColumns['Estimated Cashback'] && (
                                                        <td className="text-right p-2 text-emerald-600 font-medium">
                                                            {currencyFn(t.estCashback)}
                                                        </td>
                                                    )}
                                                    
                                                    {visibleColumns['Card Name'] && <td className="p-2">{card ? card.name : ''}</td>}
                                                    
                                                    {visibleColumns['Category'] && <td className="p-2">{t['Category'] || ''}</td>}
                                                    
                                                    {visibleColumns['Applicable Rule'] && (
                                                        <td className="p-2 text-xs font-mono text-slate-500">
                                                            {t['Applicable Rule']?.length > 0 ? t['Applicable Rule'][0].slice(0, 8) + '...' : ''}
                                                        </td>
                                                    )}
                                                    
                                                    {visibleColumns['MCC Code'] && (
                                                        <td className="p-2">
                                                            {t['MCC Code'] ? `${t['MCC Code']} - ${getMccDescription(t['MCC Code'])}` : ''}
                                                        </td>
                                                    )}
                                                    
                                                    {visibleColumns['Notes'] && <td className="p-2">{t['Notes'] || ''}</td>}
                                                    
                                                    {visibleColumns['Cashback Rate'] && (
                                                        <td className="text-right p-2">
                                                            {(t.estCashback && t['Amount']) ? (t.estCashback / t['Amount'] * 100).toFixed(1) + '%' : ''}
                                                        </td>
                                                    )}
                                                    
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
                                                                {onDelete && <DropdownMenuItem onClick={() => onDelete(t.id, t['Transaction Name'])} className="text-destructive">Delete</DropdownMenuItem>}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>

                                    <tfoot>
                                        <tr className="border-t-2 font-semibold bg-slate-50/50">
                                            <td className="p-2"></td>
                                            {visibleColumns['Transaction Date'] && <td className="p-2"></td>}

                                            {/* Logic to place 'Total' label correctly */}
                                            {visibleColumns['Transaction Name'] && (
                                                <td className="p-2 text-right text-slate-500">Total</td>
                                            )}
                                            {visibleColumns['Merchant'] && !visibleColumns['Transaction Name'] && (
                                                <td className="p-2 text-right text-slate-500">Total</td>
                                            )}
                                            {visibleColumns['Merchant'] && visibleColumns['Transaction Name'] && <td className="p-2"></td>}


                                            {visibleColumns['Amount'] && (
                                                <td className="p-2 text-right">{currencyFn(totals.amount)}</td>
                                            )}

                                            {visibleColumns['Estimated Cashback'] && (
                                                <td className="p-2 text-right text-emerald-600 font-bold">{currencyFn(totals.cashback)}</td>
                                            )}

                                            {visibleColumns['Card Name'] && <td className="p-2"></td>}
                                            {visibleColumns['Category'] && <td className="p-2"></td>}
                                            {visibleColumns['Applicable Rule'] && <td className="p-2"></td>}
                                            {visibleColumns['MCC Code'] && <td className="p-2"></td>}
                                            {visibleColumns['Notes'] && <td className="p-2"></td>}
                                            {visibleColumns['Cashback Rate'] && <td className="p-2"></td>}

                                            <td className="p-2"></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* Mobile Card View */}
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