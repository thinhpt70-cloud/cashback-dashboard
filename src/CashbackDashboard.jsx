// CashbackDashboard.jsx

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { CreditCard, DollarSign, AlertTriangle, Search, Loader2, Plus, LayoutDashboard, ArrowLeftRight, Banknote, Menu, RefreshCw, LogOut } from "lucide-react";
import { Toaster, toast } from 'sonner';

// Import utility functions
import { cn } from "./lib/utils";
import { getMetricSparkline } from './lib/stats';
import { getTodaysMonth, getPreviousMonth, getCurrentCashbackMonthForCard } from './lib/date';

// Import UI components
import { Button } from "./components/ui/button";
import { TooltipProvider } from "./components/ui/tooltip";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./components/ui/sheet";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "./components/ui/drawer";

// Import dialog components
import MobileThemeToggle from "./components/dashboard/header/MobileThemeToggle";
import BestCardFinderDialog from './components/dashboard/dialogs/BestCardFinderDialog';
import SyncQueueSheet from './components/shared/SyncQueueSheet';

// Import form components
import AddTransactionForm from './components/dashboard/forms/AddTransactionForm';

// Import overview tab components
import CardSpendsCap from "./components/dashboard/overview/CardSpendsCap";
import EnhancedSuggestions from "./components/dashboard/overview/EnhancedSuggestions";
import SpendByCardChart from "./components/dashboard/overview/SpendByCardChart";
import CashbackByCardChart from "./components/dashboard/overview/CashbackByCardChart";
import CummulativeResultsChart from "./components/dashboard/overview/CummulativeResultsChart";
import RecentTransactions from './components/dashboard/overview/RecentTransactions';
import CurrentCashflowChart from "./components/dashboard/overview/CurrentCashflowChart";
import TransactionReview from './components/dashboard/transactions/TransactionReview';
import TransactionsList from './components/dashboard/transactions/TransactionsList';
import TransactionDetailSheet from './components/shared/TransactionDetailSheet';
import CashbackTracker from './components/dashboard/cashback/CashbackTracker';

// Import new CardsTab component
import CardsTab from "./components/dashboard/cards/CardsTab";

// Import new PaymentsTab component
import PaymentsTab from "./components/dashboard/payments/PaymentsTab";

// Import authentication component
import LoginScreen from './components/auth/LoginScreen';

// Import shared components
import AppSkeleton from "./components/shared/AppSkeleton";
import AppSidebar from "./components/shared/AppSidebar";
import SharedTransactionsDialog from "./components/shared/SharedTransactionsDialog";
import StatCards from './components/dashboard/overview/OverviewStatCards';

// Import custom hooks
import useMediaQuery from "./hooks/useMediaQuery";
import useCashbackData from "./hooks/useCashbackData";
import useTransactionSync from "./hooks/useTransactionSync";

// Import constants and utilities
import { COLORS } from './lib/constants';
import { calculateDaysLeft } from './lib/date';
import { currency, fmtYMShort } from './lib/formatters';

const API_BASE_URL = '/api';

const navItems = [
    { view: 'overview', icon: LayoutDashboard, label: 'Overview' },
    { view: 'transactions', icon: ArrowLeftRight, label: 'Transactions' },
    { view: 'cards', icon: CreditCard, label: 'My Cards' },
    { view: 'cashback', icon: DollarSign, label: 'Cashback' },
    { view: 'payments', icon: Banknote, label: 'Payments' },
];

