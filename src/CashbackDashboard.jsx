// CashbackDashboard.jsx

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { CreditCard, Wallet, CalendarClock, DollarSign, AlertTriangle, Search, Loader2, Plus, History, Check, ChevronDown, List, FilePenLine, LayoutDashboard, ArrowLeftRight, Banknote, Menu, RefreshCw, LogOut } from "lucide-react";
import { Toaster, toast } from 'sonner';

// Import utility functions
import { cn } from "./lib/utils";
import { getMetricSparkline } from './lib/stats';
import { getTodaysMonth, getPreviousMonth, getCurrentCashbackMonthForCard } from './lib/date';

// Import UI components
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./components/ui/accordion";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "./components/ui/tooltip";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./components/ui/sheet";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "./components/ui/drawer";

// Import dialog components
import MobileThemeToggle from "./components/dashboard/header/MobileThemeToggle";
import BestCardFinderDialog from './components/dashboard/dialogs/BestCardFinderDialog';
import PaymentLogDialog from './components/dashboard/dialogs/PaymentLogDialog';
import StatementLogDialog from './components/dashboard/dialogs/StatementLogDialog';
import NeedsSyncingDialog from './components/dashboard/dialogs/NeedsSyncingDialog';

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
import StatCards from './components/dashboard/overview/OverviewStatCards';
import TransactionReview from './components/dashboard/transactions/TransactionReview';
import TransactionsList from './components/dashboard/transactions/TransactionsList';
import TransactionDetailSheet from './components/shared/TransactionDetailSheet';
import CashbackTracker from './components/dashboard/cashback/CashbackTracker';

// Import new CardsTab component
import CardsTab from "./components/dashboard/cards/CardsTab";

// Import authentication component
import LoginScreen from './components/auth/LoginScreen';

// Import shared components
import AppSkeleton from "./components/shared/AppSkeleton";
import StatCard from "./components/shared/StatCard";
import AppSidebar from "./components/shared/AppSidebar";
import SharedTransactionsDialog from "./components/shared/SharedTransactionsDialog";

