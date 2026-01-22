import React, { useState, useMemo, useEffect } from 'react';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "../../ui/table";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Input } from "../../ui/input";
import { Checkbox } from "../../ui/checkbox";
import {
    Check, Trash2, FilePenLine, ChevronDown, ChevronUp,
    AlertTriangle, ArrowUp, ArrowDown, Search,
    MoreHorizontal, Loader2, Filter, Layers, X, Wand2,
    CreditCard, ArrowUpDown
} from "lucide-react";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from "../../ui/dropdown-menu";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "../../ui/select";
import { cn } from "../../../lib/utils";
import { toast } from 'sonner';
import BulkEditDialog from '../dialogs/BulkEditDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../ui/tooltip";

const TransactionReview = React.memo(({
    transactions,
    isLoading,
    onRefresh,
    cards,
    categories,
    rules,
    getCurrentCashbackMonthForCard,
    onEditTransaction,
    isDesktop,
    mccMap
}) => {
    // FIX 1: Set initial state to false so it does not auto-expand on load
    const [isOpen, setIsOpen] = useState(false);
    
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [sortConfig, setSortConfig] = useState({ key: 'Transaction Date', direction: 'descending' });
    const [filters, setFilters] = useState({
        search: '',
        card: 'all',
        status: 'all'
    });
    // FIX 2 & 3: Grouping State
    const [groupBy, setGroupBy] = useState('date'); // Default to date
    const [sortByValue, setSortByValue] = useState('Newest');

    // Bulk Edit State
    const [isBulkEditDialogOpen, setIsBulkEditDialogOpen] = useState(false);
    // eslint-disable-next-line no-unused-vars
    const [isProcessing, setIsProcessing] = useState(false);

    // NEW: Processing IDs to track individual loading states
    // eslint-disable-next-line no-unused-vars
    const [processingIds, setProcessingIds] = useState(new Set());

    // Sync sortConfig with sortByValue
    useEffect(() => {
        if (sortConfig.key === 'Transaction Date' && sortConfig.direction === 'descending') setSortByValue('Newest');
        else if (sortConfig.key === 'Transaction Date' && sortConfig.direction === 'ascending') setSortByValue('Oldest');
        else if (sortConfig.key === 'Amount' && sortConfig.direction === 'descending') setSortByValue('Amount: High');
        else if (sortConfig.key === 'Amount' && sortConfig.direction === 'ascending') setSortByValue('Amount: Low');
    }, [sortConfig]);

    // --- Helper: Format MCC ---
    const formatMcc = (code) => {
        if (!code) return null;
        const name = mccMap && mccMap[code] ? mccMap[code].vn : null;
        return name ? `${code} - ${name}` : code;
    };

    // --- 1. Logic to Calculate Status ---
    const enrichedTransactions = useMemo(() => {
        return transactions.map(tx => {
            let status = '';
            let statusType = 'neutral'; // neutral, warning, success, info

            // Check conditions
            const hasMcc = !!tx['MCC Code'];
            const hasRule = !!tx['Applicable Rule'] && tx['Applicable Rule'].length > 0;
            const isMatch = tx['Match']; 
            const isAutomated = tx['Automated'];

            if (!hasMcc) {
                status = 'Missing MCC';
                statusType = 'warning';
            } else if (!hasRule) {
                status = 'Missing Rule';
                statusType = 'warning';
            } else if (!isMatch) {
                status = 'Mismatch';
                statusType = 'error';
            } else if (isAutomated) {
                status = 'Quick Approve';
                statusType = 'success';
            } else {
                status = 'Review Needed'; 
                statusType = 'info';
            }

            return {
                ...tx,
                status,
                statusType,
                // ⚡ Bolt Optimization: Pre-calculate lowercased search strings to avoid repetitive ops in filter loop
                _searchName: (tx['Transaction Name'] || '').toLowerCase(),
                _searchAmount: String(tx['Amount'] ?? ''),
                _searchMcc: tx['MCC Code'] ? String(tx['MCC Code']) : ''
            };
        });
    }, [transactions]);

    // --- 2. Filtering & Sorting ---
    const filteredData = useMemo(() => {
        let data = [...enrichedTransactions];

        // Filter by Search
        if (filters.search) {
            const lowerSearch = filters.search.toLowerCase();
            data = data.filter(tx =>
                tx._searchName.includes(lowerSearch) ||
                tx._searchAmount.includes(lowerSearch) ||
                tx._searchMcc.includes(lowerSearch)
            );
        }

        // Filter by Card
        if (filters.card !== 'all') {
            data = data.filter(tx => tx['Card'] && tx['Card'][0] === filters.card);
        }

        // Filter by Status
        if (filters.status !== 'all') {
             if (filters.status === 'automated') data = data.filter(tx => tx.status === 'Quick Approve');
             if (filters.status === 'missing') data = data.filter(tx => tx.status.includes('Missing'));
             if (filters.status === 'mismatch') data = data.filter(tx => tx.status === 'Mismatch');
        }

        // Sorting (Only applies if NOT grouped, or sorts within groups)
        if (sortConfig.key) {
            data.sort((a, b) => {
                const aVal = a[sortConfig.key];
                const bVal = b[sortConfig.key];

                if (aVal < bVal) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }

        return data;
    }, [enrichedTransactions, filters, sortConfig]);

    // --- 3. Grouping Logic ---
    const groupedData = useMemo(() => {
        if (groupBy === 'none') {
            return { 'All Transactions': filteredData };
        }

        const groups = {};
        filteredData.forEach(tx => {
            let key = 'Other';
            
            if (groupBy === 'card') {
                const cardId = tx['Card'] && tx['Card'][0];
                const card = cards.find(c => c.id === cardId);
                key = card ? card.name : 'Unknown Card';
            } else if (groupBy === 'status') {
                key = tx.status;
            } else if (groupBy === 'date') {
                key = tx['Transaction Date'];
            }

            if (!groups[key]) groups[key] = [];
            groups[key].push(tx);
        });

        // Sort keys to make groups appear in order (optional)
        return Object.keys(groups).sort((a, b) => {
             // Check if Sort Key matches Group Key
             let isMatchingSort = false;
             if (groupBy === 'date' && sortConfig.key === 'Transaction Date') isMatchingSort = true;
             else if (groupBy === 'card' && sortConfig.key === 'Card') isMatchingSort = true;
             else if (groupBy === 'category' && sortConfig.key === 'Category') isMatchingSort = true;
             else if (groupBy === 'status' && sortConfig.key === 'Status') isMatchingSort = true;

             if (isMatchingSort) {
                 if (groupBy === 'date') {
                      return sortConfig.direction === 'ascending'
                          ? new Date(a) - new Date(b)
                          : new Date(b) - new Date(a);
                 }
                 return sortConfig.direction === 'ascending'
                    ? a.localeCompare(b)
                    : b.localeCompare(a);
             }

             if (groupBy === 'date') return new Date(b) - new Date(a);
             return a.localeCompare(b);
        }).reduce((obj, key) => {
            obj[key] = groups[key]; 
            return obj;
        }, {});
    }, [filteredData, groupBy, cards, sortConfig]);


    // --- 4. Event Handlers ---

    const handleSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handleSortChange = (val) => {
        setSortByValue(val);
        if (val === 'Newest') setSortConfig({ key: 'Transaction Date', direction: 'descending' });
        else if (val === 'Oldest') setSortConfig({ key: 'Transaction Date', direction: 'ascending' });
        else if (val === 'Amount: High') setSortConfig({ key: 'Amount', direction: 'descending' });
        else if (val === 'Amount: Low') setSortConfig({ key: 'Amount', direction: 'ascending' });
    };

    const handleSelectAll = () => {
        if (selectedIds.size === filteredData.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredData.map(tx => tx.id)));
        }
    };

    const handleSelectOne = (id) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleSingleProcess = async (tx) => {
        const newProcessingIds = new Set(processingIds);
        newProcessingIds.add(tx.id);
        setProcessingIds(newProcessingIds);

        try {
            // STATE 2: QUICK APPROVE (Green Status) -> FINALIZE
            if (tx.status === 'Quick Approve') {
                const res = await fetch('/api/transactions/finalize', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: [tx.id] })
                });
                if (!res.ok) throw new Error("Finalize failed");
                toast.success("Transaction finalized.");
                onRefresh();
            }
        } catch (error) {
            console.error(error);
            toast.error("Process failed.");
        } finally {
            setProcessingIds(prev => {
                const next = new Set(prev);
                next.delete(tx.id);
                return next;
            });
        }
    };

    const handleBulkProcess = async () => {
        const txsToProcess = filteredData.filter(tx => selectedIds.has(tx.id));
        if (txsToProcess.length === 0) return;

        setIsProcessing(true);
        try {
            const quickApproveIds = txsToProcess.filter(tx => tx.status === 'Quick Approve').map(t => t.id);
            let successCount = 0;

            // 1. Process Quick Approves (Finalize)
            if (quickApproveIds.length > 0) {
                await fetch('/api/transactions/finalize', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: quickApproveIds })
                });
                successCount += quickApproveIds.length;
            }

            if (successCount > 0) {
                toast.success(`Processed ${successCount} automated transactions.`);
                onRefresh();
            } else {
                toast.info("No 'Quick Approve' transactions selected.");
            }

        } catch (error) {
            console.error(error);
            toast.error("Bulk process failed.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSingleDelete = async (id) => {
        if (!window.confirm("Delete this transaction?")) return;
        setIsProcessing(true);
        try {
             const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
             if (!res.ok) throw new Error("Delete failed");
             onRefresh();
             const newSelected = new Set(selectedIds);
             newSelected.delete(id);
             setSelectedIds(newSelected);
             toast.success("Transaction deleted.");
        } catch(err) {
            toast.error("Failed to delete.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} transactions?`)) return;

        setIsProcessing(true);
        try {
            const ids = Array.from(selectedIds);
            const res = await fetch('/api/transactions/bulk-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids })
            });

            if (!res.ok) throw new Error("Delete failed");

            onRefresh();
            setSelectedIds(new Set());
            toast.success("Transactions deleted.");

        } catch (error) {
            console.error(error);
            toast.error("Failed to delete transactions.");
        } finally {
            setIsProcessing(false);
        }
    };

    const currency = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

    // 1. Loading State
    if (isLoading) {
        return (
            <div className="border rounded-lg bg-white dark:bg-slate-950 dark:border-slate-800 shadow-sm mb-6 overflow-hidden transition-colors">
                <div className="p-4 bg-white dark:bg-slate-950 flex justify-between items-center select-none transition-colors">
                    <div className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                        <h3 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center">
                            Checking transactions...
                        </h3>
                    </div>
                </div>
            </div>
        );
    }

    // 2. All Caught Up State (No transactions)
    if (transactions.length === 0) {
        return (
            <div className="border rounded-lg bg-white dark:bg-slate-950 dark:border-slate-800 shadow-sm mb-6 overflow-hidden transition-colors">
                <div className="p-4 bg-white dark:bg-slate-950 border-emerald-100 dark:border-emerald-900/50 flex justify-between items-center select-none transition-colors">
                    <div className="flex items-center gap-2">
                        <div className="h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                            <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h3 className="font-semibold text-emerald-950 dark:text-emerald-100 flex items-center">
                            All caught up!
                        </h3>
                    </div>
                </div>
            </div>
        );
    }

    // --- RENDER HELPERS ---

    const renderBulkBar = () => (
         <div className="sticky top-16 z-40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-slate-900 text-white shadow-md rounded-b-xl animate-in fade-in slide-in-from-top-2 mb-4">
            <div className="flex items-center gap-4 pl-1 w-full sm:w-auto">
                <div className="flex items-center gap-2">
                     <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-300 hover:text-white shrink-0"
                        onClick={() => setSelectedIds(new Set())}
                        aria-label="Clear selection"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium whitespace-nowrap">{selectedIds.size} Selected</span>
                </div>
            </div>
            <div className="flex items-center gap-2 pr-2 w-full sm:w-auto justify-end">
                 <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBulkProcess}
                    disabled={isProcessing}
                    className="bg-slate-800 border-slate-700 text-emerald-400 hover:text-emerald-300 hover:bg-slate-700"
                >
                    {isProcessing ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin"/> : <Wand2 className="mr-2 h-3.5 w-3.5" />}
                    Smart Process
                </Button>
                <Button variant="destructive" size="sm" onClick={handleBulkDelete} disabled={isProcessing} className="w-full sm:w-auto">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
            </div>
        </div>
    );

    const renderMobileFilters = () => {
        return (
            <div className="sticky top-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm px-4 py-3 shadow-sm border-b border-slate-100/50 dark:border-slate-800/50">
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 py-1 select-none no-scrollbar">
                    {/* Search */}
                    <div className="relative flex items-center min-w-[140px]">
                        <Search className="absolute left-3 w-3.5 h-3.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={filters.search}
                            onChange={(e) => setFilters({...filters, search: e.target.value})}
                            className="w-full h-[30px] pl-8 pr-3 bg-slate-100 dark:bg-slate-900 rounded-full text-base font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-500 transition-all border-none"
                        />
                        {filters.search && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setFilters({...filters, search: ''})}
                                className="absolute right-2 h-5 w-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 hover:bg-slate-300 dark:hover:bg-slate-700 p-0"
                                aria-label="Clear search"
                            >
                                <X className="w-3 h-3" />
                            </Button>
                        )}
                    </div>

                    {/* Card Filter Pill */}
                    <Select value={filters.card} onValueChange={(v) => setFilters({...filters, card: v})}>
                        <SelectTrigger className="h-[30px] w-auto border-0 p-0 bg-transparent shadow-none focus:ring-0 [&>span]:hidden [&>svg]:hidden">
                             <div className={cn(
                                "flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all border cursor-pointer",
                                filters.card !== 'all'
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm dark:bg-slate-100 dark:text-slate-900'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-800'
                            )}>
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Card</span>
                                {filters.card !== 'all' && (
                                    <>
                                        <span className="opacity-60">|</span>
                                        <span className="font-semibold max-w-[80px] truncate">
                                            {cards.find(c => c.id === filters.card)?.name || 'Selected'}
                                        </span>
                                    </>
                                )}
                                <ChevronDown className={cn("w-3 h-3 opacity-50", filters.card !== 'all' ? 'text-white dark:text-slate-900' : '')} />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Cards</SelectItem>
                            {[...cards].sort((a, b) => a.name.localeCompare(b.name)).map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Status Filter Pill */}
                    <Select value={filters.status} onValueChange={(v) => setFilters({...filters, status: v})}>
                        <SelectTrigger className="h-[30px] w-auto border-0 p-0 bg-transparent shadow-none focus:ring-0 [&>span]:hidden [&>svg]:hidden">
                            <div className={cn(
                                "flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all border cursor-pointer",
                                filters.status !== 'all'
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm dark:bg-slate-100 dark:text-slate-900'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-800'
                            )}>
                                <Filter className="w-3.5 h-3.5" />
                                <span>Status</span>
                                {filters.status !== 'all' && (
                                    <>
                                        <span className="opacity-60">|</span>
                                        <span className="font-semibold max-w-[80px] truncate">
                                            {filters.status === 'automated' ? 'Quick Approve' :
                                             filters.status === 'missing' ? 'Missing Info' :
                                             filters.status === 'mismatch' ? 'Mismatch' : filters.status}
                                        </span>
                                    </>
                                )}
                                <ChevronDown className={cn("w-3 h-3 opacity-50", filters.status !== 'all' ? 'text-white dark:text-slate-900' : '')} />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="automated">Quick Approve</SelectItem>
                            <SelectItem value="missing">Missing Info</SelectItem>
                            <SelectItem value="mismatch">Mismatch</SelectItem>
                        </SelectContent>
                    </Select>

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
                            <SelectItem value="status">Status</SelectItem>
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

    // 3. Review Needed State (Has transactions)
    return (
        <div className={cn(
            "border rounded-lg bg-white dark:bg-slate-950 dark:border-slate-800 shadow-sm mb-6 transition-colors relative",
            // Remove overflow-hidden on mobile when open to allow sticky header to work
            isOpen && !isDesktop ? "" : "overflow-hidden"
        )}>
            {/* Header */}
            <button
                type="button"
                className="w-full p-4 bg-orange-50 dark:bg-orange-950/30 border-b border-orange-100 dark:border-orange-900/50 flex justify-between items-center cursor-pointer select-none transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-controls="review-needed-content"
            >
                <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-500" />
                    <h3 className="font-semibold text-orange-900 dark:text-orange-100 flex items-center">
                        Review Needed
                        <Badge variant="secondary" className="ml-2 bg-orange-200 text-orange-800 dark:bg-orange-900 dark:text-orange-100 hover:bg-orange-300 dark:hover:bg-orange-800">
                            {transactions.length}
                        </Badge>
                    </h3>
                </div>
                <div className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors">
                    {isOpen ? <ChevronUp className="h-4 w-4 text-orange-700 dark:text-orange-300" /> : <ChevronDown className="h-4 w-4 text-orange-700 dark:text-orange-300" />}
                </div>
            </button>

            {/* Content */}
            {isOpen && (
                <div className="p-0" id="review-needed-content">
                    {/* Toolbar (Desktop) */}
                    {isDesktop && (
                        <div className="p-4 border-b dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center transition-colors">
                            <div className="flex flex-wrap gap-2 items-center w-full xl:w-auto">
                                {/* Search */}
                                <div className="relative w-full md:w-48">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search..."
                                        className="pl-8 h-9 bg-white dark:bg-slate-900"
                                        value={filters.search}
                                        onChange={(e) => setFilters({...filters, search: e.target.value})}
                                    />
                                </div>

                                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block"></div>

                                {/* Filter: Card */}
                                <Select value={filters.card} onValueChange={(v) => setFilters({...filters, card: v})}>
                                    <SelectTrigger className="w-[160px] h-9 bg-white dark:bg-slate-900">
                                        <div className="flex items-center gap-2 truncate">
                                            <Filter className="h-3.5 w-3.5 text-muted-foreground"/>
                                            <span className="truncate">{filters.card === 'all' ? 'All Cards' : cards.find(c => c.id === filters.card)?.name || 'Selected'}</span>
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Cards</SelectItem>
                                        {cards.map(card => (
                                            <SelectItem key={card.id} value={card.id}>{card.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Filter: Status */}
                                <Select value={filters.status} onValueChange={(v) => setFilters({...filters, status: v})}>
                                    <SelectTrigger className="w-[180px] h-9 bg-white dark:bg-slate-900">
                                        <div className="flex items-center gap-2">
                                            <Filter className="h-3.5 w-3.5 text-muted-foreground"/>
                                            <SelectValue placeholder="Status" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="automated">Quick Approve</SelectItem>
                                        <SelectItem value="missing">Missing Info</SelectItem>
                                        <SelectItem value="mismatch">Mismatch</SelectItem>
                                    </SelectContent>
                                </Select>

                                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block"></div>

                                {/* Group By */}
                                <Select value={groupBy} onValueChange={setGroupBy}>
                                    <SelectTrigger className="w-[180px] h-9 bg-white dark:bg-slate-900">
                                        <div className="flex items-center gap-2">
                                            <Layers className="h-3.5 w-3.5 text-muted-foreground"/>
                                            <span className="truncate">Group: {groupBy === 'none' ? 'None' : groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}</span>
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No Grouping</SelectItem>
                                        <SelectItem value="card">Group by Card</SelectItem>
                                        <SelectItem value="status">Group by Status</SelectItem>
                                        <SelectItem value="date">Group by Date</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Bulk Actions */}
                            <div className="flex items-center gap-2 w-full xl:w-auto justify-end">
                                {selectedIds.size > 0 && (
                                    <>
                                        <span className="text-sm text-muted-foreground mr-2">
                                            {selectedIds.size} selected
                                        </span>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={handleBulkProcess}
                                            disabled={isProcessing}
                                            className="bg-white dark:bg-slate-900 text-emerald-600 hover:text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                                        >
                                            {isProcessing ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin"/> : <Wand2 className="mr-2 h-3.5 w-3.5" />}
                                            Smart Process
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setIsBulkEditDialogOpen(true)}
                                            disabled={isProcessing}
                                            className="bg-white dark:bg-slate-900"
                                        >
                                            <FilePenLine className="mr-2 h-3.5 w-3.5" />
                                            Edit
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-destructive hover:text-destructive bg-white dark:bg-slate-900 hover:bg-red-50 border-red-200"
                                            onClick={handleBulkDelete}
                                            disabled={isProcessing}
                                        >
                                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                                            Delete
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Mobile Filters */}
                    {!isDesktop && renderMobileFilters()}

                    {/* Mobile Bulk Bar */}
                    {!isDesktop && selectedIds.size > 0 && renderBulkBar()}

                    {/* Table / List View */}
                    <div className="overflow-x-auto max-h-[600px]">
                        {isDesktop ? (
                            <Table>
                                <TableHeader className="bg-slate-50 dark:bg-slate-900 sticky top-0 z-10 shadow-sm transition-colors">
                                    <TableRow className="hover:bg-slate-50 dark:hover:bg-slate-900 border-b-slate-200 dark:border-b-slate-800">
                                        <TableHead className="w-[40px] text-center">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:checked:bg-primary"
                                                checked={filteredData.length > 0 && selectedIds.size === filteredData.length}
                                                onChange={handleSelectAll}
                                            />
                                        </TableHead>
                                        <TableHead className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('Transaction Date')}>
                                            Date {sortConfig.key === 'Transaction Date' && (sortConfig.direction === 'ascending' ? <ArrowUp className="inline h-3 w-3"/> : <ArrowDown className="inline h-3 w-3"/>)}
                                        </TableHead>
                                        <TableHead className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('Transaction Name')}>
                                            Transaction {sortConfig.key === 'Transaction Name' && (sortConfig.direction === 'ascending' ? <ArrowUp className="inline h-3 w-3"/> : <ArrowDown className="inline h-3 w-3"/>)}
                                        </TableHead>
                                        <TableHead>Details</TableHead>
                                        <TableHead className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('Category')}>
                                            Category {sortConfig.key === 'Category' && (sortConfig.direction === 'ascending' ? <ArrowUp className="inline h-3 w-3"/> : <ArrowDown className="inline h-3 w-3"/>)}
                                        </TableHead>
                                        <TableHead>Cashback Rule</TableHead>
                                        <TableHead className="text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('Amount')}>
                                            Amount {sortConfig.key === 'Amount' && (sortConfig.direction === 'ascending' ? <ArrowUp className="inline h-3 w-3"/> : <ArrowDown className="inline h-3 w-3"/>)}
                                        </TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredData.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                                                No transactions match the filters.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        Object.entries(groupedData).map(([groupKey, groupTxs]) => (
                                            <React.Fragment key={groupKey}>
                                                {/* Group Header */}
                                                {groupBy !== 'none' && (
                                                    <TableRow className="bg-slate-100/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-900">
                                                        <TableCell colSpan={9} className="py-2 px-4 font-semibold text-xs uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                                                            {groupKey} <span className="ml-1 text-slate-400 font-normal">({groupTxs.length})</span>
                                                        </TableCell>
                                                    </TableRow>
                                                )}

                                                {/* Transactions in Group */}
                                                {groupTxs.map(tx => {
                                                    const cardName = tx['Card'] && cards.find(c => c.id === tx['Card'][0])?.name;
                                                    const ruleName = tx['Applicable Rule'] && rules.find(r => r.id === tx['Applicable Rule'][0])?.ruleName;
                                                    const isSelected = selectedIds.has(tx.id);

                                                    return (
                                                        <TableRow key={tx.id} className={cn("group transition-colors dark:border-slate-800", isSelected && "bg-slate-50 dark:bg-slate-900")}>
                                                            <TableCell className="text-center">
                                                                <input
                                                                    type="checkbox"
                                                                    className="rounded border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:checked:bg-primary"
                                                                    checked={isSelected}
                                                                    onChange={() => handleSelectOne(tx.id)}
                                                                />
                                                            </TableCell>
                                                            <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                                                                {tx['Transaction Date']}
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="font-medium text-sm dark:text-slate-200">{tx['Transaction Name']}</div>
                                                            </TableCell>
                                                            <TableCell className="text-xs space-y-1">
                                                                {cardName && <div className="flex items-center gap-1"><span className="font-semibold text-slate-500 dark:text-slate-400">Card:</span> <span className="dark:text-slate-300">{cardName}</span></div>}
                                                                {tx['MCC Code'] && <div className="flex items-center gap-1"><span className="font-semibold text-slate-500 dark:text-slate-400">MCC:</span> <span className="dark:text-slate-300">{tx['MCC Code']}</span></div>}
                                                            </TableCell>
                                                            <TableCell className="text-sm">
                                                                {tx['Category'] ? (
                                                                    <Badge variant="secondary" className="font-normal bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200">
                                                                        {tx['Category']}
                                                                    </Badge>
                                                                ) : (
                                                                    <span className="text-xs text-muted-foreground italic">Uncategorized</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-sm">
                                                                {ruleName ? (
                                                                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors border-transparent bg-slate-100 text-slate-900 hover:bg-slate-200/80 dark:bg-slate-800 dark:text-slate-50">
                                                                        {ruleName}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-xs text-muted-foreground italic">None</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-right font-medium dark:text-slate-200">
                                                                {currency(tx['Amount'])}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline" className={cn(
                                                                    "whitespace-nowrap",
                                                                    tx.statusType === 'success' && "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900",
                                                                    tx.statusType === 'warning' && "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900",
                                                                    tx.statusType === 'error' && "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900",
                                                                    tx.statusType === 'info' && "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900"
                                                                )}>
                                                                    {tx.status}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex items-center justify-end gap-1">
                                                                    {tx.status === 'Quick Approve' && (
                                                                        <TooltipProvider>
                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="icon"
                                                                                        aria-label="Quick Approve"
                                                                                        className="h-8 w-8 transition-colors text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                                                        onClick={() => handleSingleProcess(tx)}
                                                                                        disabled={processingIds.has(tx.id)}
                                                                                    >
                                                                                        {processingIds.has(tx.id) ? (
                                                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                                                        ) : (
                                                                                            <Check className="h-4 w-4" />
                                                                                        )}
                                                                                    </Button>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent>
                                                                                    Quick Approve
                                                                                </TooltipContent>
                                                                            </Tooltip>
                                                                        </TooltipProvider>
                                                                    )}

                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-slate-500 hover:text-slate-700"
                                                                        onClick={() => onEditTransaction(tx)}
                                                                        title="Edit"
                                                                        disabled={isProcessing}
                                                                    >
                                                                        <FilePenLine className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                                                                        onClick={() => handleSingleDelete(tx.id)}
                                                                        title="Delete"
                                                                        disabled={isProcessing}
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
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
                        ) : (
                            /* Mobile List View */
                            <div className="flex flex-col gap-2 p-2">
                                {filteredData.length === 0 ? (
                                    <div className="p-4 text-center text-muted-foreground border rounded-lg">
                                        No transactions match the filters.
                                    </div>
                                ) : (
                                    Object.entries(groupedData).map(([groupKey, groupTxs]) => (
                                        <React.Fragment key={groupKey}>
                                            {groupBy !== 'none' && (
                                                <div className="py-2 px-2 font-semibold text-xs uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                                                    {groupKey} <span className="ml-1 text-slate-400 font-normal">({groupTxs.length})</span>
                                                </div>
                                            )}
                                            {groupTxs.map(tx => {
                                                const cardName = tx['Card'] && cards.find(c => c.id === tx['Card'][0])?.name;
                                                const ruleName = tx['Applicable Rule'] && rules.find(r => r.id === tx['Applicable Rule'][0])?.ruleName;
                                                const isSelected = selectedIds.has(tx.id);
                                                const formattedMcc = formatMcc(tx['MCC Code']);

                                                return (
                                                    <div
                                                        key={tx.id}
                                                        className={cn(
                                                            "border rounded-lg p-3 bg-white dark:bg-slate-900 shadow-sm transition-colors",
                                                            isSelected ? "border-primary bg-primary/5 dark:bg-primary/10" : "dark:border-slate-800"
                                                        )}
                                                    >
                                                        {/* Row 1: Checkbox & Name */}
                                                        <div className="flex gap-3 items-start">
                                                             <div className="pt-1">
                                                                <Checkbox
                                                                    checked={isSelected}
                                                                    onCheckedChange={() => handleSelectOne(tx.id)}
                                                                    aria-label={`Select ${tx['Transaction Name']}`}
                                                                />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex justify-between items-start gap-2">
                                                                    <div className="flex-col overflow-hidden">
                                                                        <p className="font-semibold text-sm truncate">{tx['Transaction Name']}</p>
                                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                                                            <span>{tx['Transaction Date']}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right flex-shrink-0">
                                                                        <p className="font-bold text-sm">{currency(tx['Amount'])}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Row 2: Details Chips */}
                                                        <div className="flex flex-wrap gap-1.5 mt-3 ml-7">
                                                            {cardName && (
                                                                <Badge variant="outline" className="text-[10px] px-1.5 h-5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-normal">
                                                                    {cardName}
                                                                </Badge>
                                                            )}
                                                            {formattedMcc && (
                                                                <Badge variant="outline" className="text-[10px] px-1.5 h-5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-normal max-w-[150px] truncate block">
                                                                    {formattedMcc}
                                                                </Badge>
                                                            )}
                                                            {tx['Category'] && (
                                                                <Badge variant="secondary" className="text-[10px] px-1.5 h-5 font-normal">
                                                                    {tx['Category']}
                                                                </Badge>
                                                            )}
                                                             {ruleName && (
                                                                <Badge variant="outline" className="text-[10px] px-1.5 h-5 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 font-normal">
                                                                    {ruleName}
                                                                </Badge>
                                                            )}
                                                        </div>

                                                        {/* Row 3: Status & Actions */}
                                                        <div className="flex justify-between items-center mt-3 ml-7 border-t pt-2 dark:border-slate-800">
                                                            <Badge variant="outline" className={cn(
                                                                "text-[10px] px-2 h-5 whitespace-nowrap",
                                                                tx.statusType === 'success' && "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900",
                                                                tx.statusType === 'warning' && "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900",
                                                                tx.statusType === 'error' && "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900",
                                                                tx.statusType === 'info' && "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900"
                                                            )}>
                                                                {tx.status}
                                                            </Badge>

                                                            <div className="flex items-center gap-2">
                                                                 <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className={cn(
                                                                        "h-7 px-3 text-xs border transition-colors",
                                                                        tx.status === 'Quick Approve'
                                                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950 dark:border-emerald-900 dark:text-emerald-400"
                                                                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400"
                                                                    )}
                                                                    onClick={() => tx.status === 'Quick Approve' ? handleSingleProcess(tx) : onEditTransaction(tx)}
                                                                    disabled={processingIds.has(tx.id)}
                                                                >
                                                                    {processingIds.has(tx.id) ? (
                                                                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                                                    ) : tx.status === 'Quick Approve' ? (
                                                                        <Check className="mr-2 h-3 w-3" />
                                                                    ) : (
                                                                        <FilePenLine className="mr-2 h-3 w-3" />
                                                                    )}
                                                                    {tx.status === 'Quick Approve' ? "Approve" : "Edit"}
                                                                </Button>
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="More options">
                                                                            <MoreHorizontal className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end">
                                                                        <DropdownMenuItem onClick={() => onEditTransaction(tx)}>
                                                                            <FilePenLine className="mr-2 h-4 w-4" /> Edit
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuSeparator />
                                                                        <DropdownMenuItem
                                                                            onClick={() => handleSingleDelete(tx.id)}
                                                                            className="text-destructive"
                                                                        >
                                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </React.Fragment>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Bulk Edit Dialog */}
            <BulkEditDialog
                isOpen={isBulkEditDialogOpen}
                onClose={() => setIsBulkEditDialogOpen(false)}
                selectedIds={Array.from(selectedIds)}
                allTransactions={transactions}
                categories={categories}
                cards={cards}
                rules={rules}
                mccMap={mccMap}
                getCurrentCashbackMonthForCard={getCurrentCashbackMonthForCard}
                onUpdateComplete={() => {
                    onRefresh();
                    setSelectedIds(new Set());
                }}
            />
        </div>
    );
});

TransactionReview.displayName = "TransactionReview";

export default TransactionReview;