import React, { useState, useMemo, useEffect } from "react";
import {
    ChevronsUpDown,
    ArrowUp,
    ArrowDown,
    FilePenLine,
    Trash2,
    Search,
    X
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
    fmtYMShortFn
}) {
    const [searchTerm, setSearchTerm] = useState("");
    const [cardFilter, setCardFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [visibleCount, setVisibleCount] = useState(15);
    const [sortConfig, setSortConfig] = useState({ key: 'Transaction Date', direction: 'descending' });
    const [selectedIds, setSelectedIds] = useState([]); // State for bulk selection
    const currency = (n) => (n || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

    // Reset selection when month/filter changes
    useEffect(() => {
        setSelectedIds([]);
    }, [activeMonth, filterType]);

    const categories = useMemo(() => {
        const uniqueCategories = Array.from(new Set(transactions.map(tx => tx['Category']).filter(Boolean)));
        uniqueCategories.sort((a, b) => a.localeCompare(b));
        return ["all", ...uniqueCategories];
    }, [transactions]);

    const filteredAndSortedTransactions = useMemo(() => {
        let sortableItems = [...transactions].map(tx => ({
            ...tx,
            rate: (tx['Amount'] && tx['Amount'] > 0) ? (tx.estCashback / tx['Amount']) : 0
        }));

        sortableItems = sortableItems.filter(tx => {
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
            sortableItems.sort((a, b) => {
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
        return sortableItems;
    }, [transactions, searchTerm, cardFilter, categoryFilter, sortConfig]);

    useEffect(() => {
        setVisibleCount(15);
    }, [filteredAndSortedTransactions]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const transactionsToShow = useMemo(() => {
        return filteredAndSortedTransactions.slice(0, visibleCount);
    }, [filteredAndSortedTransactions, visibleCount]);

    const handleLoadMore = () => {
        setVisibleCount(prevCount => prevCount + 15);
    };

    const handleEdit = (tx) => {
        onEditTransaction(tx); // <-- Call the handler from the parent
    };

    const handleDelete = (txId, txName) => {
        onTransactionDeleted(txId, txName);
    };

    const handleSelectAll = (checked) => {
        if (checked) {
            // Select all currently visible/filtered transactions
            const allIds = filteredAndSortedTransactions.map(tx => tx.id);
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
            setSelectedIds([]); // Clear selection after action triggers (optimistic)
        }
    };

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
            // If it's not desktop (i.e., mobile view)
            if (!isDesktop) {
                return (
                    <div className="space-y-3">
                        {/* Create 5 skeleton cards for the mobile list view */}
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="p-3 border bg-white rounded-lg space-y-3">
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

            // Otherwise, render the skeleton for the desktop table view
            return (
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[40px]"><Skeleton className="h-5 w-5" /></TableHead>
                                <TableHead className="w-[40px]"><Skeleton className="h-5 w-5" /></TableHead>
                                <TableHead className="w-[120px]"><Skeleton className="h-5 w-20" /></TableHead>
                                <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                                <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                                <TableHead className="text-center"><Skeleton className="h-5 w-16 mx-auto" /></TableHead>
                                <TableHead className="text-right"><Skeleton className="h-5 w-28 ml-auto" /></TableHead>
                                <TableHead className="text-right"><Skeleton className="h-5 w-24 ml-auto" /></TableHead>
                                <TableHead className="w-[100px] text-center"><Skeleton className="h-5 w-20 mx-auto" /></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* Create 7 skeleton rows for the desktop table view */}
                            {Array.from({ length: 7 }).map((_, i) => (
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
                            ))}
                        </TableBody>
                    </Table>
                </div>
            );
        }

        if (transactionsToShow.length === 0) {
            return <div className="text-center h-24 flex items-center justify-center text-muted-foreground"><p>No transactions found.</p></div>;
        }

        if (!isDesktop) {
            return (
                <div className="space-y-3">
                    {transactionsToShow.map(tx => {
                        const card = tx['Card'] ? cardMap.get(tx['Card'][0]) : null;
                        return (
                            <div key={tx.id} className="border bg-white rounded-lg shadow-sm overflow-hidden" onClick={() => onViewDetails && onViewDetails(tx)}>
                                <div className="p-3">
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
                                    <div className="flex justify-between items-center mt-2 pt-2 border-t">
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
                        );
                    })}
                </div>
            );
        }

        // --- DESKTOP TABLE VIEW ---
        return (
            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[30px] p-2">
                                <Checkbox
                                    checked={selectedIds.length > 0 && selectedIds.length === filteredAndSortedTransactions.length}
                                    onCheckedChange={handleSelectAll}
                                    aria-label="Select all"
                                />
                            </TableHead>
                            <TableHead className="w-[30px]"></TableHead>
                            <TableHead className="w-[120px]"><Button variant="ghost" onClick={() => requestSort('Transaction Date')} className="px-2">Date <SortIcon columnKey="Transaction Date" /></Button></TableHead>
                            <TableHead><Button variant="ghost" onClick={() => requestSort('Transaction Name')} className="px-2">Transaction <SortIcon columnKey="Transaction Name" /></Button></TableHead>
                            <TableHead><Button variant="ghost" onClick={() => requestSort('Card')} className="px-2">Card <SortIcon columnKey="Card" /></Button></TableHead>
                            {/* --- FIX: Columns reordered --- */}
                            <TableHead className="text-center"><Button variant="ghost" onClick={() => requestSort('rate')} className="px-2">Rate <SortIcon columnKey="rate" /></Button></TableHead>
                            <TableHead className="text-right"><Button variant="ghost" onClick={() => requestSort('Amount')} className="px-2 justify-end">Amount <SortIcon columnKey="Amount" /></Button></TableHead>
                            <TableHead className="text-right"><Button variant="ghost" onClick={() => requestSort('estCashback')} className="px-2 justify-end">Cashback <SortIcon columnKey="estCashback" /></Button></TableHead>
                            <TableHead className="w-[100px] text-center">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactionsToShow.map(tx => {
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
                                        {/* Spacer for alignment where Chevron was */}
                                    </TableCell>
                                    <TableCell>{tx['Transaction Date']}</TableCell>
                                    <TableCell>
                                        <div className="font-medium">{tx['Transaction Name']}</div>
                                        {tx.merchantLookup && <div className="text-xs text-gray-500">{tx.merchantLookup}</div>}
                                    </TableCell>
                                    <TableCell>{card ? <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">{card.name}</Badge> : 'N/A'}</TableCell>
                                    {/* --- FIX: Cells reordered --- */}
                                    <TableCell className="text-center">
                                        <Badge variant="outline" className={cn("font-mono", getRateColor(tx.rate))}>
                                            {(tx.rate * 100).toFixed(1)}%
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">{currency(tx['Amount'])}</TableCell>
                                    <TableCell className="text-right font-medium text-emerald-600">{currency(tx.estCashback)}</TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(tx)}><FilePenLine className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(tx.id, tx['Transaction Name'])}><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        );
    };

    return (
        <Card className="relative">
             {selectedIds.length > 0 && (
                <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between gap-4 p-2 bg-slate-900 text-white rounded-t-xl animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-4 pl-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-white" onClick={() => setSelectedIds([])}>
                            <X className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium">{selectedIds.length} Selected</span>
                    </div>
                    <div className="flex items-center gap-2 pr-2">
                        <Button variant="destructive" size="sm" onClick={handleBulkDeleteAction}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete ({selectedIds.length})
                        </Button>
                    </div>
                </div>
            )}
            <CardHeader>
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
                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input type="search" placeholder="Search..." className="w-full pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        <select value={cardFilter} onChange={(e) => setCardFilter(e.target.value)} className="flex-1 sm:flex-initial h-10 text-sm rounded-md border border-input bg-transparent px-3 py-1 shadow-sm focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer">
                            <option value="all">All Cards</option>
                            {[...allCards].sort((a, b) => a.name.localeCompare(b.name)).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="flex-1 sm:flex-initial h-10 text-sm rounded-md border border-input bg-transparent px-3 py-1 shadow-sm focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer">
                            {categories.map(cat => <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>)}
                        </select>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {renderContent()}
                <div className="mt-6 flex flex-col items-center gap-4">
                    <p className="text-sm text-muted-foreground">
                        Showing <span className="font-semibold text-primary">{transactionsToShow.length}</span> of <span className="font-semibold text-primary">{filteredAndSortedTransactions.length}</span> transactions
                    </p>
                    {visibleCount < filteredAndSortedTransactions.length && (
                        <Button onClick={handleLoadMore} variant="outline">Load More</Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
