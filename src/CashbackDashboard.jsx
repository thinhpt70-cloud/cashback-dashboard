import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { CreditCard, Wallet, CalendarClock, TrendingUp, DollarSign, AlertTriangle, RefreshCw, Search, Info, Loader2, Plus, CalendarDays, History, Globe, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { Progress } from "./components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./components/ui/tabs";
import { Input } from "./components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./components/ui/table";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "./components/ui/tooltip";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from "./components/ui/dialog";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "./components/ui/sheet";
import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, BarChart, Bar, PieChart, Pie, Cell, Legend, LabelList, LineChart, Line } from "recharts";
import { ArrowUp, ArrowDown, ChevronsUpDown, ChevronDown, ChevronRight, ChevronLeft, List } from "lucide-react";
import { cn } from "./lib/utils";
import { Toaster, toast } from 'sonner';



// --------------------------
// 1) API & DATA FETCHING
// --------------------------
const API_BASE_URL = '/api';

const calculateDaysLeft = (paymentDateString) => {
    if (!paymentDateString || paymentDateString === "N/A") return null;

    // Use a fixed "today" for consistent results in this example
    const today = new Date(); 
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(paymentDateString + "T00:00:00Z");
    
    if (isNaN(dueDate)) return null;

    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays >= 0 ? diffDays : null;
};

const calculateDaysLeftInCashbackMonth = (cashbackMonth) => {
    if (!cashbackMonth) return { days: null, status: 'N/A' };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const year = parseInt(cashbackMonth.slice(0, 4), 10);
    const month = parseInt(cashbackMonth.slice(4, 6), 10); // e.g., 10 for October

    // Get the last day of the given cashback month by getting day 0 of the *next* month
    const lastDayOfMonth = new Date(year, month, 0);
    
    if (isNaN(lastDayOfMonth.getTime())) return { days: null, status: 'N/A' };

    const diffTime = lastDayOfMonth.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return { days: null, status: 'Completed' };
    }
    return { days: diffDays, status: 'Upcoming' };
};

const calculateDaysUntilStatement = (statementDay, activeMonth) => {
    if (!statementDay || !activeMonth) return { days: null, status: 'N/A' };

    const today = new Date(); // Using today's date
    today.setHours(0, 0, 0, 0); // Normalize to the beginning of the day

    const year = parseInt(activeMonth.slice(0, 4), 10);
    const month = parseInt(activeMonth.slice(4, 6), 10);
    
    // Create the statement date for the active month
    const statementDate = new Date(year, month - 1, statementDay);

    if (isNaN(statementDate.getTime())) return { days: null, status: 'N/A' };
    
    // Calculate the difference in days
    const diffTime = statementDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return { days: null, status: 'Completed' };
    }
    return { days: diffDays, status: 'Upcoming' };
};

const COLORS = ['#0ea5e9', '#84cc16', '#f43f5e', '#f59e0b', '#6366f1', '#14b8a6', '#d946ef'];


