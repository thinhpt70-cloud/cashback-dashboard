// TransactionsList.jsx

import React, { useState, useMemo, useEffect } from "react";
import {
    ChevronsUpDown,
    ArrowUp,
    ArrowDown,
    FilePenLine,
    Trash2,
    Search,
    X,
    Filter,
    Layers,
    MoreHorizontal,
    Settings2
} from "lucide-react";

import { cn } from "../../../lib/utils";
import { Checkbox } from "../../ui/checkbox";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../ui/table";
import { Input } from "../../ui/input";
import { Skeleton } from "../../ui/skeleton";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../../ui/card";
import {
    Tabs,
    TabsList,
    TabsTrigger,
} from "../../ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from "../../ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "../../ui/dropdown-menu";

export default function TransactionsList({
    transactions,
    isLoading,
    activeMonth,
    cardMap,
    mccNameFn,
    allCards,
    filterType,
    onFilterTypeChange,
    statementMonths,
    isDesktop,
    onTransactionDeleted,
    onEditTransaction,
    onBulkDelete,
    onViewDetails,
    fmtYMShortFn,
    rules
}) {
    const [searchTerm, setSearchTerm] = useState("");
    const [cardFilter, setCardFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [visibleCount, setVisibleCount] = useState(15);
    const [sortConfig, setSortConfig] = useState({ key: 'Transaction Date', direction: 'descending' });
    const [selectedIds, setSelectedIds] = useState([]);
    const [groupBy, setGroupBy] = useState("none");

    const [visibleColumns, setVisibleColumns] = useState({
        'Transaction Date': true,
        'Transaction Name': true,
        'Merchant': false,
        'Amount': true,
        'Estimated Cashback': true,
        'Card Name': true,
        'Category': false,
        'Applicable Rule': false,
        'MCC Code': false,
        'Notes': false,
        'Cashback Rate': true,
    });

    const currency = (n) => (n || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

    useEffect(() => {
        setSelectedIds([]);
    }, [activeMonth, filterType]);

    const categories = useMemo(() => {
        const uniqueCategories = Array.from(new Set(transactions.map(tx => tx['Category']).filter(Boolean)));
        uniqueCategories.sort((a, b) => a.localeCompare(b));
        return ["all", ...uniqueCategories];
    }, [transactions]);

    const filteredData = useMemo(() => {
        let items = [...transactions].map(tx => ({
            ...tx,
            rate: (tx['Amount'] && tx['Amount'] > 0) ? (tx.estCashback / tx['Amount']) : 0
        }));

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
        })
        .filter(tx => cardFilter === "all" || (tx['Card'] && tx['Card'][0] === cardFilter))
        .filter(tx => categoryFilter === "all" || tx['Category'] === categoryFilter);

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
    }, [transactions, searchTerm, cardFilter, categoryFilter, sortConfig]);

    useEffect(() => {
        setVisibleCount(15);
    }, [filteredData]);

    const groupedData = useMemo(() => {
        if (groupBy === 'none') {
            return { 'All Transactions': filteredData.slice(0, visibleCount) };
        }

        const groups = {};
        const itemsToShow = filteredData.slice(0, visibleCount);

        itemsToShow.forEach(tx => {
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

    }, [filteredData, groupBy, visibleCount, cardMap]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const transactionsToShow = useMemo(() => {
        return filteredData.slice(0, visibleCount);
    }, [filteredData, visibleCount]);

    const handleLoadMore = () => {
        setVisibleCount(prevCount => prevCount + 15);
    };

    const handleEdit = (tx) => {
        onEditTransaction(tx);
    };

    const handleDelete = (txId, txName) => {
        onTransactionDeleted(txId, txName);
    };

    const handleSelectAll = (checked) => {
        if (checked) {
            const allIds = filteredData.map(tx => tx.id);
            setSelectedIds(allIds);
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (txId, checked) => {
        if (checked) {
            setSelectedIds(prev => [...prev, txId]);
        } else {
            setSelectedIds(prev => prev.filter(id => id !== txId));
        }
    };

    const handleBulkDeleteAction = () => {
        if (onBulkDelete) {
            onBulkDelete(selectedIds);
            setSelectedIds([]);
        }
    };

    const { totalAmount, totalCashback } = useMemo(() => {
        const selectedTxs = transactions.filter(tx => selectedIds.includes(tx.id));
        const totalAmount = selectedTxs.reduce((sum, tx) => sum + (tx['Amount'] || 0), 0);
        const totalCashback = selectedTxs.reduce((sum, tx) => sum + (tx.estCashback || 0), 0);
        return { totalAmount, totalCashback };
    }, [selectedIds, transactions]);

    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) return <ChevronsUpDown className="ml-2 h-4 w-4" />;
        return sortConfig.direction === 'ascending' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
    };

    const getRateColor = (r) => {
        const ratePercent = r * 100;
        if (ratePercent >= 5) return "bg-emerald-100 text-emerald-800 border-emerald-200";
        if (ratePercent >= 2) return "bg-sky-100 text-sky-800 border-sky-200";
        if (ratePercent > 0) return "bg-slate-100 text-slate-700 border-slate-200";
        return "bg-gray-100 text-gray-500 border-gray-200";
    };

    const renderContent = () => {
        if (isLoading) {
             if (!isDesktop) {
                return (
                    <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="p-3 border bg-white dark:bg-slate-950 dark:border-slate-800 rounded-lg space-y-3">
                                <div className="flex justify-between items-start gap-2">
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-5 w-3/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                    <div className="text-right flex-shrink-0 space-y-2">
                                        <Skeleton className="h-6 w-24 ml-auto" />
                                        <Skeleton className="h-4 w-16 ml-auto" />
                                    </div>
                                </div>
                                <div className="flex justify-between items-center mt-2 pt-2 border-t">
                                    <Skeleton className="h-6 w-32" />
                                    <Skeleton className="h-8 w-8 rounded-md" />
                                </div>
                            </div>
                        ))}
                    </div>
                );
            }

            return (
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[30px] p-2">
                                    <Checkbox
                                        checked={selectedIds.length > 0 && selectedIds.length === filteredData.length}
                                        onCheckedChange={handleSelectAll}
                                        aria-label="Select all"
                                    />
                                </TableHead>
                                <TableHead className="w-[30px]"></TableHead>

                                {visibleColumns['Transaction Date'] && (
                                    <TableHead className="w-[120px]"><Button variant="ghost" onClick={() => requestSort('Transaction Date')} className="px-2">Date <SortIcon columnKey="Transaction Date" /></Button></TableHead>
                                )}

                                {visibleColumns['Transaction Name'] && (
                                    <TableHead><Button variant="ghost" onClick={() => requestSort('Transaction Name')} className="px-2">Transaction <SortIcon columnKey="Transaction Name" /></Button></TableHead>
                                )}

                                {visibleColumns['Merchant'] && (
                                    <TableHead><Button variant="ghost" onClick={() => requestSort('merchantLookup')} className="px-2">Merchant <SortIcon columnKey="merchantLookup" /></Button></TableHead>
                                )}

                                {visibleColumns['Amount'] && (
                                    <TableHead className="text-right"><Button variant="ghost" onClick={() => requestSort('Amount')} className="px-2 justify-end">Amount <SortIcon columnKey="Amount" /></Button></TableHead>
                                )}

                                {visibleColumns['Estimated Cashback'] && (
                                    <TableHead className="text-right"><Button variant="ghost" onClick={() => requestSort('estCashback')} className="px-2 justify-end">Cashback <SortIcon columnKey="estCashback" /></Button></TableHead>
                                )}

                                {visibleColumns['Card Name'] && (
                                    <TableHead><Button variant="ghost" onClick={() => requestSort('Card')} className="px-2">Card <SortIcon columnKey="Card" /></Button></TableHead>
                                )}

                                {visibleColumns['Category'] && (
                                    <TableHead><Button variant="ghost" onClick={() => requestSort('Category')} className="px-2">Category <SortIcon columnKey="Category" /></Button></TableHead>
                                )}

                                {visibleColumns['Applicable Rule'] && (
                                    <TableHead>Rule</TableHead>
                                )}

                                {visibleColumns['MCC Code'] && (
                                    <TableHead>MCC</TableHead>
                                )}

                                {visibleColumns['Notes'] && (
                                    <TableHead>Notes</TableHead>
                                )}

                                {visibleColumns['Cashback Rate'] && (
                                    <TableHead className="text-center"><Button variant="ghost" onClick={() => requestSort('rate')} className="px-2">Rate <SortIcon columnKey="rate" /></Button></TableHead>
                                )}

                                <TableHead className="w-[100px] text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* Loading State for Table */}
                            {isLoading ? (
                                Array.from({ length: 7 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-16 mx-auto" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-7 w-16 mx-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                Object.entries(groupedData).map(([groupKey, groupTxs]) => (
                                    <React.Fragment key={groupKey}>
                                        {groupBy !== 'none' && (
                                            <TableRow className="bg-slate-100/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-900">
                                                <TableCell colSpan={Object.keys(visibleColumns).filter(k => visibleColumns[k]).length + 3} className="py-2 px-4 font-semibold text-xs uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                                                    {groupKey} <span className="ml-1 text-slate-400 font-normal">({groupTxs.length})</span>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        {groupTxs.map(tx => {
                                            const card = tx['Card'] ? cardMap.get(tx['Card'][0]) : null;
                                            const isSelected = selectedIds.includes(tx.id);

                                            return (
                                                <TableRow
                                                    key={tx.id}
                                                    onClick={() => onViewDetails && onViewDetails(tx)}
                                                    className={cn("cursor-pointer", isSelected && "bg-slate-50 dark:bg-slate-800/50")}
                                                >
                                                    <TableCell className="p-2" onClick={(e) => e.stopPropagation()}>
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onCheckedChange={(checked) => handleSelectOne(tx.id, checked)}
                                                            aria-label={`Select ${tx['Transaction Name']}`}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="px-2">
                                                    </TableCell>

                                                    {visibleColumns['Transaction Date'] && <TableCell>{tx['Transaction Date']}</TableCell>}

                                                    {visibleColumns['Transaction Name'] && (
                                                        <TableCell>
                                                            <div className="font-medium">{tx['Transaction Name']}</div>
                                                            {tx.merchantLookup && <div className="text-xs text-gray-500">{tx.merchantLookup}</div>}
                                                        </TableCell>
                                                    )}

                                                    {visibleColumns['Merchant'] && (
                                                        <TableCell className="text-slate-500">{tx.merchantLookup || ''}</TableCell>
                                                    )}

                                                    {visibleColumns['Amount'] && <TableCell className="text-right">{currency(tx['Amount'])}</TableCell>}

                                                    {visibleColumns['Estimated Cashback'] && <TableCell className="text-right font-medium text-emerald-600">{currency(tx.estCashback)}</TableCell>}

                                                    {visibleColumns['Card Name'] && <TableCell>{card ? <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">{card.name}</Badge> : 'N/A'}</TableCell>}

                                                    {visibleColumns['Category'] && <TableCell>{tx['Category'] || ''}</TableCell>}

                                                    {visibleColumns['Applicable Rule'] && (
                                                        <TableCell className="text-xs font-mono text-slate-500">
                                                            {(() => {
                                                                const ruleId = tx['Applicable Rule'] && tx['Applicable Rule'][0];
                                                                if (!ruleId) return '';
                                                                const ruleName = rules && rules.find(r => r.id === ruleId)?.ruleName;
                                                                return ruleName || "Error";
                                                            })()}
                                                        </TableCell>
                                                    )}

                                                    {visibleColumns['MCC Code'] && (
                                                        <TableCell>
                                                            {tx['MCC Code'] ? `${tx['MCC Code']} - ${mccNameFn ? mccNameFn(tx['MCC Code']) : ''}` : ''}
                                                        </TableCell>
                                                    )}

                                                    {visibleColumns['Notes'] && <TableCell>{tx['Notes'] || ''}</TableCell>}

                                                    {visibleColumns['Cashback Rate'] && (
                                                        <TableCell className="text-center">
                                                            <Badge variant="outline" className={cn("font-mono", getRateColor(tx.rate))}>
                                                                {(tx.rate * 100).toFixed(1)}%
                                                            </Badge>
                                                        </TableCell>
                                                    )}

                                                    <TableCell className="text-center">
                                                         <div className="md:hidden">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem onClick={() => onEditTransaction(tx)}>
                                                                        <FilePenLine className="mr-2 h-4 w-4" /> Edit
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleDelete(tx.id, tx['Transaction Name'])}
                                                                        className="text-destructive"
                                                                    >
                                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                        <div className="hidden md:flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(tx)}><FilePenLine className="h-4 w-4" /></Button>
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(tx.id, tx['Transaction Name'])}><Trash2 className="h-4 w-4" /></Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </React.Fragment>
                                 ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            );
        };

        if (filteredData.length === 0) {
            return <div className="text-center h-24 flex items-center justify-center text-muted-foreground"><p>No transactions found.</p></div>;
        }

        if (!isDesktop) {
            // Mobile View
             const flatList = [];
             Object.entries(groupedData).forEach(([key, items]) => {
                 if (groupBy !== 'none') flatList.push({ type: 'header', title: key, count: items.length });
                 flatList.push(...items.map(i => ({ type: 'item', ...i })));
             });

            return (
                <div className="space-y-3">
                    {flatList.map((item, index) => {
                        if (item.type === 'header') {
                            return (
                                <div key={`header-${index}`} className="pt-2 pb-1 px-1">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{item.title} ({item.count})</span>
                                </div>
                            );
                        }

                        // Item
                        const tx = item;
                        const card = tx['Card'] ? cardMap.get(tx['Card'][0]) : null;
                        const isSelected = selectedIds.includes(tx.id);
                        return (
                            <div key={tx.id} className={cn("border rounded-lg shadow-sm overflow-hidden transition-colors", isSelected ? "bg-slate-50 border-slate-400 dark:bg-slate-800 dark:border-slate-600" : "bg-white dark:bg-slate-950 dark:border-slate-800")} onClick={() => onViewDetails && onViewDetails(tx)}>
                                <div className="p-3 flex gap-3">
                                    <div onClick={(e) => e.stopPropagation()} className="pt-1">
                                        <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={(checked) => handleSelectOne(tx.id, checked)}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold truncate">{tx['Transaction Name']}</p>
                                            {tx.merchantLookup && <p className="text-xs text-muted-foreground">{tx.merchantLookup}</p>}
                                            <p className="text-sm text-muted-foreground">{tx['Transaction Date']}</p>
                                        </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="font-bold text-lg">{currency(tx['Amount'])}</p>
                                                <p className="text-sm text-emerald-600 font-medium">+ {currency(tx.estCashback)}</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center mt-2 pt-2 border-t dark:border-slate-800">
                                            <div className="flex items-center gap-2">
                                                {card && <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">{card.name}</Badge>}
                                                <Badge variant="outline" className={cn("font-mono", getRateColor(tx.rate))}>{(tx.rate * 100).toFixed(1)}%</Badge>
                                            </div>
                                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                Tap for details
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            );
        }

        // --- DESKTOP TABLE VIEW (Default Return from renderContent) ---
        return (
            <div className="border rounded-md">
                 <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[30px] p-2">
                                    <Checkbox
                                        checked={selectedIds.length > 0 && selectedIds.length === filteredData.length}
                                        onCheckedChange={handleSelectAll}
                                        aria-label="Select all"
                                    />
                                </TableHead>
                                <TableHead className="w-[30px]"></TableHead>

                                {visibleColumns['Transaction Date'] && (
                                    <TableHead className="w-[120px]"><Button variant="ghost" onClick={() => requestSort('Transaction Date')} className="px-2">Date <SortIcon columnKey="Transaction Date" /></Button></TableHead>
                                )}

                                {visibleColumns['Transaction Name'] && (
                                    <TableHead><Button variant="ghost" onClick={() => requestSort('Transaction Name')} className="px-2">Transaction <SortIcon columnKey="Transaction Name" /></Button></TableHead>
                                )}

                                {visibleColumns['Merchant'] && (
                                    <TableHead><Button variant="ghost" onClick={() => requestSort('merchantLookup')} className="px-2">Merchant <SortIcon columnKey="merchantLookup" /></Button></TableHead>
                                )}

                                {visibleColumns['Amount'] && (
                                    <TableHead className="text-right"><Button variant="ghost" onClick={() => requestSort('Amount')} className="px-2 justify-end">Amount <SortIcon columnKey="Amount" /></Button></TableHead>
                                )}

                                {visibleColumns['Estimated Cashback'] && (
                                    <TableHead className="text-right"><Button variant="ghost" onClick={() => requestSort('estCashback')} className="px-2 justify-end">Cashback <SortIcon columnKey="estCashback" /></Button></TableHead>
                                )}

                                {visibleColumns['Card Name'] && (
                                    <TableHead><Button variant="ghost" onClick={() => requestSort('Card')} className="px-2">Card <SortIcon columnKey="Card" /></Button></TableHead>
                                )}

                                {visibleColumns['Category'] && (
                                    <TableHead><Button variant="ghost" onClick={() => requestSort('Category')} className="px-2">Category <SortIcon columnKey="Category" /></Button></TableHead>
                                )}

                                {visibleColumns['Applicable Rule'] && (
                                    <TableHead>Rule</TableHead>
                                )}

                                {visibleColumns['MCC Code'] && (
                                    <TableHead>MCC</TableHead>
                                )}

                                {visibleColumns['Notes'] && (
                                    <TableHead>Notes</TableHead>
                                )}

                                {visibleColumns['Cashback Rate'] && (
                                    <TableHead className="text-center"><Button variant="ghost" onClick={() => requestSort('rate')} className="px-2">Rate <SortIcon columnKey="rate" /></Button></TableHead>
                                )}

                                <TableHead className="w-[100px] text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* Desktop Table Body */}
                            {isLoading ? (
                                Array.from({ length: 7 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-16 mx-auto" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-7 w-16 mx-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                Object.entries(groupedData).map(([groupKey, groupTxs]) => (
                                    <React.Fragment key={groupKey}>
                                        {groupBy !== 'none' && (
                                            <TableRow className="bg-slate-100/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-900">
                                                <TableCell colSpan={Object.keys(visibleColumns).filter(k => visibleColumns[k]).length + 3} className="py-2 px-4 font-semibold text-xs uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                                                    {groupKey} <span className="ml-1 text-slate-400 font-normal">({groupTxs.length})</span>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        {groupTxs.map(tx => {
                                            const card = tx['Card'] ? cardMap.get(tx['Card'][0]) : null;
                                            const isSelected = selectedIds.includes(tx.id);

                                            return (
                                                <TableRow
                                                    key={tx.id}
                                                    onClick={() => onViewDetails && onViewDetails(tx)}
                                                    className={cn("cursor-pointer", isSelected && "bg-slate-50 dark:bg-slate-800/50")}
                                                >
                                                    <TableCell className="p-2" onClick={(e) => e.stopPropagation()}>
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onCheckedChange={(checked) => handleSelectOne(tx.id, checked)}
                                                            aria-label={`Select ${tx['Transaction Name']}`}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="px-2">
                                                    </TableCell>

                                                    {visibleColumns['Transaction Date'] && <TableCell>{tx['Transaction Date']}</TableCell>}

                                                    {visibleColumns['Transaction Name'] && (
                                                        <TableCell>
                                                            <div className="font-medium">{tx['Transaction Name']}</div>
                                                            {tx.merchantLookup && <div className="text-xs text-gray-500">{tx.merchantLookup}</div>}
                                                        </TableCell>
                                                    )}

                                                    {visibleColumns['Merchant'] && (
                                                        <TableCell className="text-slate-500">{tx.merchantLookup || ''}</TableCell>
                                                    )}

                                                    {visibleColumns['Amount'] && <TableCell className="text-right">{currency(tx['Amount'])}</TableCell>}

                                                    {visibleColumns['Estimated Cashback'] && <TableCell className="text-right font-medium text-emerald-600">{currency(tx.estCashback)}</TableCell>}

                                                    {visibleColumns['Card Name'] && <TableCell>{card ? <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">{card.name}</Badge> : 'N/A'}</TableCell>}

                                                    {visibleColumns['Category'] && <TableCell>{tx['Category'] || ''}</TableCell>}

                                                    {visibleColumns['Applicable Rule'] && (
                                                        <TableCell className="text-xs font-mono text-slate-500">
                                                            {tx['Applicable Rule']?.length > 0 ? tx['Applicable Rule'][0].slice(0, 8) + '...' : ''}
                                                        </TableCell>
                                                    )}

                                                    {visibleColumns['MCC Code'] && (
                                                        <TableCell>
                                                            {tx['MCC Code'] ? `${tx['MCC Code']} - ${mccNameFn ? mccNameFn(tx['MCC Code']) : ''}` : ''}
                                                        </TableCell>
                                                    )}

                                                    {visibleColumns['Notes'] && <TableCell>{tx['Notes'] || ''}</TableCell>}

                                                    {visibleColumns['Cashback Rate'] && (
                                                        <TableCell className="text-center">
                                                            <Badge variant="outline" className={cn("font-mono", getRateColor(tx.rate))}>
                                                                {(tx.rate * 100).toFixed(1)}%
                                                            </Badge>
                                                        </TableCell>
                                                    )}

                                                    <TableCell className="text-center">
                                                         <div className="md:hidden">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem onClick={() => onEditTransaction(tx)}>
                                                                        <FilePenLine className="mr-2 h-4 w-4" /> Edit
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleDelete(tx.id, tx['Transaction Name'])}
                                                                        className="text-destructive"
                                                                    >
                                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                        <div className="hidden md:flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(tx)}><FilePenLine className="h-4 w-4" /></Button>
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(tx.id, tx['Transaction Name'])}><Trash2 className="h-4 w-4" /></Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </React.Fragment>
                                 ))
                            )}
                        </TableBody>
                    </Table>
                </div>
        );
    };

    const renderBulkBar = (isStickyMobile) => (
        <div className={cn(
            "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-slate-900 text-white animate-in fade-in slide-in-from-top-2",
            isStickyMobile ? "sticky top-16 z-40 shadow-md rounded-b-xl" : ""
        )}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 pl-1 w-full sm:w-auto">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-white shrink-0" onClick={() => setSelectedIds([])}>
                        <X className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium whitespace-nowrap">{selectedIds.length} Selected</span>
                </div>
                <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-300 ml-10 sm:ml-0">
                    <span className="whitespace-nowrap">Total: <span className="text-white font-medium">{currency(totalAmount)}</span></span>
                    <span className="hidden sm:inline">•</span>
                    <span className="whitespace-nowrap">Cashback: <span className="text-emerald-400 font-medium">{currency(totalCashback)}</span></span>
                </div>
            </div>
            <div className="flex items-center gap-2 pr-2 w-full sm:w-auto justify-end">
                <Button variant="destructive" size="sm" onClick={handleBulkDeleteAction} className="w-full sm:w-auto">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete ({selectedIds.length})
                </Button>
            </div>
        </div>
    );

    return (
        <Card className="relative">
            {/* Mobile Bulk Bar - Rendered OUTSIDE the static header wrapper */}
            {!isDesktop && selectedIds.length > 0 && renderBulkBar(true)}

            <div
                // Desktop Sticky Header Container
                className={cn(
                    "z-30 bg-background shadow-sm rounded-t-xl overflow-hidden",
                    isDesktop ? "sticky top-16" : "static"
                )}
            >
                {/* Desktop Bulk Bar - Rendered INSIDE the sticky header wrapper */}
                {isDesktop && selectedIds.length > 0 && renderBulkBar(false)}

                 <CardHeader className="border-b p-4">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <CardTitle>
                                {activeMonth === 'live'
                                    ? 'Recent Transactions'
                                    : `Transactions for ${fmtYMShortFn(activeMonth)}`
                                }
                            </CardTitle>
                            {activeMonth !== 'live' && (
                                <Tabs defaultValue="date" value={filterType} onValueChange={onFilterTypeChange} className="flex items-center">
                                    <TabsList className="bg-slate-100 p-1 rounded-lg">
                                        <TabsTrigger value="date">Transaction Date</TabsTrigger>
                                        <TabsTrigger value="cashbackMonth">Cashback Month</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            )}
                        </div>

                        {/* Toolbar */}
                        <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center transition-colors">
                            <div className="flex flex-wrap gap-2 items-center w-full xl:w-auto">
                                {/* Search */}
                                <div className="relative w-full md:w-64">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="search"
                                        placeholder="Search..."
                                        className="pl-8 h-10"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block"></div>

                                {/* Card Filter */}
                                <Select value={cardFilter} onValueChange={setCardFilter}>
                                    <SelectTrigger className="w-full md:w-[160px] h-10">
                                        <div className="flex items-center gap-2 truncate">
                                            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span className="truncate">
                                                {cardFilter === 'all' ? 'All Cards' : allCards.find(c => c.id === cardFilter)?.name || 'Selected'}
                                            </span>
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Cards</SelectItem>
                                        {[...allCards].sort((a, b) => a.name.localeCompare(b.name)).map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Category Filter */}
                                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                    <SelectTrigger className="w-full md:w-[160px] h-10">
                                        <div className="flex items-center gap-2 truncate">
                                            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span className="truncate">
                                                {categoryFilter === 'all' ? 'All Categories' : categoryFilter}
                                            </span>
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(cat => (
                                            <SelectItem key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block"></div>

                                {/* Group By */}
                                <Select value={groupBy} onValueChange={setGroupBy}>
                                    <SelectTrigger className="hidden md:flex w-full md:w-[160px] h-10">
                                        <div className="flex items-center gap-2">
                                            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span className="truncate">Group: {groupBy === 'none' ? 'None' : groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}</span>
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No Grouping</SelectItem>
                                        <SelectItem value="card">Group by Card</SelectItem>
                                        <SelectItem value="category">Group by Category</SelectItem>
                                        <SelectItem value="date">Group by Date</SelectItem>
                                    </SelectContent>
                                </Select>

                                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block"></div>

                                {/* Columns Selection */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="h-10">
                                            <Settings2 className="h-3.5 w-3.5 mr-2" />
                                            Columns
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-[180px]">
                                        <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {Object.keys(visibleColumns).map((column) => (
                                            <DropdownMenuItem key={column} onSelect={(e) => e.preventDefault()}>
                                                <Checkbox
                                                    checked={visibleColumns[column]}
                                                    onCheckedChange={() =>
                                                        setVisibleColumns((prev) => ({ ...prev, [column]: !prev[column] }))
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
                    </div>
                </CardHeader>
            </div>
            <CardContent className="pt-6">
                {renderContent()}
                <div className="mt-6 flex flex-col items-center gap-4">
                    <p className="text-sm text-muted-foreground">
                        Showing <span className="font-semibold text-primary">{transactionsToShow.length}</span> of <span className="font-semibold text-primary">{filteredData.length}</span> transactions
                    </p>
                    {visibleCount < filteredData.length && (
                        <Button onClick={handleLoadMore} variant="outline">Load More</Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
