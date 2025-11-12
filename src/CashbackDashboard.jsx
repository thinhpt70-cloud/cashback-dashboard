// CashbackDashboard.jsx

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { CreditCard, Wallet, CalendarClock, TrendingUp, DollarSign, AlertTriangle, RefreshCw, Search, Loader2, Plus, History, Check, Snowflake, LogOut, ArrowUp, ArrowDown, ChevronsUpDown, ChevronDown, List, MoreHorizontal, FilePenLine, Trash2 } from "lucide-react";
import { Toaster, toast } from 'sonner';

// Import utility functions
import { cn } from "./lib/utils";
import { getMetricSparkline } from './lib/stats';
import { getTodaysMonth, getPreviousMonth, getCurrentCashbackMonthForCard } from './lib/date';

// Import UI components
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { Progress } from "./components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./components/ui/tabs";
import { Input } from "./components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./components/ui/accordion";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./components/ui/table";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "./components/ui/tooltip";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./components/ui/sheet";
import { Skeleton } from "./components/ui/skeleton";

// Import dialog components
import BestCardFinderDialog from './components/dashboard/dialogs/BestCardFinderDialog';
import TransactionDetailsDialog from './components/dashboard/dialogs/TransactionDetailsDialog';
import PaymentLogDialog from './components/dashboard/dialogs/PaymentLogDialog';
import StatementLogDialog from './components/dashboard/dialogs/StatementLogDialog';
import CardInfoSheet from './components/dashboard/dialogs/CardInfoSheet';

// Import form components
import AddTransactionForm from './components/dashboard/forms/AddTransactionForm';

// Import overview tab components
import CardSpendsCap from "./components/dashboard/tabs/overview/CardSpendsCap";
import EnhancedSuggestions from "./components/dashboard/tabs/overview/EnhancedSuggestions";
import SpendByCardChart from "./components/dashboard/tabs/overview/SpendByCardChart";
import CashbackByCardChart from "./components/dashboard/tabs/overview/CashbackByCardChart";
import CardPerformanceLineChart from "./components/dashboard/tabs/overview/CardPerformanceLineChart";
import RecentTransactions from './components/dashboard/tabs/overview/RecentTransactions';
import CummulativeResultsChart from "./components/dashboard/tabs/overview/CummulativeResultsChart";
import StatCards from './components/dashboard/tabs/overview/OverviewStatCards';

// Import transactions tab components
import TransactionReviewCenter from './components/dashboard/tabs/transactions/TransactionReviewCenter';

// Import authentication component
import LoginScreen from './components/auth/LoginScreen';

// Import shared components
import AppSkeleton from "./components/shared/AppSkeleton";
import StatCard from "./components/shared/StatCard";
import { ModeToggle } from "./components/ui/ThemeToggle";

// Import custom hooks
import useMediaQuery from "./hooks/useMediaQuery";
import useIOSKeyboardGapFix from "./hooks/useIOSKeyboardGapFix";
import useCashbackData from "./hooks/useCashbackData";

// Import constants and utilities
import { COLORS, cardThemes } from './lib/constants';
import { calculateDaysLeft } from './lib/date';
import { currency, fmtYMShort } from './lib/formatters';

const API_BASE_URL = '/api';

