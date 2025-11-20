
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
    MoreHorizontal, Loader2
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
    const [isOpen, setIsOpen] = useState(true);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [sortConfig, setSortConfig] = useState({ key: 'Transaction Date', direction: 'descending' });
    const [filters, setFilters] = useState({
        search: '',
        card: 'all',
        status: 'all'
    });

    // Bulk Edit State
    const [isBulkEditDialogOpen, setIsBulkEditDialogOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // --- 1. Logic to Calculate Status ---
    const enrichedTransactions = useMemo(() => {
        return transactions.map(tx => {
            let status = '';
            let statusType = 'neutral'; // neutral, warning, success, info

            // Check conditions
            const hasMcc = !!tx['MCC Code'];
            const hasSummary = !!tx['Card Summary Category'] && tx['Card Summary Category'].length > 0;
            const isMatch = tx['Match']; // Boolean from Notion
            const isAutomated = tx['Automated']; // Boolean from Notion

            if (!hasMcc) {
                status = 'Missing MCC';
                statusType = 'warning';
            } else if (!hasSummary) {
                status = 'Missing Summary';
                statusType = 'warning';
            } else if (!isMatch) {
                status = 'Mismatch';
                statusType = 'error';
            } else if (isAutomated) {
                status = 'Quick Approve';
                statusType = 'success';
            } else {
                status = 'Review Needed'; // Fallback
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
             // Basic status mapping based on the calculated text
             if (filters.status === 'automated') data = data.filter(tx => tx.status === 'Quick Approve');
             if (filters.status === 'missing') data = data.filter(tx => tx.status.includes('Missing'));
             if (filters.status === 'mismatch') data = data.filter(tx => tx.status === 'Mismatch');
        }

        // Sorting
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

    // --- 3. Event Handlers ---

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
        // Only allow approving items that are technically ready
        // Logic: They must have MCC, Summary, Match=true.
        // Ideally, Quick Approve is mostly for "Automated" ones, but user can force it.

        if (txsToApprove.length === 0) return;

        setIsProcessing(true);
        try {
            const ids = txsToApprove.map(t => t.id);
            const res = await fetch('/api/transactions/bulk-approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids })
            });

            if (!res.ok) throw new Error("Approval failed");

            const updatedTxs = await res.json();

            // Remove approved items from the list immediately
            // We do this by calling onRefresh to reload the data from source,
            // OR we can locally optimistically update, but a refresh is safer for sync.
            onRefresh();
            setSelectedIds(new Set()); // Clear selection
            toast.success(`Approved ${updatedTxs.length} transactions.`);

        } catch (error) {
            console.error(error);
            toast.error("Failed to approve transactions.");
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

    if (!isLoading && transactions.length === 0) return null;

    return (
        <div className="border rounded-lg bg-white shadow-sm mb-6 overflow-hidden">
            {/* Header */}
            <div
                className="p-4 bg-orange-50 border-b border-orange-100 flex justify-between items-center cursor-pointer select-none"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <h3 className="font-semibold text-orange-900">
                        Review Needed
                        <Badge variant="secondary" className="ml-2 bg-orange-200 text-orange-800 hover:bg-orange-300">
                            {transactions.length}
                        </Badge>
                    </h3>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
            </div>

            {/* Content */}
            {isOpen && (
                <div className="p-0">
                    {/* Toolbar */}
                    <div className="p-4 border-b bg-white flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                        <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
                            {/* Search */}
                            <div className="relative w-full md:w-48">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search..."
                                    className="pl-8 h-9"
                                    value={filters.search}
                                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                                />
                            </div>

                            {/* Filters */}
                            <Select value={filters.status} onValueChange={(v) => setFilters({...filters, status: v})}>
                                <SelectTrigger className="w-[140px] h-9">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="automated">Quick Approve</SelectItem>
                                    <SelectItem value="missing">Missing Info</SelectItem>
                                    <SelectItem value="mismatch">Mismatch</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
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
                                    >
                                        <Check className="mr-2 h-3.5 w-3.5 text-emerald-600" />
                                        Approve
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setIsBulkEditDialogOpen(true)}
                                        disabled={isProcessing}
                                    >
                                        <FilePenLine className="mr-2 h-3.5 w-3.5" />
                                        Edit
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-destructive hover:text-destructive"
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
                    <div className="overflow-x-auto max-h-[500px]">
                        <Table>
                            <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                                <TableRow>
                                    <TableHead className="w-[40px] text-center">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300"
                                            checked={filteredData.length > 0 && selectedIds.size === filteredData.length}
                                            onChange={handleSelectAll}
                                        />
                                    </TableHead>
                                    <TableHead className="cursor-pointer hover:bg-slate-100" onClick={() => handleSort('Transaction Date')}>
                                        Date {sortConfig.key === 'Transaction Date' && (sortConfig.direction === 'ascending' ? <ArrowUp className="inline h-3 w-3"/> : <ArrowDown className="inline h-3 w-3"/>)}
                                    </TableHead>
                                    <TableHead className="cursor-pointer hover:bg-slate-100" onClick={() => handleSort('Transaction Name')}>
                                        Transaction {sortConfig.key === 'Transaction Name' && (sortConfig.direction === 'ascending' ? <ArrowUp className="inline h-3 w-3"/> : <ArrowDown className="inline h-3 w-3"/>)}
                                    </TableHead>
                                    <TableHead>Details</TableHead>
                                    <TableHead className="text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('Amount')}>
                                        Amount {sortConfig.key === 'Amount' && (sortConfig.direction === 'ascending' ? <ArrowUp className="inline h-3 w-3"/> : <ArrowDown className="inline h-3 w-3"/>)}
                                    </TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                            No transactions match the filters.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredData.map(tx => {
                                        const cardName = tx['Card'] && cards.find(c => c.id === tx['Card'][0])?.name;
                                        const isSelected = selectedIds.has(tx.id);

                                        return (
                                            <TableRow key={tx.id} className={cn("group", isSelected && "bg-slate-50")}>
                                                <TableCell className="text-center">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-gray-300"
                                                        checked={isSelected}
                                                        onChange={() => handleSelectOne(tx.id)}
                                                    />
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                                                    {tx['Transaction Date']}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium text-sm">{tx['Transaction Name']}</div>
                                                </TableCell>
                                                <TableCell className="text-xs space-y-1">
                                                    {cardName && <div className="flex items-center gap-1"><span className="font-semibold text-slate-500">Card:</span> {cardName}</div>}
                                                    {tx['MCC Code'] && <div className="flex items-center gap-1"><span className="font-semibold text-slate-500">MCC:</span> {tx['MCC Code']}</div>}
                                                    {tx['Category'] && <div className="flex items-center gap-1"><span className="font-semibold text-slate-500">Cat:</span> {tx['Category']}</div>}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {currency(tx['Amount'])}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={cn(
                                                        "whitespace-nowrap",
                                                        tx.statusType === 'success' && "bg-emerald-100 text-emerald-800 border-emerald-200",
                                                        tx.statusType === 'warning' && "bg-amber-100 text-amber-800 border-amber-200",
                                                        tx.statusType === 'error' && "bg-red-100 text-red-800 border-red-200",
                                                        tx.statusType === 'info' && "bg-blue-50 text-blue-700 border-blue-200"
                                                    )}>
                                                        {tx.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleQuickApprove([tx])}>
                                                                <Check className="mr-2 h-4 w-4 text-emerald-600" /> Approve
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => onEditTransaction(tx)}>
                                                                <FilePenLine className="mr-2 h-4 w-4" /> Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setSelectedIds(new Set([tx.id]));
                                                                    handleBulkDelete();
                                                                }}
                                                                className="text-destructive"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
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
                    setSelectedIds(new Set()); // Clear selection after edit
                }}
            />
        </div>
    );
}
