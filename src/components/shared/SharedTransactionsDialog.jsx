import React, { useState, useMemo, useEffect } from 'react';
import { Loader2, Trash2, MoreVertical, Search, X, ArrowUpDown, ChevronDown, Layers } from 'lucide-react';
import mccData from '@/lib/MCC.json';
import useMediaQuery from '@/hooks/useMediaQuery';
import { formatDateTime, formatDate } from '@/lib/date';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import MobileTransactionItem from './MobileTransactionItem';
import TransactionDetailSheet from './TransactionDetailSheet';

// Helper function to get MCC description
const getMccDescription = (mcc) => {
    return mccData.mccDescriptionMap[mcc]?.vn || 'N/A';
};

const formatTxDate = (dateStr) => {
    if (!dateStr) return '';
    return dateStr.includes('T') ? formatDateTime(dateStr) : formatDate(dateStr);
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
    onDuplicate,
    onDelete,
    onBulkDelete,
    cardMap,
    // New props for the embedded sheet
    rules,
    allCards,
    monthlyCategorySummary
}) {
    const isDesktop = useMediaQuery("(min-width: 768px)");
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [isSelectionActive, setIsSelectionActive] = useState(false);
    const [viewingTransaction, setViewingTransaction] = useState(null);

    // Filtering and Sorting State
    const [searchTerm, setSearchTerm] = useState("");
    const [groupBy, setGroupBy] = useState("none");
    const [sortByValue, setSortByValue] = useState('Newest');
    const [sortConfig, setSortConfig] = useState({ key: 'Transaction Date', direction: 'descending' });

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
            setViewingTransaction(null);
            setSearchTerm("");
            setGroupBy("none");
            setSortByValue("Newest");
            setSortConfig({ key: 'Transaction Date', direction: 'descending' });
        }
    }, [isOpen, transactions]);

    const handleSortChange = (val) => {
        setSortByValue(val);
        if (val === 'Newest') setSortConfig({ key: 'Transaction Date', direction: 'descending' });
        else if (val === 'Oldest') setSortConfig({ key: 'Transaction Date', direction: 'ascending' });
        else if (val === 'Amount: High') setSortConfig({ key: 'Amount', direction: 'descending' });
        else if (val === 'Amount: Low') setSortConfig({ key: 'Amount', direction: 'ascending' });
    };

    const filteredAndSortedData = useMemo(() => {
        let items = [...transactions].map(tx => ({
            ...tx,
            rate: (tx['Amount'] && tx['Amount'] > 0) ? (tx.estCashback / tx['Amount']) : 0
        }));

        // Filter
        items = items.filter(tx => {
            if (!searchTerm) return true;
            const lowerCaseSearch = searchTerm.toLowerCase();
            return (
                tx['Transaction Name']?.toLowerCase().includes(lowerCaseSearch) ||
                tx['merchantLookup']?.toLowerCase().includes(lowerCaseSearch) ||
                String(tx['Amount']).includes(lowerCaseSearch) ||
                tx['Transaction Date']?.includes(lowerCaseSearch) ||
                String(tx['MCC Code']).includes(lowerCaseSearch)
            );
        });

        // Sort
        if (sortConfig.key !== null) {
            items.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;
                if (typeof aValue === 'number' && typeof bValue === 'number') {
                    return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
                }
                if (sortConfig.key === 'Transaction Date') {
                    return sortConfig.direction === 'ascending'
                        ? new Date(aValue) - new Date(bValue)
                        : new Date(bValue) - new Date(aValue);
                }
                return sortConfig.direction === 'ascending'
                    ? String(aValue).localeCompare(String(bValue))
                    : String(bValue).localeCompare(String(aValue));
            });
        }
        return items;
    }, [transactions, searchTerm, sortConfig]);

    const groupedData = useMemo(() => {
        if (groupBy === 'none') {
            return { 'All Transactions': filteredAndSortedData };
        }

        const groups = {};
        filteredAndSortedData.forEach(tx => {
            let key = 'Other';
            if (groupBy === 'card') {
                const cardId = tx['Card'] && tx['Card'][0];
                const card = cardMap.get(cardId);
                key = card ? card.name : 'Unknown Card';
            } else if (groupBy === 'category') {
                key = tx['Category'] || 'Uncategorized';
            } else if (groupBy === 'date') {
                key = tx['Transaction Date'] || 'No Date';
            }

            if (!groups[key]) groups[key] = [];
            groups[key].push(tx);
        });

        return Object.keys(groups).sort((a, b) => {
             if (groupBy === 'date') return new Date(b) - new Date(a);
             return a.localeCompare(b);
        }).reduce((obj, key) => {
            obj[key] = groups[key];
            return obj;
        }, {});
    }, [filteredAndSortedData, groupBy, cardMap]);

    const handleSelectAll = (checked) => {
        if (checked) {
            const allIds = new Set(filteredAndSortedData.map(t => t.id));
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

    // Calculate totals for ALL filtered transactions (for the table footer)
    const totals = useMemo(() => {
        return filteredAndSortedData.reduce((acc, t) => {
            acc.amount += t['Amount'] || 0;
            acc.cashback += t.estCashback || 0;
            return acc;
        }, { amount: 0, cashback: 0 });
    }, [filteredAndSortedData]);

    // Calculate totals for SELECTED transactions (for the bulk action bar)
    const selectedTotals = useMemo(() => {
        return transactions // Use original list to ensure we can select items even if filtered out visually, or restrict to filtered? Usually bulk action applies to selected ID regardless of view.
            .filter(t => selectedRows.has(t.id))
            .reduce((acc, t) => {
                acc.amount += t['Amount'] || 0;
                acc.cashback += t.estCashback || 0;
                return acc;
            }, { amount: 0, cashback: 0 });
    }, [transactions, selectedRows]);

    const isAllSelected = filteredAndSortedData.length > 0 && selectedRows.size === filteredAndSortedData.length;

    const handleDeleteSelected = () => {
        if (onBulkDelete) {
            onBulkDelete(Array.from(selectedRows));
        }
        setSelectedRows(new Set());
        setIsSelectionActive(false); 
    };

    const renderMobileFilters = () => {
        return (
            <div className="sticky top-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm px-4 py-3 shadow-sm border-b border-slate-100/50 dark:border-slate-800/50 -mx-6 mb-2">
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide px-2 py-1 select-none no-scrollbar">
                    {/* Search */}
                    <div className="relative flex items-center min-w-[140px]">
                        <Search className="absolute left-3 w-3.5 h-3.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-[30px] pl-8 pr-3 bg-slate-100 dark:bg-slate-900 rounded-full text-base font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-500 transition-all border-none"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="absolute right-2 p-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500">
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>

                     {/* Group By Pill */}
                     <Select value={groupBy} onValueChange={setGroupBy}>
                        <SelectTrigger className="h-[30px] w-auto border-0 p-0 bg-transparent shadow-none focus:ring-0 [&>span]:hidden [&>svg]:hidden">
                            <div className={cn(
                                "flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all border cursor-pointer",
                                groupBy !== 'none'
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm dark:bg-slate-100 dark:text-slate-900'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-800'
                            )}>
                                <Layers className="w-3.5 h-3.5" />
                                <span>Group</span>
                                {groupBy !== 'none' && (
                                    <>
                                        <span className="opacity-60">|</span>
                                        <span className="font-semibold max-w-[80px] truncate">{groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}</span>
                                    </>
                                )}
                                <ChevronDown className={cn("w-3 h-3 opacity-50", groupBy !== 'none' ? 'text-white dark:text-slate-900' : '')} />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">No Grouping</SelectItem>
                            <SelectItem value="card">Card</SelectItem>
                            <SelectItem value="category">Category</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Sort Pill */}
                    <Select value={sortByValue} onValueChange={handleSortChange}>
                        <SelectTrigger className="h-[30px] w-auto border-0 p-0 bg-transparent shadow-none focus:ring-0 [&>span]:hidden [&>svg]:hidden">
                            <div className={cn(
                                "flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all border cursor-pointer",
                                sortByValue !== 'Newest' && sortByValue !== 'Custom'
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm dark:bg-slate-100 dark:text-slate-900'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-800'
                            )}>
                                <ArrowUpDown className="w-3.5 h-3.5" />
                                <span>Sort</span>
                                {sortByValue !== 'Newest' && sortByValue !== 'Custom' && (
                                    <>
                                        <span className="opacity-60">|</span>
                                        <span className="font-semibold max-w-[80px] truncate">{sortByValue}</span>
                                    </>
                                )}
                                <ChevronDown className={cn("w-3 h-3 opacity-50", sortByValue !== 'Newest' && sortByValue !== 'Custom' ? 'text-white dark:text-slate-900' : '')} />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Newest">Newest</SelectItem>
                            <SelectItem value="Oldest">Oldest</SelectItem>
                            <SelectItem value="Amount: High">Amount: High</SelectItem>
                            <SelectItem value="Amount: Low">Amount: Low</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        );
    }

    const renderBulkBar = () => (
        <div className="fixed bottom-4 left-4 right-4 z-50 shadow-xl rounded-xl flex flex-col items-start gap-2 p-3 bg-slate-900 text-white animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 pl-1 w-full">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-white shrink-0" onClick={() => setSelectedRows(new Set())}>
                    <X className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium whitespace-nowrap">{selectedRows.size} Selected</span>
                <div className="flex-1" />
                <div className="flex items-center gap-3 text-xs text-slate-300">
                     <span className="whitespace-nowrap">Total: <span className="text-white font-medium">{currencyFn(selectedTotals.amount)}</span></span>
                </div>
            </div>
            <div className="flex items-center gap-2 w-full justify-between pl-1 pr-1">
                 <span className="text-xs text-slate-300 whitespace-nowrap">Cashback: <span className="text-emerald-400 font-medium">{currencyFn(selectedTotals.cashback)}</span></span>
                <Button variant="destructive" size="sm" onClick={handleDeleteSelected} className="h-8 text-xs">
                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                </Button>
            </div>
        </div>
    );

    const renderContent = () => (
        <>
            {/* --- DESKTOP ACTION BAR (HIDDEN ON MOBILE) --- */}
            <div className="hidden md:flex items-center justify-between px-6 pb-4">

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

            <div className="flex-1 overflow-y-auto px-6 pb-6 pt-0">
                    {/* Mobile Header (Filters) - Rendered INSIDE scroll area but sticky */}
                    <div className="md:hidden">
                    {renderMobileFilters()}
                    </div>

                    {/* Mobile Bulk Bar - Rendered OUTSIDE normal flow but fixed via CSS */}
                    <div className="md:hidden">
                    {selectedRows.size > 0 && renderBulkBar()}
                    </div>

                {isLoading ? (
                    <div className="flex justify-center items-center h-48">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : filteredAndSortedData.length > 0 ? (
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
                                    {filteredAndSortedData.map(t => {
                                        const card = t['Card'] ? cardMap?.get(t['Card'][0]) : null;

                                        return (
                                            <tr key={t.id} className="border-b">
                                                <td className="p-2">
                                                    <Checkbox
                                                        checked={selectedRows.has(t.id)}
                                                        onCheckedChange={(checked) => handleSelectRow(t.id, checked)}
                                                    />
                                                </td>
                                                {visibleColumns['Transaction Date'] && <td className="p-2">{formatTxDate(t['Transaction Date'])}</td>}
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
                                                            <DropdownMenuItem onClick={() => setViewingTransaction(t)}>View Details</DropdownMenuItem>
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

                        {/* Mobile List View */}
                        <div className="md:hidden space-y-2.5 pb-20">
                                {/* Select All Row */}
                            {filteredAndSortedData.length > 0 && (
                                <div className="flex items-center justify-between px-2 pt-1 pb-1">
                                    <div className="flex items-center gap-2 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleSelectAll(selectedRows.size !== filteredAndSortedData.length); }}>
                                        <Checkbox
                                            checked={selectedRows.size > 0 && selectedRows.size === filteredAndSortedData.length}
                                            onCheckedChange={handleSelectAll}
                                            className={cn("h-5 w-5 rounded border data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 bg-white border-slate-300")}
                                        />
                                        <span className="text-xs font-medium text-slate-500">Select All</span>
                                    </div>
                                    <span className="text-[10px] text-slate-400">{filteredAndSortedData.length} items</span>
                                </div>
                            )}

                            {/* Grouped List Logic */}
                            {(() => {
                                const flatList = [];
                                Object.entries(groupedData).forEach(([key, items]) => {
                                    if (groupBy !== 'none') flatList.push({ type: 'header', title: key, count: items.length });
                                    flatList.push(...items.map(i => ({ type: 'item', ...i })));
                                });

                                return flatList.map((item, index) => {
                                        if (item.type === 'header') {
                                        return (
                                            <div key={`header-${index}`} className="pt-2 pb-1 px-1">
                                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{item.title} ({item.count})</span>
                                            </div>
                                        );
                                    }

                                    // Item
                                    const tx = item;
                                    return (
                                        <MobileTransactionItem
                                            key={tx.id}
                                            transaction={tx}
                                            currencyFn={currencyFn}
                                            isSelected={selectedRows.has(tx.id)}
                                            onSelect={handleSelectRow}
                                            onClick={() => setViewingTransaction(tx)}
                                            cardMap={cardMap}
                                        />
                                    );
                                });
                            })()}
                        </div>
                    </>
                ) : (
                    <div className="flex justify-center items-center h-48">
                        <p className="text-muted-foreground">No transactions found.</p>
                    </div>
                )}
            </div>
        </>
    );

    if (isDesktop) {
        return (
            <>
                <Dialog open={isOpen} onOpenChange={onClose}>
                    <DialogContent
                        className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0"
                        onOpenAutoFocus={(e) => e.preventDefault()}
                    >
                        <DialogHeader className="p-6 pb-2">
                            <DialogTitle>{title}</DialogTitle>
                            <DialogDescription>
                                {description}
                            </DialogDescription>
                        </DialogHeader>
                        {renderContent()}
                    </DialogContent>
                </Dialog>

                {/* Embedded Transaction Detail Sheet */}
                <TransactionDetailSheet
                    transaction={viewingTransaction}
                    isOpen={!!viewingTransaction}
                    onClose={() => setViewingTransaction(null)}
                    onEdit={(t) => {
                        setViewingTransaction(null);
                        if (onEdit) onEdit(t);
                    }}
                    onDuplicate={onDuplicate}
                    onDelete={(id, name) => {
                        setViewingTransaction(null);
                        if (onDelete) onDelete(id, name);
                    }}
                    currencyFn={currencyFn}
                    allCards={allCards}
                    rules={rules}
                    monthlyCategorySummary={monthlyCategorySummary}
                />
            </>
        );
    }

    return (
        <>
            <Drawer open={isOpen} onOpenChange={onClose}>
                <DrawerContent
                    className="max-h-[90vh] flex flex-col p-0 gap-0"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <DrawerHeader className="p-6 pb-2 text-left">
                        <DrawerTitle>{title}</DrawerTitle>
                        <DrawerDescription>
                            {description}
                        </DrawerDescription>
                    </DrawerHeader>
                    {renderContent()}
                </DrawerContent>
            </Drawer>

            {/* Embedded Transaction Detail Sheet */}
            <TransactionDetailSheet
                transaction={viewingTransaction}
                isOpen={!!viewingTransaction}
                onClose={() => setViewingTransaction(null)}
                onEdit={(t) => {
                    setViewingTransaction(null);
                    if (onEdit) onEdit(t);
                }}
                onDuplicate={onDuplicate}
                onDelete={(id, name) => {
                    setViewingTransaction(null);
                    if (onDelete) onDelete(id, name);
                }}
                currencyFn={currencyFn}
                allCards={allCards}
                rules={rules}
                monthlyCategorySummary={monthlyCategorySummary}
            />
        </>
    );
}