export default function CashbackDashboard() {

    const [activeMonth, setActiveMonth] = useState("live");
    const [monthlyTransactions, setMonthlyTransactions] = useState([]);
    const [isMonthlyTxLoading, setIsMonthlyTxLoading] = useState(true);
    const [isAddTxDialogOpen, setIsAddTxDialogOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [duplicateTransaction, setDuplicateTransaction] = useState(null);
    const [viewingTransaction, setViewingTransaction] = useState(null);
    const [transactionFilterType, setTransactionFilterType] = useState('date'); // 'date' or 'cashbackMonth'
    const [dialogDetails, setDialogDetails] = useState(null); // Will hold { cardId, cardName, month, monthLabel }
    const [dialogTransactions, setDialogTransactions] = useState([]);
    const [isDialogLoading, setIsDialogLoading] = useState(false);
    // const [cardView, setCardView] = useState('month'); // MOVED TO CardsTab
    const [activeView, setActiveView] = useState('overview');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const [isFinderOpen, setIsFinderOpen] = useState(false);

    // --- LIVE TRANSACTIONS STATE ---
    const [liveTransactions, setLiveTransactions] = useState([]);
    const [liveCursor, setLiveCursor] = useState(null);
    const [liveHasMore, setLiveHasMore] = useState(false);
    const [isLiveLoading, setIsLiveLoading] = useState(false);
    const [liveSearchTerm, setLiveSearchTerm] = useState('');
    const isDesktop = useMediaQuery("(min-width: 768px)");
    const addTxSheetSide = isDesktop ? 'right' : 'bottom';

    const {
        cards, allCards, rules, monthlySummary, mccMap, monthlyCategorySummary,
        recentTransactions, allCategories, commonVendors, reviewTransactions,
        error, refreshData, isShellReady, isDashboardLoading,
        setRecentTransactions, setReviewTransactions,
        cashbackRules, monthlyCashbackCategories, liveSummary,
        fetchReviewTransactions, reviewLoading, fetchCategorySummaryForMonth,
        definitions
    } = useCashbackData(isAuthenticated);


    // --- SYNC LOGIC ---
    const handleBackgroundSyncSuccess = useCallback((updatedTransaction) => {
        // Find and replace the transaction in the list for an instant UI update
        // without disrupting the user or closing the form
        setMonthlyTransactions(prevTxs =>
            prevTxs.map(tx => tx.id === updatedTransaction.id ? updatedTransaction : tx)
        );

        // Also update the recent transactions carousel
        setRecentTransactions(prevRecent =>
            prevRecent.map(tx => tx.id === updatedTransaction.id ? updatedTransaction : tx)
        );

        setReviewTransactions(prevReview =>
            prevReview.filter(tx => tx.id !== updatedTransaction.id)
        );

        // Quietly refresh other data
        refreshData(true);
    }, [setRecentTransactions, setReviewTransactions, refreshData]);

    const {
        queue: needsSyncing,
        addToQueue,
        retry: handleRetrySync,
        remove: handleRemoveFromSync,
        isSyncing,
        isSheetOpen: isSyncingSheetOpen,
        setSheetOpen: setIsSyncingSheetOpen
    } = useTransactionSync({
        cards,
        monthlySummary,
        monthlyCategorySummary, // actually passed but hook logic does fetch itself if needed, but it's good for deps
        onSyncSuccess: handleBackgroundSyncSuccess
    });


    // Fetch review transactions when tab is active
    useEffect(() => {
        if (!isAddTxDialogOpen) {
            setDuplicateTransaction(null);
        }
    }, [isAddTxDialogOpen]);

    // Fetch review transactions when tab is active
    useEffect(() => {
        if (activeView === 'transactions') {
            fetchReviewTransactions();
        }
    }, [activeView, fetchReviewTransactions]);

    // NEW: Trigger lazy load of category summaries when activeMonth changes
    useEffect(() => {
        if (!monthlyCategorySummary) return;

        if (activeMonth === 'live') {
            // For live view, we need to check the current cashback month for ALL active cards
            // because different cards might be in different statement cycles.
            const requiredMonths = new Set();
            cards.forEach(card => {
                const currentMonth = getCurrentCashbackMonthForCard(card);
                requiredMonths.add(currentMonth);
            });

            // Find which of these required months are missing from our data
            const loadedMonths = new Set(monthlyCategorySummary.map(item => item.month));
            const missingMonths = [...requiredMonths].filter(m => !loadedMonths.has(m));

            // Fetch any missing months
            if (missingMonths.length > 0) {
                // Fetch them one by one (or could batch if API supported it, but loop is fine for now)
                missingMonths.forEach(month => {
                    fetchCategorySummaryForMonth(month);
                });
            }

        } else {
            // Standard historical view: check if we have data for the specific selected month
            const hasDataForMonth = monthlyCategorySummary.some(item => item.month === activeMonth);

            if (!hasDataForMonth) {
                fetchCategorySummaryForMonth(activeMonth);
            }
        }
    }, [activeMonth, monthlyCategorySummary, fetchCategorySummaryForMonth, cards]);

    const handleLogout = async () => {
        try {
            await fetch('/api/logout', {
                method: 'POST',
                credentials: 'include'
            });
            setIsAuthenticated(false);
        } catch (error) {
            console.error("Logout failed:", error);
            toast.error("Logout failed. Please try again.");
        }
    };

    // --- LIVE TRANSACTIONS LOGIC ---
    const fetchLiveTransactions = useCallback(async (cursor = null, search = '', isAppend = false) => {
        setIsLiveLoading(true);
        try {
            const params = new URLSearchParams();
            if (cursor) params.append('cursor', cursor);
            if (search) params.append('search', search);

            const res = await fetch(`${API_BASE_URL}/transactions/query?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch live transactions');

            const data = await res.json();

            setLiveTransactions(prev => isAppend ? [...prev, ...data.results] : data.results);
            setLiveCursor(data.nextCursor);
            setLiveHasMore(data.hasMore);
        } catch (error) {
            console.error("Error fetching live transactions:", error);
            toast.error("Failed to load transactions.");
        } finally {
            setIsLiveLoading(false);
        }
    }, []);

    const handleLiveLoadMore = useCallback(() => {
        if (liveHasMore && liveCursor) {
            fetchLiveTransactions(liveCursor, liveSearchTerm, true);
        }
    }, [liveHasMore, liveCursor, liveSearchTerm, fetchLiveTransactions]);

    const handleLiveSearch = useCallback((term) => {
        setLiveSearchTerm(term);
        // Reset list and fetch new results
        fetchLiveTransactions(null, term, false);
    }, [fetchLiveTransactions]);

    // ⚡ Bolt Optimization: Memoize handlers to prevent re-renders
    const handleTransactionAdded = useCallback((newTransaction) => {
        // 1. Instantly update the list for the current month
        if (newTransaction['Transaction Date'].startsWith(activeMonth.replace('-', ''))) {
                setMonthlyTransactions(prevTxs => [newTransaction, ...prevTxs]);
        }

        // 2. Update the recent transactions carousel
        setRecentTransactions(prevRecent => [newTransaction, ...prevRecent].slice(0, 20));

        // 3. Update Live Transactions list
        setLiveTransactions(prev => [newTransaction, ...prev]);

        // 4. Trigger a full refresh in the background to update all aggregate data (charts, stats, etc.) without a loading screen.
        refreshData(true);
    }, [activeMonth, setRecentTransactions, refreshData]);

    const handleViewTransactions = useCallback(async (cardId, cardName, month, monthLabel) => {
        setDialogDetails({ cardId, cardName, month, monthLabel });
        setIsDialogLoading(true);
        setDialogTransactions([]);

        try {
            // Use 'cashbackMonth' filter as it aligns with statement periods
            const res = await fetch(`${API_BASE_URL}/transactions?month=${month}&filterBy=statementMonth&cardId=${cardId}`);
            if (!res.ok) throw new Error('Failed to fetch transactions for dialog');
            const data = await res.json();

            // Sort by date just in case
            data.sort((a, b) => new Date(b['Transaction Date']) - new Date(a['Transaction Date']));

            setDialogTransactions(data);
        } catch (err) {
            console.error(err);
            toast.error("Could not load transaction details.");
        } finally {
            setIsDialogLoading(false);
        }
    }, []);

    const handleTransactionDeleted = useCallback(async (deletedTxId, txName) => {
        // 1. Ask for confirmation to prevent accidental deletion
        const confirmationMessage = txName
            ? `Are you sure you want to delete the transaction for "${txName}"? This action cannot be undone.`
            : `Are you sure you want to delete this transaction? This action cannot be undone.`;

        if (!window.confirm(confirmationMessage)) {
            return;
        }

        try {
            // 2. Call the backend API to archive the page in Notion
            const response = await fetch(`${API_BASE_URL}/transactions/${deletedTxId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                // Handle server-side errors
                throw new Error('Failed to delete the transaction on the server.');
            }

            // 3. If successful, update the UI
            // Remove the transaction from the main list to update the UI instantly
            setMonthlyTransactions(prevTxs => prevTxs.filter(tx => tx.id !== deletedTxId));

            // Also remove it from the recent transactions carousel for consistency
            setRecentTransactions(prevRecent => prevRecent.filter(tx => tx.id !== deletedTxId));

            // Also remove it from the review transactions list
            setReviewTransactions(prevReview => prevReview.filter(tx => tx.id !== deletedTxId));

            toast.success('Transaction deleted successfully!');

            // Optionally, trigger a silent refresh to ensure all aggregate data is up-to-date
            refreshData(true);

        } catch (error) {
            console.error("Delete failed:", error);
            toast.error("Could not delete the transaction. Please try again.");
        }
    }, [setRecentTransactions, setReviewTransactions, refreshData]);

    const handleEditClick = useCallback((transaction) => {
        setEditingTransaction(transaction);
    }, []);

    const handleDuplicateClick = useCallback((transaction) => {
        setDuplicateTransaction(transaction);
        setIsAddTxDialogOpen(true);
    }, []);

    // ⚡ Bolt Optimization: Memoize helper functions to prevent re-renders
    const cardMap = useMemo(() => new Map(allCards.map(c => [c.id, c])), [allCards]); // Use allCards here

    const handleViewTransactionDetails = useCallback((transaction) => {
        const cardName = transaction['Card Name'] || (transaction['Card'] && cardMap.get(transaction['Card'][0])?.name);
        setViewingTransaction({ ...transaction, 'Card Name': cardName });
    }, [cardMap]);

    const handleBulkDelete = useCallback(async (transactionIds) => {
        if (!window.confirm(`Are you sure you want to delete ${transactionIds.length} transactions? This action cannot be undone.`)) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/transactions/bulk-delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: transactionIds }),
            });

            if (!response.ok) {
                throw new Error('Failed to delete transactions on the server.');
            }

            setMonthlyTransactions(prevTxs => prevTxs.filter(tx => !transactionIds.includes(tx.id)));
            setRecentTransactions(prevRecent => prevRecent.filter(tx => !transactionIds.includes(tx.id)));
            setReviewTransactions(prevReview => prevReview.filter(tx => !transactionIds.includes(tx.id)));
            toast.success(`${transactionIds.length} transactions deleted successfully!`);
            refreshData(true);
        } catch (error) {
            console.error("Bulk delete failed:", error);
            toast.error("Could not delete transactions. Please try again.");
        }
    }, [setRecentTransactions, setReviewTransactions, refreshData]);

    // Used for MANUAL edits (when user clicks "Update Transaction" in form)
    // The background sync updates are handled by handleBackgroundSyncSuccess
    const handleTransactionUpdated = useCallback((updatedTransaction) => {
        // Find and replace the transaction in the list for an instant UI update
        setMonthlyTransactions(prevTxs =>
            prevTxs.map(tx => tx.id === updatedTransaction.id ? updatedTransaction : tx)
        );

        // Also update the recent transactions carousel
        setRecentTransactions(prevRecent =>
            prevRecent.map(tx => tx.id === updatedTransaction.id ? updatedTransaction : tx)
        );

        setReviewTransactions(prevReview =>
            prevReview.filter(tx => tx.id !== updatedTransaction.id)
        );

        // Close the edit form ONLY IF we are editing THIS transaction
        if (editingTransaction && editingTransaction.id === updatedTransaction.id) {
            setEditingTransaction(null);
        }

        refreshData(true);
    }, [setRecentTransactions, setReviewTransactions, refreshData, editingTransaction]);



    // Dynamic list of available months from transactions
    const statementMonths = useMemo(() => {
        if (!monthlySummary || monthlySummary.length === 0) return [];
        const uniqueMonths = [...new Set(monthlySummary.map(summary => summary.month))];
        return uniqueMonths.sort().reverse();
    }, [monthlySummary]);

    // --- NEW: AUTHENTICATION CHECK EFFECT ---

    useEffect(() => {
        const checkAuthStatus = async () => {
            try {
                // Use fetch with 'credentials: "include"' to send cookies
                const response = await fetch('/api/verify-auth', {
                    credentials: 'include'
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.isAuthenticated) {
                        setIsAuthenticated(true);
                    } else {
                        setIsAuthenticated(false);
                    }
                } else {
                    // Fallback for any other non-200 status (though we aim for 200)
                    setIsAuthenticated(false);
                }
            } catch (error) {
                console.error("Auth check failed:", error);
                setIsAuthenticated(false);
            }
        };

        checkAuthStatus();
    }, []); // Empty dependency array means this runs only once on component mount.



    useEffect(() => {
        const isLiveView = activeMonth === 'live';

        // 1. Handle Live View fetching
        if (isLiveView && activeView === 'transactions') {
             // Only fetch if empty to avoid refetching on every tab switch,
             // unless we want to ensure freshness.
             // Given 'recentTransactions' might be stale or partial, we fetch fresh.
             if (liveTransactions.length === 0) {
                 fetchLiveTransactions();
             }
        }
        // 2. Handle Historical View fetching
        else {
            const monthToFetch = activeMonth;
            if (monthToFetch && activeView === 'transactions') {
                const fetchMonthlyTransactions = async () => {
                    setIsMonthlyTxLoading(true);
                    try {
                        const res = await fetch(`${API_BASE_URL}/transactions?month=${monthToFetch}&filterBy=${transactionFilterType}`);
                        if (!res.ok) throw new Error('Failed to fetch monthly transactions');
                        const data = await res.json();
                        setMonthlyTransactions(data);
                    } catch (err) {
                        console.error(err);
                        setMonthlyTransactions([]);
                    } finally {
                        setIsMonthlyTxLoading(false);
                    }
                };
                fetchMonthlyTransactions();
            }
        }
    }, [activeMonth, transactionFilterType, activeView, fetchLiveTransactions, liveTransactions.length]);

    // --------------------------
    // 2) HELPERS & CALCULATIONS
    // --------------------------

    // --- UTILITIES ---
    // ⚡ Bolt Optimization: Memoize this function to prevent re-renders of TransactionsList
    const mccName = useCallback((code) => mccMap[code]?.vn || "Unknown", [mccMap]);

    // sortedCards MOVED TO CardsTab
    // const sortedCards = useMemo(() => { ... }, [allCards]);

    // --- MEMOIZED DATA PROCESSING ---

    const cardColorMap = useMemo(() => {
        const map = new Map();
        // Sort cards by name to ensure color assignment is stable
        const sortedCards = [...allCards].sort((a, b) => a.name.localeCompare(b.name)); // Use allCards here
        sortedCards.forEach((card, index) => {
            map.set(card.name, COLORS[index % COLORS.length]);
        });
        return map;
    }, [allCards]);


    // --- NEW: CONSOLIDATED STATS LOGIC ---
    // This single hook provides all stats for the StatCards,
    // for both 'live' and 'historical' views.
    const displayStats = useMemo(() => {
        const today = getTodaysMonth(); // e.g., '2024-07'
        const lastCompletedMonth = getPreviousMonth(today); // e.g., '2024-06'

        // --- Helper to get data for a specific month ---
        const getMonthStats = (month) => {
            if (!month) return { totalSpend: 0, totalCashback: 0, effectiveRate: 0 };
            const monthData = monthlySummary.filter(s => s.month === month);
            const totalSpend = monthData.reduce((acc, curr) => acc + (curr.spend || 0), 0);
            const totalCashback = monthData.reduce((acc, curr) => acc + (curr.cashback || 0), 0);
            const effectiveRate = totalSpend > 0 ? totalCashback / totalSpend : 0;
            return { totalSpend, totalCashback, effectiveRate };
        };

        // --- Calculate sparkline data (last 6 completed months) ---
        const sparklineBaseMonth = activeMonth === 'live' ? lastCompletedMonth : activeMonth;
        const spendSparkline = getMetricSparkline(monthlySummary, sparklineBaseMonth, 6, 'spend');
        const cashbackSparkline = getMetricSparkline(monthlySummary, sparklineBaseMonth, 6, 'cashback');
        const rateSparkline = getMetricSparkline(monthlySummary, sparklineBaseMonth, 6, 'cashback')
            .map((cb, i) => {
                const spend = spendSparkline[i];
                return spend > 0 ? cb / spend : 0;
            });


        // --- CASE 1: LIVE VIEW ---
        if (activeMonth === 'live') {
            const { totalSpend: prevMonthSpend, totalCashback: prevMonthCashback, effectiveRate: prevMonthRate } = getMonthStats(lastCompletedMonth);

            // Assuming liveSummary is passed from useCashbackData
            const totalSpend = liveSummary?.liveSpend || 0;
            const totalCashback = liveSummary?.liveCashback || 0;
            const effectiveRate = totalSpend > 0 ? totalCashback / totalSpend : 0;

            return {
                label: "Latest", // <-- Changed from "Live"
                totalSpend,
                totalCashback,
                effectiveRate,
                prevMonthSpend,
                prevMonthCashback,
                prevMonthRate,
                spendSparkline,
                cashbackSparkline,
                rateSparkline
            };
        }

        // --- CASE 2: HISTORICAL VIEW ---
        const { totalSpend, totalCashback, effectiveRate } = getMonthStats(activeMonth);
        const prevMonth = getPreviousMonth(activeMonth);
        const { totalSpend: prevMonthSpend, totalCashback: prevMonthCashback, effectiveRate: prevMonthRate } = getMonthStats(prevMonth);

        return {
            label: fmtYMShort(activeMonth),
            totalSpend,
            totalCashback,
            effectiveRate,
            prevMonthSpend,
            prevMonthCashback,
            prevMonthRate,
            spendSparkline,
            cashbackSparkline,
            rateSparkline
        };

    }, [activeMonth, monthlySummary, liveSummary]);


    // --- RENAMED: This hook now ONLY calculates pie chart data ---
    const overviewChartStats = useMemo(() => {
        // Filter the summary data for only the currently selected month
        const monthData = monthlySummary.filter(s => s.month === activeMonth);

        // Prepare data formatted for the pie charts
        const spendByCard = monthData.map(item => ({
            name: cardMap.get(item.cardId)?.name || "Unknown Card",
            value: item.spend || 0,
        })).sort((a, b) => b.value - a.value);

        const cashbackByCard = monthData.map(item => ({
            name: cardMap.get(item.cardId)?.name || "Unknown Card",
            value: item.cashback || 0,
        })).sort((a, b) => b.value - a.value);

        // --- Removed totalSpend, totalCashback, effectiveRate ---
        return { spendByCard, cashbackByCard };
    }, [activeMonth, monthlySummary, cardMap]);

    // cardsTabStats MOVED TO CardsTab
    // const cardsTabStats = useMemo(() => { ... }, [allCards]);

    const cardPerformanceData = useMemo(() => {
        const allMonths = [...new Set(monthlySummary.map(s => s.month))].sort();
        const summaryMap = new Map();
        monthlySummary.forEach(s => {
            const key = `${s.month}-${s.cardId}`;
            summaryMap.set(key, s);
        });

        return allMonths.map(month => {
            const monthData = { month: fmtYMShort(month) };
            cards.forEach(card => {
                const key = `${month}-${card.id}`;
                const summary = summaryMap.get(key);

                // THIS IS THE FIX: Default to null instead of 0
                monthData[`${card.name} Spend`] = summary ? summary.spend : null;
                monthData[`${card.name} Cashback`] = summary ? summary.cashback : null;
            });
            return monthData;
        });
    }, [monthlySummary, cards]);

    const monthlyChartData = useMemo(() => {
        const aggregated = new Map(); // Use a Map to aggregate and preserve order

        // Ensure monthlySummary is sorted by month before aggregating
        const sortedSummary = [...monthlySummary].sort((a, b) => a.month.localeCompare(b.month));

        sortedSummary.forEach(item => {
            const monthCode = item.month; // e.g., "2024-07"
            if (!aggregated.has(monthCode)) {
                aggregated.set(monthCode, { month: monthCode, spend: 0, cashback: 0 });
            }
            const current = aggregated.get(monthCode);
            current.spend += item.spend || 0;
            current.cashback += item.cashback || 0;
        });

        // Convert map values to array and format the month label for display
        return Array.from(aggregated.values())
            .map(item => ({
                ...item,
                month: fmtYMShort(item.month) // Converts "2024-07" to "Jul 2024"
            }));
    }, [monthlySummary]);

    // calculateFeeCycleProgress MOVED TO lib/date.js

    // --- NEW LOADING STATE FOR AUTH CHECK ---
    if (isAuthenticated === null) {
        return (
            <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/40">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Verifying session...</p>
            </div>
        );
    }

    // If the user is not authenticated, show the login screen.
    if (!isAuthenticated) {
        return <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />;
    }

    if (!isShellReady) {
        return <AppSkeleton />;
    }

    if (error) {
        return (
            <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/40 p-4">
                <div className="flex flex-col items-center text-center max-w-md">
                    <AlertTriangle className="h-12 w-12 text-destructive" />
                    <h2 className="mt-4 text-2xl font-semibold">Oops! Something went wrong.</h2>
                    <p className="mt-2 text-muted-foreground">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <TooltipProvider>
        <div className="flex min-h-screen w-full bg-muted/40">
            <Toaster richColors position="top-center" />
            <AppSidebar 
                activeView={activeView} 
                setActiveView={setActiveView} 
                isCollapsed={isSidebarCollapsed}
                setIsCollapsed={setIsSidebarCollapsed}
                handleLogout={handleLogout}
                refreshData={refreshData}
                openFinder={() => setIsFinderOpen(true)}
            />
            <div className={cn(
                "flex flex-col w-full transition-all duration-300 ease-in-out",
                isSidebarCollapsed ? "md:pl-16" : "md:pl-56"
            )}>
            {/* --- RESPONSIVE HEADER --- */}
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 shadow-sm sm:px-6 md:px-6">
                <div className="md:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="h-6 w-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-56 p-2 flex flex-col">
                            <div>
                                <div className="flex items-center justify-center h-16 border-b mb-2">
                                    <img src="/favicon.svg" alt="Cardifier" className="h-8 w-8" />
                                </div>
                                <nav className="space-y-2">
                                {navItems.map((item) => (
                                    <SheetTrigger asChild key={item.view}>
                                        <Button
                                            variant={activeView === item.view ? 'default' : 'ghost'}
                                            className="w-full justify-start h-10"
                                            onClick={() => setActiveView(item.view)}
                                        >
                                            <item.icon className="h-5 w-5 mr-3" />
                                            <span>{item.label}</span>
                                        </Button>
                                    </SheetTrigger>
                                ))}
                            </nav>
                            <div className="mt-auto flex flex-col gap-2 pt-2 border-t">
                                <SheetTrigger asChild>
                                    <Button variant="ghost" className="w-full justify-start h-10" onClick={() => setIsFinderOpen(true)}>
                                        <Search className="h-5 w-5 mr-3" />
                                        <span>Card Finder</span>
                                    </Button>
                                </SheetTrigger>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" className="w-full justify-start h-10" onClick={() => refreshData(false)}>
                                        <RefreshCw className="h-5 w-5 mr-3" />
                                        <span>Refresh</span>
                                    </Button>
                                </SheetTrigger>
                                <MobileThemeToggle />
                                <SheetTrigger asChild>
                                    <Button variant="ghost" className="w-full justify-start h-10" onClick={handleLogout}>
                                        <LogOut className="h-5 w-5 mr-3" />
                                        <span>Logout</span>
                                    </Button>
                                </SheetTrigger>
                            </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
                <h1 className="text-xl font-semibold md:hidden">Cardifer</h1>
                <h1 className="text-xl font-semibold hidden md:flex items-center gap-2 shrink-0 dark:text-white">
                    <span className="hidden md:inline">Cardifier | Cashback Optimizer</span>
                </h1>

                {/* Right-aligned container for all controls */}
                <div className="ml-auto flex items-center gap-2">
                    {/* Status Indicator for Sync */}
                    {needsSyncing.length > 0 && (
                         <Button
                             variant="ghost"
                             size="sm"
                             className="h-8 gap-1.5 px-2 text-muted-foreground hover:text-foreground"
                             onClick={() => setIsSyncingSheetOpen(true)}
                         >
                            {isSyncing ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    <span className="hidden sm:inline text-xs">Syncing...</span>
                                </>
                            ) : (
                                <>
                                    <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                                    <span className="hidden sm:inline text-xs">Saved Offline</span>
                                </>
                            )}
                         </Button>
                    )}

                    {/* Month Selector - visible on all screen sizes */}
                    {statementMonths.length > 0 && (
                        <select
                            value={activeMonth}
                            onChange={(e) => setActiveMonth(e.target.value)}
                            className="h-10 text-sm rounded-md border border-input bg-transparent px-3 py-1 shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                            <option value="live">Live View</option>
                            {statementMonths.map(m => (
                                <option key={m} value={m}>{fmtYMShort(m)}</option>
                            ))}
                        </select>
                    )}

                    {/* --- Desktop Controls (hidden on mobile) --- */}
                    <div className="hidden md:flex items-center gap-2">
                        <Sheet open={isAddTxDialogOpen && isDesktop} onOpenChange={setIsAddTxDialogOpen}>
                            <SheetTrigger asChild>
                                <Button variant="default" className="h-10">
                                    <Plus className="mr-2 h-4 w-4" />
                                    New Transaction
                                </Button>
                            </SheetTrigger>
                            <SheetContent
                                side={addTxSheetSide}
                                className={cn(
                                    "flex flex-col p-0",
                                    "w-full sm:max-w-2xl",
                                    !isDesktop && "h-[90dvh]"
                                )}
                            >
                                <SheetHeader className="px-6 pt-6">
                                    <SheetTitle>Add a New Transaction</SheetTitle>
                                </SheetHeader>
                                <div className="flex-grow overflow-y-auto px-6 pb-6">
                                    <AddTransactionForm
                                        cards={cards}
                                        categories={allCategories}
                                        definitions={definitions}
                                        rules={cashbackRules}
                                        monthlyCategories={monthlyCashbackCategories}
                                        mccMap={mccMap}
                                        onTransactionAdded={handleTransactionAdded}
                                        commonVendors={commonVendors}
                                        monthlySummary={monthlySummary}
                                        monthlyCategorySummary={monthlyCategorySummary}
                                        getCurrentCashbackMonthForCard={getCurrentCashbackMonthForCard}
                                        addToQueue={addToQueue}
                                        prefillData={duplicateTransaction}
                                    />
                                </div>
                            </SheetContent>
                        </Sheet>
                        <Sheet open={!!editingTransaction} onOpenChange={(isOpen) => !isOpen && setEditingTransaction(null)}>
                            <SheetContent
                                side={addTxSheetSide}
                                className={cn("flex flex-col p-0", "w-full sm:max-w-2xl", !isDesktop && "h-[90dvh]")}
                            >
                                <SheetHeader className="px-6 pt-6">
                                    <SheetTitle>Edit Transaction</SheetTitle>
                                </SheetHeader>
                                <div className="flex-grow overflow-y-auto px-6 pb-6">
                                    <AddTransactionForm
                                        cards={cards}
                                        categories={allCategories}
                                        definitions={definitions}
                                        rules={cashbackRules}
                                        monthlyCategories={monthlyCashbackCategories}
                                        mccMap={mccMap}
                                        commonVendors={commonVendors}
                                        monthlySummary={monthlySummary}
                                        monthlyCategorySummary={monthlyCategorySummary}
                                        getCurrentCashbackMonthForCard={getCurrentCashbackMonthForCard}
                                        initialData={editingTransaction}
                                        onTransactionUpdated={handleTransactionUpdated}
                                        onClose={() => setEditingTransaction(null)}
                                        addToQueue={addToQueue}
                                    />
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

                    {/* --- Mobile Controls (hidden on desktop) --- */}
                    <div className="flex items-center gap-2 md:hidden">
                        <Drawer open={isAddTxDialogOpen} onOpenChange={setIsAddTxDialogOpen}>
                            <DrawerTrigger asChild>
                                <Button variant="default" size="icon" className="h-10 w-10 rounded-full shadow-lg">
                                    <Plus className="h-6 w-6" />
                                </Button>
                            </DrawerTrigger>
                            <DrawerContent className="h-[90vh]">
                                <DrawerHeader>
                                    <DrawerTitle>Add Transaction</DrawerTitle>
                                </DrawerHeader>
                                <div className="px-4 pb-4 overflow-y-auto">
                                    <AddTransactionForm
                                        cards={cards}
                                        categories={allCategories}
                                        definitions={definitions}
                                        rules={cashbackRules}
                                        monthlyCategories={monthlyCashbackCategories}
                                        mccMap={mccMap}
                                        onTransactionAdded={handleTransactionAdded}
                                        commonVendors={commonVendors}
                                        monthlySummary={monthlySummary}
                                        monthlyCategorySummary={monthlyCategorySummary}
                                        getCurrentCashbackMonthForCard={getCurrentCashbackMonthForCard}
                                        addToQueue={addToQueue}
                                        prefillData={duplicateTransaction}
                                        onClose={() => setIsAddTxDialogOpen(false)}
                                    />
                                </div>
                            </DrawerContent>
                        </Drawer>

                        {/* Mobile Edit Transaction Drawer */}
                        {editingTransaction && !isDesktop && (
                             <Drawer open={!!editingTransaction} onOpenChange={(isOpen) => !isOpen && setEditingTransaction(null)}>
                                <DrawerContent className="h-[90vh]">
                                    <DrawerHeader>
                                        <DrawerTitle>Edit Transaction</DrawerTitle>
                                    </DrawerHeader>
                                    <div className="px-4 pb-4 overflow-y-auto">
                                        <AddTransactionForm
                                            cards={cards}
                                            categories={allCategories}
                                            rules={cashbackRules}
                                            monthlyCategories={monthlyCashbackCategories}
                                            mccMap={mccMap}
                                            commonVendors={commonVendors}
                                            monthlySummary={monthlySummary}
                                            monthlyCategorySummary={monthlyCategorySummary}
                                            getCurrentCashbackMonthForCard={getCurrentCashbackMonthForCard}
                                            initialData={editingTransaction}
                                            onTransactionUpdated={handleTransactionUpdated}
                                            onClose={() => setEditingTransaction(null)}
                                            addToQueue={addToQueue}
                                        />
                                    </div>
                                </DrawerContent>
                            </Drawer>
                        )}
                    </div>
                </div>
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">

                {activeView === 'overview' && (
                    <div className="space-y-4 pt-4">
                        {/* --- 1. UNIFIED DYNAMIC COMPONENTS --- */}
                        <div className="flex flex-col lg:flex-row gap-4">
                            {/* LEFT COLUMN */}
                            <div className="lg:w-7/12 flex flex-col gap-4">
                                <StatCards stats={displayStats} currencyFn={currency} isLoading={isDashboardLoading} />

                                <CardSpendsCap
                                    cards={cards}
                                    rules={rules}
                                    activeMonth={activeMonth}
                                    monthlySummary={monthlySummary}
                                    monthlyCategorySummary={monthlyCategorySummary}
                                    currencyFn={currency}
                                    getCurrentCashbackMonthForCard={getCurrentCashbackMonthForCard}
                                    onEditTransaction={handleEditClick}
                                    onTransactionDeleted={handleTransactionDeleted}
                                    onBulkDelete={handleBulkDelete}
                                    onViewTransactionDetails={handleViewTransactionDetails}
                                    cardMap={cardMap}
                                    isLoading={isDashboardLoading}
                                />
                            </div>

                            {/* --- RIGHT COLUMN (REVISED LAYOUT) --- */}
                            <div className="lg:w-5/12 flex flex-col gap-4">
                                {/* EnhancedSuggestions is first, with a max-height on desktop */}
                                <EnhancedSuggestions
                                    rules={rules}
                                    cards={cards}
                                    monthlyCategorySummary={monthlyCategorySummary}
                                    monthlySummary={monthlySummary}
                                    activeMonth={activeMonth}
                                    currencyFn={currency}
                                    getCurrentCashbackMonthForCard={getCurrentCashbackMonthForCard}
                                    className="lg:max-h-[800px]"
                                    isLoading={isDashboardLoading}
                                />

                                {/* RecentTransactions is second, and will fill remaining space */}
                                <RecentTransactions
                                    transactions={recentTransactions}
                                    cardMap={cardMap}
                                    currencyFn={currency}
                                    isLoading={isDashboardLoading}
                                />
                            </div>
                        </div>

                        {/* --- 3. UNIFIED CONTEXTUAL COMPONENTS --- */}

                        <div className="grid gap-4">
                            <CurrentCashflowChart data={monthlyChartData} />
                        </div>

                        <div className="mt-4">
                            <CummulativeResultsChart
                                data={cardPerformanceData}
                                cards={cards}
                                currencyFn={currency}
                                cardColorMap={cardColorMap}
                            />
                        </div>

                        {/* --- 4. CONDITIONAL HISTORICAL CHARTS --- */}
                        {/* These charts only render for historical months */}
                        {activeMonth !== 'live' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <SpendByCardChart
                                    spendData={overviewChartStats.spendByCard}
                                    currencyFn={currency}
                                    cardColorMap={cardColorMap}
                                />
                                <CashbackByCardChart
                                    cashbackData={overviewChartStats.cashbackByCard}
                                    currencyFn={currency}
                                    cardColorMap={cardColorMap}
                                />
                            </div>
                        )}
                    </div>
                )}

                {activeView === 'transactions' && (
                    <div className="pt-4 space-y-4">
                        <TransactionReview
                            transactions={reviewTransactions}
                            isLoading={reviewLoading}
                            onRefresh={fetchReviewTransactions}
                            cards={cards}
                            categories={allCategories}
                            rules={cashbackRules}
                            getCurrentCashbackMonthForCard={getCurrentCashbackMonthForCard}
                            onEditTransaction={handleEditClick}
                            isDesktop={isDesktop}
                            mccMap={mccMap}
                        />
                        <TransactionsList
                            isDesktop={isDesktop}
                            transactions={activeMonth === 'live' ? liveTransactions : monthlyTransactions}
                            isLoading={activeMonth === 'live' ? isLiveLoading : isMonthlyTxLoading}
                            activeMonth={activeMonth}
                            cardMap={cardMap}
                            categories={allCategories}
                            mccNameFn={mccName}
                            allCards={cards}
                            filterType={transactionFilterType}
                            onFilterTypeChange={setTransactionFilterType}
                            statementMonths={statementMonths}
                            onTransactionDeleted={handleTransactionDeleted}
                            onEditTransaction={handleEditClick}
                            onDuplicateTransaction={handleDuplicateClick}
                            onBulkDelete={handleBulkDelete}
                            onViewDetails={handleViewTransactionDetails}
                            fmtYMShortFn={fmtYMShort}
                            rules={cashbackRules}

                            // Server-side props
                            isServerSide={activeMonth === 'live'}
                            onLoadMore={handleLiveLoadMore}
                            hasMore={liveHasMore}
                            onSearch={handleLiveSearch}
                        />
                    </div>
                )}

                {activeView === 'cards' && (
                    <CardsTab
                        cards={cards}
                        allCards={allCards}
                        monthlySummary={monthlySummary}
                        activeMonth={activeMonth}
                        rules={rules}
                        currencyFn={currency}
                        fmtYMShortFn={fmtYMShort}
                        mccMap={mccMap}
                        isDesktop={isDesktop}
                    />
                )}

                {activeView === 'cashback' && (
                    <div className="space-y-4 pt-4">
                        <CashbackTracker
                            cards={cards}
                            monthlySummary={monthlySummary}
                            onUpdate={() => refreshData(true)}
                            onEditTransaction={handleEditClick}
                            onTransactionDeleted={handleTransactionDeleted}
                            onBulkDelete={handleBulkDelete}
                            onViewTransactionDetails={handleViewTransactionDetails}
                            cardMap={cardMap}
                            rules={cashbackRules}
                            monthlyCategorySummary={monthlyCategorySummary}
                        />
                    </div>
                )}

                {activeView === 'payments' && (
                    <div className="space-y-4 pt-4">
                        <PaymentsTab
                            cards={allCards} // Pass allCards (including Closed) to Payments tab
                            monthlySummary={monthlySummary}
                            currencyFn={currency}
                            fmtYMShortFn={fmtYMShort}
                            daysLeftFn={calculateDaysLeft}
                            onViewTransactions={handleViewTransactions}
                        />
                    </div>
                )}
            </main>

            {/* 4. RENDER THE DIALOG COMPONENT */}

            <BestCardFinderDialog
                isOpen={isFinderOpen}
                onOpenChange={setIsFinderOpen}
                allCards={cards}
                allRules={rules}
                mccMap={mccMap}
                monthlySummary={monthlySummary}
                monthlyCategorySummary={monthlyCategorySummary}
                activeMonth={activeMonth}
                getCurrentCashbackMonthForCard={getCurrentCashbackMonthForCard}
                isDesktop={isDesktop}
            />
            <SharedTransactionsDialog
                isOpen={!!dialogDetails}
                onClose={() => setDialogDetails(null)}
                transactions={dialogTransactions}
                title={dialogDetails ? `Transactions - ${dialogDetails.cardName}` : 'Transactions'}
                description={dialogDetails ? `Viewing statement for ${dialogDetails.monthLabel}` : ''}
                currencyFn={currency}
                isLoading={isDialogLoading}
                cardMap={cardMap}
                rules={cashbackRules}
                allCards={cards}
                monthlyCategorySummary={monthlyCategorySummary}
                onEdit={handleEditClick}
                onDuplicate={handleDuplicateClick}
                onDelete={handleTransactionDeleted}
                onBulkDelete={handleBulkDelete}
            />
            <TransactionDetailSheet
                transaction={viewingTransaction}
                isOpen={!!viewingTransaction}
                onClose={() => setViewingTransaction(null)}
                onEdit={(tx) => {
                    setViewingTransaction(null);
                    handleEditClick(tx);
                }}
                onDuplicate={handleDuplicateClick}
                onDelete={(id, name) => {
                    setViewingTransaction(null);
                    handleTransactionDeleted(id, name);
                }}
                currencyFn={currency}
                allCards={cards}
                rules={cashbackRules}
                monthlyCategorySummary={monthlyCategorySummary}
            />
            <SyncQueueSheet
                isOpen={isSyncingSheetOpen}
                onOpenChange={setIsSyncingSheetOpen}
                queue={needsSyncing}
                onRetry={handleRetrySync}
                onRemove={handleRemoveFromSync}
                isSyncing={isSyncing}
            />
        </div>
        </div>
        </TooltipProvider>
    );
}

// --------------------------
// 3) UI SUB-COMPONENTS
// --------------------------