export default function CashbackDashboard() {

    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // --- STATE MANAGEMENT ---
    const [cards, setCards] = useState([]);
    const [rules, setRules] = useState([]);
    const [monthlySummary, setMonthlySummary] = useState([]);
    const [mccMap, setMccMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [monthlyCategorySummary, setMonthlyCategorySummary] = useState([]);
    const [activeMonth, setActiveMonth] = useState("");
    const [monthlyTransactions, setMonthlyTransactions] = useState([]);
    const [isMonthlyTxLoading, setIsMonthlyTxLoading] = useState(true);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [cashbackRules, setCashbackRules] = useState([]);
    const [monthlyCashbackCategories, setMonthlyCashbackCategories] = useState([]);
    const [allCategories, setAllCategories] = useState([]); // 1. Add new state
    const [isAddTxDialogOpen, setIsAddTxDialogOpen] = useState(false);
    const [transactionFilterType, setTransactionFilterType] = useState('date'); // 'date' or 'cashbackMonth'
    const [dialogDetails, setDialogDetails] = useState(null); // Will hold { cardId, cardName, month, monthLabel }
    const [dialogTransactions, setDialogTransactions] = useState([]);
    const [isDialogLoading, setIsDialogLoading] = useState(false);
    const [commonVendors, setCommonVendors] = useState([]);

    const handleTransactionAdded = (newTransaction) => {
        // 1. Instantly update the list for the current month
        // This makes the UI feel immediate
        if (newTransaction['Transaction Date'].startsWith(activeMonth.replace('-', ''))) {
                setMonthlyTransactions(prevTxs => [newTransaction, ...prevTxs]);
        }

        // 2. Update the recent transactions carousel
        setRecentTransactions(prevRecent => [newTransaction, ...prevRecent].slice(0, 20));

        // 3. Trigger a full refresh in the background to update all
        //    aggregate data (charts, stats, etc.) without a loading screen.
        fetchData(true); 
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

    // --- DATA FETCHING ---
    const fetchData = async (isSilent = false) => {
        if (!isSilent) {
            setLoading(true);
        }
        setError(null);
        try {
            // This array now includes the new '/api/monthly-category-summary' endpoint
            const [
                cardsRes, 
                rulesRes, 
                monthlyRes, 
                mccRes, 
                monthlyCatRes,
                recentTxRes,
                categoriesRes,
                commonVendorsRes
            ] = await Promise.all([
                fetch(`${API_BASE_URL}/cards`),
                fetch(`${API_BASE_URL}/rules`),
                fetch(`${API_BASE_URL}/monthly-summary`),
                fetch(`${API_BASE_URL}/mcc-codes`),
                fetch(`${API_BASE_URL}/monthly-category-summary`), // Fetches data for the optimized overview
                fetch(`${API_BASE_URL}/recent-transactions`),
                fetch(`${API_BASE_URL}/categories`),
                fetch(`${API_BASE_URL}/common-vendors`),
            ]);

            // Check if all network responses are successful
            if (!cardsRes.ok || !rulesRes.ok || !monthlyRes.ok || !mccRes.ok || !monthlyCatRes.ok || !recentTxRes.ok || !categoriesRes.ok || !commonVendorsRes.ok) {
                throw new Error('A network response was not ok. Please check the server.');
            }

            // Parse all JSON data from the responses
            const cardsData = await cardsRes.json();
            const rulesData = await rulesRes.json();
            const monthlyData = await monthlyRes.json();
            const mccData = await mccRes.json();
            const monthlyCatData = await monthlyCatRes.json();
            const recentTxData = await recentTxRes.json(); 
            const categoriesData = await categoriesRes.json(); 
            const commonVendorsData = await commonVendorsRes.json();

            // Set all the state variables for the application
            setCards(cardsData);
            setRules(rulesData);
            setMonthlySummary(monthlyData);
            setMccMap(mccData.mccDescriptionMap || {});
            setMonthlyCategorySummary(monthlyCatData); // Set the new state for the overview tab
            setRecentTransactions(recentTxData); // Set the new state
            setAllCategories(categoriesData); // Set the new state for all categories
            setCommonVendors(commonVendorsData);

            const mappedRules = rulesData.map(r => ({ ...r, name: r.ruleName }));
            const mappedMonthlyCats = monthlyCatData.map(c => ({ ...c, name: c.summaryId }));

            setCashbackRules(mappedRules);
            setMonthlyCashbackCategories(mappedMonthlyCats);

            // Set the active month based on the summary data for a faster initial load
            if (monthlyData.length > 0) {
                const allMonths = [...new Set(monthlyData.map(t => t.month))].filter(Boolean).sort().reverse();
                if (allMonths.length > 0) {
                    setActiveMonth(allMonths[0]);
                }
            }

        } catch (err) {
            setError("Failed to fetch data. Please check the backend, .env configuration, and Notion permissions.");
            console.error(err);
        } finally {
            if (!isSilent) {
                setLoading(false);
            }
        }
    };

    // It now depends on 'isAuthenticated' and will run when it changes to true.
    useEffect(() => {
        // Only fetch data if the user has been authenticated.
        if (isAuthenticated) {
            fetchData();
        }
    }, [isAuthenticated]); // The dependency array now includes 'isAuthenticated'.

    // ADD THIS NEW HOOK to fetch transactions when the month changes
    useEffect(() => {
        if (activeMonth) {
            const fetchMonthlyTransactions = async () => {
                setIsMonthlyTxLoading(true); // Set loading to true
                try {
                    const res = await fetch(`${API_BASE_URL}/transactions?month=${activeMonth}&filterBy=${transactionFilterType}`);
                    if (!res.ok) {
                        throw new Error('Failed to fetch monthly transactions');
                    }
                    const data = await res.json();
                    setMonthlyTransactions(data); // Set the new transactions
                } catch (err) {
                    console.error(err);
                    setMonthlyTransactions([]); // Clear transactions on error
                } finally {
                    setIsMonthlyTxLoading(false); // Set loading to false
                }
            };
            fetchMonthlyTransactions();
        }
    }, [activeMonth, transactionFilterType]); // This hook runs whenever 'activeMonth' changes

    // --------------------------
    // 2) HELPERS & CALCULATIONS
    // --------------------------

    // --- UTILITIES ---
    const currency = useCallback((n) => (n || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }), []);
    const mccName = (code) => mccMap[code]?.vn || "Unknown";

    // Dynamic list of available months from transactions
    const statementMonths = useMemo(() => {
        if (!monthlySummary || monthlySummary.length === 0) return [];
        const uniqueMonths = [...new Set(monthlySummary.map(summary => summary.month))];
        return uniqueMonths.sort().reverse();
    }, [monthlySummary]);
    

    const fmtYMShort = useCallback((ymCode) => {
        if (!ymCode || typeof ymCode !== 'string' || ymCode.length !== 6) return "";
        const year = Number(ymCode.slice(0, 4));
        const month = Number(ymCode.slice(4, 6));
        if (isNaN(year) || isNaN(month)) return "";
        return new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'short', year: 'numeric' });
    }, []); // The empty array [] tells React this function never needs to be re-created.

    const renderCustomBarLabel = (props) => {
        const { x, y, width, value } = props;
        // Format the value to millions (e.g., 39,500,000 becomes "40M")
        const formattedValue = (value / 1000000).toFixed(2) + 'M';
        
        // Don't show the label if the bar is too small, to prevent clutter
        if (width < 30) return null; 

        return (
            <text x={x + width / 2} y={y} fill="#6b7280" textAnchor="middle" dy={-6} fontSize={12}>
            {formattedValue}
            </text>
        );
    };

    const sortedCards = useMemo(() => {
        // Create a shallow copy to avoid mutating the original state array, then sort it
        return [...cards].sort((a, b) => a.name.localeCompare(b.name));
    }, [cards]); // The dependency array ensures this runs only when 'cards' data changes
    
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

    const overviewStats = useMemo(() => {
        // Filter the summary data for only the currently selected month
        const monthData = monthlySummary.filter(s => s.month === activeMonth);

        // Calculate total spend and cashback for that month
        const totalSpend = monthData.reduce((acc, curr) => acc + (curr.spend || 0), 0);
        const totalCashback = monthData.reduce((acc, curr) => acc + (curr.cashback || 0), 0);
        const effectiveRate = totalSpend > 0 ? totalCashback / totalSpend : 0;

        // Prepare data formatted for the pie charts
        const spendByCard = monthData.map(item => ({
            name: cardMap.get(item.cardId)?.name || "Unknown Card",
            value: item.spend || 0,
        })).sort((a, b) => b.value - a.value);
        
        const cashbackByCard = monthData.map(item => ({
            name: cardMap.get(item.cardId)?.name || "Unknown Card",
            value: item.cashback || 0,
        })).sort((a, b) => b.value - a.value);

        return { totalSpend, totalCashback, effectiveRate, spendByCard, cashbackByCard };
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
    }, [monthlySummary, cards, fmtYMShort]);

    const monthlyChartData = useMemo(() => {
        const aggregated = {};
        monthlySummary.forEach(item => {
            const monthLabel = fmtYMShort(item.month);
            if (!aggregated[monthLabel]) {
                aggregated[monthLabel] = { month: monthLabel, spend: 0, cashback: 0 };
            }
            aggregated[monthLabel].spend += item.spend || 0;
            aggregated[monthLabel].cashback += item.cashback || 0;
        });
        return Object.values(aggregated);
    }, [monthlySummary, fmtYMShort]);

    const calculateFeeCycleProgress = (openDateStr, nextFeeDateStr) => {
        if (!openDateStr || !nextFeeDateStr) return { daysPast: 0, progressPercent: 0 };
        
        const openDate = new Date(openDateStr);
        const nextFeeDate = new Date(nextFeeDateStr);
        const today = new Date(); // Using the live date

        const totalDuration = nextFeeDate.getTime() - openDate.getTime();
        const elapsedDuration = today.getTime() - openDate.getTime();

        if (totalDuration <= 0) return { daysPast: 0, progressPercent: 0 };

        const daysPast = Math.floor(elapsedDuration / (1000 * 60 * 60 * 24));
        const progressPercent = Math.min(100, Math.round((elapsedDuration / totalDuration) * 100));

        return { daysPast, progressPercent };
    };

    // --- RENDER LOGIC ---

    // If the user is not authenticated, show the login screen.
    if (!isAuthenticated) {
        return <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />;
    }

    if (loading) {
        return (
            <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/40">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Loading Dashboard Data from Notion...</p>
            </div>
        );
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
            <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-white shadow-sm px-4 md:px-6 z-30">
            <h1 className="text-xl font-semibold flex items-center gap-2">Cashback Optimizer</h1>
            <div className="ml-auto flex items-center gap-4">
                {statementMonths.length > 0 && (
                    <select
                    value={activeMonth}
                    onChange={(e) => setActiveMonth(e.target.value)}
                    className="h-9 text-sm rounded-md border border-input bg-transparent px-3 py-1 shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                    {statementMonths.map(m => (
                        <option key={m} value={m}>{fmtYMShort(m)}</option>
                    ))}
                    </select>
                )}
                <Button variant="outline" size="icon" onClick={() => fetchData(false)}><RefreshCw className="h-4 w-4" /></Button>
                <div className="ml-auto flex items-center gap-4">
                    {/* This Sheet component creates the slide-over panel */}
                    <Sheet open={isAddTxDialogOpen} onOpenChange={setIsAddTxDialogOpen}>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon"><Plus className="h-4 w-4" /></Button>
                        </SheetTrigger>
                        <SheetContent className="overflow-y-auto">
                            <SheetHeader>
                                <SheetTitle>Add a New Transaction</SheetTitle>
                            </SheetHeader>
                            <div className="flex-grow overflow-y-auto">
                                <AddTransactionForm
                                    cards={cards}
                                    categories={allCategories}
                                    rules={cashbackRules}
                                    monthlyCategories={monthlyCashbackCategories}
                                    mccMap={mccMap}
                                    onTransactionAdded={handleTransactionAdded}
                                    commonVendors={commonVendors}
                                />
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
            </header>

            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <Tabs defaultValue="overview">
                <div className="flex items-center">
                <TabsList className="bg-slate-100 p-1 rounded-lg">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="transactions">Transactions</TabsTrigger>
                    <TabsTrigger value="cards">My Cards</TabsTrigger>
                    <TabsTrigger value="payments">Payments</TabsTrigger>
                </TabsList>
                </div>

                <TabsContent value="overview" className="space-y-4 pt-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard title="Month" value={fmtYMShort(activeMonth)} icon={<CalendarClock className="h-4 w-4 text-muted-foreground" />} />
                    {/* Update the props for the StatCards */}
                    <StatCard title="Total Spend" value={currency(overviewStats.totalSpend)} icon={<Wallet className="h-4 w-4 text-muted-foreground" />} />
                    <StatCard title="Est. Cashback" value={currency(overviewStats.totalCashback)} icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} />
                    <StatCard title="Effective Rate" value={`${(overviewStats.effectiveRate * 100).toFixed(2)}%`} icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />} />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <Card className="lg:col-span-4 flex flex-col min-h-[300px]">
                            <CardHeader><CardTitle>Spend vs Cashback Trend</CardTitle></CardHeader>
                            <CardContent className="pl-2 flex-grow">
                                <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyChartData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                                    <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`} />
                                    <RechartsTooltip content={<CustomRechartsTooltip />} />
                                    <Legend formatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)} />
                                    <Bar dataKey="spend" fill="#0BA6DF" radius={[4, 4, 0, 0]}>
                                    <LabelList dataKey="spend" content={renderCustomBarLabel} />
                                    </Bar>
                                    <Bar dataKey="cashback" fill="#67C090" radius={[4, 4, 0, 0]}>
                                    <LabelList dataKey="cashback" content={renderCustomBarLabel} />
                                    </Bar>
                                </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <CardSpendsCap
                        cards={cards}
                        activeMonth={activeMonth}
                        monthlySummary={monthlySummary} 
                        />
                    </div>

                    <RecentTransactionsCarousel 
                        transactions={recentTransactions}
                        cardMap={cardMap}
                        currencyFn={currency}
                    />

                    {/* ADD THE NEW LINE CHART COMPONENT HERE */}
                    <div className="mt-4">
                        <CardPerformanceLineChart 
                            data={cardPerformanceData}
                            cards={cards}
                            currencyFn={currency}
                            cardColorMap={cardColorMap} 
                        />
                    </div>
                        
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SpendByCardChart
                            spendData={overviewStats.spendByCard}
                            currencyFn={currency}
                            cardColorMap={cardColorMap}
                        />
                        <CashbackByCardChart
                            cashbackData={overviewStats.cashbackByCard}
                            currencyFn={currency}
                            cardColorMap={cardColorMap}
                        />
                    </div>
                
                </TabsContent>

                <TabsContent value="transactions" className="pt-4">
                <TransactionsTab
                        // UPDATE these props
                        transactions={monthlyTransactions}
                        isLoading={isMonthlyTxLoading}
                        // The rest of the props stay the same
                        activeMonth={activeMonth}
                        cardMap={cardMap}
                        mccNameFn={mccName}
                        allCards={cards}
                        // 3. PASS THE NEW PROPS DOWN
                        filterType={transactionFilterType}
                        onFilterTypeChange={setTransactionFilterType}
                />
                </TabsContent>  

                <TabsContent value="cards" className="space-y-4 pt-4">
                    <CardsOverviewMetrics stats={cardsTabStats} currencyFn={currency} />

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {sortedCards.map(card => {
                            // --- LOGIC TO GET ALL STATS FOR THE CARD ---

                            // 1. Get Monthly Stats (for the selected month)
                            const cardMonthSummary = monthlySummary.find(
                                summary => summary.cardId === card.id && summary.month === activeMonth
                            );
                            const totalSpendMonth = cardMonthSummary ? cardMonthSummary.spend : 0;
                            const estCashbackMonth = cardMonthSummary ? cardMonthSummary.cashback : 0;
                            const effectiveRate = totalSpendMonth > 0 ? (estCashbackMonth / totalSpendMonth) * 100 : 0;

                            // 2. Calculate Total YTD Spend by summing up all months from the summary data
                            const totalSpendYTD = monthlySummary
                                .filter(summary => summary.cardId === card.id)
                                .reduce((acc, summary) => acc + (summary.spend || 0), 0);

                            const isMaxedOut = card.overallMonthlyLimit > 0 && estCashbackMonth >= card.overallMonthlyLimit;

                            return (
                                <Card 
                                    key={card.id} 
                                    className={cn(
                                        "transition-shadow duration-300",
                                        isMaxedOut && "shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-500"
                                    )}
                                >
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg">{card.name} &bull;&bull;&bull;{card.last4}</CardTitle>
                                            <Badge variant="outline">{card.bank}</Badge>
                                        </div>
                                        <p className="text-sm text-gray-500 pt-1">
                                            Statement Due Day: {card.statementDay} &bull; Payment Due Day: {card.paymentDueDay}
                                        </p>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* --- NEW TWO-ROW LAYOUT --- */}

                                        {/* Row 1: Year-to-Date Totals */}
                                        <div className="grid grid-cols-2 gap-4 text-center">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Total Spending</p>
                                                <p className="font-semibold text-xl">{currency(totalSpendYTD)}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Total Cashback</p>
                                                <p className="font-semibold text-xl text-emerald-600">{currency(card.estYtdCashback)}</p>
                                            </div>
                                        </div>

                                        {/* Divider for visual separation */}
                                        <div className="border-t"></div>

                                        {/* Row 2: Selected Month's Stats */}
                                        <div className="grid grid-cols-3 gap-4 text-center">
                                            <div>
                                                <p className="font-semibold text-lg">{currency(totalSpendMonth)}</p>
                                                <p className="text-sm text-muted-foreground">Spend</p>
                                                <p className="text-xs text-gray-500">{fmtYMShort(activeMonth)}</p>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-lg text-emerald-600">{currency(estCashbackMonth)}</p>
                                                <p className="text-sm text-muted-foreground">Cashback</p>
                                                <p className="text-xs text-gray-500">{fmtYMShort(activeMonth)}</p>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-lg">{effectiveRate.toFixed(2)}%</p>
                                                <p className="text-sm text-muted-foreground">% Rate</p>
                                                <p className="text-xs text-gray-500">{fmtYMShort(activeMonth)}</p>
                                            </div>
                                        </div>

                                        <div className="flex justify-end items-center gap-2 pt-2">
                                            {card.status && (
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        'capitalize rounded-md h-7', // Override pill shape to match button
                                                        card.status === 'Active' && 'bg-emerald-100 text-emerald-800 border-emerald-200',
                                                        card.status === 'Closed' && 'bg-red-100 text-red-800 border-red-200',
                                                        card.status === 'Frozen' && 'bg-blue-100 text-blue-800 border-blue-200'
                                                    )}
                                                >
                                                    <span className={cn( // The new status dot
                                                        "mr-2 h-2 w-2 rounded-full",
                                                        card.status === 'Active' && 'bg-emerald-500',
                                                        card.status === 'Closed' && 'bg-red-500',
                                                        card.status === 'Frozen' && 'bg-blue-500'
                                                    )} />
                                                    {card.status}
                                                </Badge>
                                            )}
                                            <CardInfoDialog card={card} rules={rules.filter(r => r.cardId === card.id)} />
                                        </div>

                                        <div className="border-t pt-4">
                                            <CategoryCapsUsage 
                                                card={card}
                                                activeMonth={activeMonth}
                                                monthlyCategorySummary={monthlyCategorySummary}
                                                monthlySummary={monthlySummary} 
                                                currencyFn={currency}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </TabsContent>
                
                <TabsContent value="payments" className="space-y-4 pt-4">
                    {/* Create a grid for the two components */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* The summary table takes up 2/3 of the space on large screens */}
                        <div className="lg:col-span-3">
                            <PaymentsTabV2 
                                cards={cards}
                                monthlySummary={monthlySummary}
                                currencyFn={currency}
                                fmtYMShortFn={fmtYMShort}
                                daysLeftFn={calculateDaysLeft}
                                onViewTransactions={handleViewTransactions}
                            />
                        </div>
                        {/* The new ROI component takes up 1/3 of the space */}
                        <div className="lg:col-span-1">
                            <CardRoi cards={cards} currencyFn={currency} feeCycleProgressFn={calculateFeeCycleProgress} />
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
            </main>  
            {/* 4. RENDER THE DIALOG COMPONENT */}
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
function StatCard({ title, value, icon, valueClassName }) {
    return (
        <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            {/* This 'cn' utility will merge the default styles with your new color class */}
            <div className={cn("text-2xl font-bold", valueClassName)}>{value}</div>
        </CardContent>
        </Card>
    );
}

const CustomRechartsTooltip = ({ active, payload, label }) => {
    const currency = (n) => (n || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
    
    if (active && payload?.length) {
        // Find the spend and cashback values from the tooltip's data payload
        const spendEntry = payload.find(p => p.dataKey === 'spend');
        const cashbackEntry = payload.find(p => p.dataKey === 'cashback');
        
        const spend = spendEntry ? spendEntry.value : 0;
        const cashback = cashbackEntry ? cashbackEntry.value : 0;

        // Calculate the effective rate, handling the case where spend is 0
        const effectiveRate = spend > 0 ? (cashback / spend) * 100 : 0;

        return (
        <div className="rounded-lg border bg-white p-2 text-sm shadow-sm">
            <p className="font-bold">{label}</p>
            {payload.map((p, i) => (
            <p key={i} style={{ color: p.color }}>
                {/* Capitalize the name for display */}
                {`${p.name.charAt(0).toUpperCase() + p.name.slice(1)}: ${currency(p.value)}`}
            </p>
            ))}
            {/* ADD THIS NEW LINE to display the effective rate */}
            <p className="font-semibold mt-2 pt-2 border-t">
            Effective Rate: {effectiveRate.toFixed(2)}%
            </p>
        </div>
        );
    }
    return null;
};

function CardInfoDialog({ card, rules }) {
    const currency = (n) => (n || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

    const isFeeCovered = card.estYtdCashback >= card.annualFee;
    const representativeTxCapRule = rules.find(rule => rule.capPerTransaction > 0);

    const infoItems = [
        { label: "Credit Limit", value: currency(card.creditLimit) },
        { label: "Card Number", value: `**** **** **** ${card.last4}` },
        { label: "Statement Day", value: `~ Day ${card.statementDay}` },
        { label: "Payment Due Day", value: `~ Day ${card.paymentDueDay}` },
        { label: "Monthly Interest", value: `${(card.interestRateMonthly * 100).toFixed(2)}%` },
        { 
        label: "Annual Fee", 
        value: currency(card.annualFee),
        valueClassName: isFeeCovered ? 'text-emerald-600' : 'text-red-500'
        },
    ];

    return (
        <Dialog>
        <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 text-xs">
            <Info className="mr-1.5 h-3.5 w-3.5" /> More info
            </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg bg-white">
            <DialogHeader>
            <DialogTitle>{card.name}</DialogTitle>
            <DialogDescription>{card.bank} &ndash; {card.cardType} Card</DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm pt-2">
            {infoItems.map(item => (
                <div key={item.label}>
                <p className="text-muted-foreground">{item.label}</p>
                <p className={cn("font-medium", item.valueClassName)}>{item.value}</p>
                </div>
            ))}
            </div>

            <div>
            <h4 className="font-semibold text-sm mb-2 mt-3">Cashback Details</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm p-3 bg-muted rounded-lg">
                {representativeTxCapRule && (
                <div>
                    <p className="text-muted-foreground">Max per Tx</p>
                    <p className="font-medium">{currency(representativeTxCapRule.capPerTransaction)}</p>
                </div>
                )}
                {card.limitPerCategory > 0 && (
                <div>
                    <p className="text-muted-foreground">Max per Cat</p>
                    <p className="font-medium">{currency(card.limitPerCategory)}</p>
                </div>
                )}
                {card.overallMonthlyLimit > 0 && (
                <div>
                    <p className="text-muted-foreground">Max per Month</p>
                    <p className="font-medium">{currency(card.overallMonthlyLimit)}</p>
                </div>
                )}
                {/* --- THIS IS THE NEW METRIC --- */}
                {card.minimumMonthlySpend > 0 && (
                <div>
                    <p className="text-muted-foreground">Min. Spending</p>
                    <p className="font-medium">{currency(card.minimumMonthlySpend)}</p>
                </div>
                )}
                {/* --- END OF NEW METRIC --- */}
            </div>
            </div>

            <div>
                <h4 className="font-semibold text-sm mb-2 mt-3">Cashback Rules</h4>
                {/* 1. Add this new relative container */}
                <div className="relative">
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-4">
                    {rules.map(rule => (
                        <Badge key={rule.id} variant="outline" className="w-full justify-between py-3">
                        <span className="font-medium text-primary">{rule.ruleName}</span>
                        <span className="font-mono text-base text-foreground">{rule.rate * 100}%</span>
                        </Badge>
                    ))}
                    {rules.length === 0 && <p className="text-xs text-muted-foreground">No specific cashback rules found for this card.</p>}
                    </div>
                    {/* 2. Add the fade-out overlay element */}
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                </div>
            </div>
        </DialogContent>
        </Dialog>
    );
}

function TransactionsTab({ transactions, isLoading, activeMonth, cardMap, mccNameFn, allCards, filterType, onFilterTypeChange }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [cardFilter, setCardFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [visibleCount, setVisibleCount] = useState(15);
    const [sortConfig, setSortConfig] = useState({ key: 'Transaction Date', direction: 'descending' });

    const currency = (n) => (n || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
    const fmtYMShort = (ymCode) => {
        if (!ymCode || typeof ymCode !== 'string' || ymCode.length !== 6) return "";
        const year = Number(ymCode.slice(0, 4));
        const month = Number(ymCode.slice(4, 6));
        if (isNaN(year) || isNaN(month)) return "";
        return new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'short', year: 'numeric' });
    };

    const categories = useMemo(() => {
        const allCategories = transactions.map(tx => tx['Category']).filter(Boolean);
        return ["all", ...Array.from(new Set(allCategories))];
    }, [transactions]);

    const filteredAndSortedTransactions = useMemo(() => {
        let sortableItems = [...transactions]; // Start with the fetched transactions for the month

        // Apply filters
        sortableItems = sortableItems.filter(tx => {
            if (!searchTerm) return true;
            const lowerCaseSearch = searchTerm.toLowerCase();
            return (
            tx['Transaction Name']?.toLowerCase().includes(lowerCaseSearch) ||
            String(tx['Amount']).includes(lowerCaseSearch) ||
            tx['Transaction Date']?.includes(lowerCaseSearch) ||
            String(tx['MCC Code']).includes(lowerCaseSearch)
            );
        })
        .filter(tx => cardFilter === "all" || (tx['Card'] && tx['Card'][0] === cardFilter))
        .filter(tx => categoryFilter === "all" || tx['Category'] === categoryFilter);

        // Apply sorting
        if (sortConfig.key !== null) {
        sortableItems.sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];
            if (aValue === null) return 1;
            if (bValue === null) return -1;

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

    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) return <ChevronsUpDown className="ml-2 h-4 w-4" />;
        return sortConfig.direction === 'ascending' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
    };

    return (
        <Card>
        <CardHeader>
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle>Transactions for {fmtYMShort(activeMonth)}</CardTitle>
                    
                    {/* This is the new filter switch */}
                    <Tabs defaultValue="date" value={filterType} onValueChange={onFilterTypeChange} className="flex items-center">
                        <TabsList className="bg-slate-100 p-1 rounded-lg">
                            <TabsTrigger value="date">Transaction Date</TabsTrigger>
                            <TabsTrigger value="cashbackMonth">Cashback Month</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                {/* The existing search and filter dropdowns */}
                <div className="flex flex-col sm:flex-row gap-2">
                    {/* Search bar takes full width on mobile, auto on larger screens */}
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input type="search" placeholder="Search..." className="w-full pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    {/* Dropdowns grow on mobile, auto on larger screens */}
                    <select value={cardFilter} onChange={(e) => setCardFilter(e.target.value)} className="flex-1 sm:flex-initial h-9 text-sm rounded-md border border-input bg-transparent px-3 py-1 shadow-sm focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer">
                        <option value="all">All Cards</option>
                        {allCards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="flex-1 sm:flex-initial h-9 text-sm rounded-md border border-input bg-transparent px-3 py-1 shadow-sm focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer">
                        {categories.map(cat => <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>)}
                    </select>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead className="w-[120px]"><Button variant="ghost" onClick={() => requestSort('Transaction Date')} className="px-2">Date <SortIcon columnKey="Transaction Date" /></Button></TableHead>
                        <TableHead><Button variant="ghost" onClick={() => requestSort('Transaction Name')} className="px-2">Transaction Name <SortIcon columnKey="Transaction Name" /></Button></TableHead>
                        <TableHead className="w-[150px]"><Button variant="ghost" onClick={() => requestSort('Cashback Month')} className="px-2 whitespace-normal h-auto text-left justify-start">S. Month <SortIcon columnKey="Statement Month" /></Button></TableHead>
                        <TableHead className="w-[200px]"><Button variant="ghost" onClick={() => requestSort('Card')} className="px-2 whitespace-normal h-auto text-left justify-start">Card <SortIcon columnKey="Card" /></Button></TableHead>
                        <TableHead><Button variant="ghost" onClick={() => requestSort('Category')} className="px-2 whitespace-normal h-auto text-left justify-start">Category <SortIcon columnKey="Category" /></Button></TableHead>
                        <TableHead className="text-right"><Button variant="ghost" onClick={() => requestSort('estCashback')} className="px-2 justify-end">Est. Cashback <SortIcon columnKey="estCashback" /></Button></TableHead>
                        <TableHead className="text-right"><Button variant="ghost" onClick={() => requestSort('Amount')} className="px-2 justify-end">Amount <SortIcon columnKey="Amount" /></Button></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={7} className="text-center h-24"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                        ) : transactionsToShow.length > 0 ? (
                            transactionsToShow.map(tx => {
                                const card = tx['Card'] ? cardMap.get(tx['Card'][0]) : null;
                                return (
                                    <TableRow key={tx.id}>
                                    <TableCell>{tx['Transaction Date']}</TableCell>
                                    <TableCell>
                                    <div className="font-medium">{tx['Transaction Name']}</div>
                                    {/* THIS IS THE LINE TO CHANGE: Add a conditional check */}
                                    {tx['MCC Code'] && (
                                        <div className="text-xs text-gray-500">
                                            {mccNameFn(tx['MCC Code'])} ({tx['MCC Code']})
                                        </div>
                                    )}
                                    </TableCell>
                                    <TableCell>
                                        {tx['Cashback Month'] ? (
                                            <Badge variant="outline">{fmtYMShort(tx['Cashback Month'])}</Badge>
                                        ) : null}
                                    </TableCell>
                                    <TableCell>{card ? <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">{card.name}</Badge> : 'N/A'}</TableCell>
                                    <TableCell>
                                        {tx['Category'] ? (
                                            <Badge variant="outline">
                                                {tx['Category']}
                                            </Badge>
                                        ) : null}
                                    </TableCell>
                                    <TableCell className="text-right font-medium text-emerald-600">{currency(tx.estCashback)}</TableCell>
                                    <TableCell className="text-right">{currency(tx['Amount'])}</TableCell>
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow><TableCell colSpan={7} className="text-center h-24 text-muted-foreground">No transactions found for the selected period or filters.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
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

function CardSpendsCap({ cards, activeMonth, monthlySummary }) {
    const currency = (n) => (n || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

    const cardSpendsCapProgress = useMemo(() => {
        return cards
            .filter(card => card.overallMonthlyLimit > 0)
            .map(card => {
                const cardMonthSummary = monthlySummary.find(
                    summary => summary.cardId === card.id && summary.month === activeMonth
                );
                const currentCashback = cardMonthSummary ? cardMonthSummary.cashback : 0;
                const monthlyLimit = card.overallMonthlyLimit;
                const usedPct = monthlyLimit > 0 ? Math.min(100, Math.round((currentCashback / monthlyLimit) * 100)) : 0;
                
                const { days, status } = card.useStatementMonthForPayments
                    ? calculateDaysLeftInCashbackMonth(activeMonth)
                    : calculateDaysUntilStatement(card.statementDay, activeMonth);

                return {
                    cardId: card.id,
                    cardName: card.name,
                    currentCashback,
                    monthlyLimit,
                    usedPct,
                    daysLeft: days,
                    cycleStatus: status,
                };
            })
            .sort((a, b) => b.usedPct - a.usedPct);
    }, [cards, activeMonth, monthlySummary]);

    const getProgressColor = (percentage) => {
        if (percentage >= 100) return "bg-emerald-500";
        if (percentage > 85) return "bg-orange-500";
        return "bg-sky-500";
    };

    const DaysLeftBadge = ({ status, days }) => (
        <Badge
            variant="outline"
            className={cn(
                "text-xs h-6 px-2 font-semibold justify-center",
                status === 'Completed' && "bg-emerald-100 text-emerald-800 border-emerald-200"
            )}
        >
            {status === 'Completed' ? 'Done' : `${days} days`}
        </Badge>
    );

    return (
        <Card className="lg:col-span-3">
            <CardHeader>
                <CardTitle>Card Spends Cap</CardTitle>
            </CardHeader>
            <CardContent>
                {cardSpendsCapProgress.length > 0 ? (
                    <div className="space-y-4">
                        {cardSpendsCapProgress.map(p => (
                            <div key={p.cardId} className="space-y-2">
                                {/* Top Row: Card Name and Days Left */}
                                <div className="flex justify-between items-center">
                                    <p className="font-semibold truncate" title={p.cardName}>
                                        {p.cardName}
                                    </p>
                                    <DaysLeftBadge status={p.cycleStatus} days={p.daysLeft} />
                                </div>

                                {/* Bottom Row: Progress bar with amount on the side */}
                                <div className="flex items-center gap-2">
                                    {/* THIS IS THE CHANGED LINE */}
                                    <Progress value={p.usedPct} indicatorClassName={getProgressColor(p.usedPct)} className="h-1.5 flex-grow" />
                                    <span className="text-xs font-medium text-muted-foreground shrink-0 text-right w-[160px]">
                                        {currency(p.currentCashback)} / {currency(p.monthlyLimit)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No monthly limits defined for your cards.</p>
                )}
            </CardContent>
        </Card>
    );
}

function SpendByCardChart({ spendData, currencyFn, cardColorMap }) {
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);
        if (percent < 0.05) return null;
        return (
            <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-semibold">
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <Card>
            <CardHeader><CardTitle>Spending by Card</CardTitle></CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                        <Pie data={spendData} cx="50%" cy="50%" labelLine={false} label={renderCustomizedLabel} innerRadius={60} outerRadius={90} dataKey="value" nameKey="name" paddingAngle={3}>
                            {spendData.map((entry) => (
                                <Cell key={`cell-${entry.name}`} fill={cardColorMap.get(entry.name) || '#cccccc'} />
                            ))}
                        </Pie>
                        <RechartsTooltip formatter={(value) => currencyFn(value)} />
                        <Legend wrapperStyle={{ marginTop: '24px' }}/>
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

function CashbackByCardChart({ cashbackData, currencyFn, cardColorMap }) {
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);
        if (percent < 0.05) return null;
        return (
            <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-semibold">
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <Card>
            <CardHeader><CardTitle>Cashback by Card</CardTitle></CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                        <Pie data={cashbackData} cx="50%" cy="50%" labelLine={false} label={renderCustomizedLabel} innerRadius={60} outerRadius={90} dataKey="value" nameKey="name" paddingAngle={3}>
                            {cashbackData.map((entry) => (
                                <Cell key={`cell-${entry.name}`} fill={cardColorMap.get(entry.name) || '#cccccc'} />
                            ))}
                        </Pie>
                        <RechartsTooltip formatter={(value) => currencyFn(value)} />
                        <Legend wrapperStyle={{ marginTop: '24px' }} />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

function CardsOverviewMetrics({ stats, currencyFn }) {
    // THIS IS THE FIX: Add a guard clause to handle the initial render
    // If the stats object isn't ready, render nothing.
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
    const [activeStatement, setActiveStatement] = useState(null);
    const [isLoadingMore, setIsLoadingMore] = useState({}); // ADD THIS STATE BACK

    // RE-INTRODUCE THE "LOAD MORE" HANDLER
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

    useEffect(() => {
        const calculatePaymentData = async () => {
            if (cards.length === 0 || monthlySummary.length === 0) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);

            // THIS IS THE UPDATED DATA PROCESSING LOGIC
            const dataPromises = cards.map(async (card) => {
                const allCardSummaries = monthlySummary.filter(s => s.cardId === card.id);
                if (allCardSummaries.length === 0) return null;

                let finalResult;

                if (card.useStatementMonthForPayments) {
                    // --- SPECIAL HANDLING LOGIC ---
                    const tempStatements = allCardSummaries.map(stmt => {
                        const year = parseInt(stmt.month.slice(0, 4), 10);
                        const month = parseInt(stmt.month.slice(4, 6), 10);
                        let paymentMonth = month;
                        if (card.paymentDueDay < card.statementDay) paymentMonth += 1;
                        const dueDate = new Date(year, paymentMonth - 1, card.paymentDueDay);
                        const paymentDate = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')}`;
                        return { ...stmt, paymentDateObj: dueDate, daysLeft: daysLeftFn(paymentDate), paymentDate, card };
                    });

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
                    const upcoming = processedStatements.filter(s => s.daysLeft !== null).sort((a, b) => a.daysLeft - b.daysLeft);
                    const past = processedStatements.filter(s => s.daysLeft === null).sort((a, b) => b.paymentDateObj - a.paymentDateObj);
                    
                    finalResult = { mainStatement: upcoming[0] || past[0], upcomingStatements: upcoming.slice(1), pastStatements: past, remainingPastSummaries };

                } else {
                    // --- STANDARD HANDLING LOGIC ---
                    const finalStatements = allCardSummaries.map(stmt => {
                         const year = parseInt(stmt.month.slice(0, 4), 10);
                        const month = parseInt(stmt.month.slice(4, 6), 10);
                        let paymentMonth = month;
                        if (card.paymentDueDay < card.statementDay) paymentMonth += 1;
                        const dueDate = new Date(year, paymentMonth - 1, card.paymentDueDay);
                        const paymentDate = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')}`;
                        return { ...stmt, paymentDateObj: dueDate, daysLeft: daysLeftFn(paymentDate), paymentDate, card };
                    });

                    const upcoming = finalStatements.filter(s => s.daysLeft !== null).sort((a, b) => a.daysLeft - b.daysLeft);
                    const past = finalStatements.filter(s => s.daysLeft === null).sort((a, b) => b.paymentDateObj - a.paymentDateObj);
                    finalResult = { mainStatement: upcoming[0] || past[0], upcomingStatements: upcoming.slice(1), pastStatements: past };
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
                return b.mainStatement.paymentDateObj - a.mainStatement.paymentDateObj;
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

    // This function will simulate the update. In a real app, it would call your API.
    const handleSavePayment = (statementId, newPaidAmount) => {
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
    };
    
    // Calculate summary stats
    const summaryStats = useMemo(() => {
        const upcomingBills = paymentData.filter(p => p.mainStatement.daysLeft !== null && (p.mainStatement.statementAmount - p.mainStatement.paidAmount > 0));
        
        const totalDue = upcomingBills.reduce((acc, curr) => acc + (curr.mainStatement.statementAmount - curr.mainStatement.paidAmount), 0);
        const nextPayment = upcomingBills.length > 0 ? upcomingBills[0] : null;

        return {
            totalDue,
            billCount: upcomingBills.length,
            nextPaymentAmount: nextPayment ? (nextPayment.mainStatement.statementAmount - nextPayment.mainStatement.paidAmount) : 0,
            nextPaymentCard: nextPayment ? nextPayment.mainStatement.card.name : 'N/A',
        };
    }, [paymentData]);

    if (isLoading) {
        return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <StatCard title="Total Due Soon" value={currencyFn(summaryStats.totalDue)} icon={<Wallet className="h-4 w-4 text-muted-foreground" />} />
                <StatCard title="Upcoming Bills" value={summaryStats.billCount} icon={<CalendarClock className="h-4 w-4 text-muted-foreground" />} />
                <StatCard title="Next Payment" value={currencyFn(summaryStats.nextPaymentAmount)} icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />} valueClassName="text-red-600" />
            </div>

            <div className="space-y-4">
                {paymentData.map(({ mainStatement, upcomingStatements, pastStatements }) => (
                    <PaymentCard 
                        key={mainStatement.id}
                        statement={mainStatement}
                        upcomingStatements={upcomingStatements}
                        pastStatements={pastStatements}
                        onLogPayment={handleLogPaymentClick}
                        onViewTransactions={onViewTransactions}
                        currencyFn={currencyFn}
                        fmtYMShortFn={fmtYMShortFn}
                    />
                ))}
            </div>

            {activeStatement && (
                 <PaymentLogDialog
                    isOpen={dialogOpen}
                    onClose={() => setDialogOpen(false)}
                    statement={activeStatement}
                    onSave={handleSavePayment}
                    currencyFn={currencyFn}
                />
            )}
        </div>
    );
}

