// CashbackDashboard.jsx

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { CreditCard, DollarSign, AlertTriangle, Loader2, LayoutDashboard, ArrowLeftRight, Banknote, Settings } from "lucide-react";
import { Toaster, toast } from 'sonner';

// Import utility functions
import { cn } from "./lib/utils";
import { getCurrentCashbackMonthForCard } from './lib/date';

// Import UI components
import { TooltipProvider } from "./components/ui/tooltip";

// Import dialog components
import BestCardFinderDialog from './components/dashboard/dialogs/BestCardFinderDialog';
import SyncQueueSheet from './components/shared/SyncQueueSheet';
import DashboardHeader from "./components/dashboard/header/DashboardHeader";

// Import overview tab components
import CardSpendsCap from "./components/dashboard/overview/CardSpendsCap";
import EnhancedSuggestions from "./components/dashboard/overview/EnhancedSuggestions";
import CombinedCardStatsChart from "./components/dashboard/overview/CombinedCardStatsChart";
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

// Import new SettingsTab component
import SettingsTab from "./components/dashboard/settings/SettingsTab";

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
import useLiveTransactions from "./hooks/useLiveTransactions";
import useDashboardStats from "./hooks/useDashboardStats";

// Import constants and utilities
import { COLORS } from './lib/constants';
import { calculateDaysLeft } from './lib/date';
import { currency, fmtYMShort } from './lib/formatters';

const navItems = [
    { view: 'overview', icon: LayoutDashboard, label: 'Overview' },
    { view: 'transactions', icon: ArrowLeftRight, label: 'Transactions' },
    { view: 'cards', icon: CreditCard, label: 'My Cards' },
    { view: 'cashback', icon: DollarSign, label: 'Cashback' },
    { view: 'payments', icon: Banknote, label: 'Payments' },
    { view: 'settings', icon: Settings, label: 'Settings' },
];

