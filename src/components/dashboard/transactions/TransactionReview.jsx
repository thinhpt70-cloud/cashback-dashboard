import React, { useState, useMemo } from 'react';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "../../ui/table";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Input } from "../../ui/input";
import {
    Check, Trash2, FilePenLine, ChevronDown, ChevronUp,
    AlertTriangle, ArrowUp, ArrowDown, Search,
    MoreHorizontal, Loader2, Filter, Layers
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

export default function TransactionReview({
    transactions,
    isLoading,
    onRefresh,
    cards,
    categories,
    rules,
    getCurrentCashbackMonthForCard,
    onEditTransaction
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

    const handleQuickApprove = async (txsToApprove) => {
        if (txsToApprove.length === 0) return;

        const ids = txsToApprove.map(t => t.id);

        // CASE 1: Single Transaction (Automatic)
        if (ids.length === 1) {
            setIsProcessing(true);
            try {
                const res = await fetch('/api/transactions/bulk-approve', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids })
                });

                if (!res.ok) throw new Error("Approval failed");

                const updatedTxs = await res.json();
                onRefresh();

                const newSelected = new Set(selectedIds);
                ids.forEach(id => newSelected.delete(id));
                setSelectedIds(newSelected);

                // Check status of single item
                if (updatedTxs && updatedTxs[0] && updatedTxs[0].approvalStatus === 'skipped') {
                    toast.warning(`Renamed only: ${updatedTxs[0].approvalReason}`);
                } else {
                    toast.success(`Approved transaction.`);
                }
            } catch (error) {
                console.error(error);
                toast.error("Failed to approve transaction.");
            } finally {
                setIsProcessing(false);
            }
        }
        // CASE 2: Multiple Transactions (Open Dialog)
        else {
            setIsBulkApproveDialogOpen(true);
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

    if (!isLoading && transactions.length === 0) {
        return (
            <div className="border rounded-lg bg-white dark:bg-slate-950 dark:border-slate-800 shadow-sm mb-6 overflow-hidden transition-colors">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/50 flex justify-between items-center select-none transition-colors">
                    <div className="flex items-center gap-2">
                        <div className="h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                            <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 flex items-center">
                            All caught up! No transactions pending review.
                        </h3>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="border rounded-lg bg-white dark:bg-slate-950 dark:border-slate-800 shadow-sm mb-6 overflow-hidden transition-colors">
            {/* Header */}
            <div
                className="p-4 bg-orange-50 dark:bg-orange-950/30 border-b border-orange-100 dark:border-orange-900/50 flex justify-between items-center cursor-pointer select-none transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-500" />
                    <h3 className="font-semibold text-orange-900 dark:text-orange-100 flex items-center">
                        Review Needed
                        {isLoading ? (
                            <Loader2 className="ml-2 h-4 w-4 animate-spin text-orange-600 dark:text-orange-400" />
                        ) : (
                            <Badge variant="secondary" className="ml-2 bg-orange-200 text-orange-800 dark:bg-orange-900 dark:text-orange-100 hover:bg-orange-300 dark:hover:bg-orange-800">
                                {transactions.length}
                            </Badge>
                        )}
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
                                        onClick={() => handleQuickApprove(filteredData.filter(tx => selectedIds.has(tx.id)))}
                                        disabled={isProcessing}
                                        className="bg-white dark:bg-slate-900 text-emerald-600 hover:text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                                    >
                                        <Check className="mr-2 h-3.5 w-3.5" />
                                        Auto Approve
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

                    {/* Table */}
                    <div className="overflow-x-auto max-h-[600px]">
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
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="h-24 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredData.length === 0 ? (
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
                                                        
                                                        {/* FIX 4: Inline Actions for Desktop */}
                                                        <TableCell className="text-right">
                                                            {/* Mobile View: Dropdown */}
                                                            <div className="md:hidden">
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                            <MoreHorizontal className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end">
                                                                        <DropdownMenuItem onClick={() => handleQuickApprove([tx])}>
                                                                            <Check className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-500" /> Auto Approve
                                                                        </DropdownMenuItem>
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

                                                            {/* Desktop View: Inline Buttons */}
                                                            <div className="hidden md:flex items-center justify-end gap-1">
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                                    onClick={() => handleQuickApprove([tx])}
                                                                    title="Auto Approve"
                                                                    disabled={isProcessing}
                                                                >
                                                                    <Check className="h-4 w-4" />
                                                                </Button>
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