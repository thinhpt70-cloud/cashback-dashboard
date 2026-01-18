import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
    ChevronsUpDown,
    ArrowUp,
    ArrowDown,
    Trash2,
    Search,
    X,
    Filter,
    Layers,
    Settings2,
    CreditCard,
    ArrowUpDown,
    ChevronDown,
    Inbox
} from "lucide-react";

import { cn } from "../../../lib/utils";
import { formatDate } from "../../../lib/date";
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
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "../../ui/dropdown-menu";
import MobileTransactionItem from "../../shared/MobileTransactionItem";
import MethodIndicator from "../../shared/MethodIndicator";
import TransactionRow from "./TransactionRow";
import useDebounce from "../../../hooks/useDebounce";

// Moved currency function outside to be stable
const currency = (n) => (n || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

const TransactionsList = React.memo(({
    transactions,
    isLoading,
    activeMonth,
    cardMap,
    rules = [],
    mccNameFn,
    allCards,
    filterType,
    onFilterTypeChange,
    statementMonths,
    isDesktop,
    onTransactionDeleted,
    onEditTransaction,
    onDuplicateTransaction,
    onBulkDelete,
    onViewDetails = () => {},
    fmtYMShortFn,
    isServerSide = false,
    onLoadMore,
    hasMore = false,
    onSearch
}) => {
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const [cardFilter, setCardFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [methodFilter, setMethodFilter] = useState("all");
    const [visibleCount, setVisibleCount] = useState(15);
    const [sortConfig, setSortConfig] = useState({ key: 'Transaction Date', direction: 'descending' });
    const [selectedIds, setSelectedIds] = useState([]);
    const [groupBy, setGroupBy] = useState("date");
    const [sortByValue, setSortByValue] = useState('Newest');

    // ------------------------------------------------------------------
    // 1. Column Configuration
    // ------------------------------------------------------------------
    const ruleMap = useMemo(() => {
        if (!rules) return new Map();
        return new Map(rules.map(r => [r.id, r]));
    }, [rules]);

    const getRateColor = (r) => {
        const ratePercent = r * 100;
        if (ratePercent >= 5) return "bg-emerald-100 text-emerald-800 border-emerald-200";
        if (ratePercent >= 2) return "bg-sky-100 text-sky-800 border-sky-200";
        if (ratePercent > 0) return "bg-slate-100 text-slate-700 border-slate-200";
        return "bg-gray-100 text-gray-500 border-gray-200";
    };

    const columnsConfig = useMemo(() => [
        {
            id: 'date',
            label: 'Date',
            sortKey: 'Transaction Date',
            defaultVisible: true,
            width: 'w-[120px]',
            renderCell: (tx) => formatDate(tx.effectiveDate)
        },
        {
            id: 'name',
            label: 'Transaction Name',
            sortKey: 'Transaction Name',
            defaultVisible: true,
            renderCell: (tx) => (
                <div className="flex items-center gap-2">
                    <MethodIndicator method={tx['Method']} />
                    <div>
                        <div className="font-medium">{tx['Transaction Name']}</div>
                        {tx.merchantLookup && <div className="text-xs text-gray-500">{tx.merchantLookup}</div>}
                    </div>
                </div>
            )
        },
        {
            id: 'amount',
            label: 'Amount',
            sortKey: 'Amount',
            defaultVisible: true,
            headerClass: "text-right",
            cellClass: "text-right",
            renderCell: (tx) => currency(tx['Amount'])
        },
        {
            id: 'estCashback',
            label: 'Est. Cashback',
            sortKey: 'estCashback',
            defaultVisible: true,
            headerClass: "text-right",
            cellClass: "text-right font-medium text-emerald-600",
            renderCell: (tx) => currency(tx.estCashback)
        },
        {
            id: 'card',
            label: 'Card Name',
            sortKey: 'Card',
            defaultVisible: true,
            renderCell: (tx) => {
                const card = tx['Card'] ? cardMap.get(tx['Card'][0]) : null;
                return card ? <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">{card.name}</Badge> : 'N/A';
            }
        },
        {
            id: 'category',
            label: 'Category',
            sortKey: 'Category',
            defaultVisible: false,
            renderCell: (tx) => tx['Category'] || ''
        },
        {
            id: 'rule',
            label: 'Applicable Rule',
            defaultVisible: false,
            renderCell: (tx) => {
                const ruleId = tx['Applicable Rule'] && tx['Applicable Rule'][0];
                const rule = ruleId ? ruleMap.get(ruleId) : null;
                const ruleName = rule ? (rule.ruleName || rule.name) : (ruleId ? ruleId.slice(0, 8) + '...' : '');
                return <span className="text-xs text-slate-600">{ruleName}</span>;
            }
        },
        {
            id: 'mcc',
            label: 'MCC Code',
            defaultVisible: false,
            renderCell: (tx) => tx['MCC Code'] ? `${tx['MCC Code']} - ${mccNameFn ? mccNameFn(tx['MCC Code']) : ''}` : ''
        },
        {
            id: 'notes',
            label: 'Notes',
            defaultVisible: false,
            renderCell: (tx) => tx['Notes'] || ''
        },
        {
            id: 'rate',
            label: 'Cashback Rate',
            sortKey: 'rate',
            defaultVisible: true,
            headerClass: "text-center",
            cellClass: "text-center",
            renderCell: (tx) => (
                <Badge variant="outline" className={cn("font-mono", getRateColor(tx.rate))}>
                    {(tx.rate * 100).toFixed(1)}%
                </Badge>
            )
        },
        {
            id: 'paidFor',
            label: 'Paid for',
            sortKey: 'Paid for',
            defaultVisible: false,
            renderCell: (tx) => tx.paidFor ? <Badge variant="secondary">{tx.paidFor}</Badge> : ''
        },
        {
            id: 'method',
            label: 'Method',
            sortKey: 'Method',
            defaultVisible: false,
            renderCell: (tx) => tx['Method'] && (
                <Badge variant="outline" className={cn(
                    "font-mono font-normal",
                    tx['Method'] === 'International' && "bg-orange-100 text-orange-800 border-orange-200",
                    tx['Method'] === 'POS' && "bg-blue-100 text-blue-800 border-blue-200",
                    tx['Method'] === 'eCom' && "bg-green-100 text-green-800 border-green-200",
                    !['International', 'POS', 'eCom'].includes(tx['Method']) && "bg-slate-100 text-slate-700 border-slate-200"
                )}>
                    {tx['Method']}
                </Badge>
            )
        }
    ], [cardMap, ruleMap, mccNameFn]);

    // Initialize visibility state based on config defaults
    const [visibleColumnIds, setVisibleColumnIds] = useState(() => {
        // We can't access columnsConfig here directly in initial render if it depends on props/memos
        // But we can recreate the initial state logic or use an effect.
        // Hardcoding defaults here to match the config above for simplicity and stability.
        return ['date', 'name', 'amount', 'estCashback', 'card', 'rate'];
    });

    const activeColumns = useMemo(() => {
        return columnsConfig.filter(col => visibleColumnIds.includes(col.id));
    }, [columnsConfig, visibleColumnIds]);

    // ------------------------------------------------------------------
    // Existing Logic (Sorting, Filtering, Grouping)
    // ------------------------------------------------------------------

    // Server-side Search Trigger
    useEffect(() => {
        if (isServerSide && onSearch) {
            onSearch(debouncedSearchTerm);
        }
    }, [debouncedSearchTerm, isServerSide, onSearch]);

    useEffect(() => {
        setSelectedIds([]);
    }, [activeMonth, filterType]);

    useEffect(() => {
        if (sortConfig.key === 'Transaction Date' && sortConfig.direction === 'descending') setSortByValue('Newest');
        else if (sortConfig.key === 'Transaction Date' && sortConfig.direction === 'ascending') setSortByValue('Oldest');
        else if (sortConfig.key === 'Amount' && sortConfig.direction === 'descending') setSortByValue('Amount: High');
        else if (sortConfig.key === 'Amount' && sortConfig.direction === 'ascending') setSortByValue('Amount: Low');
        else setSortByValue('Custom');
    }, [sortConfig]);

    const categories = useMemo(() => {
        const uniqueCategories = Array.from(new Set(transactions.map(tx => tx['Category']).filter(Boolean)));
        uniqueCategories.sort((a, b) => a.localeCompare(b));
        return ["all", ...uniqueCategories];
    }, [transactions]);

    const enrichedTransactions = useMemo(() => {
        return transactions.map(tx => {
            // Priority: Billing Date > Transaction Date
            const effectiveDate = tx['billingDate'] || tx['Transaction Date'];

            // ⚡ Bolt Optimization: Pre-calculate date timestamp for faster sorting
            const dateStr = effectiveDate;
            const timestamp = dateStr ? new Date(dateStr).getTime() : 0;

            return {
                ...tx,
                effectiveDate,
                rate: (tx['Amount'] && tx['Amount'] > 0) ? (tx.estCashback / tx['Amount']) : 0,
                // ⚡ Bolt Optimization: Pre-calculate lowercased search strings to avoid repeated ops in filter loop
                _searchName: (tx['Transaction Name'] || '').toLowerCase(),
                _searchMerchant: (tx.merchantLookup || '').toLowerCase(),
                _searchAmount: String(tx['Amount'] ?? ''),
                _searchDate: dateStr || '',
                _searchMcc: String(tx['MCC Code'] ?? ''),
                _dateTimestamp: isNaN(timestamp) ? 0 : timestamp
            };
        });
    }, [transactions]);

    // ⚡ Bolt Optimization: Sort FIRST, then Filter.
    // This ensures that when the user types in the search box (high frequency), we only run O(N) filter,
    // and do NOT re-run O(N log N) sort. The sorted order is preserved by filter.
    const sortedTransactions = useMemo(() => {
        let items = [...enrichedTransactions];

        if (sortConfig.key !== null) {
            items.sort((a, b) => {
                // ⚡ Bolt Optimization: Use pre-calculated timestamp for Date sorting
                if (sortConfig.key === 'Transaction Date') {
                    const aTime = a._dateTimestamp;
                    const bTime = b._dateTimestamp;
                    return sortConfig.direction === 'ascending' ? aTime - bTime : bTime - aTime;
                }

                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;

                if (typeof aValue === 'number' && typeof bValue === 'number') {
                    return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
                }

                return sortConfig.direction === 'ascending'
                    ? String(aValue).localeCompare(String(bValue))
                    : String(bValue).localeCompare(String(aValue));
            });
        }
        return items;
    }, [enrichedTransactions, sortConfig]);

    const filteredData = useMemo(() => {
        // Start with the ALREADY SORTED list
        let items = sortedTransactions;

        // ⚡ Bolt Optimization: Hoist toLowerCase out of loop and use pre-calculated fields
        // Skip client-side text filtering if server-side search is active
        if (!isServerSide && searchTerm) {
            const lowerCaseSearch = searchTerm.toLowerCase();
            items = items.filter(tx =>
                tx._searchName.includes(lowerCaseSearch) ||
                tx._searchMerchant.includes(lowerCaseSearch) ||
                tx._searchAmount.includes(lowerCaseSearch) ||
                tx._searchDate.includes(lowerCaseSearch) ||
                tx._searchMcc.includes(lowerCaseSearch)
            );
        }

        items = items
        .filter(tx => cardFilter === "all" || (tx['Card'] && tx['Card'][0] === cardFilter))
        .filter(tx => categoryFilter === "all" || tx['Category'] === categoryFilter)
        .filter(tx => methodFilter === "all" || tx['Method'] === methodFilter);

        // No need to sort here! 'items' retains the order from 'sortedTransactions'.
        return items;
    }, [sortedTransactions, searchTerm, cardFilter, categoryFilter, methodFilter, isServerSide]);

    useEffect(() => {
        if (!isServerSide) {
            setVisibleCount(15);
        } else {
            // For server-side, we always want to show all loaded items
            // But we need to update it when filteredData changes (e.g. new page loaded)
            setVisibleCount(filteredData.length > 0 ? 10000 : 15); // Use a large number or length
        }
    }, [filteredData, isServerSide]);

    const groupedData = useMemo(() => {
        // New Logic: Group all filtered data first.
        if (groupBy === 'none') {
            return { 'All Transactions': filteredData };
        }

        const groups = {};
        // Group everything (not just slice)
        filteredData.forEach(tx => {
            let key = 'Other';
            if (groupBy === 'card') {
                const cardId = tx['Card'] && tx['Card'][0];
                const card = cardMap.get(cardId);
                key = card ? card.name : 'Unknown Card';
            } else if (groupBy === 'category') {
                key = tx['Category'] || 'Uncategorized';
            } else if (groupBy === 'date') {
                key = formatDate(tx.effectiveDate) || 'No Date';
            }

            if (!groups[key]) groups[key] = [];
            groups[key].push(tx);
        });

        // Determine if current sort matches group key
        let isMatchingSort = false;
        if (groupBy === 'date' && sortConfig.key === 'Transaction Date') isMatchingSort = true;
        else if (groupBy === 'card' && sortConfig.key === 'Card') isMatchingSort = true;
        else if (groupBy === 'category' && sortConfig.key === 'Category') isMatchingSort = true;

        const sortedKeys = Object.keys(groups).sort((a, b) => {
            if (isMatchingSort) {
                // If keys match, strict adherence to sortConfig.direction
                if (groupBy === 'date') {
                    const dateA = groups[a][0].effectiveDate;
                    const dateB = groups[b][0].effectiveDate;
                    return sortConfig.direction === 'ascending'
                        ? new Date(dateA) - new Date(dateB)
                        : new Date(dateB) - new Date(dateA);
                }

                return sortConfig.direction === 'ascending'
                    ? a.localeCompare(b)
                    : b.localeCompare(a);
            }

            // Default fallback sorting for groups if not matching active sort
             if (groupBy === 'date') {
                 // Date Descending default
                 const dateA = groups[a][0].effectiveDate;
                 const dateB = groups[b][0].effectiveDate;
                 return new Date(dateB) - new Date(dateA);
             }
             // Alphabetical Ascending default
             return a.localeCompare(b);
        });

        return sortedKeys.reduce((obj, key) => {
            obj[key] = groups[key];
            return obj;
        }, {});

    }, [filteredData, groupBy, cardMap, sortConfig]);

    // Flatten the grouped data for rendering and pagination
    const flattenedTransactions = useMemo(() => {
        const list = [];
        Object.entries(groupedData).forEach(([key, items]) => {
            if (groupBy !== 'none') {
                list.push({ type: 'header', title: key, count: items.length });
            }
            items.forEach(tx => list.push({ type: 'item', ...tx }));
        });
        return list;
    }, [groupedData, groupBy]);

    const transactionsToShow = useMemo(() => {
        // If server side, we might just want to show all flattenedTransactions
        // But the previous useEffect tries to set visibleCount to large number.
        // Let's just slice safely.
        return flattenedTransactions.slice(0, visibleCount);
    }, [flattenedTransactions, visibleCount]);

    const requestSort = (key) => {
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

    const handleLoadMore = () => {
        if (isServerSide && onLoadMore) {
            onLoadMore();
        } else {
            setVisibleCount(prevCount => prevCount + 15);
        }
    };

    const handleEdit = useCallback((tx) => {
        onEditTransaction(tx);
    }, [onEditTransaction]);

    const handleDelete = useCallback((txId, txName) => {
        onTransactionDeleted(txId, txName);
    }, [onTransactionDeleted]);

    const handleSelectAll = (checked) => {
        if (checked) {
            const allIds = filteredData.map(tx => tx.id);
            setSelectedIds(allIds);
        } else {
            setSelectedIds([]);
        }
    };

    // Memoized handleSelectOne to prevent re-creating it on every render
    const handleSelectOne = useCallback((txId, checked) => {
        if (checked) {
            setSelectedIds(prev => prev.includes(txId) ? prev : [...prev, txId]);
        } else {
            setSelectedIds(prev => prev.filter(id => id !== txId));
        }
    }, []);

    const handleBulkDeleteAction = () => {
        if (onBulkDelete) {
            onBulkDelete(selectedIds);
            setSelectedIds([]);
        }
    };

    const { totalAmount, totalCashback } = useMemo(() => {
        // ⚡ Bolt Optimization: Use Set for O(1) lookup instead of array.includes (O(N))
        if (selectedIds.length === 0) return { totalAmount: 0, totalCashback: 0 };
        const selectedSet = new Set(selectedIds);

        const selectedTxs = transactions.filter(tx => selectedSet.has(tx.id));
        const totalAmount = selectedTxs.reduce((sum, tx) => sum + (tx['Amount'] || 0), 0);
        const totalCashback = selectedTxs.reduce((sum, tx) => sum + (tx.estCashback || 0), 0);
        return { totalAmount, totalCashback };
    }, [selectedIds, transactions]);

    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) return <ChevronsUpDown className="ml-2 h-4 w-4" />;
        return sortConfig.direction === 'ascending' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
    };

    const renderMobileFilters = () => {
        return (
            <div className="sticky top-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm px-4 py-3 shadow-sm border-b border-slate-100/50 dark:border-slate-800/50 rounded-xl">
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 py-1 select-none no-scrollbar">
                    {/* Search */}
                    <div className="relative flex items-center min-w-[140px]">
                        <Search className="absolute left-3 w-3.5 h-3.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder={isServerSide ? "Search Database..." : "Search..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-[30px] pl-8 pr-3 bg-slate-100 dark:bg-slate-900 rounded-full text-base font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-500 transition-all border-none"
                        />
                        {searchTerm && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setSearchTerm('')}
                                className="absolute right-2 h-5 w-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 hover:bg-slate-300 dark:hover:bg-slate-700 p-0"
                                aria-label="Clear search"
                            >
                                <X className="w-3 h-3" />
                            </Button>
                        )}
                    </div>

                    {/* Card Filter Pill */}
                    <Select value={cardFilter} onValueChange={setCardFilter}>
                        <SelectTrigger className="h-[30px] w-auto border-0 p-0 bg-transparent shadow-none focus:ring-0 [&>span]:hidden [&>svg]:hidden">
                             <div className={cn(
                                "flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all border cursor-pointer",
                                cardFilter !== 'all'
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm dark:bg-slate-100 dark:text-slate-900'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-800'
                            )}>
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Card</span>
                                {cardFilter !== 'all' && (
                                    <>
                                        <span className="opacity-60">|</span>
                                        <span className="font-semibold max-w-[80px] truncate">
                                            {allCards.find(c => c.id === cardFilter)?.name || 'Selected'}
                                        </span>
                                    </>
                                )}
                                <ChevronDown className={cn("w-3 h-3 opacity-50", cardFilter !== 'all' ? 'text-white dark:text-slate-900' : '')} />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Cards</SelectItem>
                            {[...allCards].sort((a, b) => a.name.localeCompare(b.name)).map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Category Filter Pill */}
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="h-[30px] w-auto border-0 p-0 bg-transparent shadow-none focus:ring-0 [&>span]:hidden [&>svg]:hidden">
                            <div className={cn(
                                "flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all border cursor-pointer",
                                categoryFilter !== 'all'
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm dark:bg-slate-100 dark:text-slate-900'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-800'
                            )}>
                                <Filter className="w-3.5 h-3.5" />
                                <span>Cat</span>
                                {categoryFilter !== 'all' && (
                                    <>
                                        <span className="opacity-60">|</span>
                                        <span className="font-semibold max-w-[80px] truncate">{categoryFilter}</span>
                                    </>
                                )}
                                <ChevronDown className={cn("w-3 h-3 opacity-50", categoryFilter !== 'all' ? 'text-white dark:text-slate-900' : '')} />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Method Filter Pill */}
                    <Select value={methodFilter} onValueChange={setMethodFilter}>
                        <SelectTrigger className="h-[30px] w-auto border-0 p-0 bg-transparent shadow-none focus:ring-0 [&>span]:hidden [&>svg]:hidden">
                            <div className={cn(
                                "flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all border cursor-pointer",
                                methodFilter !== 'all'
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm dark:bg-slate-100 dark:text-slate-900'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-800'
                            )}>
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Method</span>
                                {methodFilter !== 'all' && (
                                    <>
                                        <span className="opacity-60">|</span>
                                        <span className="font-semibold max-w-[80px] truncate">{methodFilter}</span>
                                    </>
                                )}
                                <ChevronDown className={cn("w-3 h-3 opacity-50", methodFilter !== 'all' ? 'text-white dark:text-slate-900' : '')} />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Methods</SelectItem>
                            <SelectItem value="POS">POS</SelectItem>
                            <SelectItem value="eCom">eCom</SelectItem>
                            <SelectItem value="International">International</SelectItem>
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

    const renderContent = () => {
        // Only show full skeleton if it's an initial load (empty list) or client-side filter load
        // This prevents the list from unmounting during "Load More" (server-side append), which preserves scroll position.
        const shouldShowSkeleton = isLoading && (transactions.length === 0 || !isServerSide);

        if (shouldShowSkeleton) {
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
                <div className="rounded-md">
                    <Table>
                        <TableHeader>
                             <TableRow>
                                <TableHead className="w-[30px] p-2">
                                    <Checkbox aria-label="Select all rows" />
                                </TableHead>
                                <TableHead className="w-[30px]"></TableHead>
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <TableHead key={i}><Skeleton className="h-4 w-20" /></TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Array.from({ length: 7 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-16 mx-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            );
        }

        if (filteredData.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in duration-300">
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-full mb-3">
                        <Inbox className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">No transactions found</h3>
                    <p className="text-sm text-slate-500 max-w-sm mt-1 mb-4">
                        We couldn't find any transactions matching your current filters.
                    </p>
                    {(searchTerm || cardFilter !== 'all' || categoryFilter !== 'all' || methodFilter !== 'all') && (
                        <Button
                            variant="outline"
                            onClick={() => {
                                setSearchTerm('');
                                setCardFilter('all');
                                setCategoryFilter('all');
                                setMethodFilter('all');
                            }}
                        >
                            Clear all filters
                        </Button>
                    )}
                </div>
            );
        }

        if (!isDesktop) {
            return (
                <div className="space-y-2.5 pb-20 p-3">
                    {/* Select All Row */}
                    {filteredData.length > 0 && (
                        <div className="flex items-center justify-between px-2 pt-1 pb-1">
                            <div className="flex items-center gap-2 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleSelectAll(selectedIds.length !== filteredData.length); }}>
                                <Checkbox
                                    checked={selectedIds.length > 0 && selectedIds.length === filteredData.length}
                                    onCheckedChange={handleSelectAll}
                                    aria-label="Select all transactions"
                                    className={cn("h-5 w-5 rounded border data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 bg-white border-slate-300")}
                                />
                                <span className="text-xs font-medium text-slate-500">Select All</span>
                            </div>
                            <span className="text-[10px] text-slate-400">{filteredData.length} items</span>
                        </div>
                    )}

                    {transactionsToShow.map((item, index) => {
                        if (item.type === 'header') {
                            return (
                                <div key={`header-${index}`} className="pt-2 pb-1 px-1">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{item.title} ({item.count})</span>
                                </div>
                            );
                        }

                        const tx = item;
                        const isSelected = selectedIds.includes(tx.id);
                        return (
                            <MobileTransactionItem
                                key={tx.id}
                                transaction={tx}
                                isSelected={isSelected}
                                onSelect={handleSelectOne}
                                onClick={onViewDetails}
                                cardMap={cardMap}
                                currencyFn={currency}
                            />
                        );
                    })}
                </div>
            );
        }

        // --- DESKTOP TABLE VIEW (Refactored) ---
        return (
            <div className="rounded-md">
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

                                {/* Dynamic Headers */}
                                {activeColumns.map(col => (
                                    <TableHead key={col.id} className={col.width || ''}>
                                        {col.sortKey ? (
                                            <Button
                                                variant="ghost"
                                                onClick={() => requestSort(col.sortKey)}
                                                className={cn(
                                                    "px-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1",
                                                    col.headerClass?.includes("text-right") ? "w-full justify-end ml-0" : "",
                                                    col.headerClass || ""
                                                )}
                                            >
                                                {col.label} <SortIcon columnKey={col.sortKey} />
                                            </Button>
                                        ) : (
                                            <div className={cn("flex items-center", col.headerClass?.includes("text-right") ? "justify-end" : "", col.headerClass || "")}>
                                                <span>{col.label}</span>
                                            </div>
                                        )}
                                    </TableHead>
                                ))}

                                <TableHead className="w-[100px] text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactionsToShow.map((item, index) => {
                                if (item.type === 'header') {
                                    return (
                                        <TableRow key={`group-${index}-${item.title}`} className="bg-slate-100/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-900">
                                            {/* colSpan = activeColumns.length + 3 (Check, Spacer, Actions) */}
                                            <TableCell colSpan={activeColumns.length + 3} className="py-2 px-4 font-semibold text-xs uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                                                {item.title} <span className="ml-1 text-slate-400 font-normal">({item.count})</span>
                                            </TableCell>
                                        </TableRow>
                                    );
                                }

                                const tx = item;
                                return (
                                    <TransactionRow
                                        key={tx.id}
                                        transaction={tx}
                                        isSelected={selectedIds.includes(tx.id)}
                                        activeColumns={activeColumns}
                                        onSelect={handleSelectOne}
                                        onViewDetails={onViewDetails}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                    />
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
        );
    };

    const renderBulkBar = (isStickyMobile) => (
        <div className={cn(
            "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-slate-900 text-white animate-in fade-in slide-in-from-top-2",
            isStickyMobile ? "fixed bottom-4 left-4 right-4 z-50 shadow-xl rounded-xl" : ""
        )}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 pl-1 w-full sm:w-auto">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-300 hover:text-white shrink-0"
                        onClick={() => setSelectedIds([])}
                        aria-label="Clear selection"
                    >
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
        <Card className={cn(
            "relative",
            isDesktop ? "bg-white dark:bg-slate-950 border shadow-sm" : "bg-slate-50 dark:bg-slate-950 border-0 shadow-none"
        )}>
            {/* Mobile Bulk Bar - Rendered OUTSIDE the static header wrapper */}
            {!isDesktop && selectedIds.length > 0 && renderBulkBar(true)}

            {isDesktop ? (
                // DESKTOP LAYOUT
                <div className="sticky top-16 z-30 bg-background shadow-sm rounded-t-xl overflow-hidden">
                    {/* Desktop Bulk Bar */}
                    {selectedIds.length > 0 && renderBulkBar(false)}

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
                                            placeholder={isServerSide ? "Search Database..." : "Search..."}
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

                                    {/* Method Filter */}
                                    <Select value={methodFilter} onValueChange={setMethodFilter}>
                                        <SelectTrigger className="w-full md:w-[160px] h-10">
                                            <div className="flex items-center gap-2 truncate">
                                                <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span className="truncate">
                                                    {methodFilter === 'all' ? 'All Methods' : methodFilter}
                                                </span>
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Methods</SelectItem>
                                            <SelectItem value="POS">POS</SelectItem>
                                            <SelectItem value="eCom">eCom</SelectItem>
                                            <SelectItem value="International">International</SelectItem>
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

                                    {/* Columns Selection - REFACTORED */}
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
                                            {columnsConfig.map((column) => (
                                                <DropdownMenuCheckboxItem
                                                    key={column.id}
                                                    checked={visibleColumnIds.includes(column.id)}
                                                    onCheckedChange={(checked) => {
                                                        setVisibleColumnIds(prev =>
                                                            checked
                                                                ? [...prev, column.id]
                                                                : prev.filter(id => id !== column.id)
                                                        );
                                                    }}
                                                    onSelect={(e) => e.preventDefault()}
                                                >
                                                    {column.label}
                                                </DropdownMenuCheckboxItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                </div>
            ) : (
                // MOBILE HEADER (Filters Only)
                renderMobileFilters()
            )}

            <CardContent className={cn("p-0")}>
                {renderContent()}
                <div className="mt-2 flex flex-col items-center gap-4 mb-6">
                    <p className="text-sm text-muted-foreground">
                        {isServerSide ? (
                            <>Showing <span className="font-semibold text-primary">{transactionsToShow.length}</span> loaded items</>
                        ) : (
                            <>Showing <span className="font-semibold text-primary">{transactionsToShow.length}</span> of <span className="font-semibold text-primary">{flattenedTransactions.length}</span> items</>
                        )}
                    </p>
                    {(visibleCount < flattenedTransactions.length || (isServerSide && hasMore)) && (
                        <Button onClick={handleLoadMore} variant="outline" disabled={isServerSide && isLoading}>
                            {isServerSide && isLoading ? 'Loading...' : 'Load More'}
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
});

TransactionsList.displayName = "TransactionsList";

export default TransactionsList;