export default function CashbackDashboard() {
    const {
        liveTransactions, setLiveTransactions,
        liveCursor, setLiveCursor,
        liveHasMore, setLiveHasMore,
        isLiveLoading, setIsLiveLoading,
        isLiveAppending, setIsLiveAppending,
        liveSearchTerm, setLiveSearchTerm,
        liveDateRange, setLiveDateRange,
        liveSort, setLiveSort,
        liveCardFilter, setLiveCardFilter,
        liveCategoryFilter, setLiveCategoryFilter,
        liveMethodFilter, setLiveMethodFilter,
        fetchLiveTransactions,
        handleLiveLoadMore,
        handleLiveSearch,
        handleLiveDateRangeChange,
        handleLiveSortChange,
        handleLiveFilterChange
    } = useLiveTransactions();

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

    // --- LOADING STATES ---
    const [processingIds, setProcessingIds] = useState(new Set());

    const isDesktop = useMediaQuery("(min-width: 768px)");
    const addTxSheetSide = isDesktop ? 'right' : 'bottom';

    const {
        cards, allCards, rules, monthlySummary, mccMap, monthlyCategorySummary,
        recentTransactions, allCategories, commonVendors, reviewTransactions,
        error, refreshData, isShellReady, isDashboardLoading,
        setRecentTransactions, setReviewTransactions,
        cashbackRules, monthlyCashbackCategories, liveSummary,
        fetchReviewTransactions, reviewLoading, fetchSummariesForMonth,
        definitions, updateCard, updateRule, availableMonths
    } = useCashbackData(isAuthenticated);


    // --- SYNC LOGIC ---
    const handleBackgroundSyncSuccess = useCallback((updatedTransaction, oldId) => {
        const targetId = oldId || updatedTransaction.id;

        // Find and replace the transaction in the list for an instant UI update
        // without disrupting the user or closing the form
        setMonthlyTransactions(prevTxs =>
            prevTxs.map(tx => tx.id === targetId ? updatedTransaction : tx)
        );

        // Also update the recent transactions carousel
        setRecentTransactions(prevRecent =>
            prevRecent.map(tx => tx.id === targetId ? updatedTransaction : tx)
        );

        // Update Live Transactions (Critical for "Appears Faster")
        setLiveTransactions(prevLive =>
            prevLive.map(tx => tx.id === targetId ? updatedTransaction : tx)
        );

        setReviewTransactions(prevReview =>
            prevReview.filter(tx => tx.id !== targetId && tx.id !== updatedTransaction.id)
        );

        // Quietly refresh other data, skipping static resources (cards, rules)
        refreshData(true, true);
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

    const syncingIds = useMemo(() => {
        return new Set(needsSyncing.filter(t => t.status === 'pending').map(t => t.id));
    }, [needsSyncing]);

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

    const fetchedMonthsRef = React.useRef(new Set());

    // Trigger lazy load of BOTH summaries when activeMonth changes
    useEffect(() => {
        if (!monthlyCategorySummary || !monthlySummary) return;

        if (activeMonth === 'live') {
            const requiredMonths = new Set();
            cards.forEach(card => {
                const currentMonth = getCurrentCashbackMonthForCard(card);
                requiredMonths.add(currentMonth);
            });

            const missingMonths = [...requiredMonths].filter(m => !fetchedMonthsRef.current.has(m));

            if (missingMonths.length > 0) {
                missingMonths.forEach(month => {
                    fetchedMonthsRef.current.add(month);
                    fetchSummariesForMonth(month);
                });
            }
        } else {
            if (!fetchedMonthsRef.current.has(activeMonth)) {
                fetchedMonthsRef.current.add(activeMonth);
                fetchSummariesForMonth(activeMonth);
            }
        }
    }, [activeMonth, monthlyCategorySummary, monthlySummary, fetchSummariesForMonth, cards]);

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
        // Skip static data fetch to prevent unnecessary re-renders of memoized components.
        refreshData(true, true);
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

        setProcessingIds(prev => {
            const next = new Set(prev);
            next.add(deletedTxId);
            return next;
        });

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
            setLiveTransactions(prev => prev.filter(tx => tx.id !== deletedTxId)); // Optimistic Live Update

            // Also remove it from the recent transactions carousel for consistency
            setRecentTransactions(prevRecent => prevRecent.filter(tx => tx.id !== deletedTxId));

            // Also remove it from the review transactions list
            setReviewTransactions(prevReview => prevReview.filter(tx => tx.id !== deletedTxId));

            toast.success('Transaction deleted successfully!');

            // Optionally, trigger a silent refresh to ensure all aggregate data is up-to-date
            refreshData(true, true);

        } catch (error) {
            console.error("Delete failed:", error);
            toast.error("Could not delete the transaction. Please try again.");
        } finally {
            setProcessingIds(prev => {
                const next = new Set(prev);
                next.delete(deletedTxId);
                return next;
            });
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

        setProcessingIds(prev => {
            const next = new Set(prev);
            transactionIds.forEach(id => next.add(id));
            return next;
        });

        try {
            const response = await fetch(`${API_BASE_URL}/transactions/bulk-delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: transactionIds }),
            });

            if (!response.ok) {
                throw new Error('Failed to delete transactions on the server.');
            }

            const idsSet = new Set(transactionIds);

            setMonthlyTransactions(prevTxs => prevTxs.filter(tx => !idsSet.has(tx.id)));
            setLiveTransactions(prev => prev.filter(tx => !idsSet.has(tx.id))); // Optimistic Live Update
            setRecentTransactions(prevRecent => prevRecent.filter(tx => !idsSet.has(tx.id)));
            setReviewTransactions(prevReview => prevReview.filter(tx => !idsSet.has(tx.id)));
            toast.success(`${transactionIds.length} transactions deleted successfully!`);
            refreshData(true, true);
        } catch (error) {
            console.error("Bulk delete failed:", error);
            toast.error("Could not delete transactions. Please try again.");
        } finally {
            setProcessingIds(prev => {
                const next = new Set(prev);
                transactionIds.forEach(id => next.delete(id));
                return next;
            });
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

        refreshData(true, true);
    }, [setRecentTransactions, setReviewTransactions, refreshData, editingTransaction]);

    const handleBulkTransactionUpdate = useCallback((updatedTransactions) => {
        if (!updatedTransactions || updatedTransactions.length === 0) return;

        const updatedIds = new Set(updatedTransactions.map(t => t.id));

        // Update Monthly
        setMonthlyTransactions(prev => prev.map(tx => updatedIds.has(tx.id) ? updatedTransactions.find(u => u.id === tx.id) : tx));

        // Update Live
        setLiveTransactions(prev => prev.map(tx => updatedIds.has(tx.id) ? updatedTransactions.find(u => u.id === tx.id) : tx));

        // Update Review
        setReviewTransactions(prev => prev.map(tx => updatedIds.has(tx.id) ? updatedTransactions.find(u => u.id === tx.id) : tx));

        // Update Recent
        setRecentTransactions(prev => prev.map(tx => updatedIds.has(tx.id) ? updatedTransactions.find(u => u.id === tx.id) : tx));

        refreshData(true, true);
    }, [refreshData, setRecentTransactions, setReviewTransactions]);

    // NEW: Optimistic updates from TransactionReview actions
    const handleTransactionReviewUpdate = useCallback((action, txIdOrIds, updatedData) => {
        if (action === 'delete') {
            const idsToDelete = Array.isArray(txIdOrIds) ? new Set(txIdOrIds) : new Set([txIdOrIds]);

            setMonthlyTransactions(prev => prev.filter(tx => !idsToDelete.has(tx.id)));
            setLiveTransactions(prev => prev.filter(tx => !idsToDelete.has(tx.id)));
            setRecentTransactions(prev => prev.filter(tx => !idsToDelete.has(tx.id)));
            setReviewTransactions(prev => prev.filter(tx => !idsToDelete.has(tx.id)));
        } else if (action === 'update' && updatedData) {
            // Update in lists if exists, otherwise append if it matches current view criteria?
            // For simplicity and safety, we mainly update existing items.
            // "Quick Approve" might move it from Review to Main lists if it wasn't there (but usually it is).

            const updateList = (list) => list.map(tx => tx.id === txIdOrIds ? updatedData : tx);

            setMonthlyTransactions(updateList);
            setLiveTransactions(updateList);
            setRecentTransactions(updateList);

            // For Review list, we usually remove it if it's approved/fixed?
            // Or update it if it still needs review?
            // TransactionReview component handles removing it from its own list via optimistic state.
            // But we should sync the prop `reviewTransactions` too.
            // If updatedData.status is 'Review Needed' or similar, keep it.
            // If 'Automated' is false and Match is true, it might not be in "needs-review" anymore.
            // For now, let's assume if we update it here, we update it everywhere.
             setReviewTransactions(prev => prev.map(tx => tx.id === txIdOrIds ? updatedData : tx));
        }

        // We do NOT trigger full refreshData here to keep it instant.
        // The background refresh is triggered by the caller if needed (e.g. onRefresh prop in TransactionReview).
    }, [setRecentTransactions, setReviewTransactions]);



    // We now use availableMonths directly from useCashbackData
    // Removed old statementMonths useMemo.

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



    const fetchMonthlyTransactions = useCallback(async () => {
        if (!activeMonth || activeMonth === 'live') return;

        setIsMonthlyTxLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/transactions?month=${activeMonth}&filterBy=${transactionFilterType}`);
            if (!res.ok) throw new Error('Failed to fetch monthly transactions');
            const data = await res.json();
            setMonthlyTransactions(data);
        } catch (err) {
            console.error(err);
            setMonthlyTransactions([]);
        } finally {
            setIsMonthlyTxLoading(false);
        }
    }, [activeMonth, transactionFilterType]);

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
        else if (activeView === 'transactions') {
            fetchMonthlyTransactions();
        }
    }, [activeMonth, activeView, fetchLiveTransactions, fetchMonthlyTransactions, liveTransactions.length]);

    const handleGlobalRefresh = useCallback(() => {
        fetchReviewTransactions();
        if (activeMonth === 'live') {
            fetchLiveTransactions(null, liveSearchTerm, false);
        } else {
            fetchMonthlyTransactions();
        }
        // Skip static data fetch for smoother UX in transaction review
        refreshData(true, true);
    }, [fetchReviewTransactions, activeMonth, fetchLiveTransactions, liveSearchTerm, fetchMonthlyTransactions, refreshData]);

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


    const {
        liveChartPeriod, setLiveChartPeriod,
        displayStats, overviewChartStats,
        liveOverviewChartStats, cardPerformanceData
    } = useDashboardStats({
        activeMonth, monthlySummary, liveSummary,
        cards, recentTransactions, monthlyTransactions
    });

    // cardsTabStats MOVED TO CardsTab
    // const cardsTabStats = useMemo(() => { ... }, [allCards]);

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
            <DashboardHeader
                activeView={activeView}
                setActiveView={setActiveView}
                isFinderOpen={isFinderOpen}
                setIsFinderOpen={setIsFinderOpen}
                handleLogout={handleLogout}
                refreshData={refreshData}
                needsSyncing={needsSyncing}
                isSyncing={isSyncing}
                isSyncingSheetOpen={isSyncingSheetOpen}
                setIsSyncingSheetOpen={setIsSyncingSheetOpen}
                activeMonth={activeMonth}
                setActiveMonth={setActiveMonth}
                availableMonths={availableMonths}
                isAddTxDialogOpen={isAddTxDialogOpen}
                setIsAddTxDialogOpen={setIsAddTxDialogOpen}
                duplicateTransaction={duplicateTransaction}
                editingTransaction={editingTransaction}
                setEditingTransaction={setEditingTransaction}
                addToQueue={addToQueue}
                handleTransactionAdded={handleTransactionAdded}
                handleTransactionUpdated={handleTransactionUpdated}
                isDesktop={isDesktop}
                addTxSheetSide={addTxSheetSide}
                cards={cards}
                allCategories={allCategories}
                definitions={definitions}
                cashbackRules={cashbackRules}
                monthlyCashbackCategories={monthlyCashbackCategories}
                mccMap={mccMap}
                commonVendors={commonVendors}
                monthlySummary={monthlySummary}
                monthlyCategorySummary={monthlyCategorySummary}
                getCurrentCashbackMonthForCard={getCurrentCashbackMonthForCard}
                navItems={navItems}
            />
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
                            <CurrentCashflowChart
                                data={cardPerformanceData}
                                cards={cards}
                                currencyFn={currency}
                            />
                        </div>

                        <div className="mt-4">
                            <CummulativeResultsChart
                                data={cardPerformanceData}
                                cards={cards}
                                currencyFn={currency}
                                cardColorMap={cardColorMap}
                            />
                        </div>

                        {/* --- 4. SPEND AND CASHBACK BY CARD CHARTS --- */}
                        <div className="grid gap-4 mt-4">
                            <CombinedCardStatsChart
                                data={activeMonth === 'live' ? liveOverviewChartStats : overviewChartStats}
                                currencyFn={currency}
                                isLiveView={activeMonth === 'live'}
                                period={liveChartPeriod}
                                onPeriodChange={setLiveChartPeriod}
                            />
                        </div>
                    </div>
                )}

                {activeView === 'transactions' && (
                    <div className="pt-4 space-y-4">
                        <TransactionReview
                            transactions={reviewTransactions}
                            isLoading={reviewLoading}
                            onRefresh={handleGlobalRefresh}
                            cards={cards}
                            categories={allCategories}
                            rules={cashbackRules}
                            getCurrentCashbackMonthForCard={getCurrentCashbackMonthForCard}
                            onEditTransaction={handleEditClick}
                            isDesktop={isDesktop}
                            mccMap={mccMap}
                            setReviewTransactions={setReviewTransactions}
                            onReviewUpdate={handleTransactionReviewUpdate}
                        />
                        <TransactionsList
                            isDesktop={isDesktop}
                            transactions={activeMonth === 'live' ? liveTransactions : monthlyTransactions}
                            isLoading={activeMonth === 'live' ? isLiveLoading : isMonthlyTxLoading}
                            activeMonth={activeMonth}
                            cardMap={cardMap}
                            categories={allCategories}
                            mccNameFn={mccName}
                            mccMap={mccMap}
                            allCards={cards}
                            filterType={transactionFilterType}
                            onFilterTypeChange={setTransactionFilterType}
                            statementMonths={availableMonths}
                            onTransactionDeleted={handleTransactionDeleted}
                            onEditTransaction={handleEditClick}
                            onDuplicateTransaction={handleDuplicateClick}
                            onBulkDelete={handleBulkDelete}
                            onBulkUpdate={handleBulkTransactionUpdate}
                            onViewDetails={handleViewTransactionDetails}
                            fmtYMShortFn={fmtYMShort}
                            rules={cashbackRules}
                            getCurrentCashbackMonthForCard={getCurrentCashbackMonthForCard}
                            processingIds={processingIds}
                            syncingIds={syncingIds}

                            // Server-side props
                            isServerSide={activeMonth === 'live'}
                            onLoadMore={handleLiveLoadMore}
                            hasMore={liveHasMore}
                            onSearch={handleLiveSearch}
                            onSortChange={handleLiveSortChange}
                            onFilterChange={handleLiveFilterChange}
                            dateRange={liveDateRange}
                            onDateRangeChange={handleLiveDateRangeChange}
                            isAppending={activeMonth === 'live' ? isLiveAppending : false}
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
                        onUpdateCard={updateCard}
                        onUpdateRule={updateRule}
                    />
                )}

                {activeView === 'cashback' && (
                    <div className="space-y-4 pt-4">
                        <CashbackTracker
                            cards={cards}
                            monthlySummary={monthlySummary}
                            onUpdate={() => refreshData(true, true)}
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

                {activeView === 'settings' && (
                    <div className="space-y-4 pt-4">
                        <SettingsTab />
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