// -------------------------------------------------
// 2. ADD THE NEW PAYMENT CARD COMPONENT
// -------------------------------------------------
function PaymentCard({ statement, upcomingStatements, pastStatements, onLogPayment, onViewTransactions, currencyFn, fmtYMShortFn }) {
    const [historyOpen, setHistoryOpen] = useState(false);
    
    const { 
        card, 
        daysLeft, 
        statementAmount = 0, // Default to 0 if data is missing
        paidAmount = 0,
        spend = 0,
        cashback = 0
    } = statement;

    const remaining = statementAmount - paidAmount;
    const isPaid = remaining <= 0;
    const isPartiallyPaid = paidAmount > 0 && !isPaid;
    const estimatedBalance = spend - cashback;

    const getStatus = () => {
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
        <div className={cn("bg-white rounded-xl shadow-sm overflow-hidden border",
            isPaid && "opacity-70",
            !isPaid && daysLeft !== null && daysLeft <= 3 && "border-2 border-red-500",
            isPartiallyPaid && "border-2 border-yellow-500"
        )}>
            <div className="p-4">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="font-bold text-slate-800 text-lg">{card.name} <span className="text-base font-medium text-slate-400">•••• {card.last4}</span></p>
                        <p className="text-sm text-slate-500">Statement: {fmtYMShortFn(statement.month)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                         <div className={cn("text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 inline-flex items-center", status.className)}>
                            {status.icon}{status.text}
                        </div>
                        <button onClick={() => onViewTransactions(card.id, card.name, statement.month, fmtYMShortFn(statement.month))} title="View Transactions" className="text-slate-400 hover:text-slate-600">
                             <List className="h-6 w-6"/>
                        </button>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 bg-slate-100/80 rounded-lg p-3">
                        <p className="text-xs text-slate-500 font-semibold">ACTUAL BALANCE</p>
                        <p className="text-3xl font-extrabold text-slate-800 tracking-tight">{currencyFn(statementAmount)}</p>
                        <div className="mt-2 space-y-1 text-sm">
                            <div className="flex justify-between items-center"><span className="text-slate-500">Paid:</span><span className="font-medium text-slate-600">{currencyFn(paidAmount)}</span></div>
                            <div className="flex justify-between items-center font-bold"><span className="text-slate-500">Remaining:</span><span className={cn(isPaid ? "text-emerald-600" : "text-red-600")}>{currencyFn(remaining)}</span></div>
                        </div>
                    </div>
                    <div className="w-full md:w-64 bg-slate-50/70 rounded-lg p-3">
                        <p className="text-xs text-slate-500 font-semibold">ESTIMATED BALANCE</p>
                        <p className="text-2xl font-bold text-slate-500 tracking-tight">{currencyFn(estimatedBalance)}</p>
                        <div className="mt-2 space-y-1 text-sm">
                            <div className="flex justify-between items-center"><span className="text-slate-500">Total Spend:</span><span className="font-medium text-slate-600">{currencyFn(spend)}</span></div>
                            <div className="flex justify-between items-center"><span className="text-slate-500">Cashback:</span><span className="font-medium text-emerald-600">-{currencyFn(cashback)}</span></div>
                        </div>
                    </div>
                </div>
                <div className="mt-4 flex gap-3">
                   <Button onClick={() => onLogPayment(statement)} disabled={isPaid} className="flex-1 h-10">{isPaid ? 'Fully Paid' : 'Log Payment'}</Button>
                   <Button onClick={() => setHistoryOpen(!historyOpen)} variant="outline" className="flex-1 h-10">History</Button>
                </div>
            </div>
                {historyOpen && (
                    <div className="p-4 border-t border-slate-200 bg-slate-50/50 space-y-4">
                        <StatementHistoryTable
                            title="Upcoming Statements"
                            statements={upcomingStatements}
                            currencyFn={currencyFn}
                            fmtYMShortFn={fmtYMShortFn}
                            onViewTransactions={onViewTransactions}
                        />
                        <StatementHistoryTable
                            title="Past Statements"
                            statements={pastStatements}
                            remainingCount={statement.remainingPastSummaries?.length || 0}
                            onLoadMore={() => onLoadMore(statement.card.id)}
                            isLoadingMore={isLoadingMore[statement.card.id]}
                            currencyFn={currencyFn}
                            fmtYMShortFn={fmtYMShortFn}
                            onViewTransactions={onViewTransactions}
                        />
                    </div>
                )}
        </div>
    );
}

// -------------------------------------------------
// 3. ADD THE NEW PAYMENT LOG DIALOG COMPONENT
// -------------------------------------------------
function PaymentLogDialog({ isOpen, onClose, statement, onSave, currencyFn }) {
    const [amount, setAmount] = useState('');
    
    useEffect(() => {
        if (isOpen) {
            // Pre-fill with remaining amount for convenience
            const remaining = (statement.statementAmount || 0) - (statement.paidAmount || 0);
            setAmount(remaining > 0 ? remaining : '');
        }
    }, [isOpen, statement]);

    const handleSave = () => {
        const newPaidAmount = (statement.paidAmount || 0) + Number(amount);
        onSave(statement.id, newPaidAmount);
        onClose();
    };

    if (!statement) return null;
    
    const remaining = (statement.statementAmount || 0) - (statement.paidAmount || 0);
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Log Payment</DialogTitle>
                    <DialogDescription>For {statement.card.name} - {fmtYMShort(statement.month)}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="text-sm">
                        <p>Actual Balance: <span className="font-medium">{currencyFn(statement.statementAmount)}</span></p>
                        <p>Currently Paid: <span className="font-medium">{currencyFn(statement.paidAmount)}</span></p>
                        <p className="font-bold">Remaining: <span className="text-red-600">{currencyFn(remaining)}</span></p>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="payment-amount" className="text-sm font-medium">Amount to Log</label>
                        <Input 
                            id="payment-amount" 
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Enter amount paid"
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Save Payment</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function StatementHistoryTable({ title, statements, remainingCount, onLoadMore, isLoadingMore, currencyFn, fmtYMShortFn, onViewTransactions }) {
    if (!statements || statements.length === 0) {
        return null; // Don't render anything if there are no statements
    }

    return (
        <div>
            <h3 className="text-sm font-semibold mb-2 text-slate-600">{title}</h3>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-sm whitespace-nowrap">
                    <thead className="text-left text-slate-500 bg-slate-100">
                        <tr>
                            <th className="p-2 font-medium">Month</th>
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
                    <tbody className="divide-y divide-slate-200 bg-white">
                        {statements.map(stmt => {
                            const remaining = (stmt.statementAmount || 0) - (stmt.paidAmount || 0);
                            const isPaid = remaining <= 0 && stmt.statementAmount > 0;
                            
                            let statusBadge;
                            if (stmt.daysLeft === null) {
                                statusBadge = <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full">Completed</span>;
                            } else {
                                statusBadge = <span className="bg-sky-100 text-sky-800 text-xs font-bold px-2 py-0.5 rounded-full">Upcoming</span>;
                            }
                            
                            return (
                                <tr key={stmt.id} className="hover:bg-slate-50">
                                    <td className="p-2"><span className="bg-slate-200 text-slate-700 font-medium px-2 py-1 rounded-md text-xs">{fmtYMShortFn(stmt.month)}</span></td>
                                    <td className="p-2">{statusBadge}</td>
                                    <td className="p-2">{stmt.statementDate}</td>
                                    <td className="p-2">{stmt.paymentDate}</td>
                                    <td className="p-2 text-right">{currencyFn(stmt.spend)}</td>
                                    <td className="p-2 text-right text-emerald-600">-{currencyFn(stmt.cashback)}</td>
                                    <td className="p-2 text-right font-bold text-slate-700">{currencyFn(stmt.statementAmount)}</td>
                                    <td className="p-2 text-right">{currencyFn(stmt.paidAmount)}</td>
                                    <td className="p-2 text-center">
                                        <button 
                                            onClick={() => onViewTransactions(stmt.card.id, stmt.card.name, stmt.month, fmtYMShortFn(stmt.month))}
                                            className="text-slate-400 hover:text-slate-600"
                                        >
                                            <List className="h-5 w-5"/>
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    {remainingCount > 0 && (
                        <tfoot className="bg-slate-50">
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

function CardRoi({ cards, currencyFn, feeCycleProgressFn }) {
    const roiData = useMemo(() => {
        const data = cards.map(card => {
            const totalValue = (card.estYtdCashback || 0) - (card.annualFee || 0);
            const isNetPositive = totalValue >= 0;
            const { daysPast, progressPercent } = feeCycleProgressFn(card.cardOpenDate, card.nextAnnualFeeDate);
            return { ...card, totalValue, isNetPositive, daysPast, progressPercent };
        });
        
        // --- THIS IS THE UPDATED SORTING LOGIC ---
        // Sort by progress percentage from highest to lowest
        data.sort((a, b) => b.progressPercent - a.progressPercent);

        return data;
    }, [cards, feeCycleProgressFn]);

    return (
        <Card>
            <CardHeader><CardTitle>Card ROI (Year-to-Date)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                {roiData.map(card => (
                    <div key={card.id} className="p-4 rounded-lg border bg-background">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="font-semibold">{card.name}</p>
                                <p className="text-sm text-gray-500">Open since: {card.cardOpenDate || "N/A"}</p>
                                <p className="text-sm text-gray-500">Next Fee: {card.nextAnnualFeeDate || "N/A"}</p>
                            </div>
                            <Badge variant="outline" className={cn(
                                "font-semibold",
                                card.isNetPositive
                                    ? "border-gray-300 border text-gray-600"
                                    : "bg-red-500 text-white border-transparent"
                            )}>
                                {card.isNetPositive ? "Net Positive" : "Net Negative"}
                            </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                            <div>
                                <p className="text-muted-foreground">Annual Fee</p>
                                <p className="font-medium">{currencyFn(card.annualFee)}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Total Value (YTD)</p>
                                <p className={`font-medium ${card.isNetPositive ? 'text-emerald-600' : 'text-orange-500'}`}>
                                    {currencyFn(card.totalValue)}
                                </p>
                            </div>
                        </div>
                        {card.progressPercent > 0 && (
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className={"text-gray-500"}>
                                        {card.daysPast} days past
                                    </span>
                                    <span className={"text-gray-500"}>
                                        {card.progressPercent}%
                                    </span>
                                </div>
                                <Progress value={card.progressPercent} />
                            </div>
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

function CategoryCapsUsage({ card, activeMonth, monthlyCategorySummary, monthlySummary, currencyFn }) {
    // --- THIS IS THE ADJUSTED LOGIC ---
    const { days, status } = card.useStatementMonthForPayments
        ? calculateDaysLeftInCashbackMonth(activeMonth)
        : calculateDaysUntilStatement(card.statementDay, activeMonth);

    const categoryCapData = useMemo(() => {
        const summaries = monthlyCategorySummary.filter(
            summary => summary.cardId === card.id && summary.month === activeMonth
        );
        if (!summaries.length) return [];
        return summaries.map(summary => {
            const currentCashback = summary.cashback || 0;
            const categoryLimit = summary.categoryLimit || 0;
            const usedPct = categoryLimit > 0 ? Math.min(100, Math.round((currentCashback / categoryLimit) * 100)) : 0;
            const remaining = categoryLimit - currentCashback;
            let categoryName = 'Unknown Category';
            if (summary.summaryId) {
                const parts = summary.summaryId.split(' - ');
                if (parts.length > 2) categoryName = parts.slice(2).join(' - ');
            }
            return { id: summary.id, category: categoryName, currentCashback, limit: categoryLimit, usedPct, remaining };
        });
    }, [card, activeMonth, monthlyCategorySummary]);

    const totalCardData = useMemo(() => {
        const summary = monthlySummary.find(
            s => s.cardId === card.id && s.month === activeMonth
        );
        if (!summary || !card.overallMonthlyLimit) return null;
        const totalCashback = summary.cashback || 0;
        const totalLimit = card.overallMonthlyLimit || 0;
        const usedPct = totalLimit > 0 ? Math.min(100, Math.round((totalCashback / totalLimit) * 100)) : 0;
        const remaining = totalLimit - totalCashback;
        return { totalCashback, limit: totalLimit, usedPct, remaining };
    }, [card, activeMonth, monthlySummary]);

    return (
        <div>
            <h4 className="text-sm font-semibold text-center text-muted-foreground mb-2">Category Caps Usage</h4>
            <div className="flex justify-center mb-3" style={{ marginBottom: '24px' }}>
                <Badge variant="outline" className={cn(
                    "text-xs",
                    status === 'Completed' && "bg-emerald-100 text-emerald-800 border-emerald-200"
                )}>
                    {status === 'Completed' ? 'Completed' : `${days} days left`}
                </Badge>
            </div>
            {categoryCapData.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {totalCardData && (
                        <div className="border p-3 rounded-lg space-y-2 flex flex-col bg-slate-100">
                            <div className="flex justify-between items-start">
                                <p className="font-semibold text-sm truncate pr-2">Total</p>
                                <Badge variant="outline" className={cn("font-mono", totalCardData.usedPct >= 100 ? "bg-emerald-500 text-white border-transparent" : "bg-background text-foreground border border-input")}>
                                    {totalCardData.usedPct}%
                                </Badge>
                            </div>
                            <div className="flex-grow"></div> 
                            <Progress value={totalCardData.usedPct} className="h-2" />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{currencyFn(totalCardData.totalCashback)} / {currencyFn(totalCardData.limit)}</span>
                                <span className="font-medium">{currencyFn(totalCardData.remaining)} left</span>
                            </div>
                        </div>
                    )}
                    {categoryCapData.map(cap => (
                        <div key={cap.id} className="border p-3 rounded-lg space-y-2 flex flex-col">
                            <div className="flex justify-between items-start">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <p className="font-medium text-sm truncate pr-2" title={cap.category}>{cap.category}</p>
                                    </TooltipTrigger>
                                    <TooltipContent><p>{cap.category}</p></TooltipContent>
                                </Tooltip>
                                <Badge variant="outline" className={cn("font-mono", cap.usedPct >= 100 ? "bg-emerald-500 text-white border-transparent" : "bg-background text-foreground border border-input")}>
                                    {cap.usedPct}%
                                </Badge>
                            </div>
                            <div className="flex-grow"></div> 
                            <Progress value={cap.usedPct} className="h-2" />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{currencyFn(cap.currentCashback)} / {currencyFn(cap.limit)}</span>
                                <span className="font-medium">{currencyFn(cap.remaining)} left</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="border p-3 rounded-lg flex items-center justify-center h-24">
                    <p className="text-xs text-muted-foreground">No specific categories for this month</p>
                </div>
            )}
        </div>
    );
}

function CardPerformanceLineChart({ data, cards, currencyFn, cardColorMap }) {
    const [view, setView] = useState('All');
    
    const SquareDot = (props) => {
        const { cx, cy, stroke, value } = props;
        const size = 7;
        if (value === null || value === undefined) return null;
        return <rect x={cx - size / 2} y={cy - size / 2} width={size} height={size} fill={stroke} />;
    };

    return (
        <Card>
            <CardHeader className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>Card Performance Trend</CardTitle>
                <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
                    <Button onClick={() => setView('All')} variant="ghost" size="sm" className={cn("h-7 px-3", view === 'All' && 'bg-white text-primary shadow-sm hover:bg-white')}>All</Button>
                    <Button onClick={() => setView('Spending')} variant="ghost" size="sm" className={cn("h-7 px-3", view === 'Spending' && 'bg-white text-primary shadow-sm hover:bg-white')}>Spending</Button>
                    <Button onClick={() => setView('Cashback')} variant="ghost" size="sm" className={cn("h-7 px-3", view === 'Cashback' && 'bg-white text-primary shadow-sm hover:bg-white')}>Cashback</Button>
                </div>
            </CardHeader>
            <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis yAxisId="left" domain={[0, 'auto']} stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={view === 'Cashback' ? (v) => `${(v / 1000).toFixed(0)}k` : (v) => `${(v / 1000000).toFixed(0)}M`} />
                        {view === 'All' && (
                            <YAxis yAxisId="right" domain={[0, 'auto']} orientation="right" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                        )}
                        <RechartsTooltip content={<CustomLineChartTooltip currencyFn={currencyFn} cards={cards} />} />
                        
                        {cards.map((card) => {
                            const cardColor = cardColorMap.get(card.name) || '#cccccc'; // Get color from map
                            return (
                                <React.Fragment key={card.id}>
                                    {(view === 'All' || view === 'Spending') && (
                                        <Line type="linear" connectNulls dataKey={`${card.name} Spend`} stroke={cardColor} strokeWidth={2} yAxisId="left" activeDot={{ r: 6 }} dot={{ r: 4 }} />
                                    )}
                                    {(view === 'All' || view === 'Cashback') && (
                                        <Line type="linear" connectNulls dataKey={`${card.name} Cashback`} stroke={cardColor} strokeWidth={2} strokeDasharray="5 5" yAxisId={view === 'All' ? 'right' : 'left'} activeDot={{ r: 6 }} dot={<SquareDot />} />
                                    )}
                                </React.Fragment>
                            )
                        })}
                    </LineChart>
                </ResponsiveContainer>
                <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs">
                    {cards.map((card) => (
                        <div key={card.id} className="flex items-center gap-1.5">
                            <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: cardColorMap.get(card.name) || '#cccccc' }} // Use map for legend color
                            />
                            <span>{card.name}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function RecentTransactionsCarousel({ transactions, cardMap, currencyFn }) {
    const scrollContainerRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScrollability = () => {
        const container = scrollContainerRef.current;
        if (container) {
            setCanScrollLeft(container.scrollLeft > 0);
            setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth);
        }
    };

    useEffect(() => {
        // A slight delay to ensure the container has rendered and can be measured
        setTimeout(checkScrollability, 100); 

        const container = scrollContainerRef.current;
        container?.addEventListener('scroll', checkScrollability);
        window.addEventListener('resize', checkScrollability);
        return () => {
            container?.removeEventListener('scroll', checkScrollability);
            window.removeEventListener('resize', checkScrollability);
        };
    }, [transactions]);

    const handleScroll = (direction) => {
        const container = scrollContainerRef.current;
        if (container) {
            const scrollAmount = container.clientWidth * 0.8;
            container.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
        }
    };

    if (!transactions || transactions.length === 0) return null;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent className="relative px-12">
                {canScrollLeft && (
                    <Button variant="outline" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full" onClick={() => handleScroll('left')}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                )}
                <div 
                    ref={scrollContainerRef} 
                    className="flex gap-4 overflow-x-auto pb-4 scroll-smooth"
                    // THIS IS THE CORRECTED STYLE OBJECT
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {transactions.map(tx => {
                        const card = tx['Card'] ? cardMap.get(tx['Card'][0]) : null;
                        return (
                            <div key={tx.id} className="flex-shrink-0 w-64 border rounded-lg p-3 space-y-2">
                                <div className="flex justify-between items-start gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold truncate" title={tx['Transaction Name']}>{tx['Transaction Name']}</p>
                                        <p className="text-xs text-gray-500">{tx['Transaction Date']}</p>
                                    </div>
                                    {card && <Badge variant="outline" className="text-xs h-5 shrink-0">{card.name}</Badge>}
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-lg">{currencyFn(tx['Amount'])}</p>
                                    <p className="text-sm text-emerald-600 font-medium">+ {currencyFn(tx.estCashback)}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
                {canScrollRight && (
                    <Button variant="outline" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full" onClick={() => handleScroll('right')}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

function PinInput({ length = 6, onComplete }) {
    const [pin, setPin] = useState(Array(length).fill(''));
    const inputRefs = useRef([]);

    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    const handleChange = (e, index) => {
        const value = e.target.value;
        if (!/^[0-9]$/.test(value) && value !== '') return;

        const newPin = [...pin];
        newPin[index] = value;
        setPin(newPin);

        if (value !== '' && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        if (newPin.join('').length === length) {
            onComplete(newPin.join(''));
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace' && pin[index] === '' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        const pastedData = e.clipboardData.getData('text').slice(0, length);
        if (/^[0-9]+$/.test(pastedData)) {
            const newPin = Array(length).fill('');
            pastedData.split('').forEach((char, index) => {
                newPin[index] = char;
            });
            setPin(newPin);
            if (newPin.join('').length === length) {
                onComplete(newPin.join(''));
            }
        }
    };

    return (
        <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {pin.map((digit, index) => (
                <Input
                    key={index}
                    ref={el => inputRefs.current[index] = el}
                    type="password"
                    maxLength="1"
                    pattern="[0-9]"
                    inputMode="numeric"
                    value={digit}
                    onChange={(e) => handleChange(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className="w-12 h-14 text-center text-2xl font-semibold"
                />
            ))}
        </div>
    );
}

function LoginScreen({ onLoginSuccess }) {
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handlePinComplete = async (pin) => {
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ pin }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    onLoginSuccess();
                } else {
                    // This case handles if the API itself says the pin is wrong
                    setError('Incorrect PIN. Please try again.');
                }
            } else {
                // This handles server errors (e.g., 401 Unauthorized)
                setError('Incorrect PIN. Please try again.');
            }
        } catch (err) {
            console.error('Login request failed:', err);
            setError('An error occurred. Please check your connection.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
            <div className="w-full max-w-sm">
                <Card>
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">Enter PIN</CardTitle>
                        <p className="text-sm text-muted-foreground pt-1">Please enter your 6-digit PIN to continue.</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* The PinInput component doesn't need any changes */}
                        <PinInput onComplete={handlePinComplete} />
                        
                        {isLoading && <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}

                        {error && <p className="text-sm font-medium text-destructive text-center">{error}</p>}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// CashbackDashboard.jsx

function AddTransactionForm({ cards, categories, rules, monthlyCategories, mccMap, onTransactionAdded, commonVendors }) {
    // --- State Management ---
    const [merchant, setMerchant] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [cardId, setCardId] = useState('');
    const [category, setCategory] = useState('');
    const [mccCode, setMccCode] = useState('');
    const [merchantLookup, setMerchantLookup] = useState('');
    const [mccName, setMccName] = useState('');
    const [applicableRuleId, setApplicableRuleId] = useState('');
    const [cardSummaryCategoryId, setCardSummaryCategoryId] = useState('new');
    const [isMccSearching, setIsMccSearching] = useState(false);
    const [mccResults, setMccResults] = useState([]);
    const [isMccDialogOpen, setIsMccDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPredicting, setIsPredicting] = useState(false);

    const amountInputRef = useRef(null);

    const handleVendorSelect = (vendor) => {
        setMerchant(vendor.transactionName || '');
        setMerchantLookup(vendor.merchant || '');
        setMccCode(vendor.mcc || '');
        setCategory(vendor.category || '');

        // --- NEW LOGIC ---
        // Set the card first, if a preferred one is specified.
        if (vendor.preferredCardId) {
            setCardId(vendor.preferredCardId);
        }

        // Then, set the preferred rule.
        // This works because setting the card above will trigger React to update
        // the list of available rules before this line runs.
        if (vendor.preferredRuleId) {
            setApplicableRuleId(vendor.preferredRuleId);
        } else {
            // If the vendor has no preferred rule, clear any existing selection.
            setApplicableRuleId('');
        }
        // --- END NEW LOGIC ---

        // Focus the amount field so the user can type the amount immediately.
        amountInputRef.current?.focus();
    };

    // --- Memoized Calculations ---
    const selectedCard = useMemo(() => cards.find(c => c.id === cardId), [cardId, cards]);

    const filteredRules = useMemo(() => {
        if (!cardId) return [];
        // --- THIS IS THE UPDATED FILTER LOGIC ---
        // Only show rules for the selected card that are also "Active"
        return rules
            .filter(rule => rule.cardId === cardId && rule.status === 'Active')
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [cardId, rules]);

    const selectedRule = useMemo(() => rules.find(r => r.id === applicableRuleId), [applicableRuleId, rules]);

    const cashbackMonth = useMemo(() => {
        if (!selectedCard || !date) return null;
        const transactionDate = new Date(date);
        const statementDay = selectedCard.statementDay;
        if (selectedCard.useStatementMonthForPayments) {
            const year = transactionDate.getFullYear();
            const month = transactionDate.getMonth() + 1;
            return `${year}${String(month).padStart(2, '0')}`;
        }
        let year = transactionDate.getFullYear();
        let month = transactionDate.getMonth();
        if (transactionDate.getDate() >= statementDay) {
            month += 1;
        }
        if (month > 11) {
            month = 0;
            year += 1;
        }
        const finalMonth = month + 1;
        return `${year}${String(finalMonth).padStart(2, '0')}`;
    }, [selectedCard, date]);

    const filteredSummaries = useMemo(() => {
        if (!selectedRule || !cardId || !cashbackMonth) return [];
        const targetSummaryId = `${cashbackMonth} - ${selectedRule.name}`;
        return monthlyCategories.filter(summary => {
            return summary.cardId === cardId && summary.summaryId === targetSummaryId;
        });
    }, [cardId, monthlyCategories, selectedRule, cashbackMonth]);

    // --- Effects ---

    useEffect(() => {
        // Don't search if the input is too short
        if (merchant.trim().length < 3) {
            setIsPredicting(false);
            return;
        }

        setIsPredicting(true);

        // Set a timer to run after 500ms
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`/api/predict-merchant-profile?keyword=${encodeURIComponent(merchant)}`);
                const profile = await res.json();

                // If a profile was found, auto-fill the fields
                if (profile) {
                    setMerchantLookup(profile.merchant || '');
                    setMccCode(profile.mcc || '');
                    setCategory(profile.category || '');
                }
            } catch (error) {
                console.error("Failed to fetch merchant profile:", error);
            } finally {
                setIsPredicting(false);
            }
        }, 500); // 500ms delay

        // This cleanup function runs every time the 'merchant' state changes.
        // It cancels the previous timer, so the API call only happens once you stop typing.
        return () => {
            clearTimeout(timer);
        };
    }, [merchant]); // This effect runs whenever the 'merchant' input value changes

    useEffect(() => {
        if (filteredSummaries.length > 0) {
            setCardSummaryCategoryId(filteredSummaries[0].id);
        } else {
            setCardSummaryCategoryId('new');
        }
    }, [filteredSummaries]);

    useEffect(() => {
        if (cards.length > 0 && !cardId) {
            const lastUsedCardId = localStorage.getItem('lastUsedCardId');
            
            // Check if the last-used ID exists and is a valid option in the current cards list
            const lastUsedCardIsValid = lastUsedCardId && cards.some(c => c.id === lastUsedCardId);

            if (lastUsedCardIsValid) {
                setCardId(lastUsedCardId);
            } else {
                // Fallback to the first card in the list if no valid last-used card is found
                setCardId(cards[0].id);
            }
        }
    }, [cards, cardId]);
    

    useEffect(() => {
        if (mccMap && mccCode && mccMap[mccCode]) {
            setMccName(mccMap[mccCode].vn);
        } else {
            setMccName('');
        }
    }, [mccCode, mccMap]);

    const estimatedCashback = useMemo(() => {
        if (!selectedRule || !amount) {
            return 0;
        }
        const numericAmount = parseFloat(String(amount).replace(/,/g, ''));
        if (isNaN(numericAmount)) {
            return 0;
        }
        const calculatedCashback = numericAmount * selectedRule.rate;
        const cap = selectedRule.capPerTransaction;
        if (cap > 0 && calculatedCashback > cap) {
            return cap;
        }
        return calculatedCashback;
    }, [amount, selectedRule]);

    // --- Handlers ---
    const resetForm = () => {
        setMerchant('');
        setAmount('');
        // setDate(new Date().toISOString().split('T')[0]);
        // setCardId(cards.length > 0 ? cards[0].id : '');
        setCategory('');
        setMccCode('');
        setMerchantLookup('');
        setApplicableRuleId('');
        setCardSummaryCategoryId('new');
    };
    
    const handleAmountChange = (e) => {
        const value = e.target.value.replace(/,/g, '');
        if (!isNaN(value) && value.length <= 15) {
            setAmount(Number(value).toLocaleString('en-US'));
        } else if (value === '') {
            setAmount('');
        }
    };

    const handleMccSearch = async () => {
        if (!merchant) return;
        setIsMccSearching(true);
        setMccResults([]);

        try {
            const keyword = encodeURIComponent(merchant);

            // 1. Fetch from both internal and external APIs in parallel
            const [internalRes, externalRes] = await Promise.all([
                fetch(`/api/internal-mcc-search?keyword=${keyword}`),
                fetch(`/api/mcc-search?keyword=${keyword}`)
            ]);

            // 2. Process results, handling potential errors for each
            let internalData = [];
            if (internalRes.ok) {
                const rawInternal = await internalRes.json();
                // Transform internal data to match the external format for the dialog
                internalData = rawInternal.map(item => ([
                    "Your History", // Source
                    item.merchant,  // Merchant Name
                    item.mcc,       // MCC Code
                    mccMap[item.mcc]?.en || "Unknown", // English Category Name
                    mccMap[item.mcc]?.vn || "Không rõ", // Vietnamese Category Name
                    null // Add a null placeholder for PTTT data
                ]));
            } else {
                console.error("Internal MCC search failed");
            }

            let externalData = [];
            if (externalRes.ok) {
                const rawExternal = await externalRes.json();
                if (rawExternal.results) {
                    externalData = rawExternal.results;
                }
            } else {
                console.error("External MCC search failed");
            }
            
            // 3. Combine and de-duplicate results, prioritizing internal data
            const combinedResults = [...internalData, ...externalData];
            const uniqueResults = new Map();

            combinedResults.forEach(result => {
                const merchantName = result[1];
                const mcc = result[2];
                const key = `${merchantName}|${mcc}`; // Unique key
                if (!uniqueResults.has(key)) {
                    uniqueResults.set(key, result);
                }
            });

            const finalResults = Array.from(uniqueResults.values());

            if (finalResults.length > 0) {
                setMccResults(finalResults);
                setIsMccDialogOpen(true);
            } else {
                toast.info("No MCC suggestions found for this merchant.");
            }

        } catch (error) {
            console.error("MCC Search Error:", error);
            toast.error("Could not perform MCC search.");
        } finally {
            setIsMccSearching(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        let finalSummaryId = null; 
        try {
            if (applicableRuleId && cardSummaryCategoryId === 'new') {
                const summaryResponse = await fetch('/api/summaries', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        cardId: cardId,
                        month: cashbackMonth,
                        ruleId: applicableRuleId,
                    }),
                });
                if (!summaryResponse.ok) {
                    throw new Error('Failed to create new monthly summary.');
                }
                const newSummary = await summaryResponse.json();
                finalSummaryId = newSummary.id;
            } else if (applicableRuleId && cardSummaryCategoryId !== 'new') {
                finalSummaryId = cardSummaryCategoryId;
            }

            const transactionData = {
                merchant,
                amount: parseFloat(String(amount).replace(/,/g, '')),
                date,
                cardId,
                category: category || null,
                mccCode: mccCode || null,
                merchantLookup: merchantLookup || null,
                applicableRuleId: applicableRuleId || null,
                cardSummaryCategoryId: finalSummaryId,
            };

            const response = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transactionData),
            });

            if (!response.ok) throw new Error('Failed to add transaction');
            
            const newTransactionFromServer = await response.json();
            const optimisticTransaction = {
                ...newTransactionFromServer,
                estCashback: estimatedCashback,
            };
            toast.success("Transaction added successfully!");
            localStorage.setItem('lastUsedCardId', cardId);
            onTransactionAdded(optimisticTransaction);
            resetForm();
        } catch (error) {
            console.error('Error during transaction submission:', error);
            toast.error("Failed to add transaction. Please try again.");
        } finally {
            setIsSubmitting(false); 
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-6 py-4">
                <QuickAddButtons vendors={commonVendors} onSelect={handleVendorSelect} />
                {/* --- Section 1: Transaction Details --- */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="merchant">Transaction Name</label>
                        <div className="flex items-center gap-2">
                            <Input id="merchant" value={merchant} onChange={(e) => setMerchant(e.target.value)} required />
                            {isPredicting && (
                                <div className="absolute right-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                </div>
                            )}
                            <Button type="button" size="icon" variant="outline" onClick={handleMccSearch} disabled={!merchant || isMccSearching}>
                                {isMccSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-10 gap-4 items-start">
                        <div className="space-y-2 col-span-1 sm:col-span-6">
                            <label htmlFor="merchantLookup">Merchant</label>
                            <Input id="merchantLookup" value={merchantLookup} onChange={(e) => setMerchantLookup(e.target.value)} placeholder="Merchant Name" />
                        </div>
                        <div className="space-y-2 col-span-1 sm:col-span-4">
                            <label htmlFor="mcc">MCC</label>
                            <Input id="mcc" value={mccCode} onChange={(e) => setMccCode(e.target.value)} placeholder="Enter code or use Lookup" />
                            {mccName && <p className="text-xs text-muted-foreground pt-1">{mccName}</p>}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="amount">Amount</label>
                            <Input ref={amountInputRef} id="amount" type="text" inputMode="numeric" value={amount} onChange={handleAmountChange} required />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="date">Date</label>
                            <div className="relative flex items-center">
                                <CalendarDays className="absolute left-3 z-10 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="date"
                                    type="date"
                                    className="relative flex items-center w-full py-2 pl-10 text-left"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- Section 2: Categorization --- */}
                <div className="space-y-4 border-t pt-6">
                <div className="space-y-2">
                    <label htmlFor="card">Card</label>
                    <select id="card" value={cardId} onChange={(e) => { setCardId(e.target.value); setApplicableRuleId(''); }} className="w-full p-2 border rounded cursor-pointer" required>
                    {[...cards]
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map(card => <option key={card.id} value={card.id}>{card.name}</option>)
                    }
                    </select>
                    {cashbackMonth && (
                    <div className="flex items-center gap-2 pt-2">
                        <span className="text-xs text-muted-foreground">Statement Month:</span>
                        <Badge variant="outline">{cashbackMonth}</Badge>
                    </div>
                    )}
                </div>
                <div className="space-y-2">
                    <label htmlFor="rule">Applicable Cashback Rule</label>
                    <select id="rule" value={applicableRuleId} onChange={(e) => setApplicableRuleId(e.target.value)} className="w-full p-2 border rounded cursor-pointer" disabled={filteredRules.length === 0}>
                    <option value="">{filteredRules.length === 0 ? 'No active rules for this card' : 'None'}</option>
                    {filteredRules.map(rule => <option key={rule.id} value={rule.id}>{rule.name}</option>)}
                    </select>
                    {selectedRule && (
                    <div className="flex items-center gap-2 pt-2">
                        <Badge variant="secondary">Rate: {(selectedRule.rate * 100).toFixed(1)}%</Badge>
                        {estimatedCashback > 0 && (
                            <Badge variant="outline" className="text-emerald-600">
                                Est: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(estimatedCashback)}
                            </Badge>
                        )}
                    </div>
                    )}
                </div>
                {applicableRuleId && (
                <div className="space-y-2">
                    <label htmlFor="summary">Link to Monthly Summary</label>
                    <select id="summary" value={cardSummaryCategoryId} onChange={(e) => setCardSummaryCategoryId(e.target.value)} className="w-full p-2 border rounded cursor-pointer">
                    <option value="new">Create New Summary</option>
                    {filteredSummaries.map(summary => <option key={summary.id} value={summary.id}>{summary.summaryId}</option>)}
                    </select>
                </div>
                )}
                <div className="space-y-2">
                    <label htmlFor="category">Internal Category</label>
                    <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-2 border rounded cursor-pointer">
                        <option value="">None</option>
                        {[...categories]
                            .sort((a, b) => a.localeCompare(b))
                            .map(cat => <option key={cat} value={cat}>{cat}</option>)
                        }
                    </select>
                </div>
                </div>

                {/* --- Submit Button --- */}
                <div className="pt-2">
                <Button type="submit" disabled={isSubmitting} size="lg" className="w-full">
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Add Transaction"}
                </Button>
                </div>
            </form>
            <MccSearchResultsDialog
                open={isMccDialogOpen}
                onOpenChange={setIsMccDialogOpen}
                results={mccResults}                
                onSelect={(selectedResult) => {
                    const merchantNameFromResult = selectedResult[1];
                    const mccCodeFromResult = selectedResult[2];
                    setMccCode(mccCodeFromResult);
                    setMerchantLookup(merchantNameFromResult);
                    setIsMccDialogOpen(false);
                }}
            />
        </>      
    );
}

function MccSearchResultsDialog({ open, onOpenChange, results, onSelect }) {
    // 1. We use useMemo to automatically group results into "History" and "General"
    const { historyResults, generalResults } = useMemo(() => {
        const history = results.filter(r => r[0] === 'Your History');
        const general = results.filter(r => r[0] !== 'Your History');
        return { historyResults: history, generalResults: general };
    }, [results]);

    const handleSelect = (result) => {
        onSelect(result);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl bg-background">
                <DialogHeader>
                    <DialogTitle>MCC Search Results</DialogTitle>
                    <DialogDescription>
                        Select the most relevant merchant category code. Your past results are shown first.
                    </DialogDescription>
                </DialogHeader>
                {/* 2. The main container is now a flexible div, not a table */}
                <div className="max-h-[60vh] overflow-y-auto space-y-6 p-1">
                    {/* 3. Render the "History" section only if there are history results */}
                    {historyResults.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm text-muted-foreground px-3">From Your History</h4>
                            <div className="space-y-1">
                                {historyResults.map((result, index) => (
                                    <ResultItem key={`hist-${index}`} result={result} onSelect={handleSelect} isHistory={true} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 4. Render the "General" section only if there are general results */}
                    {generalResults.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm text-muted-foreground px-3">General Suggestions</h4>
                            <div className="space-y-1">
                                {generalResults.map((result, index) => (
                                    <ResultItem key={`gen-${index}`} result={result} onSelect={handleSelect} isHistory={false} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

// 5. A new sub-component to render each result item beautifully
function ResultItem({ result, onSelect, isHistory }) {
    // Safely extract data based on its source (History vs General)
    const merchantName = result[1];
    const mcc = result[2];
    const vietnameseCategory = result[4];
    // English category only exists for history items
    const englishCategory = isHistory ? result[3] : null;

    return (
        <div
            onClick={() => onSelect(result)}
            className="flex items-center gap-4 rounded-lg p-3 cursor-pointer transition-colors hover:bg-muted"
        >
            {/* Left Side: Icon */}
            <div className="text-muted-foreground">
                {isHistory ? <History className="h-5 w-5" /> : <Globe className="h-5 w-5" />}
            </div>

            {/* Center: Text Content */}
            <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{merchantName}</p>
                <p className="text-sm text-muted-foreground truncate">
                    {vietnameseCategory}
                    {englishCategory && ` (${englishCategory})`}
                </p>
            </div>

            {/* Right Side: MCC Tag */}
            <Badge variant="outline" className="font-mono text-sm py-1 px-2">
                {mcc}
            </Badge>
        </div>
    );
}

function CustomLineChartTooltip({ active, payload, label, currencyFn, cards }) {
    if (active && payload?.length) {
        // Group payload items by card name
        const dataByCard = payload.reduce((acc, entry) => {
        const cardName = cards.find(c => entry.dataKey.startsWith(c.name))?.name;
        if (!cardName) return acc;
        
        const type = entry.dataKey.includes('Spend') ? 'spend' : 'cashback';
        
        if (!acc[cardName]) {
            acc[cardName] = { color: entry.stroke, name: cardName };
        }
        acc[cardName][type] = entry.value;

        return acc;
        }, {});

        return (
        <div className="rounded-lg border bg-white/90 backdrop-blur-sm p-3 text-xs shadow-lg">
            <p className="font-bold mb-2 text-sm">{label}</p>
            <div className="space-y-2">
            {Object.values(dataByCard).map(cardData => (
                <div key={cardData.name}>
                <p className="font-semibold" style={{ color: cardData.color }}>{cardData.name}</p>
                <div className="grid grid-cols-[1fr_auto] gap-x-4">
                    <span className="text-muted-foreground">Spend:</span>
                    <span className="font-medium text-right">{currencyFn(cardData.spend)}</span>
                    <span className="text-muted-foreground">Cashback:</span>
                    <span className="font-medium text-right">{currencyFn(cardData.cashback)}</span>
                </div>
                </div>
            ))}
            </div>
        </div>
        );
    }

    return null;
}

function TransactionDetailsDialog({ isOpen, onClose, details, transactions, isLoading, currencyFn }) {
    // Calculates the totals for cashback and amount only when transactions change
    const totals = useMemo(() => {
        return transactions.reduce((acc, tx) => {
            acc.totalCashback += tx.estCashback || 0;
            acc.totalAmount += tx['Amount'] || 0;
            return acc;
        }, { totalCashback: 0, totalAmount: 0 });
    }, [transactions]);

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl bg-white">
            <DialogHeader>
            <DialogTitle>
                Transactions for {details.cardName}
            </DialogTitle>
            <DialogDescription>
                Statement Month: {details.month}
            </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto pr-4">
            {isLoading ? (
                <div className="flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : transactions.length > 0 ? (
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Transaction</TableHead>
                    <TableHead className="text-right">Cashback</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {transactions.map(tx => (
                    <TableRow key={tx.id}>
                        <TableCell>{tx['Transaction Date']}</TableCell>
                        <TableCell className="font-medium">{tx['Transaction Name']}</TableCell>
                        <TableCell className="text-right text-emerald-600 font-medium">{currencyFn(tx.estCashback)}</TableCell>
                        <TableCell className="text-right">{currencyFn(tx['Amount'])}</TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                <tfoot className="border-t-2 font-semibold">
                    <TableRow>
                        <TableCell colSpan={2} className="text-right">Totals</TableCell>
                        <TableCell className="text-right text-emerald-600">
                            {currencyFn(totals.totalCashback)}
                        </TableCell>
                        <TableCell className="text-right">
                            {currencyFn(totals.totalAmount)}
                        </TableCell>
                    </TableRow>
                </tfoot>
                </Table>
            ) : (
                <div className="flex justify-center items-center h-48 text-muted-foreground">
                <p>No transactions found for this period.</p>
                </div>
            )}
            </div>
        </DialogContent>
        </Dialog>
    );
}

function QuickAddButtons({ vendors, onSelect }) {
    if (!vendors || vendors.length === 0) {
        return null;
    }

    return (
        <div className="mb-4 space-y-2">
            <label className="text-sm font-medium">Quick Add</label>
            <div className="flex flex-wrap gap-2">
                {vendors.map(vendor => (
                    <Button
                        key={vendor.id}
                        variant="outline"
                        size="sm"
                        onClick={() => onSelect(vendor)}
                        className="h-8"
                    >
                        {vendor.name}
                    </Button>
                ))}
            </div>
        </div>
    );
}