// Import custom hooks
import useMediaQuery from "./hooks/useMediaQuery";
import useCashbackData from "./hooks/useCashbackData";

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
    const [needsSyncing, setNeedsSyncing] = useState([]);
    const [isSyncingDialogOpen, setIsSyncingDialogOpen] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const [isFinderOpen, setIsFinderOpen] = useState(false);
    const isDesktop = useMediaQuery("(min-width: 768px)");
    const addTxSheetSide = isDesktop ? 'right' : 'bottom';

    const {
        cards, allCards, rules, monthlySummary, mccMap, monthlyCategorySummary,
        recentTransactions, allCategories, commonVendors, reviewTransactions,
        loading, error, refreshData, isShellReady, isDashboardLoading,
        setRecentTransactions, setReviewTransactions,
        cashbackRules, monthlyCashbackCategories, liveSummary,
        fetchReviewTransactions, reviewLoading, fetchCategorySummaryForMonth,
        definitions
    } = useCashbackData(isAuthenticated);

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

    const handleTransactionAdded = (newTransaction) => {
        // 1. Instantly update the list for the current month
        if (newTransaction['Transaction Date'].startsWith(activeMonth.replace('-', ''))) {
                setMonthlyTransactions(prevTxs => [newTransaction, ...prevTxs]);
        }

        // 2. Update the recent transactions carousel
        setRecentTransactions(prevRecent => [newTransaction, ...prevRecent].slice(0, 20));

        // 3. Trigger a full refresh in the background to update all aggregate data (charts, stats, etc.) without a loading screen.
        refreshData(true);
    };

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

    const handleTransactionDeleted = async (deletedTxId, txName) => {
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
    };

    const handleEditClick = (transaction) => {
        setEditingTransaction(transaction);
    };

    const handleDuplicateClick = (transaction) => {
        setDuplicateTransaction(transaction);
        setIsAddTxDialogOpen(true);
    };

    const handleViewTransactionDetails = (transaction) => {
        const cardName = transaction['Card Name'] || (transaction['Card'] && cardMap.get(transaction['Card'][0])?.name);
        setViewingTransaction({ ...transaction, 'Card Name': cardName });
    };

    const handleBulkDelete = async (transactionIds) => {
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
    };

    const handleTransactionUpdated = (updatedTransaction) => {
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

        setEditingTransaction(null); // Close the edit form
        refreshData(true);
    };



    // Dynamic list of available months from transactions
    const statementMonths = useMemo(() => {
        if (!monthlySummary || monthlySummary.length === 0) return [];
        const uniqueMonths = [...new Set(monthlySummary.map(summary => summary.month))];
        return uniqueMonths.sort().reverse();
    }, [monthlySummary]);

    // --- NEW: AUTHENTICATION CHECK EFFECT ---
    useEffect(() => {
        const storedQueue = localStorage.getItem('needsSyncing');
        if (storedQueue) {
            setNeedsSyncing(JSON.parse(storedQueue));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('needsSyncing', JSON.stringify(needsSyncing));

        const syncTransactions = async () => {
            setIsSyncing(true); // <-- 1. SET THE LOCK

            try { // <-- 2. Wrap in try/finally to ensure lock is released
                for (const transaction of needsSyncing) {
                    if (transaction.status === 'pending') {
                        try {
                            let finalSummaryId = null;

                            // --- START: Summary Logic ---
                            const cardId = transaction['Card'] ? transaction['Card'][0] : null;
                            const ruleId = transaction['Applicable Rule'] ? transaction['Applicable Rule'][0] : null;
                            const cardForTx = cardId ? cards.find(c => c.id === cardId) : null;

                            if (ruleId && cardForTx) {
                                const cbMonth = getCurrentCashbackMonthForCard(cardForTx, transaction['Transaction Date']);
                                const summaryResponse = await fetch('/api/summaries', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        cardId: cardId,
                                        month: cbMonth,
                                        ruleId: ruleId
                                    }),
                                });
                                if (!summaryResponse.ok) throw new Error('Failed to create new monthly summary.');
                                const newSummary = await summaryResponse.json();
                                finalSummaryId = newSummary.id;
                            }
                            // --- END: Summary Logic ---


                            // --- START: FIX 1 (Key Mapping) ---
                            const apiPayload = {
                                merchant: transaction['Transaction Name'],
                                amount: transaction['Amount'],
                                date: transaction['Transaction Date'],
                                cardId: cardId,
                                category: transaction['Category'],
                                mccCode: transaction['MCC Code'],
                                merchantLookup: transaction['merchantLookup'],
                                applicableRuleId: ruleId,
                                cardSummaryCategoryId: finalSummaryId,
                                notes: transaction['notes'],
                                otherDiscounts: transaction['otherDiscounts'],
                                otherFees: transaction['otherFees'],
                                foreignCurrencyAmount: transaction['foreignCurrencyAmount'],
                                exchangeRate: transaction['exchangeRate'],
                                foreignCurrency: transaction['foreignCurrency'],
                                conversionFee: transaction['conversionFee'],
                                paidFor: transaction['paidFor'],
                                subCategory: transaction['subCategory'],
                                billingDate: transaction['billingDate'],
                                method: transaction['Method'], // Pass the method field
                            };
                            // --- END: FIX 1 ---

                            // --- START: FIX 2 (POST vs. PATCH) ---
                            const isNewTransaction = transaction.id.includes('T') && transaction.id.includes('Z');
                            // --- END: FIX 2 ---

                            let response;
                            if (isNewTransaction) {
                                response = await fetch('/api/transactions', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(apiPayload),
                                });
                            } else {
                                response = await fetch(`/api/transactions/${transaction.id}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(apiPayload),
                                });
                            }

                            if (!response.ok) {
                                const errorBody = await response.json().catch(() => ({}));
                                console.error("Server responded with error:", response.status, errorBody);
                                throw new Error(`Failed to sync transaction. Server said: ${errorBody.error || 'Bad Request'}`);
                            }

                            const syncedTransaction = await response.json();

                            // Remove from queue *after* successful sync
                            setNeedsSyncing(prevQueue => prevQueue.filter(t => t.id !== transaction.id));

                            handleTransactionUpdated(syncedTransaction);
                            toast.success(`Synced "${syncedTransaction['Transaction Name']}"`);

                        } catch (error) {
                            console.error('Error syncing transaction:', error);
                            setNeedsSyncing(prevQueue =>
                                prevQueue.map(t => t.id === transaction.id ? { ...t, status: 'error' } : t)
                            );
                        }
                    }
                }
            } finally {
                setIsSyncing(false); // <-- 3. RELEASE THE LOCK
            }
        };

        // 4. CHECK THE LOCK before starting
        if (needsSyncing.some(t => t.status === 'pending') && !isSyncing) {
            syncTransactions();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [needsSyncing, cards, monthlySummary, monthlyCategorySummary, isSyncing]); // <-- 5. ADD isSyncing to dependency array


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
        // Determine which month to fetch transactions for.
        const isLiveView = activeMonth === 'live';
        // In Live View, default to the most recent month. Otherwise, use the selected month.
        const monthToFetch = isLiveView ? statementMonths[0] : activeMonth;

        // NEW: Lazy loading - only fetch full transactions if the tab is active
        if (monthToFetch && activeView === 'transactions') {
            const fetchMonthlyTransactions = async () => {
                setIsMonthlyTxLoading(true);
                try {
                    // Use the dynamically determined 'monthToFetch' in the API call.
                    const res = await fetch(`${API_BASE_URL}/transactions?month=${monthToFetch}&filterBy=${transactionFilterType}`);
                    if (!res.ok) {
                        throw new Error('Failed to fetch monthly transactions');
                    }
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
    }, [activeMonth, transactionFilterType, statementMonths, activeView]);

    // --------------------------
    // 2) HELPERS & CALCULATIONS
    // --------------------------

    // --- UTILITIES ---
    const mccName = (code) => mccMap[code]?.vn || "Unknown";

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

    const cardMap = useMemo(() => new Map(allCards.map(c => [c.id, c])), [allCards]); // Use allCards here


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

    const handleRetrySync = (txId) => {
        const updatedQueue = needsSyncing.map(tx =>
            tx.id === txId ? { ...tx, status: 'pending' } : tx
        );
        setNeedsSyncing(updatedQueue);
    };

    const handleRemoveFromSync = (txId) => {
        const updatedQueue = needsSyncing.filter(tx => tx.id !== txId);
        setNeedsSyncing(updatedQueue);
    };

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
                        <Button variant="outline" className="h-10" onClick={() => setIsSyncingDialogOpen(true)}>
                            <History className="mr-2 h-4 w-4" />
                            Needs Syncing ({needsSyncing.length})
                        </Button>
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
                                        needsSyncing={needsSyncing}
                                        setNeedsSyncing={setNeedsSyncing}
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
                                        needsSyncing={needsSyncing}
                                        setNeedsSyncing={setNeedsSyncing}
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
                                        needsSyncing={needsSyncing}
                                        setNeedsSyncing={setNeedsSyncing}
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
                                            needsSyncing={needsSyncing}
                                            setNeedsSyncing={setNeedsSyncing}
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
                            transactions={activeMonth === 'live' ? recentTransactions : monthlyTransactions}
                            isLoading={activeMonth === 'live' ? loading : isMonthlyTxLoading}
                            activeMonth={activeMonth}
                            cardMap={cardMap}
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
                        <PaymentsTabV2
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
            <NeedsSyncingDialog
                isOpen={isSyncingDialogOpen}
                onClose={() => setIsSyncingDialogOpen(false)}
                needsSyncing={needsSyncing}
                onRetry={handleRetrySync}
                onRemove={handleRemoveFromSync}
            />
        </div>
        </div>
        </TooltipProvider>
    );
}

// --------------------------
// 3) UI SUB-COMPONENTS
// --------------------------

function PaymentsTabV2({ cards, monthlySummary, currencyFn, fmtYMShortFn, daysLeftFn, onViewTransactions }) {
    const [paymentData, setPaymentData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [isStatementDialogOpen, setStatementDialogOpen] = useState(false); // State for the new dialog
    const [activeStatement, setActiveStatement] = useState(null);
    const [isLoadingMore, setIsLoadingMore] = useState({});

    const handleLoadMore = useCallback(async (cardId) => {
        setIsLoadingMore(prev => ({ ...prev, [cardId]: true }));
        const cardData = paymentData.find(p => p.mainStatement.card.id === cardId);

        if (!cardData || !cardData.remainingPastSummaries || cardData.remainingPastSummaries.length === 0) {
            setIsLoadingMore(prev => ({ ...prev, [cardId]: false }));
            return;
        }

        const summariesToProcess = cardData.remainingPastSummaries.slice(0, 3);
        const remainingSummaries = cardData.remainingPastSummaries.slice(3);

        try {
            const statementPromises = summariesToProcess.map(async (stmt) => {
                const res = await fetch(`${API_BASE_URL}/transactions?month=${stmt.month}&filterBy=statementMonth&cardId=${cardId}`);
                if (!res.ok) throw new Error('Failed to fetch transactions');
                const transactions = await res.json();
                const spend = transactions.reduce((acc, tx) => acc + (tx['Amount'] || 0), 0);
                const cashback = transactions.reduce((acc, tx) => acc + (tx.estCashback || 0), 0);
                return { ...stmt, spend, cashback };
            });

            const newPastStatements = await Promise.all(statementPromises);

            setPaymentData(currentData =>
                currentData.map(cd => {
                    if (cd.mainStatement.card.id === cardId) {
                        return {
                            ...cd,
                            pastStatements: [...cd.pastStatements, ...newPastStatements],
                            remainingPastSummaries: remainingSummaries
                        };
                    }
                    return cd;
                })
            );
        } catch (error) {
            console.error("Error loading more statements:", error);
            toast.error("Could not load more statements.");
        } finally {
            setIsLoadingMore(prev => ({ ...prev, [cardId]: false }));
        }
    }, [paymentData]);

    const partitionStatements = (allStatements) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const activeWindowStatements = allStatements
            .filter(s => s.statementDateObj && s.paymentDateObj && today >= s.statementDateObj && today <= s.paymentDateObj)
            .sort((a, b) => a.paymentDateObj - b.paymentDateObj);

        if (activeWindowStatements.length > 0) {
            const mainStatement = activeWindowStatements[0];
            const otherStatements = allStatements.filter(s => s.id !== mainStatement.id);

            const upcomingStatements = otherStatements.filter(s => s.daysLeft !== null).sort((a, b) => a.daysLeft - b.daysLeft);
            const pastStatements = otherStatements.filter(s => s.daysLeft === null).sort((a, b) => b.paymentDateObj - a.paymentDateObj);

            return {
                mainStatement,
                upcomingStatements,
                pastStatements
            };
        }

        const upcoming = allStatements.filter(s => s.daysLeft !== null).sort((a, b) => a.daysLeft - b.daysLeft);
        const past = allStatements.filter(s => s.daysLeft === null).sort((a, b) => b.paymentDateObj - a.paymentDateObj);

        const firstUnpaidUpcomingIndex = upcoming.findIndex(s => (s.statementAmount - (s.paidAmount || 0)) > 0);
        const firstUnpaidPastIndex = past.findIndex(s => (s.statementAmount - (s.paidAmount || 0)) > 0);

        let mainStatement = null;
        let finalUpcoming = [...upcoming];
        let finalPast = [...past];

        if (firstUnpaidUpcomingIndex !== -1) {
            mainStatement = finalUpcoming[firstUnpaidUpcomingIndex];
            finalUpcoming.splice(firstUnpaidUpcomingIndex, 1);
        } else if (firstUnpaidPastIndex !== -1) {
            mainStatement = finalPast[firstUnpaidPastIndex];
            finalPast.splice(firstUnpaidPastIndex, 1);
        } else {
            if (finalUpcoming.length > 0) {
                mainStatement = finalUpcoming.shift();
            } else if (finalPast.length > 0) {
                mainStatement = finalPast.shift();
            }
        }

        return {
            mainStatement: mainStatement,
            upcomingStatements: finalUpcoming,
            pastStatements: finalPast
        };
    };

    useEffect(() => {
        const calculatePaymentData = async () => {
            if (cards.length === 0 || monthlySummary.length === 0) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);

            const dataPromises = cards.map(async (card) => {
                const allCardSummaries = monthlySummary.filter(s => s.cardId === card.id);
                if (allCardSummaries.length === 0) return null;

                let finalResult;

                const createStatementObject = (stmt) => {
                    const year = parseInt(stmt.month.slice(0, 4), 10);
                    const month = parseInt(stmt.month.slice(4, 6), 10);

                    const statementDateObj = new Date(year, month - 1, card.statementDay);
                    statementDateObj.setHours(0, 0, 0, 0);

                    const calculatedStatementDate = `${statementDateObj.getFullYear()}-${String(statementDateObj.getMonth() + 1).padStart(2, '0')}-${String(statementDateObj.getDate()).padStart(2, '0')}`;

                    let paymentMonth = month;
                    if (card.paymentDueDay < card.statementDay) paymentMonth += 1;

                    const dueDate = new Date(year, paymentMonth - 1, card.paymentDueDay);
                    dueDate.setHours(0, 0, 0, 0);

                    const paymentDate = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')}`;

                    return { ...stmt, statementDateObj, statementDate: calculatedStatementDate, paymentDateObj: dueDate, daysLeft: daysLeftFn(paymentDate), paymentDate, card };
                };

                const processAndFinalize = (processedStatements, remainingPastSummaries = []) => {
                    const { mainStatement, upcomingStatements, pastStatements } = partitionStatements(processedStatements);
                    const pastDueStatements = pastStatements.filter(s => (s.statementAmount - (s.paidAmount || 0)) > 0);
                    const nextUpcomingStatement = upcomingStatements.length > 0 ? upcomingStatements[0] : null;

                    return {
                        mainStatement,
                        upcomingStatements,
                        pastStatements,
                        pastDueStatements,
                        nextUpcomingStatement,
                        remainingPastSummaries
                    };
                };

                if (card.useStatementMonthForPayments) {
                    const tempStatements = allCardSummaries.map(createStatementObject);
                    const upcomingSummaries = tempStatements.filter(s => s.daysLeft !== null);
                    const allPastSummaries = tempStatements.filter(s => s.daysLeft === null).sort((a, b) => b.paymentDateObj - a.paymentDateObj);
                    const initialPastToProcess = allPastSummaries.slice(0, 3);
                    const remainingPastSummaries = allPastSummaries.slice(3);
                    const summariesToProcess = [...upcomingSummaries, ...initialPastToProcess];

                    const statementPromises = summariesToProcess.map(async (stmt) => {
                        try {
                            const res = await fetch(`${API_BASE_URL}/transactions?month=${stmt.month}&filterBy=statementMonth&cardId=${card.id}`);
                            if (!res.ok) throw new Error('Failed to fetch statement transactions');
                            const transactions = await res.json();
                            const spend = transactions.reduce((acc, tx) => acc + (tx['Amount'] || 0), 0);
                            const cashback = transactions.reduce((acc, tx) => acc + (tx.estCashback || 0), 0);
                            return { ...stmt, spend, cashback };
                        } catch (error) { return { ...stmt, spend: 0, cashback: 0 }; }
                    });

                    const processedStatements = await Promise.all(statementPromises);
                    finalResult = processAndFinalize(processedStatements, remainingPastSummaries);

                } else {
                    const finalStatements = allCardSummaries.map(createStatementObject);
                    finalResult = processAndFinalize(finalStatements);
                }
                 return finalResult;
            });

            const resolvedData = (await Promise.all(dataPromises)).filter(Boolean);

            resolvedData.sort((a, b) => {
                const aDays = a.mainStatement?.daysLeft;
                const bDays = b.mainStatement?.daysLeft;
                if (aDays !== null && bDays === null) return -1;
                if (aDays === null && bDays !== null) return 1;
                if (aDays !== null && bDays !== null) return aDays - bDays;
                return b.mainStatement?.paymentDateObj - a.mainStatement?.paymentDateObj;
            });

            setPaymentData(resolvedData);
            setIsLoading(false);
        };
        calculatePaymentData();
    }, [cards, monthlySummary, daysLeftFn]);

    const handleLogPaymentClick = (statement) => {
        setActiveStatement(statement);
        setDialogOpen(true);
    };

    const handleLogStatementClick = (statement) => {
        setActiveStatement(statement);
        setStatementDialogOpen(true);
    };

    const paymentGroups = useMemo(() => {
        if (!paymentData) {
            return { pastDue: [], upcoming: [], completed: [] };
        }

        const pastDue = [];
        const upcoming = [];
        const completed = [];
        const closed = []; // NEW: Bucket for Closed cards

        paymentData.forEach(p => {
            if (!p.mainStatement) {
                return;
            }

            // Check if card is closed
            if (p.mainStatement.card && p.mainStatement.card.status === 'Closed') {
                closed.push(p);
                return; // Skip the rest of logic for closed cards, they go straight to their own bucket
            }

            const {
                daysLeft,
                statementAmount: rawStatementAmount = 0,
                paidAmount = 0,
                spend = 0,
                cashback = 0
            } = p.mainStatement;

            const finalStatementAmount = rawStatementAmount > 0 ? rawStatementAmount : (spend - cashback);
            const remaining = finalStatementAmount - paidAmount;

            if (daysLeft === null && remaining > 0) {
                pastDue.push(p);
            }
            else if (daysLeft !== null && remaining > 0) {
                upcoming.push(p);
            }
            else {
                completed.push(p);
            }
        });

        return { pastDue, upcoming, completed, closed };
    }, [paymentData]);

    const handleSavePayment = async (statementId, newPaidAmount) => {
        try {
            const response = await fetch(`${API_BASE_URL}/monthly-summary/${statementId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ paidAmount: newPaidAmount }),
            });

            if (!response.ok) {
                throw new Error('Failed to save payment to Notion.');
            }

            setPaymentData(currentData =>
                currentData.map(group => {
                    if (group.mainStatement.id === statementId) {
                        const updatedStatement = { ...group.mainStatement, paidAmount: newPaidAmount };
                        return { ...group, mainStatement: updatedStatement };
                    }
                    return group;
                })
            );
            toast.success("Payment logged successfully!");

        } catch (error) {
            console.error("Error saving payment:", error);
            toast.error("Could not save payment. Please try again.");
        }
    };

    const handleSaveStatement = async (statementId, newAmount) => {
        try {
            const response = await fetch(`${API_BASE_URL}/monthly-summary/${statementId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ statementAmount: newAmount }),
            });

            if (!response.ok) {
                throw new Error('Failed to save statement amount to Notion.');
            }

            setPaymentData(currentData =>
                currentData.map(group => {
                    if (group.mainStatement.id === statementId) {
                        const updatedStatement = { ...group.mainStatement, statementAmount: newAmount };
                        return { ...group, mainStatement: updatedStatement };
                    }
                    return group;
                })
            );
            toast.success("Statement amount updated successfully!");

        } catch (error) {
            console.error("Error saving statement amount:", error);
            toast.error("Could not update statement amount. Please try again.");
        }
    };

    const summaryStats = useMemo(() => {
        const upcomingBills = paymentData.filter(p => p.mainStatement.daysLeft !== null && (p.mainStatement.statementAmount - (p.mainStatement.paidAmount || 0) > 0));

        const totalDue = upcomingBills.reduce((acc, curr) => acc + (curr.mainStatement.statementAmount - (curr.mainStatement.paidAmount || 0)), 0);
        const nextPayment = upcomingBills.length > 0 ? upcomingBills[0] : null;

        return {
            totalDue,
            billCount: upcomingBills.length,
            nextPaymentAmount: nextPayment ? (nextPayment.mainStatement.statementAmount - (nextPayment.mainStatement.paidAmount || 0)) : 0,
            nextPaymentCard: nextPayment ? nextPayment.mainStatement.card.name : 'N/A',
        };
    }, [paymentData]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Calculating payment schedules...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <StatCard title="Total Upcoming" value={currencyFn(summaryStats.totalDue)} icon={<Wallet className="h-4 w-4 text-muted-foreground" />} />
                <StatCard title="Upcoming Bills" value={summaryStats.billCount} icon={<CalendarClock className="h-4 w-4 text-muted-foreground" />} />
                <StatCard title="Next Payment" value={currencyFn(summaryStats.nextPaymentAmount)} icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />} valueClassName="text-orange-600" />
            </div>
            <div className="space-y-8">
                {paymentGroups.pastDue.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-red-600">Past Due</h2>
                        {paymentGroups.pastDue.map(({ mainStatement, ...rest }) => (
                            <PaymentCard
                                key={mainStatement.id}
                                statement={mainStatement}
                                {...rest}
                                onLogPayment={handleLogPaymentClick}
                                onLogStatement={handleLogStatementClick}
                                onViewTransactions={onViewTransactions}
                                currencyFn={currencyFn}
                                fmtYMShortFn={fmtYMShortFn}
                                onLoadMore={handleLoadMore}
                                isLoadingMore={isLoadingMore}
                            />
                        ))}
                    </div>
                )}

                {paymentGroups.upcoming.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-slate-700">Upcoming</h2>
                        {paymentGroups.upcoming.map(({ mainStatement, ...rest }) => (
                            <PaymentCard
                                key={mainStatement.id}
                                statement={mainStatement}
                                {...rest}
                                onLogPayment={handleLogPaymentClick}
                                onLogStatement={handleLogStatementClick}
                                onViewTransactions={onViewTransactions}
                                currencyFn={currencyFn}
                                fmtYMShortFn={fmtYMShortFn}
                                onLoadMore={handleLoadMore}
                                isLoadingMore={isLoadingMore}
                            />
                        ))}
                    </div>
                )}

                {paymentGroups.completed.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-slate-700">Completed</h2>
                        {paymentGroups.completed.map(({ mainStatement, ...rest }) => (
                            <PaymentCard
                                key={mainStatement.id}
                                statement={mainStatement}
                                {...rest}
                                onLogPayment={handleLogPaymentClick}
                                onLogStatement={handleLogStatementClick}
                                onViewTransactions={onViewTransactions}
                                currencyFn={currencyFn}
                                fmtYMShortFn={fmtYMShortFn}
                                onLoadMore={handleLoadMore}
                                isLoadingMore={isLoadingMore}
                            />
                        ))}
                    </div>
                )}

                {paymentGroups.closed.length > 0 && (
                    <Accordion type="single" collapsible className="w-full pt-4">
                        <AccordionItem value="closed-cards-payments">
                            <AccordionTrigger className="text-base font-semibold text-muted-foreground">
                                Show Closed Cards ({paymentGroups.closed.length})
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="space-y-4 pt-4">
                                    {paymentGroups.closed.map(({ mainStatement, ...rest }) => (
                                        <PaymentCard
                                            key={mainStatement.id}
                                            statement={mainStatement}
                                            {...rest}
                                            onLogPayment={handleLogPaymentClick}
                                            onLogStatement={handleLogStatementClick}
                                            onViewTransactions={onViewTransactions}
                                            currencyFn={currencyFn}
                                            fmtYMShortFn={fmtYMShort}
                                            onLoadMore={handleLoadMore}
                                            isLoadingMore={isLoadingMore}
                                        />
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                )}
            </div>
            {activeStatement && (
                 <PaymentLogDialog
                    isOpen={dialogOpen}
                    onClose={() => setDialogOpen(false)}
                    statement={activeStatement}
                    onSave={handleSavePayment}
                    currencyFn={currencyFn}
                    fmtYMShortFn={fmtYMShortFn}
                />
            )}
            {activeStatement && (
                 <StatementLogDialog
                    isOpen={isStatementDialogOpen}
                    onClose={() => setStatementDialogOpen(false)}
                    statement={activeStatement}
                    onSave={handleSaveStatement}
                    currencyFn={currencyFn}
                    fmtYMShortFn={fmtYMShortFn}
                />
            )}
        </div>
    );
}

function PaymentCard({ statement, upcomingStatements, pastStatements, pastDueStatements, nextUpcomingStatement, onLogPayment, onLogStatement, onViewTransactions, currencyFn, fmtYMShortFn, onLoadMore, isLoadingMore }) {
    const [historyOpen, setHistoryOpen] = useState(false);

    // --- UPDATED: Balance Calculation Logic ---
    const {
        card,
        daysLeft,
        statementAmount: rawStatementAmount = 0, // Get the raw amount
        paidAmount = 0,
        spend = 0,
        cashback = 0,
        statementDateObj
    } = statement;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isNotFinalized = statementDateObj && today < statementDateObj;

    // Calculate estimated balance first
    const estimatedBalance = spend - cashback;
    // Use the actual amount if it exists, otherwise fall back to the estimated balance
    const statementAmount = rawStatementAmount > 0 ? rawStatementAmount : estimatedBalance;

    const remaining = statementAmount - paidAmount;
    // A card is considered "paid" if there was a balance and it's now cleared.
    const isPaid = statementAmount > 0 && remaining <= 0;
    // No payment is needed if the final balance is zero or negative (e.g., cashback > spend).
    const noPaymentNeeded = statementAmount <= 0;
    const isPartiallyPaid = paidAmount > 0 && !isPaid;

    const getStatus = () => {
        if (noPaymentNeeded) return {
            text: 'No Payment Needed',
            className: 'bg-slate-100 text-slate-600',
            icon: <Check className="h-3 w-3 mr-1.5" />
        };
        if (isPaid) return {
            text: 'Fully Paid',
            className: 'bg-emerald-100 text-emerald-800',
            icon: <Check className="h-3 w-3 mr-1.5" />
        };
        if (isPartiallyPaid) return {
            text: 'Partially Paid',
            className: 'bg-yellow-100 text-yellow-800'
        };
        if (daysLeft === null) return {
            text: 'Completed',
            className: 'bg-slate-100 text-slate-600'
        };
         if (daysLeft <= 3) return {
            text: `${daysLeft} days left`,
            className: 'bg-red-100 text-red-800'
        };
        if (daysLeft <= 7) return {
            text: `${daysLeft} days left`,
            className: 'bg-yellow-100 text-yellow-800'
        };
        return {
            text: `${daysLeft} days left`,
            className: 'bg-slate-100 text-slate-800'
        };
    };

    const status = getStatus();

    return (
        <div className={cn("bg-card text-card-foreground rounded-xl shadow-sm overflow-hidden border",
            (isPaid || noPaymentNeeded) && "opacity-80",
            !isPaid && daysLeft !== null && daysLeft <= 3 && "border-2 border-red-500",
            isPartiallyPaid && "border-2 border-yellow-500"
        )}>
            {pastDueStatements && pastDueStatements.length > 0 && (
                <div className="p-4 bg-orange-50 border-b border-orange-200">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-orange-500 mt-0-5 flex-shrink-0" />
                        <div>
                            <h4 className="font-bold text-sm text-orange-800">Past Due Payments Found</h4>
                            <div className="mt-1 text-xs text-orange-700 space-y-1">
                                {pastDueStatements.map(stmt => (
                                    <div key={stmt.id} className="flex justify-between items-center">
                                        <span>Statement for {fmtYMShortFn(stmt.month)}:</span>
                                        <div className="text-xs text-slate-500 mt-2 flex items-center gap-4">
                                            <span>Statement Date: <span className="font-medium text-slate-600">{statement.statementDate}</span></span>
                                            <span>Payment Due: <span className="font-medium text-slate-600">{statement.paymentDate}</span></span>
                                        </div>
                                        <span className="font-semibold ml-2">{currencyFn(stmt.statementAmount - (stmt.paidAmount || 0))}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="p-4">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200 text-lg">{card.name} <span className="text-base font-medium text-slate-400">•••• {card.last4}</span></p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                            <span>
                                Statement: <span className="font-medium text-slate-600 dark:text-slate-300">{fmtYMShortFn(statement.month)}</span>
                            </span>
                            <span className="text-slate-400">•</span>
                            <span>
                                Issued: <span className="font-medium text-slate-600 dark:text-slate-300">{statement.statementDate}</span>
                            </span>
                            <span className="text-slate-400">•</span>
                            <span>
                                Due: <span className="font-medium text-slate-600 dark:text-slate-300">{statement.paymentDate}</span>
                            </span>
                        </div>
                    </div>
                    <div className={cn("text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 inline-flex items-center", status.className)}>
                        {status.icon}{status.text}
                    </div>
                </div>

                {/* --- NEW: "Not Finalized" Banner --- */}
                {isNotFinalized && (
                    <div className="mb-4 p-3 rounded-lg bg-sky-50 border border-sky-200">
                        <div className="flex items-start gap-3">
                            <CalendarClock className="h-5 w-5 text-sky-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="font-bold text-sm text-sky-800">Statement Not Finalized</h4>
                                <p className="mt-1 text-xs text-sky-700">
                                    This balance is an active estimate and will be finalized on the statement date.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex flex-col md:flex-row gap-4">
                    {noPaymentNeeded ? (
                        <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 flex flex-col items-center justify-center text-center h-40">
                            <Wallet className="h-8 w-8 text-slate-400 dark:text-slate-500 mb-2" />
                            <p className="font-semibold text-slate-700 dark:text-slate-300">No Balance This Month</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">You're all clear for this statement cycle.</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex-1 bg-slate-100/80 dark:bg-slate-800/50 rounded-lg p-3">
                                {/* Label changed from ACTUAL BALANCE */}
                                <div className="flex items-center gap-2">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">STATEMENT BALANCE</p>
                                    {/* Move the badge logic here and remove the top margin */}
                                    {(rawStatementAmount === 0 || rawStatementAmount === null) && <Badge variant="outline">Estimated</Badge>}
                                </div>
                                <p className="text-3xl font-extrabold text-slate-800 dark:text-slate-200 tracking-tight">{currencyFn(statementAmount)}</p>
                                <div className="mt-2 space-y-1 text-sm">
                                    <div className="flex justify-between items-center"><span className="text-slate-500 dark:text-slate-400">Paid:</span><span className="font-medium text-slate-600 dark:text-slate-300">{currencyFn(paidAmount)}</span></div>
                                    <div className="flex justify-between items-center font-bold"><span className="text-slate-500 dark:text-slate-400">Remaining:</span><span className={cn(isPaid ? "text-emerald-600" : "text-red-600")}>{currencyFn(remaining)}</span></div>
                                </div>
                            </div>
                            <div className="w-full md:w-64 bg-slate-50/70 dark:bg-slate-800/30 rounded-lg p-3">
                                {/* Label changed from ESTIMATED BALANCE */}
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">SPEND SUMMARY</p>
                                <p className="text-2xl font-bold text-slate-500 dark:text-slate-400 tracking-tight">{currencyFn(estimatedBalance)}</p>
                                <div className="mt-2 space-y-1 text-sm">
                                    <div className="flex justify-between items-center"><span className="text-slate-500 dark:text-slate-400">Total Spend:</span><span className="font-medium text-slate-600 dark:text-slate-300">{currencyFn(spend)}</span></div>
                                    <div className="flex justify-between items-center"><span className="text-slate-500 dark:text-slate-400">Cashback:</span><span className="font-medium text-emerald-600">-{currencyFn(cashback)}</span></div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="mt-4 flex justify-end items-center gap-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button onClick={() => onViewTransactions(card.id, card.name, statement.month, fmtYMShortFn(statement.month))} variant="outline" size="icon" className="sm:w-auto sm:px-3">
                                    <History className="h-4 w-4" />
                                    <span className="hidden sm:inline ml-1.5">Transaction Details</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className="sm:hidden"><p>Transaction Details</p></TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button onClick={() => onLogStatement(statement)} variant="outline" size="icon" className="sm:w-auto sm:px-3">
                                    <FilePenLine className="h-4 w-4" />
                                    <span className="hidden sm:inline ml-1.5">Log Statement</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className="sm:hidden"><p>Log Statement Amount</p></TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    onClick={() => setHistoryOpen(!historyOpen)}
                                    variant="outline"
                                    size="icon"
                                    className="sm:w-auto sm:px-3"
                                >
                                    <List className="h-4 w-4" />
                                    <span className="hidden sm:inline ml-1.5">Statements</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className="sm:hidden"><p>Statements</p></TooltipContent>
                        </Tooltip>

                        {!noPaymentNeeded && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button onClick={() => onLogPayment(statement)} disabled={isPaid} size="icon" className="sm:w-auto sm:px-3">
                                        {isPaid ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                        <span className="hidden sm:inline ml-1.5">{isPaid ? 'Paid' : 'Log Payment'}</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent className="sm:hidden"><p>{isPaid ? 'Paid' : 'Log Payment'}</p></TooltipContent>
                            </Tooltip>
                        )}
                    </TooltipProvider>
                </div>
            </div>

            {isPaid && nextUpcomingStatement && (
                <div className="p-4 border-t border-slate-200 bg-slate-50/50">
                    <div className="p-4 rounded-lg bg-sky-50 border border-sky-200">
                        {/* Header Section */}
                        <div className="flex items-center gap-2 mb-3">
                            <CalendarClock className="h-5 w-5 text-sky-600" />
                            <h4 className="font-bold text-sm text-sky-800">Next Statement Preview</h4>
                        </div>

                        {/* Horizontally Aligned Content */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center md:text-left">
                            {/* --- Statement Month --- */}
                            <div>
                                <p className="text-xs text-sky-700 font-semibold uppercase tracking-wider">Statement Month</p>
                                <p className="text-lg font-bold text-sky-900">{fmtYMShortFn(nextUpcomingStatement.month)}</p>
                            </div>

                            {/* --- NEW: Est. Statement Due --- */}
                            <div>
                                <p className="text-xs text-sky-700 font-semibold uppercase tracking-wider">Est. Statement Due</p>
                                <p className="text-lg font-bold text-sky-900">{nextUpcomingStatement.statementDate}</p>
                            </div>

                            {/* --- Est. Payment Due --- */}
                            <div>
                                <p className="text-xs text-sky-700 font-semibold uppercase tracking-wider">Est. Payment Due</p>
                                <p className="text-lg font-bold text-sky-900">{nextUpcomingStatement.paymentDate}</p>
                            </div>

                            {/* --- Current Est. Balance --- */}
                            <div className="md:text-right">
                                <p className="text-xs text-sky-700 font-semibold uppercase tracking-wider">Current Est. Balance</p>
                                <p className="text-2xl font-extrabold text-sky-900 tracking-tight">
                                    {currencyFn(nextUpcomingStatement.spend - nextUpcomingStatement.cashback)}
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {historyOpen && (
                <div className="p-4 border-t border-slate-200 bg-slate-50/50 space-y-4">
                    <StatementHistoryTable title="Upcoming Statements" statements={upcomingStatements} currencyFn={currencyFn} fmtYMShortFn={fmtYMShortFn} onViewTransactions={onViewTransactions} />
                    <StatementHistoryTable title="Past Statements" statements={pastStatements} remainingCount={statement.remainingPastSummaries?.length || 0} onLoadMore={() => onLoadMore(statement.card.id)} isLoadingMore={isLoadingMore[statement.card.id]} currencyFn={currencyFn} fmtYMShortFn={fmtYMShortFn} onViewTransactions={onViewTransactions} />
                </div>
            )}
        </div>
    );
}

function StatementHistoryTable({ title, statements, remainingCount, onLoadMore, isLoadingMore, currencyFn, fmtYMShortFn, onViewTransactions }) {
    if (!statements || statements.length === 0) {
        return null; // Don't render anything if there are no statements
    }

    return (
        <div>
            <h3 className="text-sm font-semibold mb-2 text-slate-600 dark:text-slate-300">{title}</h3>
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="w-full text-sm whitespace-nowrap">
                    <thead className="text-left text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800">
                        <tr>
                            <th className="sticky left-0 bg-slate-100 dark:bg-slate-800 p-2 font-medium">Month</th>
                            <th className="p-2 font-medium">Status</th>
                            <th className="p-2 font-medium">Statement Date</th>
                            <th className="p-2 font-medium">Payment Date</th>
                            <th className="p-2 font-medium text-right">Spend</th>
                            <th className="p-2 font-medium text-right">Cashback</th>
                            <th className="p-2 font-medium text-right">Actual Balance</th>
                            <th className="p-2 font-medium text-right">Paid</th>
                            <th className="p-2 font-medium text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900">
                        {statements.map(stmt => {
                            let statusBadge;
                            if (stmt.daysLeft === null) {
                                statusBadge = <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full">Completed</span>;
                            } else {
                                statusBadge = <span className="bg-sky-100 text-sky-800 text-xs font-bold px-2 py-0.5 rounded-full">Upcoming</span>;
                            }

                            return (
                                <tr key={stmt.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="sticky left-0 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2"><span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium px-2 py-1 rounded-md text-xs">{fmtYMShortFn(stmt.month)}</span></td>
                                    <td className="p-2">{statusBadge}</td>
                                    <td className="p-2">{stmt.statementDate}</td>
                                    <td className="p-2">{stmt.paymentDate}</td>
                                    <td className="p-2 text-right">{currencyFn(stmt.spend)}</td>
                                    <td className="p-2 text-right text-emerald-600">-{currencyFn(stmt.cashback)}</td>
                                    <td className="p-2 text-right font-bold text-slate-700 dark:text-slate-300">{currencyFn(stmt.statementAmount)}</td>
                                    <td className="p-2 text-right">{currencyFn(stmt.paidAmount)}</td>
                                    <td className="p-2 text-center">
                                        <button
                                            onClick={() => onViewTransactions(stmt.card.id, stmt.card.name, stmt.month, fmtYMShortFn(stmt.month))}
                                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                        >
                                            <List className="h-5 w-5"/>
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    {remainingCount > 0 && (
                        <tfoot className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <td colSpan="9" className="text-center p-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={onLoadMore}
                                        disabled={isLoadingMore}
                                    >
                                        {isLoadingMore ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <ChevronDown className="mr-2 h-4 w-4" />
                                        )}
                                        Load More ({remainingCount} remaining)
                                    </Button>
                                </td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </div>
    );
}
