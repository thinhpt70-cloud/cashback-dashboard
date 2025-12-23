import React, { useState, useMemo } from 'react';
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
    MoreHorizontal, Loader2, Filter, Layers, X, Wand2
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
import BulkApproveDialog from '../../dashboard/dialogs/BulkApproveDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../ui/tooltip";

export default function TransactionReview({
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
}) {
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
    const [groupBy, setGroupBy] = useState('none'); // 'none', 'card', 'status', 'date'

    // Bulk Edit State
    const [isBulkEditDialogOpen, setIsBulkEditDialogOpen] = useState(false);
    const [isBulkApproveDialogOpen, setIsBulkApproveDialogOpen] = useState(false); // New state
    const [isProcessing, setIsProcessing] = useState(false);

    // NEW: Processing IDs to track individual loading states
    const [processingIds, setProcessingIds] = useState(new Set());
    // NEW: Manual Review Needed IDs
    const [manualReviewIds, setManualReviewIds] = useState(new Set());

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

            return { ...tx, status, statusType };
        });
    }, [transactions]);

    // --- 2. Filtering & Sorting ---
    const filteredData = useMemo(() => {
        let data = [...enrichedTransactions];

        // Filter by Search
        if (filters.search) {
            const lowerSearch = filters.search.toLowerCase();
            data = data.filter(tx =>
                tx['Transaction Name'].toLowerCase().includes(lowerSearch) ||
                String(tx['Amount']).includes(lowerSearch) ||
                (tx['MCC Code'] && String(tx['MCC Code']).includes(lowerSearch))
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
        return Object.keys(groups).sort().reduce((obj, key) => { 
            obj[key] = groups[key]; 
            return obj;
        }, {});
    }, [filteredData, groupBy, cards]);


    // --- 4. Event Handlers ---

    const handleSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
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
        // STATE 1: ALREADY FAILED SMART MATCH -> OPEN DIALOG
        if (manualReviewIds.has(tx.id)) {
            onEditTransaction(tx);
            return;
        }

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
            // STATE 3: REVIEW NEEDED -> SMART SEARCH
            else {
                const res = await fetch('/api/transactions/analyze-approval', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: [tx.id] })
                });
                if (!res.ok) throw new Error("Analysis failed");
                const analysis = await res.json();
                const result = analysis[0];

                if (result.status === 'approved') {
                    // APPLY THE MATCH
                    const applyRes = await fetch('/api/transactions/bulk-approve', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ items: [{ id: result.id, updates: result.updates }] })
                    });
                    if (!applyRes.ok) throw new Error("Apply failed");
                    toast.success("Match found and applied.");
                    onRefresh();
                } else {
                    // NO MATCH FOUND
                    setManualReviewIds(prev => new Set(prev).add(tx.id));
                    toast.info("No smart match found. Click again to edit manually.");
                }
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
            const otherIds = txsToProcess.filter(tx => tx.status !== 'Quick Approve').map(t => t.id);
            let successCount = 0;
            const newManualIds = new Set(manualReviewIds);

            // 1. Process Quick Approves (Finalize)
            if (quickApproveIds.length > 0) {
                await fetch('/api/transactions/finalize', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: quickApproveIds })
                });
                successCount += quickApproveIds.length;
            }

            // 2. Process Others (Analyze -> Apply if matched)
            if (otherIds.length > 0) {
                const res = await fetch('/api/transactions/analyze-approval', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: otherIds })
                });
                const analysis = await res.json();

                const toApply = analysis.filter(a => a.status === 'approved');
                const toReview = analysis.filter(a => a.status !== 'approved');

                if (toApply.length > 0) {
                     await fetch('/api/transactions/bulk-approve', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ items: toApply.map(a => ({ id: a.id, updates: a.updates })) })
                    });
                    successCount += toApply.length;
                }

                // Add failed ones to manual review list
                toReview.forEach(a => newManualIds.add(a.id));
            }

            toast.success(`Processed ${txsToProcess.length} items: ${successCount} finalized, ${txsToProcess.length - successCount} require manual review.`);

            setManualReviewIds(newManualIds);
            onRefresh();
            // Deselect successfully processed ones, keep failed ones selected
            // We can assume successCount corresponds to those removed from the list by onRefresh (eventually),
            // but for immediate UI feedback we reset selection or let the user see the remaining ones.
            // Let's keep the failed ones selected to help user find them.
            // The ones that were finalized/applied will disappear from 'filteredData' after refresh.

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
                     <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-white shrink-0" onClick={() => setSelectedIds(new Set())}>
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

    // 3. Review Needed State (Has transactions)
    return (
        <div className="border rounded-lg bg-white dark:bg-slate-950 dark:border-slate-800 shadow-sm mb-6 overflow-hidden transition-colors relative">
            {/* Header */}
            <div
                className="p-4 bg-orange-50 dark:bg-orange-950/30 border-b border-orange-100 dark:border-orange-900/50 flex justify-between items-center cursor-pointer select-none transition-colors"
                onClick={() => setIsOpen(!isOpen)}
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
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-orange-100 dark:hover:bg-orange-900/50">
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
            </div>

            {/* Content */}
            {isOpen && (
                <div className="p-0">
                    {/* Toolbar */}
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

                            {/* Filter: Card (Added) */}
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

                            {/* Group By (Added) */}
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

                        {/* Bulk Actions (Desktop Only - Mobile has sticky bar) */}
                        {isDesktop && (
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
                        )}
                    </div>

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
                                                                    <TooltipProvider>
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    aria-label={tx.status === 'Quick Approve' ? "Quick Approve" : manualReviewIds.has(tx.id) ? "Edit Manually" : "Smart Search"}
                                                                                    className={cn(
                                                                                        "h-8 w-8 transition-colors",
                                                                                        tx.status === 'Quick Approve' ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" :
                                                                                        (manualReviewIds.has(tx.id) ? "text-orange-500 hover:text-orange-600 hover:bg-orange-50" : "text-blue-500 hover:text-blue-600 hover:bg-blue-50")
                                                                                    )}
                                                                                    onClick={() => handleSingleProcess(tx)}
                                                                                    disabled={processingIds.has(tx.id)}
                                                                                >
                                                                                    {processingIds.has(tx.id) ? (
                                                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                                                    ) : tx.status === 'Quick Approve' ? (
                                                                                        <Check className="h-4 w-4" />
                                                                                    ) : manualReviewIds.has(tx.id) ? (
                                                                                        <FilePenLine className="h-4 w-4" />
                                                                                    ) : (
                                                                                        <Wand2 className="h-4 w-4" />
                                                                                    )}
                                                                                </Button>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>
                                                                                {tx.status === 'Quick Approve' ? "Quick Approve" : manualReviewIds.has(tx.id) ? "Edit Manually" : "Smart Search"}
                                                                            </TooltipContent>
                                                                        </Tooltip>
                                                                    </TooltipProvider>

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
                                                                            : (manualReviewIds.has(tx.id)
                                                                                ? "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 dark:bg-orange-950 dark:border-orange-900 dark:text-orange-400"
                                                                                : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-950 dark:border-blue-900 dark:text-blue-400")
                                                                    )}
                                                                    onClick={() => handleSingleProcess(tx)}
                                                                    disabled={processingIds.has(tx.id)}
                                                                >
                                                                    {processingIds.has(tx.id) ? (
                                                                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                                                    ) : tx.status === 'Quick Approve' ? (
                                                                        <Check className="mr-2 h-3 w-3" />
                                                                    ) : manualReviewIds.has(tx.id) ? (
                                                                        <FilePenLine className="mr-2 h-3 w-3" />
                                                                    ) : (
                                                                        <Wand2 className="mr-2 h-3 w-3" />
                                                                    )}
                                                                    {tx.status === 'Quick Approve' ? "Approve" : manualReviewIds.has(tx.id) ? "Edit" : "Check"}
                                                                </Button>
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" size="icon" className="h-7 w-7">
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
                getCurrentCashbackMonthForCard={getCurrentCashbackMonthForCard}
                onUpdateComplete={() => {
                    onRefresh();
                    setSelectedIds(new Set());
                }}
            />

            {/* Bulk Approve Dialog */}
            <BulkApproveDialog
                isOpen={isBulkApproveDialogOpen}
                onClose={() => setIsBulkApproveDialogOpen(false)}
                selectedIds={Array.from(selectedIds)}
                onApproveComplete={() => {
                    onRefresh();
                    setSelectedIds(new Set());
                }}
            />
        </div>
    );
}