export default function CashbackDashboard() {

    const [activeMonth, setActiveMonth] = useState("live");
    const [monthlyTransactions, setMonthlyTransactions] = useState([]);
    const [isMonthlyTxLoading, setIsMonthlyTxLoading] = useState(true);
    const [isAddTxDialogOpen, setIsAddTxDialogOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [transactionFilterType, setTransactionFilterType] = useState('date'); // 'date' or 'cashbackMonth'
    const [dialogDetails, setDialogDetails] = useState(null); // Will hold { cardId, cardName, month, monthLabel }
    const [dialogTransactions, setDialogTransactions] = useState([]);
    const [isDialogLoading, setIsDialogLoading] = useState(false);
    const [cardView, setCardView] = useState('month'); // 'month', 'ytd', or 'roi'

    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const [isFinderOpen, setIsFinderOpen] = useState(false);
    const isDesktop = useMediaQuery("(min-width: 768px)");
    const addTxSheetSide = isDesktop ? 'right' : 'bottom';

    const {
        cards, rules, monthlySummary, mccMap, monthlyCategorySummary,
        recentTransactions, allCategories, commonVendors, reviewTransactions,
        loading, error, refreshData,
        setRecentTransactions, setReviewTransactions,
        cashbackRules, monthlyCashbackCategories, liveSummary
    } = useCashbackData(isAuthenticated);

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

    // Create the handler for a successful approval
    const handleTransactionApproved = (approvedTransaction) => {
        // Instantly remove the approved transaction from the review list
        setReviewTransactions(prevReview =>
            prevReview.filter(tx => tx.id !== approvedTransaction.id)
        );

        setMonthlyTransactions(prevTxs =>
            prevTxs.map(tx => tx.id === approvedTransaction.id ? approvedTransaction : tx)
        );
        setRecentTransactions(prevRecent =>
            prevRecent.map(tx => tx.id === approvedTransaction.id ? approvedTransaction : tx)
        );
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

    const handleTransactionDeleted = (deletedTxId) => {
        // Remove the transaction from the main list to update the UI instantly
        setMonthlyTransactions(prevTxs => prevTxs.filter(tx => tx.id !== deletedTxId));

        // Also remove it from the recent transactions carousel for consistency
        setRecentTransactions(prevRecent => prevRecent.filter(tx => tx.id !== deletedTxId));

        // Optionally, trigger a silent refresh to ensure all aggregate data is up-to-date
        refreshData(true);
    };

    const handleEditClick = (transaction) => {
        setEditingTransaction(transaction);
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
        const checkAuthStatus = async () => {
            try {
                // Use fetch with 'credentials: "include"' to send cookies
                const response = await fetch('/api/verify-auth', {
                    credentials: 'include'
                });
                if (response.ok) {
                    setIsAuthenticated(true);
                } else {
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

        if (monthToFetch) {
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
    }, [activeMonth, transactionFilterType, statementMonths]);

    // --------------------------
    // 2) HELPERS & CALCULATIONS
    // --------------------------

    // --- UTILITIES ---
    const mccName = (code) => mccMap[code]?.vn || "Unknown";

    const sortedCards = useMemo(() => {
        const statusOrder = {
            'Active': 1,
            'Frozen': 2,
            'Closed': 3,
        };
        return [...cards].sort((a, b) => {
            const statusDiff = (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
            if (statusDiff !== 0) {
                return statusDiff;
            }
            return a.name.localeCompare(b.name);
        });
    }, [cards]);

    // --- MEMOIZED DATA PROCESSING ---

    const cardColorMap = useMemo(() => {
        const map = new Map();
        // Sort cards by name to ensure color assignment is stable
        const sortedCards = [...cards].sort((a, b) => a.name.localeCompare(b.name));
        sortedCards.forEach((card, index) => {
            map.set(card.name, COLORS[index % COLORS.length]);
        });
        return map;
    }, [cards]);

    const cardMap = useMemo(() => new Map(cards.map(c => [c.id, c])), [cards]);
    const rulesMap = useMemo(() => new Map(rules.map(r => [r.id, r])), [rules]);
    const summaryMap = useMemo(() => new Map(monthlyCategorySummary.map(s => [s.id, s])), [monthlyCategorySummary]);


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

    // ADD THIS NEW HOOK to calculate stats for the "My Cards" tab
    const cardsTabStats = useMemo(() => {
        // This now gets the total spending directly from the cards data
        const totalYtdSpending = cards.reduce((acc, card) => acc + (card.totalSpendingYtd || 0), 0);

        const totalYtdCashback = cards.reduce((acc, card) => acc + (card.estYtdCashback || 0), 0);
        const totalAnnualFee = cards.reduce((acc, card) => acc + (card.annualFee || 0), 0);
        const overallEffectiveRate = totalYtdSpending > 0 ? (totalYtdCashback / totalYtdSpending) * 100 : 0;
        const numberOfCards = cards.length;

        return {
            totalYtdSpending,
            totalYtdCashback,
            totalAnnualFee,
            overallEffectiveRate,
            numberOfCards
        };
    // The dependency on 'monthlySummary' is no longer needed here
    }, [cards]);

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
        if (!monthlySummary || monthlySummary.length === 0) {
            return [];
        }

        const aggregated = new Map();
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

        const monthlyData = Array.from(aggregated.values());

        // Now, create the cumulative data
        let cumulativeSpend = 0;
        let cumulativeCashback = 0;

        return monthlyData.map(item => {
            cumulativeSpend += item.spend;
            cumulativeCashback += item.cashback;
            return {
                month: fmtYMShort(item.month), // Converts "2024-07" to "Jul 2024"
                spend: cumulativeSpend,
                cashback: cumulativeCashback,
            };
        });
    }, [monthlySummary]);

    const calculateFeeCycleProgress = (openDateStr, nextFeeDateStr) => {
        if (!openDateStr || !nextFeeDateStr) return { daysPast: 0, progressPercent: 0 };

        const openDate = new Date(openDateStr);
        const nextFeeDate = new Date(nextFeeDateStr);
        const today = new Date();

        const totalDuration = nextFeeDate.getTime() - openDate.getTime();
        const elapsedDuration = today.getTime() - openDate.getTime();

        if (totalDuration <= 0) return { daysPast: 0, progressPercent: 0 };

        const daysPast = Math.floor(elapsedDuration / (1000 * 60 * 60 * 24));
        const progressPercent = Math.min(100, Math.round((elapsedDuration / totalDuration) * 100));

        return { daysPast, progressPercent };
    };

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

    if (loading) {
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
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <Toaster richColors position="top-center" />
            {/* --- RESPONSIVE HEADER --- */}
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 shadow-sm sm:px-6">
                <h1 className="text-xl font-semibold flex items-center gap-2 shrink-0 dark:text-white">
                    <img
                        src="/favicon.svg"
                        alt="Cardifier icon"
                        className="h-10 w-10"
                    />
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
                        <Button variant="outline" className="h-10" onClick={() => setIsFinderOpen(true)}>
                            <Search className="mr-2 h-4 w-4" />
                            Card Finder
                        </Button>
                        <Button variant="outline" className="h-10" onClick={() => refreshData(false)}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Refresh
                        </Button>
                        <Sheet open={isAddTxDialogOpen} onOpenChange={setIsAddTxDialogOpen}>
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
                                        rules={cashbackRules}
                                        monthlyCategories={monthlyCashbackCategories}
                                        mccMap={mccMap}
                                        onTransactionAdded={handleTransactionAdded}
                                        commonVendors={commonVendors}
                                        monthlySummary={monthlySummary}
                                        monthlyCategorySummary={monthlyCategorySummary}
                                        getCurrentCashbackMonthForCard={getCurrentCashbackMonthForCard}
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
                                    />
                                </div>
                            </SheetContent>
                        </Sheet>
                        <Button variant="outline" className="h-10" onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                        </Button>
                        <ModeToggle />
                    </div>

                    {/* --- Mobile Controls (hidden on desktop) --- */}
                    <div className="flex items-center gap-2 md:hidden">
                        <Sheet open={isAddTxDialogOpen} onOpenChange={setIsAddTxDialogOpen}>
                            <SheetTrigger asChild>
                                <Button variant="default" size="icon" className="h-10 w-10">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </SheetTrigger>
                        </Sheet>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon" className="h-10 w-10">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => setIsFinderOpen(true)}>
                                    <Search className="mr-2 h-4 w-4" />
                                    <span>Card Finder</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => refreshData(false)}>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    <span>Refresh Data</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={handleLogout}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Logout</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <ModeToggle />
                    </div>
                </div>
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <Tabs defaultValue="overview">
                    <div className="flex items-center">
                        <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="transactions">Transactions</TabsTrigger>
                            <TabsTrigger value="cards">My Cards</TabsTrigger>
                            <TabsTrigger value="payments">Payments</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="overview" className="space-y-4 pt-4">

                        {/* --- 1. UNIFIED DYNAMIC COMPONENTS --- */}
                        <div className="flex flex-col lg:flex-row gap-4">
                            {/* LEFT COLUMN */}
                            <div className="lg:w-7/12 flex flex-col gap-4">
                                <StatCards stats={displayStats} currencyFn={currency} />

                                <CardSpendsCap
                                    cards={cards}
                                    rules={rules}
                                    activeMonth={activeMonth}
                                    monthlySummary={monthlySummary}
                                    monthlyCategorySummary={monthlyCategorySummary}
                                    currencyFn={currency}
                                    getCurrentCashbackMonthForCard={getCurrentCashbackMonthForCard}
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
                                />

                                {/* RecentTransactions is second, and will fill remaining space */}
                                <RecentTransactions
                                    transactions={recentTransactions}
                                    cardMap={cardMap}
                                    currencyFn={currency}
                                />
                            </div>
                        </div>

                        {/* --- 3. UNIFIED CONTEXTUAL COMPONENTS --- */}

                        <div className="grid gap-4">
                            <CummulativeResultsChart data={monthlyChartData} />
                        </div>

                        <div className="mt-4">
                            <CardPerformanceLineChart
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
                    </TabsContent>

                    <TabsContent value="transactions" className="pt-4 space-y-4">
                        <TransactionReviewCenter
                            transactions={reviewTransactions}
                            onReview={handleEditClick}
                            onApprove={handleTransactionApproved}
                            currencyFn={currency}
                            cardMap={cardMap}
                            rulesMap={rulesMap}
                            mccMap={mccMap}
                            summaryMap={summaryMap}
                        />
                        <TransactionsTab
                            isDesktop={isDesktop}
                            // Use recentTransactions in live view, otherwise use monthlyTransactions
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
                            fmtYMShortFn={fmtYMShort}
                        />
                    </TabsContent>

                    <TabsContent value="cards" className="space-y-4 pt-4">
                        <CardsOverviewMetrics stats={cardsTabStats} currencyFn={currency} />
                        <Tabs defaultValue="month" value={cardView} onValueChange={(value) => setCardView(value)}>
                            {/* The container for the tabs, styled as a light grey rounded box */}
                            <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 p-1 text-muted-foreground">
                                {/* The individual tab buttons */}
                                <TabsTrigger value="month" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
                                    This Month
                                </TabsTrigger>
                                <TabsTrigger value="ytd" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
                                    Year to Date
                                </TabsTrigger>
                                <TabsTrigger value="roi" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
                                    ROI & Fees
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>

                        {(() => {
                            const isLiveView = activeMonth === 'live';
                            const activeAndFrozenCards = sortedCards.filter(c => c.status !== 'Closed');
                            const closedCards = sortedCards.filter(c => c.status === 'Closed');

                            const renderCard = (card) => {
                                const monthForCard = isLiveView ? getCurrentCashbackMonthForCard(card) : activeMonth;
                                const summaryForCard = monthlySummary.find(s => s.cardId === card.id && s.month === monthForCard);

                                return (
                                    <EnhancedCard
                                        key={card.id}
                                        card={card}
                                        activeMonth={monthForCard}
                                        cardMonthSummary={summaryForCard}
                                        rules={rules.filter(r => r.cardId === card.id)}
                                        currencyFn={currency}
                                        fmtYMShortFn={fmtYMShort}
                                        calculateFeeCycleProgressFn={calculateFeeCycleProgress}
                                        view={cardView}
                                        mccMap={mccMap}
                                        isDesktop={isDesktop}
                                    />
                                );
                            };

                            return (
                                <>
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                        {activeAndFrozenCards.map(renderCard)}
                                    </div>

                                    {closedCards.length > 0 && (
                                        <Accordion type="single" collapsible className="w-full pt-4">
                                            <AccordionItem value="closed-cards">
                                                <AccordionTrigger className="text-base font-semibold text-muted-foreground">
                                                    Show Closed Cards ({closedCards.length})
                                                </AccordionTrigger>
                                                <AccordionContent>
                                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pt-4">
                                                        {closedCards.map(renderCard)}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        </Accordion>
                                    )}
                                </>
                            );
                        })()}
                    </TabsContent>
                    <TabsContent value="payments" className="space-y-4 pt-4">
                        <PaymentsTabV2
                            cards={cards}
                            monthlySummary={monthlySummary}
                            currencyFn={currency}
                            fmtYMShortFn={fmtYMShort}
                            daysLeftFn={calculateDaysLeft}
                            onViewTransactions={handleViewTransactions}
                        />
                    </TabsContent>
                </Tabs>
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
                useIOSKeyboardGapFix={useIOSKeyboardGapFix}
            />
            <TransactionDetailsDialog
                isOpen={!!dialogDetails}
                onClose={() => setDialogDetails(null)}
                details={dialogDetails}
                transactions={dialogTransactions}
                isLoading={isDialogLoading}
                currencyFn={currency}
            />
        </div>
        </TooltipProvider>
    );
}

// --------------------------
// 3) UI SUB-COMPONENTS
// --------------------------

function TransactionsTab({ transactions, isLoading, activeMonth, cardMap, mccNameFn, allCards, filterType, onFilterTypeChange, statementMonths, isDesktop, onTransactionDeleted, onEditTransaction, fmtYMShortFn }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [cardFilter, setCardFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [visibleCount, setVisibleCount] = useState(15);
    const [sortConfig, setSortConfig] = useState({ key: 'Transaction Date', direction: 'descending' });
    const [expandedTxId, setExpandedTxId] = useState(null); // State for expandable rows
    const currency = (n) => (n || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

    const handleToggleExpand = (txId) => {
        setExpandedTxId(prevId => (prevId === txId ? null : txId));
    };

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

    const handleDelete = async (txId, txName) => {
        // 1. Ask for confirmation to prevent accidental deletion
        if (!window.confirm(`Are you sure you want to delete the transaction for "${txName}"? This action cannot be undone.`)) {
            return;
        }

        try {
            // 2. Call the backend API to archive the page in Notion
            const response = await fetch(`${API_BASE_URL}/transactions/${txId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                // Handle server-side errors
                throw new Error('Failed to delete the transaction on the server.');
            }

            // 3. If successful, call the parent handler to update the UI
            onTransactionDeleted(txId);
            toast.success('Transaction deleted successfully!');

        } catch (error) {
            console.error("Delete failed:", error);
            toast.error("Could not delete the transaction. Please try again.");
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
                        const hasOptionalFields = tx.notes || tx.otherDiscounts || tx.otherFees || tx.subCategory || tx.paidFor || tx.foreignCurrencyAmount || tx.billingDate;
                        return (
                            <div key={tx.id} className="border bg-white rounded-lg shadow-sm overflow-hidden">
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
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={() => handleEdit(tx)}><FilePenLine className="mr-2 h-4 w-4" /><span>Edit</span></DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handleDelete(tx.id, tx['Transaction Name'])} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /><span>Delete</span></DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                                {hasOptionalFields && (
                                    <Accordion type="single" collapsible className="bg-slate-50">
                                        <AccordionItem value="details" className="border-t">
                                            <AccordionTrigger className="px-3 py-2 text-xs font-semibold text-muted-foreground">
                                                More Details
                                            </AccordionTrigger>
                                            <AccordionContent className="px-3 pb-3 text-xs space-y-2">
                                                {/* This block is now more robust and formats all numbers correctly */}
                                                {tx.subCategory && <p><span className="font-medium">Sub-Category:</span> {tx.subCategory}</p>}
                                                {tx.paidFor && <p><span className="font-medium">Paid For:</span> {tx.paidFor}</p>}
                                                {tx.billingDate && <p><span className="font-medium">Billing Date:</span> {tx.billingDate}</p>}
                                                {tx.otherDiscounts > 0 && <p><span className="font-medium">Discounts:</span> -{currency(tx.otherDiscounts)}</p>}
                                                {tx.otherFees > 0 && <p><span className="font-medium">Fees:</span> +{currency(tx.otherFees)}</p>}
                                                {(tx.foreignCurrencyAmount > 0 || tx.conversionFee > 0) && (
                                                    <p>
                                                        <span className="font-medium">Foreign Spend: </span>
                                                        {tx.foreignCurrencyAmount} (+{currency(tx.conversionFee)})
                                                    </p>
                                                )}
                                                {tx.notes && <p className="pt-1 border-t mt-1 whitespace-pre-wrap"><span className="font-medium">Notes:</span> {tx.notes}</p>}
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                )}
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
                            <TableHead className="w-[40px]"></TableHead>
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
                            const isExpanded = expandedTxId === tx.id;
                            const hasOptionalFields = tx.notes || tx.otherDiscounts || tx.otherFees || tx.subCategory || tx.paidFor || tx.foreignCurrencyAmount || tx.billingDate;

                            return (
                                <React.Fragment key={tx.id}>
                                    <TableRow onClick={() => hasOptionalFields && handleToggleExpand(tx.id)} className={cn(hasOptionalFields && "cursor-pointer")}>
                                        <TableCell className="px-2">
                                            {hasOptionalFields && (
                                                <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
                                            )}
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
                                    {isExpanded && hasOptionalFields && (
                                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                                            <TableCell colSpan={8} className="p-0">
                                                <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4 text-xs">
                                                    {tx.subCategory && <div><p className="font-semibold text-slate-500">Sub-Category</p><p>{tx.subCategory}</p></div>}
                                                    {tx.paidFor && <div><p className="font-semibold text-slate-500">Paid For</p><p>{tx.paidFor}</p></div>}
                                                    {tx.billingDate && <div><p className="font-semibold text-slate-500">Billing Date</p><p>{tx.billingDate}</p></div>}
                                                    {(tx.foreignCurrencyAmount > 0 || tx.conversionFee > 0) && <div><p className="font-semibold text-slate-500">Foreign Spend</p><p>{tx.foreignCurrencyAmount} (+{currency(tx.conversionFee)})</p></div>}
                                                    {tx.otherDiscounts > 0 && <div><p className="font-semibold text-slate-500">Discounts</p><p className="text-emerald-600">-{currency(tx.otherDiscounts)}</p></div>}
                                                    {tx.otherFees > 0 && <div><p className="font-semibold text-slate-500">Fees</p><p className="text-red-600">+{currency(tx.otherFees)}</p></div>}
                                                    {tx.notes && <div className="col-span-full"><p className="font-semibold text-slate-500">Notes</p><p className="whitespace-pre-wrap">{tx.notes}</p></div>}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        );
    };

    return (
        <Card>
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

function CardsOverviewMetrics({ stats, currencyFn }) {
    if (!stats) {
        return null;
    }

    const isFeeCovered = stats.totalYtdCashback >= stats.totalAnnualFee;
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
            <StatCard
                title="Total Spending"
                value={currencyFn(stats.totalYtdSpending)}
                icon={<Wallet className="h-4 w-4 text-muted-foreground" />}
            />
            <StatCard
                title="Total Cashback"
                value={currencyFn(stats.totalYtdCashback)}
                icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
            />
            <StatCard
                title="% Rate"
                value={`${stats.overallEffectiveRate.toFixed(2)}%`}
                icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
            />
            <StatCard
                title="Est. Annual Fee"
                value={currencyFn(stats.totalAnnualFee)}
                icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />}
                valueClassName={isFeeCovered ? 'text-emerald-600' : 'text-orange-500'}
            />
            <StatCard
                title="No. of Cards"
                value={stats.numberOfCards}
                icon={<CreditCard className="h-4 w-4 text-muted-foreground" />}
            />
        </div>
    );
}

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

        paymentData.forEach(p => {
            if (!p.mainStatement) {
                return;
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

        return { pastDue, upcoming, completed };
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

function MetricItem({ label, value, valueClassName, icon: Icon, isPrimary = false }) {
    return (
        <div className="p-2 bg-slate-50/70 dark:bg-slate-800/50 rounded-lg">
            <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 mb-0.5">
                {Icon && <Icon className="h-3.5 w-3.5 mr-1.5" />}
                <span>{label}</span>
            </div>
            <p className={cn(
                "font-bold transition-all duration-300",
                isPrimary ? "text-xl text-slate-800 dark:text-slate-200" : "text-base text-slate-700 dark:text-slate-300",
                valueClassName
            )}>
                {value}
            </p>
        </div>
    );
}

function EnhancedCard({ card, activeMonth, cardMonthSummary, rules, currencyFn, fmtYMShortFn, calculateFeeCycleProgressFn, view, mccMap, isDesktop }) {

    // --- Data Calculations (no changes here) ---
    const totalSpendMonth = cardMonthSummary?.spend || 0;
    const estCashbackMonth = cardMonthSummary?.cashback || 0;
    const monthlyEffectiveRate = totalSpendMonth > 0 ? (estCashbackMonth / totalSpendMonth) * 100 : 0;
    const ytdEffectiveRate = card.totalSpendingYtd > 0 ? (card.estYtdCashback / card.totalSpendingYtd) * 100 : 0;
    const totalValue = (card.estYtdCashback || 0) - (card.annualFee || 0);
    const { daysPast, progressPercent } = calculateFeeCycleProgressFn(card.cardOpenDate, card.nextAnnualFeeDate);
    const theme = cardThemes[card.bank] || cardThemes['default'];

    const getStatusClasses = (status) => {
        switch (status) {
            case 'Active': return 'bg-emerald-100 text-emerald-800';
            case 'Frozen': return 'bg-sky-100 text-sky-800';
            case 'Closed': return 'bg-slate-200 text-slate-600';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    const formattedOpenDate = card.cardOpenDate ? new Date(card.cardOpenDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
    const formattedNextFeeDate = card.nextAnnualFeeDate ? new Date(card.nextAnnualFeeDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

    return (
        <div className={cn(
            "bg-card text-card-foreground rounded-xl shadow-md overflow-hidden transition-all duration-300 flex flex-col relative",
            card.status === 'Closed' && 'filter grayscale',
            card.status === 'Frozen' && 'opacity-75'
        )}>
            {/* Visual Card Header */}
            <div className={cn(
                "relative rounded-t-xl p-4 flex-shrink-0 overflow-hidden",
                theme.gradient,
                theme.textColor
            )}>
                {card.status === 'Frozen' && (
                    <Snowflake
                        className="absolute -right-4 -top-4 h-24 w-24 text-white/20"
                        strokeWidth={1.5}
                    />
                )}
                <div className="relative z-10">
                    <div className="flex justify-between items-center">
                        <p className="font-bold text-base">{card.bank}</p>
                        <Badge variant="outline" className={cn('capitalize rounded-md h-6 text-xs', getStatusClasses(card.status))}>
                            {card.status}
                        </Badge>
                    </div>
                    <div className="flex justify-between items-end mt-2 gap-4">
                        <p className="font-mono text-base tracking-wider flex-shrink-0">•••• {card.last4}</p>
                        <p className="font-semibold text-base truncate text-right min-w-0">{card.name}</p>
                    </div>
                </div>
            </div>

            <div className="p-4 flex-grow flex flex-col">
                <div className="text-xs text-slate-500 dark:text-slate-400 grid grid-cols-2 gap-x-4">
                    <p>Statement: <span className="font-medium text-slate-600 dark:text-slate-300">Day {card.statementDay}</span></p>
                    <p>Payment Due: <span className="font-medium text-slate-600 dark:text-slate-300">Day {card.paymentDueDay}</span></p>
                </div>

                <div className="flex-grow flex flex-col justify-center mt-4">
                    {view === 'month' && (
                        <div className="grid grid-cols-2 gap-3">
                            <MetricItem
                                label={`${fmtYMShortFn(activeMonth)}'s Rate`}
                                value={`${monthlyEffectiveRate.toFixed(2)}%`}
                                valueClassName={monthlyEffectiveRate >= 2 ? 'text-emerald-600' : 'text-slate-800'}
                            />
                            {progressPercent > 0 && (
                                <MetricItem
                                    label={`Card Progress`}
                                    value={`${progressPercent}%`}
                                />
                            )}
                            <MetricItem label="Spend" value={currencyFn(totalSpendMonth)} />
                            <MetricItem label="Cashback" value={currencyFn(estCashbackMonth)} />
                        </div>
                    )}

                    {view === 'ytd' && (
                        <div className="grid grid-cols-2 gap-3">
                            <MetricItem
                                label="YTD Effective Rate"
                                value={`${ytdEffectiveRate.toFixed(2)}%`}
                                isPrimary={true}
                                valueClassName={ytdEffectiveRate >= 2 ? 'text-emerald-600' : 'text-slate-800'}
                            />
                            <div className="space-y-1.5">
                                <MetricItem label="Total Spend" value={currencyFn(card.totalSpendingYtd)} />
                                <MetricItem label="Total Cashback" value={currencyFn(card.estYtdCashback)} />
                            </div>
                        </div>
                    )}

                    {view === 'roi' && (
                        <div className="space-y-2.5">
                            <div className="grid grid-cols-2 gap-3">
                                <MetricItem label="Annual Fee" value={currencyFn(card.annualFee)} />
                                <MetricItem
                                    label="Net Value"
                                    value={currencyFn(totalValue)}
                                    valueClassName={totalValue >= 0 ? 'text-emerald-600' : 'text-red-500'}
                                />
                            </div>
                            {progressPercent > 0 && (
                                <div>
                                    <div className="flex justify-between text-xs mb-1 text-slate-500">
                                        <span>Fee Cycle Progress ({daysPast} days past)</span>
                                        <span>{progressPercent}%</span>
                                    </div>
                                    <Progress value={progressPercent} />
                                </div>
                            )}
                            <div className="text-xs text-slate-500 grid grid-cols-2 gap-x-4">
                                <p>Opened: <span className="font-medium text-slate-600">{formattedOpenDate}</span></p>
                                <p>Next Fee: <span className="font-medium text-slate-600">{formattedNextFeeDate}</span></p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-auto pt-4 flex justify-end">
                    <CardInfoSheet
                        card={card}
                        rules={rules}
                        mccMap={mccMap}
                        isDesktop={isDesktop}
                    />
                </div>
            </div>
        </div>
    );

}
