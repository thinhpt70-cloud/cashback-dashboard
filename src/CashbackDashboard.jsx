import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { CreditCard, Wallet, CalendarClock, TrendingUp, DollarSign, AlertTriangle, RefreshCw, Search, Info, Loader2, Plus, CalendarDays, History, Globe, Check, Lightbulb, Sparkles, ShoppingCart, Snowflake, ExternalLink } from "lucide-react";
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
import { ArrowUp, ArrowDown, ChevronsUpDown, ChevronDown, ChevronRight, ChevronLeft, ChevronUp, List } from "lucide-react";
import { cn } from "./lib/utils";
import { Toaster, toast } from 'sonner';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "./components/ui/accordion";



// --------------------------
// 1) API & DATA FETCHING
// --------------------------
const API_BASE_URL = '/api';

const calculateDaysLeft = (paymentDateString) => {
    if (!paymentDateString || paymentDateString === "N/A") return null;

    const today = new Date(); 
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(paymentDateString);
    dueDate.setHours(0, 0, 0, 0);
    
    if (isNaN(dueDate)) return null;

    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
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

const cardThemes = {
    // Existing Themes with full class names
    'VIB': { gradient: 'bg-gradient-to-r from-sky-500 to-sky-700', textColor: 'text-white' },
    'HSBC': { gradient: 'bg-gradient-to-r from-red-600 to-red-800', textColor: 'text-white' },
    'Shinhan Bank': { gradient: 'bg-gradient-to-r from-blue-400 to-blue-600', textColor: 'text-white' },
    'Techcombank': { gradient: 'bg-gradient-to-r from-red-500 to-orange-500', textColor: 'text-white' },
    
    // --- NEW THEMES TO ADD ---
    'Kbank': { gradient: 'bg-gradient-to-r from-lime-500 to-green-600', textColor: 'text-white' },
    'Cake': { gradient: 'bg-gradient-to-r from-pink-500 to-fuchsia-600', textColor: 'text-white' },
    'MSB': { gradient: 'bg-gradient-to-r from-orange-500 to-orange-700', textColor: 'text-white' },
    'UOB': { gradient: 'bg-gradient-to-r from-blue-700 to-blue-900', textColor: 'text-white' },
    
    // Fallback Theme
    'default': { gradient: 'bg-gradient-to-r from-slate-600 to-slate-800', textColor: 'text-white' },
};


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
    const [cardView, setCardView] = useState('month'); // 'month', 'ytd', or 'roi'

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

    const activeMonthSummariesMap = useMemo(() => {
        const map = new Map();
        monthlySummary
            .filter(s => s.month === activeMonth)
            .forEach(summary => map.set(summary.cardId, summary));
        return map;
    }, [activeMonth, monthlySummary]);

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
                <div className="ml-auto flex items-center gap-2">

                    {/* --- ADD THIS COMPONENT --- */}
                    <BestCardFinderDialog 
                        allCards={cards} 
                        allRules={rules} 
                        mccMap={mccMap} 
                        monthlySummary={monthlySummary}
                        monthlyCategorySummary={monthlyCategorySummary}
                        activeMonth={activeMonth}
                    />

                    {/* This Sheet component creates the slide-over panel */}
                    <Sheet open={isAddTxDialogOpen} onOpenChange={setIsAddTxDialogOpen}>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon"><Plus className="h-4 w-4" /></Button>
                        </SheetTrigger>
                        <SheetContent className="overflow-y-auto">
                            <SheetHeader>
                                <SheetTitle>Add a New Transaction</SheetTitle>
                            </SheetHeader>
                            {/* The change is adding px-4 to this div */}
                            <div className="flex-grow overflow-y-auto px-4">
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

                    <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-12">
                        <div className="lg:col-span-7 flex flex-col">
                            <CardSpendsCap
                                cards={cards}
                                activeMonth={activeMonth}
                                monthlySummary={monthlySummary}
                                monthlyCategorySummary={monthlyCategorySummary}
                                currencyFn={currency}
                            />
                        </div>
                        <div className="lg:col-span-5 flex flex-col">
                            <EnhancedSuggestions
                                rules={rules}
                                cards={cards}
                                monthlyCategorySummary={monthlyCategorySummary}
                                monthlySummary={monthlySummary}
                                activeMonth={activeMonth}
                                currencyFn={currency}
                            />
                        </div>
                    </div>

                    <div className="grid gap-4">
                        <Card className="flex flex-col min-h-[300px]">
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
                    <Tabs defaultValue="month" value={cardView} onValueChange={(value) => setCardView(value)}>
                        {/* The container for the tabs, styled as a light grey rounded box */}
                        <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-muted-foreground">
                            {/* The individual tab buttons */}
                            <TabsTrigger value="month" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                                This Month
                            </TabsTrigger>
                            <TabsTrigger value="ytd" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                                YTD
                            </TabsTrigger>
                            <TabsTrigger value="roi" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                                ROI & Dates
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                    
                    {(() => {
                        const activeAndFrozenCards = sortedCards.filter(c => c.status !== 'Closed');
                        const closedCards = sortedCards.filter(c => c.status === 'Closed');
                
                        return (
                            <>
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {activeAndFrozenCards.map(card => (
                                        <EnhancedCard 
                                            key={card.id}
                                            card={card}
                                            activeMonth={activeMonth}
                                            cardMonthSummary={activeMonthSummariesMap.get(card.id)} 
                                            rules={rules.filter(r => r.cardId === card.id)}
                                            currencyFn={currency}
                                            fmtYMShortFn={fmtYMShort}
                                            calculateFeeCycleProgressFn={calculateFeeCycleProgress}
                                            view={cardView}
                                            mccMap={mccMap}
                                        />
                                    ))}
                                </div>
                
                                {closedCards.length > 0 && (
                                    <Accordion type="single" collapsible className="w-full pt-4">
                                        <AccordionItem value="closed-cards">
                                            <AccordionTrigger className="text-base font-semibold text-muted-foreground">
                                                Show Closed Cards ({closedCards.length})
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pt-4">
                                                    {closedCards.map(card => (
                                                        <EnhancedCard 
                                                            key={card.id}
                                                            card={card}
                                                            activeMonth={activeMonth}
                                                            cardMonthSummary={activeMonthSummariesMap.get(card.id)} 
                                                            rules={rules.filter(r => r.cardId === card.id)}
                                                            currencyFn={currency}
                                                            fmtYMShortFn={fmtYMShort}
                                                            calculateFeeCycleProgressFn={calculateFeeCycleProgress}
                                                            view={cardView}
                                                            mccMap={mccMap}
                                                        />
                                                    ))}
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


function CardInfoSheet({ card, rules, mccMap }) {
    // --- State for search and expansion ---
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedRuleId, setExpandedRuleId] = useState(null);
    const currency = (n) => (n || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

    // --- Helper function and memoized data ---
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

    // --- Filtering logic for the search functionality ---
    const filteredAndSortedRules = useMemo(() => {
        const lowercasedFilter = searchTerm.toLowerCase();

        const filtered = rules.filter(rule => {
            if (!searchTerm) return true; // Show all if search is empty

            const nameMatch = rule.ruleName.toLowerCase().includes(lowercasedFilter);
            if (nameMatch) return true;

            const mccList = rule.mccCodes ? rule.mccCodes.split(',').map(m => m.trim()) : [];
            for (const code of mccList) {
                const mccName = mccMap[code]?.vn || '';
                if (code.includes(lowercasedFilter) || mccName.toLowerCase().includes(lowercasedFilter)) {
                    return true;
                }
            }
            return false;
        });

        // Sort rules to show active ones first
        return filtered.sort((a, b) => {
            if (a.status === 'Active' && b.status !== 'Active') return -1;
            if (a.status !== 'Active' && b.status === 'Active') return 1;
            return a.ruleName.localeCompare(b.ruleName);
        });
    }, [rules, searchTerm, mccMap]);

    const handleToggleExpand = (ruleId) => {
        setExpandedRuleId(prevId => (prevId === ruleId ? null : ruleId));
    };

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs">
                    <Info className="mr-1.5 h-3.5 w-3.5" /> More info
                </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>{card.name}</SheetTitle>
                    <p className="text-sm text-muted-foreground">{card.bank} &ndash; {card.cardType} Card</p>
                </SheetHeader>
                
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm py-4">
                    {infoItems.map(item => (
                        <div key={item.label}>
                            <p className="text-muted-foreground">{item.label}</p>
                            <p className={cn("font-medium", item.valueClassName)}>{item.value}</p>
                        </div>
                    ))}
                </div>

                <div>
                    <h4 className="font-semibold text-sm mb-2">Cashback Details</h4>
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
                        {card.minimumMonthlySpend > 0 && (
                            <div>
                                <p className="text-muted-foreground">Min. Spending</p>
                                <p className="font-medium">{currency(card.minimumMonthlySpend)}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-4">
                    <h4 className="font-semibold text-sm mb-2">Cashback Rules</h4>
                    
                    <div className="relative mb-3">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search by name, MCC code, or category..."
                            className="w-full pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="space-y-1">
                        {filteredAndSortedRules.length > 0 ? filteredAndSortedRules.map(rule => {
                            const isExpanded = expandedRuleId === rule.id;
                            const mccList = rule.mccCodes ? rule.mccCodes.split(',').map(m => m.trim()).filter(Boolean) : [];

                            return (
                                <div key={rule.id} className="border rounded-md overflow-hidden">
                                    <div
                                        onClick={() => handleToggleExpand(rule.id)}
                                        className={cn(
                                            "flex justify-between items-center p-3 cursor-pointer hover:bg-muted/50",
                                            rule.status !== 'Active' && "opacity-60"
                                        )}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <span className={cn("h-2 w-2 rounded-full", rule.status === 'Active' ? "bg-emerald-500" : "bg-slate-400")} />
                                            <span className="font-medium text-primary">{rule.ruleName}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono text-base text-foreground">{(rule.rate * 100).toFixed(1)}%</span>
                                            <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
                                        </div>
                                    </div>
                                    
                                    {isExpanded && (
                                        <div className="p-3 border-t bg-slate-50/70">
                                            {mccList.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {mccList.map(code => (
                                                        <Badge key={code} variant="secondary" className="font-normal">
                                                            <span className="font-mono mr-1.5">{code}:</span>
                                                            {mccMap[code]?.vn || 'Unknown'}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-muted-foreground">No specific MCC codes are linked to this rule.</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        }) : (
                            <p className="text-sm text-center text-muted-foreground py-4">No rules match your search.</p>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
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

function CardSpendsCap({ cards, activeMonth, monthlySummary, monthlyCategorySummary, currencyFn }) {
    const [expandedCardId, setExpandedCardId] = useState(null);

    const handleToggleExpand = (cardId) => {
        setExpandedCardId(prevId => (prevId === cardId ? null : cardId));
    };

    const cardSpendsCapProgress = useMemo(() => {
        return cards
            .filter(card => card.overallMonthlyLimit > 0 || card.minimumMonthlySpend > 0)
            .map(card => {
                const cardMonthSummary = monthlySummary.find(
                    summary => summary.cardId === card.id && summary.month === activeMonth
                );
                
                const currentCashback = cardMonthSummary?.cashback || 0;
                const currentSpend = cardMonthSummary?.spend || 0;
                
                const monthlyLimit = card.overallMonthlyLimit;
                const usedCapPct = monthlyLimit > 0 ? Math.min(100, Math.round((currentCashback / monthlyLimit) * 100)) : 0;
                const isCapReached = usedCapPct >= 100;
                
                const minSpend = card.minimumMonthlySpend || 0;
                const minSpendMet = minSpend > 0 ? currentSpend >= minSpend : true;
                const minSpendPct = minSpend > 0 ? Math.min(100, Math.round((currentSpend / minSpend) * 100)) : 100;

                const { days, status } = card.useStatementMonthForPayments
                    ? calculateDaysLeftInCashbackMonth(activeMonth)
                    : calculateDaysUntilStatement(card.statementDay, activeMonth);

                return {
                    card, cardId: card.id, cardName: card.name, currentCashback,
                    currentSpend, monthlyLimit, usedCapPct, minSpend, minSpendMet,
                    minSpendPct, daysLeft: days, cycleStatus: status, isCapReached,
                };
            })
            .sort((a, b) => b.usedCapPct - a.usedCapPct);
    }, [cards, activeMonth, monthlySummary]);

    const getProgressColor = (percentage) => {
        if (percentage >= 100) return "bg-emerald-500";
        if (percentage > 85) return "bg-orange-500";
        return "bg-sky-500";
    };

    const DaysLeftBadge = ({ status, days }) => (
        <Badge
            variant="outline"
            className={cn( "text-xs h-6 px-2 font-semibold justify-center",
                status === 'Completed' && "bg-emerald-100 text-emerald-800 border-emerald-200"
            )}
        >
            {status === 'Completed' ? 'Done' : `${days} days left`}
        </Badge>
    );

    return (
        <Card className="lg:col-span-3">
            <CardHeader>
                <CardTitle>Card Spends Cap</CardTitle>
            </CardHeader>
            <CardContent>
                {cardSpendsCapProgress.length > 0 ? (
                    <div className="space-y-1">
                        {cardSpendsCapProgress.map(p => (
                            <div 
                                key={p.cardId} 
                                // STYLE CHANGE 1: Apply background color instead of grayscale/opacity
                                className={cn(
                                    "border-b last:border-b-0 py-1 transition-colors duration-300",
                                    { "bg-slate-50 rounded-md": p.isCapReached }
                                )}
                            >
                                <div 
                                    className="flex flex-col gap-2 p-2 cursor-pointer hover:bg-muted/50 rounded-md"
                                    onClick={() => handleToggleExpand(p.cardId)}
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            {!p.minSpendMet ? (
                                                <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0" title="Minimum spend not met" />
                                            ) : p.isCapReached ? (
                                                <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0" title="Monthly cap reached" />
                                            ) : null}
                                            {/* STYLE CHANGE 2: Conditionally grey out the card name text */}
                                            <p className={cn(
                                                "font-semibold truncate",
                                                { "text-slate-400 font-normal": p.isCapReached }
                                            )} title={p.cardName}>{p.cardName}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <DaysLeftBadge status={p.cycleStatus} days={p.daysLeft} />
                                            <ChevronDown className={cn( "h-5 w-5 text-muted-foreground transition-transform duration-200 flex-shrink-0",
                                                expandedCardId === p.cardId && "rotate-180"
                                            )} />
                                        </div>
                                    </div>
                                    
                                    {p.monthlyLimit > 0 && (
                                        <div className="flex items-center gap-3 w-full text-sm">
                                            {/* STYLE CHANGE 3: Conditionally grey out the "left" amount text */}
                                            <span className={cn(
                                                "font-medium w-32 shrink-0",
                                                p.isCapReached ? "text-slate-400" : "text-emerald-600"
                                            )}>
                                                {currencyFn(p.monthlyLimit - p.currentCashback)} left
                                            </span>
                                            <Progress value={p.usedCapPct} indicatorClassName={getProgressColor(p.usedCapPct)} className="h-1.5 flex-grow" />
                                            {/* STYLE CHANGE 4: Conditionally grey out the progress text */}
                                            <span className={cn(
                                                "text-xs w-40 shrink-0 text-right",
                                                p.isCapReached ? "text-slate-400" : "text-muted-foreground"
                                            )}>
                                                {currencyFn(p.currentCashback)} / {currencyFn(p.monthlyLimit)}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className={cn( "overflow-hidden transition-all duration-300 ease-in-out",
                                    expandedCardId === p.cardId ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                                )}>
                                    {expandedCardId === p.cardId && (
                                        <div className="pl-6 pr-2 py-4 border-t space-y-4">
                                            {p.minSpend > 0 && (
                                                <div>
                                                     <h4 className="text-sm font-semibold text-center text-muted-foreground mb-3">Minimum Spend Progress</h4>
                                                     <div className="px-4">
                                                        <Progress value={p.minSpendPct} className="h-2" indicatorClassName={p.minSpendMet ? "bg-emerald-500" : "bg-yellow-500"} />
                                                        <div className="flex justify-between items-center text-xs text-muted-foreground mt-1.5">
                                                            <span className={cn("font-semibold", p.minSpendMet ? "text-emerald-600" : "text-yellow-600")}>
                                                                {p.minSpendMet ? 'Met' : `${currencyFn(p.minSpend - p.currentSpend)} to go`}
                                                            </span>
                                                            <span>{currencyFn(p.currentSpend)} / {currencyFn(p.minSpend)}</span>
                                                        </div>
                                                     </div>
                                                </div>
                                            )}
                                            <CategoryCapsUsage 
                                                card={p.card}
                                                activeMonth={activeMonth}
                                                monthlyCategorySummary={monthlyCategorySummary}
                                                currencyFn={currencyFn}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No monthly limits or minimums defined for your cards.</p>
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

            // --- THIS IS THE CORRECTED LOGIC ---
            const { 
                daysLeft, 
                statementAmount: rawStatementAmount = 0, 
                paidAmount = 0,
                spend = 0,
                cashback = 0
            } = p.mainStatement;

            // Use the actual amount if it exists, otherwise use the live estimated balance.
            const finalStatementAmount = rawStatementAmount > 0 ? rawStatementAmount : (spend - cashback);
            const remaining = finalStatementAmount - paidAmount;
            // --- END OF CORRECTION ---

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
                        {paymentGroups.pastDue.map(({ mainStatement, upcomingStatements, pastStatements, pastDueStatements, nextUpcomingStatement }) => (
                            <PaymentCard 
                                key={mainStatement.id}
                                statement={mainStatement}
                                upcomingStatements={upcomingStatements}
                                pastStatements={pastStatements}
                                pastDueStatements={pastDueStatements}
                                nextUpcomingStatement={nextUpcomingStatement}
                                onLogPayment={handleLogPaymentClick}
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
                        {paymentGroups.upcoming.map(({ mainStatement, upcomingStatements, pastStatements, pastDueStatements, nextUpcomingStatement }) => (
                            <PaymentCard 
                                key={mainStatement.id}
                                statement={mainStatement}
                                upcomingStatements={upcomingStatements}
                                pastStatements={pastStatements}
                                pastDueStatements={pastDueStatements}
                                nextUpcomingStatement={nextUpcomingStatement}
                                onLogPayment={handleLogPaymentClick}
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
                        {paymentGroups.completed.map(({ mainStatement, upcomingStatements, pastStatements, pastDueStatements, nextUpcomingStatement }) => (
                            <PaymentCard 
                                key={mainStatement.id}
                                statement={mainStatement}
                                upcomingStatements={upcomingStatements}
                                pastStatements={pastStatements}
                                pastDueStatements={pastDueStatements}
                                nextUpcomingStatement={nextUpcomingStatement}
                                onLogPayment={handleLogPaymentClick}
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
        </div>
    );
}

// -------------------------------------------------
// 2. ADD THE NEW PAYMENT CARD COMPONENT
// -------------------------------------------------
function PaymentCard({ statement, upcomingStatements, pastStatements, pastDueStatements, nextUpcomingStatement, onLogPayment, onViewTransactions, currencyFn, fmtYMShortFn, onLoadMore, isLoadingMore }) {
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
        <div className={cn("bg-white rounded-xl shadow-sm overflow-hidden border",
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
                        <p className="font-bold text-slate-800 text-lg">{card.name} <span className="text-base font-medium text-slate-400">•••• {card.last4}</span></p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                            <span>
                                Statement: <span className="font-medium text-slate-600">{fmtYMShortFn(statement.month)}</span>
                            </span>
                            <span className="text-slate-400">•</span>
                            <span>
                                Issued: <span className="font-medium text-slate-600">{statement.statementDate}</span>
                            </span>
                            <span className="text-slate-400">•</span>
                            <span>
                                Due: <span className="font-medium text-slate-600">{statement.paymentDate}</span>
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
                        <div className="flex-1 bg-slate-50 rounded-lg p-4 flex flex-col items-center justify-center text-center h-40">
                            <Wallet className="h-8 w-8 text-slate-400 mb-2" />
                            <p className="font-semibold text-slate-700">No Balance This Month</p>
                            <p className="text-sm text-slate-500">You're all clear for this statement cycle.</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex-1 bg-slate-100/80 rounded-lg p-3">
                                {/* Label changed from ACTUAL BALANCE */}
                                <div className="flex items-center gap-2">
                                    <p className="text-xs text-slate-500 font-semibold">STATEMENT BALANCE</p>
                                    {/* Move the badge logic here and remove the top margin */}
                                    {(rawStatementAmount === 0 || rawStatementAmount === null) && <Badge variant="outline">Estimated</Badge>}
                                </div>
                                <p className="text-3xl font-extrabold text-slate-800 tracking-tight">{currencyFn(statementAmount)}</p>
                                <div className="mt-2 space-y-1 text-sm">
                                    <div className="flex justify-between items-center"><span className="text-slate-500">Paid:</span><span className="font-medium text-slate-600">{currencyFn(paidAmount)}</span></div>
                                    <div className="flex justify-between items-center font-bold"><span className="text-slate-500">Remaining:</span><span className={cn(isPaid ? "text-emerald-600" : "text-red-600")}>{currencyFn(remaining)}</span></div>
                                </div>
                            </div>
                            <div className="w-full md:w-64 bg-slate-50/70 rounded-lg p-3">
                                {/* Label changed from ESTIMATED BALANCE */}
                                <p className="text-xs text-slate-500 font-semibold">SPEND SUMMARY</p>
                                <p className="text-2xl font-bold text-slate-500 tracking-tight">{currencyFn(estimatedBalance)}</p>
                                <div className="mt-2 space-y-1 text-sm">
                                    <div className="flex justify-between items-center"><span className="text-slate-500">Total Spend:</span><span className="font-medium text-slate-600">{currencyFn(spend)}</span></div>
                                    <div className="flex justify-between items-center"><span className="text-slate-500">Cashback:</span><span className="font-medium text-emerald-600">-{currencyFn(cashback)}</span></div>
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
                                <Button onClick={() => setHistoryOpen(!historyOpen)} variant="outline" size="icon" className="sm:w-auto sm:px-3">
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

// -------------------------------------------------
// 3. ADD THE NEW PAYMENT LOG DIALOG COMPONENT
// -------------------------------------------------
function PaymentLogDialog({ isOpen, onClose, statement, onSave, currencyFn, fmtYMShortFn }) {
    const [amount, setAmount] = useState('');

    useIOSKeyboardGapFix();
    
    useEffect(() => {
        if (isOpen) {
            // Pre-fill with remaining amount and format it with commas
            const remaining = (statement.statementAmount || 0) - (statement.paidAmount || 0);
            setAmount(remaining > 0 ? remaining.toLocaleString('en-US') : '');
        }
    }, [isOpen, statement]);

    // --- NEW: Handler to format the input with commas ---
    const handleAmountChange = (e) => {
        const value = e.target.value.replace(/,/g, ''); // Remove existing commas
        if (!isNaN(value) && value.length <= 15) {
            // Format the number with commas, or set to empty if input is cleared
            setAmount(value ? Number(value).toLocaleString('en-US') : '');
        } else if (value === '') {
            setAmount('');
        }
    };

    const handleSave = () => {
        // --- UPDATED: Parse the comma-separated string back to a number ---
        const numericAmount = parseFloat(String(amount).replace(/,/g, ''));
        if (isNaN(numericAmount) || numericAmount <= 0) return; 

        const newPaidAmount = (statement.paidAmount || 0) + numericAmount;
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
                    <DialogDescription>For {statement.card.name} - {fmtYMShortFn(statement.month)}</DialogDescription>
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
                            type="text" // Changed from "number" to allow formatting
                            inputMode="numeric" // Keeps numeric keyboard on mobile
                            value={amount}
                            onChange={handleAmountChange} // Use the new formatting handler
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

function CategoryCapsUsage({ card, activeMonth, monthlyCategorySummary, currencyFn }) {
    const categoryCapData = useMemo(() => {
        const summaries = monthlyCategorySummary.filter(
            summary => summary.cardId === card.id && summary.month === activeMonth
        );
        if (!summaries.length) return [];
        
        const data = summaries.map(summary => {
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

        // Sort by the highest percentage used first
        return data.sort((a, b) => b.usedPct - a.usedPct);

    }, [card, activeMonth, monthlyCategorySummary]);

    return (
        <div>
            <h4 className="text-sm font-semibold text-center text-muted-foreground mb-4">Category Caps Usage</h4>
            {categoryCapData.length > 0 ? (
                <div className="space-y-4 px-4">
                    {categoryCapData.map(cap => (
                        <div key={cap.id}>
                            <div className="flex justify-between items-center text-sm mb-1.5">
                                <p className="font-medium text-slate-700 min-w-0 pr-4" title={cap.category}>{cap.category}</p>
                                <span className="font-mono text-xs font-semibold text-slate-500">{cap.usedPct}%</span>
                            </div>
                            <Progress value={cap.usedPct} className="h-2" />
                            <div className="flex justify-between items-center text-xs text-muted-foreground mt-1.5">
                                <span>{currencyFn(cap.currentCashback)} / {currencyFn(cap.limit)}</span>
                                <span className="font-medium">{currencyFn(cap.remaining)} left</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-4">
                    <p className="text-xs text-muted-foreground">No specific category data for this month.</p>
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
    const [isLookingUp, setIsLookingUp] = useState(false);
    const [lookupResults, setLookupResults] = useState([]);
    const [isLookupDialogOpen, setIsLookupDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // --- NEW: State to control visibility of the "View other results" button ---
    const [showLookupButton, setShowLookupButton] = useState(false);

    useIOSKeyboardGapFix();

    const amountInputRef = useRef(null);

    const handleVendorSelect = (vendor) => {
        setMerchant(vendor.transactionName || '');
        setMerchantLookup(vendor.merchant || '');
        setMccCode(vendor.mcc || '');
        setCategory(vendor.category || '');
        if (vendor.preferredCardId) setCardId(vendor.preferredCardId);
        if (vendor.preferredRuleId) setApplicableRuleId(vendor.preferredRuleId);
        else setApplicableRuleId('');
        // --- NEW: Reset the lookup button when a vendor is selected ---
        setShowLookupButton(false);
        amountInputRef.current?.focus();
    };

    // --- Memoized Calculations (No changes here) ---
    const selectedCard = useMemo(() => cards.find(c => c.id === cardId), [cardId, cards]);
    const filteredRules = useMemo(() => {
        if (!cardId) return [];
        return rules.filter(rule => rule.cardId === cardId && rule.status === 'Active').sort((a, b) => a.name.localeCompare(b.name));
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
        if (transactionDate.getDate() >= statementDay) month += 1;
        if (month > 11) { month = 0; year += 1; }
        const finalMonth = month + 1;
        return `${year}${String(finalMonth).padStart(2, '0')}`;
    }, [selectedCard, date]);
    const filteredSummaries = useMemo(() => {
        if (!selectedRule || !cardId || !cashbackMonth) return [];
        const targetSummaryId = `${cashbackMonth} - ${selectedRule.name}`;
        return monthlyCategories.filter(summary => summary.cardId === cardId && summary.summaryId === targetSummaryId);
    }, [cardId, monthlyCategories, selectedRule, cashbackMonth]);
    const estimatedCashback = useMemo(() => {
        if (!selectedRule || !amount) return 0;
        const numericAmount = parseFloat(String(amount).replace(/,/g, ''));
        if (isNaN(numericAmount)) return 0;
        const calculatedCashback = numericAmount * selectedRule.rate;
        const cap = selectedRule.capPerTransaction;
        if (cap > 0 && calculatedCashback > cap) return cap;
        return calculatedCashback;
    }, [amount, selectedRule]);

    // --- Effects (No changes here) ---
    useEffect(() => {
        if (filteredSummaries.length > 0) setCardSummaryCategoryId(filteredSummaries[0].id);
        else setCardSummaryCategoryId('new');
    }, [filteredSummaries]);

    useEffect(() => {
        if (cards.length > 0 && !cardId) {
            const lastUsedCardId = localStorage.getItem('lastUsedCardId');
            if (lastUsedCardId && cards.some(c => c.id === lastUsedCardId)) setCardId(lastUsedCardId);
            else setCardId(cards[0].id);
        }
    }, [cards, cardId]);

    useEffect(() => {
        if (mccMap && mccCode && mccMap[mccCode]) setMccName(mccMap[mccCode].vn);
        else setMccName('');
    }, [mccCode, mccMap]);


    // --- Handlers (Updated) ---
    const resetForm = () => {
        setMerchant('');
        setAmount('');
        setCategory('');
        setMccCode('');
        setMerchantLookup('');
        setApplicableRuleId('');
        setCardSummaryCategoryId('new');
        // --- NEW: Reset the lookup button on form reset ---
        setShowLookupButton(false);
    };

    const handleAmountChange = (e) => {
        const value = e.target.value.replace(/,/g, '');
        if (!isNaN(value) && value.length <= 15) setAmount(Number(value).toLocaleString('en-US'));
        else if (value === '') setAmount('');
    };

    const handleMerchantLookup = async () => {
        if (!merchant) return;
        setIsLookingUp(true);
        setLookupResults([]);
        setShowLookupButton(false);

        try {
            // --- CHANGE: Only one API call is needed now ---
            const res = await fetch(`/api/lookup-merchant?keyword=${encodeURIComponent(merchant)}`);
            if (!res.ok) throw new Error("Server responded with an error.");
            
            const data = await res.json();

            // --- CHANGE: Process the new, unified response structure ---
            const historyResults = (data.history || []).map(item => ([
                "Your History", item.merchant, item.mcc,
                mccMap[item.mcc]?.en || "Unknown",
                mccMap[item.mcc]?.vn || "Không rõ",
            ]));

            const externalResults = (data.external || []).map(item => {
                const mcc = item.mcc;
                return [
                    "External Suggestion", item.merchant, mcc,
                    mccMap[mcc]?.en || "Unknown",
                    mccMap[mcc]?.vn || "Không rõ",
                ];
            });
            
            const allResults = [...historyResults, ...externalResults];
            setLookupResults(allResults);

            // --- CHANGE: Use `bestMatch` instead of `prediction` for auto-fill ---
            if (data.bestMatch?.mcc) {
                setMccCode(data.bestMatch.mcc);
                toast.info("Auto-filled MCC based on best match.");
                // Allow user to see other options if they exist
                if (allResults.length > 0) {
                    setShowLookupButton(true); 
                }
            } else if (allResults.length > 0) {
                // If no best match but other results exist, open the dialog
                setIsLookupDialogOpen(true);
            } else {
                toast.info("No transaction history or suggestions found.");
            }

        } catch (error) {
            console.error("Merchant Lookup Error:", error);
            toast.error("Could not perform merchant lookup.");
        } finally {
            setIsLookingUp(false);
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
                    body: JSON.stringify({ cardId: cardId, month: cashbackMonth, ruleId: applicableRuleId }),
                });
                if (!summaryResponse.ok) throw new Error('Failed to create new monthly summary.');
                const newSummary = await summaryResponse.json();
                finalSummaryId = newSummary.id;
            } else if (applicableRuleId && cardSummaryCategoryId !== 'new') {
                finalSummaryId = cardSummaryCategoryId;
            }
            const transactionData = {
                merchant,
                amount: parseFloat(String(amount).replace(/,/g, '')),
                date, cardId,
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
            const optimisticTransaction = { ...newTransactionFromServer, estCashback: estimatedCashback };
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
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="merchant">Transaction Name</label>
                        <div className="relative flex items-center">
                            {/* --- NEW: onChange now resets the "View Results" button --- */}
                            <Input 
                                id="merchant" 
                                value={merchant} 
                                onChange={(e) => {
                                    setMerchant(e.target.value);
                                    setShowLookupButton(false);
                                }} 
                                required 
                                className="pr-12" 
                            />
                            <div className="absolute right-2 flex items-center gap-2">
                                <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={handleMerchantLookup} disabled={!merchant || isLookingUp}>
                                    {isLookingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                        {/* --- NEW: This button is conditionally rendered after a successful auto-fill --- */}
                        {showLookupButton && (
                            <div className="pt-2">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm" 
                                    className="w-full"
                                    onClick={() => setIsLookupDialogOpen(true)}
                                >
                                    View Other Suggestions
                                </Button>
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-10 gap-4 items-start">
                        <div className="space-y-2 col-span-1 sm:col-span-6">
                            <label htmlFor="merchantLookup">Merchant</label>
                            <Input id="merchantLookup" value={merchantLookup} onChange={(e) => setMerchantLookup(e.target.value)} placeholder="Merchant Name" className="relative focus:z-10" />
                        </div>
                        <div className="space-y-2 col-span-1 sm:col-span-4">
                            <label htmlFor="mcc">MCC</label>
                            <Input id="mcc" value={mccCode} onChange={(e) => setMccCode(e.target.value)} placeholder="Enter code or use Lookup" className="relative focus:z-10" />
                            {mccName && <p className="text-xs text-muted-foreground pt-1">{mccName}</p>}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="amount">Amount</label>
                            <Input ref={amountInputRef} id="amount" type="text" inputMode="numeric" value={amount} onChange={handleAmountChange} required className="relative focus:z-10" />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="date">Date</label>
                            <div className="relative flex items-center">
                                <CalendarDays className="absolute left-3 z-10 h-4 w-4 text-muted-foreground" />
                                <Input id="date" type="date" className="relative focus:z-10 flex items-center w-full py-2 pl-10 text-left" value={date} onChange={(e) => setDate(e.target.value)} required />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 border-t pt-6">
                    <div className="space-y-2">
                        <label htmlFor="card">Card</label>
                        <select id="card" value={cardId} onChange={(e) => { setCardId(e.target.value); setApplicableRuleId(''); }} className="relative focus:z-10 w-full p-2 border rounded cursor-pointer" required>
                        {[...cards].sort((a, b) => a.name.localeCompare(b.name)).map(card => <option key={card.id} value={card.id}>{card.name}</option>)}
                        </select>
                        {cashbackMonth && (<div className="flex items-center gap-2 pt-2"><span className="text-xs text-muted-foreground">Statement Month:</span><Badge variant="outline">{cashbackMonth}</Badge></div>)}
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="rule">Applicable Cashback Rule</label>
                        <select id="rule" value={applicableRuleId} onChange={(e) => setApplicableRuleId(e.target.value)} className="relative focus:z-10 w-full p-2 border rounded cursor-pointer" disabled={filteredRules.length === 0}>
                        <option value="">{filteredRules.length === 0 ? 'No active rules for this card' : 'None'}</option>
                        {filteredRules.map(rule => <option key={rule.id} value={rule.id}>{rule.name}</option>)}
                        </select>
                        {selectedRule && (<div className="flex items-center gap-2 pt-2"><Badge variant="secondary">Rate: {(selectedRule.rate * 100).toFixed(1)}%</Badge>{estimatedCashback > 0 && (<Badge variant="outline" className="text-emerald-600">Est: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(estimatedCashback)}</Badge>)}</div>)}
                    </div>
                    {applicableRuleId && (
                    <div className="space-y-2">
                        <label htmlFor="summary">Link to Monthly Summary</label>
                        <select id="summary" value={cardSummaryCategoryId} onChange={(e) => setCardSummaryCategoryId(e.target.value)} className="relative focus:z-10 w-full p-2 border rounded cursor-pointer">
                        <option value="new">Create New Summary</option>
                        {filteredSummaries.map(summary => <option key={summary.id} value={summary.id}>{summary.summaryId}</option>)}
                        </select>
                    </div>
                    )}
                    <div className="space-y-2">
                        <label htmlFor="category">Internal Category</label>
                        <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="relative focus:z-10 w-full p-2 border rounded cursor-pointer">
                            <option value="">None</option>
                            {[...categories].sort((a, b) => a.localeCompare(b)).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                </div>

                <div className="pt-2">
                    <Button type="submit" disabled={isSubmitting} size="lg" className="w-full">
                        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Add Transaction"}
                    </Button>
                </div>
            </form>
            <MccSearchResultsDialog
                open={isLookupDialogOpen}
                onOpenChange={setIsLookupDialogOpen}
                results={lookupResults}
                onSelect={(selectedResult) => {
                    const merchantNameFromResult = selectedResult[1];
                    const mccCodeFromResult = selectedResult[2];
                    setMccCode(mccCodeFromResult);
                    setMerchantLookup(merchantNameFromResult);
                    setIsLookupDialogOpen(false);
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
                        Select the most relevant merchant category code
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
                            <h4 className="font-semibold text-sm text-muted-foreground px-3">External Suggestions</h4>
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

    // Sort transactions from oldest to newest before rendering
    const sortedTransactions = useMemo(() => {
        // Create a shallow copy to avoid mutating the original prop array
        return [...transactions].sort((a, b) => 
            new Date(a['Transaction Date']) - new Date(b['Transaction Date'])
        );
    }, [transactions]);


    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
        {/* Adjusted width for better responsiveness */}
        <DialogContent className="sm:max-w-2xl w-full max-w-md bg-white">
            <DialogHeader>
            <DialogTitle>
                Transactions for {details.cardName}
            </DialogTitle>
            <DialogDescription>
                Statement Month: {details.monthLabel}
            </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto pr-4">
            {isLoading ? (
                <div className="flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : transactions.length > 0 ? (
                <>
                    {/* --- Mobile View --- */}
                    {/* This view is hidden on screens 'sm' and larger */}
                    <div className="space-y-3 sm:hidden">
                        {sortedTransactions.map(tx => (
                            <div key={tx.id} className="p-3 border rounded-lg">
                                <div className="flex justify-between items-start gap-2">
                                    <div className="flex-1">
                                        <p className="font-semibold break-words">{tx['Transaction Name']}</p>
                                        <p className="text-xs text-muted-foreground">{tx['Transaction Date']}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="font-medium">{currencyFn(tx['Amount'])}</p>
                                        <p className="text-sm font-medium text-emerald-600">{currencyFn(tx.estCashback)}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {/* Mobile Totals Footer */}
                        <div className="pt-3 mt-3 border-t font-medium">
                             <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Total Amount:</span>
                                <span>{currencyFn(totals.totalAmount)}</span>
                            </div>
                            <div className="flex justify-between items-center text-emerald-600">
                                <span className="text-muted-foreground">Total Cashback:</span>
                                <span>{currencyFn(totals.totalCashback)}</span>
                            </div>
                        </div>
                    </div>

                    {/* --- Desktop View (Existing Table) --- */}
                    {/* This table is hidden by default and shown on screens 'sm' and larger */}
                    <Table className="hidden sm:table">
                        <TableHeader>
                            <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Transaction</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-right">Cashback</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedTransactions.map(tx => (
                            <TableRow key={tx.id}>
                                <TableCell>{tx['Transaction Date']}</TableCell>
                                <TableCell className="font-medium">{tx['Transaction Name']}</TableCell>
                                <TableCell className="text-right">{currencyFn(tx['Amount'])}</TableCell>
                                <TableCell className="text-right text-emerald-600 font-medium">{currencyFn(tx.estCashback)}</TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                        <tfoot className="border-t-2 font-semibold">
                            <TableRow>
                                <TableCell colSpan={2}>Totals</TableCell>
                                <TableCell className="text-right">{currencyFn(totals.totalAmount)}</TableCell>
                                <TableCell className="text-right text-emerald-600">
                                    {currencyFn(totals.totalCashback)}
                                </TableCell>
                            </TableRow>
                        </tfoot>
                    </Table>
                </>
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

function MetricItem({ label, value, valueClassName, icon: Icon, isPrimary = false }) {
    return (
        <div className="p-2 bg-slate-50/70 rounded-lg">
            <div className="flex items-center text-xs text-slate-500 mb-0.5">
                {Icon && <Icon className="h-3.5 w-3.5 mr-1.5" />}
                <span>{label}</span>
            </div>
            <p className={cn(
                "font-bold transition-all duration-300",
                isPrimary ? "text-xl text-slate-800" : "text-base text-slate-700",
                valueClassName
            )}>
                {value}
            </p>
        </div>
    );
}

function EnhancedCard({ card, activeMonth, cardMonthSummary, rules, currencyFn, fmtYMShortFn, calculateFeeCycleProgressFn, view, mccMap }) {
    
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
            "bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 flex flex-col relative",
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
                <div className="text-xs text-slate-500 grid grid-cols-2 gap-x-4">
                    <p>Statement: <span className="font-medium text-slate-600">Day {card.statementDay}</span></p>
                    <p>Payment Due: <span className="font-medium text-slate-600">Day {card.paymentDueDay}</span></p>
                </div>
                
                <div className="flex-grow flex flex-col justify-center mt-4">
                    {view === 'month' && (
                        <div className="grid grid-cols-2 gap-3">
                            <MetricItem
                                label={`Rate (${fmtYMShortFn(activeMonth)})`}
                                value={`${monthlyEffectiveRate.toFixed(2)}%`}
                                valueClassName={monthlyEffectiveRate >= 2 ? 'text-emerald-600' : 'text-slate-800'}
                            />
                            {progressPercent > 0 && (
                                <MetricItem 
                                    label={`Fee Cycle (${daysPast} days)`}
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
                                    label="Net Value (vs. Fee)" 
                                    value={currencyFn(totalValue)} 
                                    valueClassName={totalValue >= 0 ? 'text-emerald-600' : 'text-red-500'}
                                />
                            </div>
                            {progressPercent > 0 && (
                                <div>
                                    <div className="flex justify-between text-xs mb-1 text-slate-500">
                                        <span>Fee Cycle Progress ({daysPast} days)</span>
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

                {/* MODIFIED: Increased top padding from pt-3 to pt-4 for better spacing */}
                <div className="mt-auto pt-3 flex justify-end">
                    <CardInfoSheet card={card} rules={rules} mccMap={mccMap} />
                </div>
            </div>
        </div>
    );
}

function EnhancedSuggestions({ rules, cards, monthlyCategorySummary, monthlySummary, activeMonth, currencyFn }) {
    const [startIndex, setStartIndex] = useState(0);

    const suggestions = useMemo(() => {
        const MINIMUM_RATE_THRESHOLD = 0.02;

        const allCandidates = rules.flatMap(rule => {
            if (rule.rate < MINIMUM_RATE_THRESHOLD || rule.status !== 'Active') return [];
            const card = cards.find(c => c.id === rule.cardId);
            if (!card || card.status !== 'Active') return [];
            const categorySummary = monthlyCategorySummary.find(s => s.cardId === rule.cardId && s.month === activeMonth && s.summaryId.endsWith(rule.ruleName));
            const cardSummary = monthlySummary.find(s => s.cardId === rule.cardId && s.month === activeMonth);
            const currentCashbackForCategory = categorySummary?.cashback || 0;
            const currentTotalSpendForCard = cardSummary?.spend || 0;
            const remainingCategoryCap = card.limitPerCategory > 0 ? Math.max(0, card.limitPerCategory - currentCashbackForCategory) : Infinity;
            if (remainingCategoryCap === 0) return [];
            const hasMetMinSpend = card.minimumMonthlySpend > 0 ? currentTotalSpendForCard >= card.minimumMonthlySpend : true;
            const spendingNeeded = remainingCategoryCap === Infinity ? Infinity : remainingCategoryCap / rule.rate;
            const categories = rule.category?.length ? rule.category : [rule.ruleName];
            return categories.map(cat => ({
                ...rule, suggestionFor: cat, parentRuleName: rule.ruleName, cardName: card.name,
                remainingCategoryCap, hasMetMinSpend, spendingNeeded
            }));
        }).filter(Boolean);

        const groupedByCategory = allCandidates.reduce((acc, candidate) => {
            const category = candidate.suggestionFor;
            if (!acc[category]) acc[category] = [];
            acc[category].push(candidate);
            return acc;
        }, {});

        const bestCardPerCategory = Object.values(groupedByCategory).map(group => {
            const qualifiedCards = group.filter(c => c.hasMetMinSpend);
            const unqualifiedCards = group.filter(c => !c.hasMetMinSpend);
            const ranker = (a, b) => (b.rate - a.rate) || (b.remainingCategoryCap - a.remainingCategoryCap);
            qualifiedCards.sort(ranker);
            unqualifiedCards.sort(ranker);
            const bestQualified = qualifiedCards[0];
            const bestUnqualified = unqualifiedCards[0];

            let finalChoice = bestQualified || bestUnqualified;

            // --- NEW LOGIC TO ADD THE ALERT ---
            if (finalChoice) {
                let hasBetterChallenger = false;
                // Check is only necessary if the chosen card is a qualified one
                if (finalChoice.hasMetMinSpend && bestUnqualified) {
                    // See if the best unqualified card is better than our choice
                    if (bestUnqualified.rate > finalChoice.rate || bestUnqualified.remainingCategoryCap > finalChoice.remainingCategoryCap) {
                        hasBetterChallenger = true;
                    }
                }
                // Attach the new flag to the suggestion object
                finalChoice = { ...finalChoice, hasBetterChallenger };
            }
            return finalChoice;
        }).filter(Boolean);

        bestCardPerCategory.sort((a, b) => {
            if (a.hasMetMinSpend !== b.hasMetMinSpend) return a.hasMetMinSpend ? -1 : 1;
            if (b.rate !== a.rate) return b.rate - a.rate;
            return b.remainingCategoryCap - a.remainingCategoryCap;
        });

        return bestCardPerCategory;
    }, [rules, cards, monthlyCategorySummary, monthlySummary, activeMonth]);

    const topSuggestions = suggestions;
    const VISIBLE_ITEMS = 5;
    
    const canScrollUp = startIndex > 0;
    const canScrollDown = startIndex < topSuggestions.length - VISIBLE_ITEMS;

    const handleScroll = (direction) => {
        if (direction === 'up' && canScrollUp) setStartIndex(prev => prev - 1);
        else if (direction === 'down' && canScrollDown) setStartIndex(prev => prev + 1);
    };

    const visibleSuggestions = topSuggestions.slice(startIndex, startIndex + VISIBLE_ITEMS);

    return (
        <Card className="flex flex-col">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-sky-500" />
                        Top Cashback Opportunities
                    </CardTitle>
                    {topSuggestions.length > VISIBLE_ITEMS && (
                         <div className="flex items-center gap-1">
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleScroll('up')} disabled={!canScrollUp}><ChevronUp className="h-4 w-4" /></Button>
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleScroll('down')} disabled={!canScrollDown}><ChevronDown className="h-4 w-4" /></Button>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
                {visibleSuggestions.length > 0 ? (
                    <div className="space-y-3">
                        {visibleSuggestions.map((s, index) => (
                            <div key={`${s.id}-${s.suggestionFor}`} className="p-3 rounded-lg border bg-slate-50/70 shadow-sm">
                                <div className="flex justify-between items-start gap-3">
                                    <div>
                                        <p className="font-semibold text-slate-800">
                                            <span className="text-sky-600 mr-2">#{startIndex + index + 1}</span>
                                            {s.suggestionFor}
                                        </p>
                                        <div className="flex items-center gap-1.5 text-sm text-slate-500 ml-7">
                                            <span>{s.cardName}</span>
                                            {!s.hasMetMinSpend && (
                                                <TooltipProvider delayDuration={100}>
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            <AlertTriangle className="h-4 w-4 text-orange-400" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Minimum spend not met on this card.</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                            {/* --- NEW ICON AND TOOLTIP --- */}
                                            {s.hasBetterChallenger && (
                                                <TooltipProvider delayDuration={100}>
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            <Sparkles className="h-4 w-4 text-blue-500" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>A better card exists but its minimum spend is not met.</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-base font-bold text-sky-700 bg-sky-100 border-sky-200 px-2.5 py-1">{(s.rate * 100).toFixed(1)}%</Badge>
                                </div>
                                <div className="mt-2 pt-2 border-t border-slate-200 text-xs text-slate-600 flex justify-between items-center flex-wrap gap-x-4 gap-y-1">
                                    <span className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5 text-emerald-600"/><span className="font-medium text-emerald-700">{s.remainingCategoryCap === Infinity ? 'Unlimited' : currencyFn(s.remainingCategoryCap)}</span><span>left</span></span>
                                    <span className="flex items-center gap-1.5"><ShoppingCart className="h-3.5 w-3.5"/><span>Spend</span><span className="font-medium text-slate-800">{s.spendingNeeded === Infinity ? 'N/A' : currencyFn(s.spendingNeeded)}</span></span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center p-4 rounded-lg bg-emerald-50 h-full min-h-[200px]">
                        <Sparkles className="h-8 w-8 text-emerald-500 mb-2" />
                        <p className="font-semibold text-emerald-800">All Qualified Tiers Maxed Out!</p>
                        <p className="text-xs text-emerald-700 mt-1">No high-tier opportunities are available on cards that have met their minimum spend.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function useIOSKeyboardGapFix() {
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (!isIOS) return;

    const handleBlur = () => {
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 100);
    };

    window.addEventListener('blur', handleBlur, true);

    return () => {
      window.removeEventListener('blur', handleBlur, true);
    };
  }, []);
}

// -------------------------------------------------------------------
// --- PASTE THIS ENTIRE BLOCK TO REPLACE YOUR EXISTING FUNCTION ---
// -------------------------------------------------------------------

function BestCardFinderDialog({ allCards, allRules, mccMap, monthlySummary, monthlyCategorySummary, activeMonth }) {
    // --- STATE MANAGEMENT ---
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState('initial'); // 'initial', 'results', 'options'
    const [isLoading, setIsLoading] = useState(false);
    
    // Search & Amount State
    const [searchTerm, setSearchTerm] = useState('');
    const [searchedTerm, setSearchedTerm] = useState('');
    const [amount, setAmount] = useState('');
    
    // Results State
    const [searchResult, setSearchResult] = useState(null);
    const [selectedMcc, setSelectedMcc] = useState(null);
    const [bestMatchDetails, setBestMatchDetails] = useState(null);
    const [recentSearches, setRecentSearches] = useState([]);

    // --- HOOKS & HELPERS ---
    const currency = (n) => (n || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
    const cardMap = useMemo(() => new Map(allCards.map(c => [c.id, c])), [allCards]);

    useEffect(() => {
        // Load recent searches from local storage when the dialog opens
        if (isOpen) {
            const searches = JSON.parse(localStorage.getItem('cardFinderSearches') || '[]');
            setRecentSearches(searches);
        }
    }, [isOpen]);
    
    const resetAndClose = () => {
        setIsOpen(false);
        // Delay reset to allow for closing animation
        setTimeout(() => {
            setView('initial');
            setSearchTerm('');
            setSearchedTerm('');
            setSearchResult(null);
            setSelectedMcc(null);
            setAmount('');
            setBestMatchDetails(null);
        }, 200);
    };

    // --- CORE LOGIC ---
    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        
        const term = searchTerm.trim();
        if (!term) return;

        // Update and save recent searches
        const updatedSearches = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
        localStorage.setItem('cardFinderSearches', JSON.stringify(updatedSearches));
        setRecentSearches(updatedSearches);

        setIsLoading(true);
        setSearchedTerm(term);
        setView('initial'); // Reset view to show loading state
        setBestMatchDetails(null);

        // Direct MCC code search
        if (/^\d{4}$/.test(term)) {
            setSelectedMcc(term);
            setBestMatchDetails({
                source: 'Direct Input',
                merchant: `Category for MCC ${term}`,
                mcc: term,
                vnDesc: mccMap[term]?.vn || "Không rõ",
            });
            setView('results');
            setIsLoading(false);
            return;
        }

        // Merchant keyword search
        try {
            const res = await fetch(`/api/lookup-merchant?keyword=${encodeURIComponent(term)}`);
            if (!res.ok) throw new Error('Failed to fetch merchant data');
            const data = await res.json();
            
            setSearchResult(data);
            const bestMcc = data.bestMatch?.mcc;
            setSelectedMcc(bestMcc);

            if (bestMcc) {
                const source = data.bestMatch.source === 'history' ? 'Your History' : 'External Suggestion';
                const listToSearch = source === 'Your History' ? data.history : data.external;
                const matchingItem = listToSearch?.find(item => item.mcc === bestMcc);
                
                setBestMatchDetails({
                    source: source,
                    merchant: matchingItem?.merchant || `Best match for '${term}'`,
                    mcc: bestMcc,
                    vnDesc: mccMap[bestMcc]?.vn || "Không rõ",
                });
            }
            setView('results');
        } catch (err) {
            console.error(err);
            toast.error("Could not fetch suggestions.");
            setView('initial'); // Go back to initial on error
        } finally {
            setIsLoading(false);
        }
    };

    const handleRecentSearchClick = (term) => {
        setSearchTerm(term);
        // Use a timeout to ensure the state updates before submitting the form
        setTimeout(() => {
            const form = document.getElementById('card-finder-form');
            form?.requestSubmit();
        }, 0);
    };
    
    const handleOptionSelect = (mcc, merchant) => {
        setSelectedMcc(mcc);
        setBestMatchDetails({
            source: 'Manual Selection',
            merchant: merchant,
            mcc: mcc,
            vnDesc: mccMap[mcc]?.vn || "Không rõ",
        });
        setView('results'); // Go back to results view with the new selection
    };

    const handleAmountChange = (e) => {
        const value = e.target.value.replace(/,/g, '');
        if (!isNaN(value) && value.length <= 15) {
            setAmount(value ? Number(value).toLocaleString('en-US') : '');
        } else if (value === '') {
            setAmount('');
        }
    };

    const rankedSuggestions = useMemo(() => {
        if (!selectedMcc) return [];
        const numericAmount = parseFloat(String(amount).replace(/,/g, ''));
        
        return allRules
            .filter(rule => rule.mccCodes && rule.mccCodes.split(',').map(c => c.trim()).includes(selectedMcc))
            .map(rule => {
                const card = cardMap.get(rule.cardId);
                if (!card || card.status !== 'Active') return null;

                const cardMonthSummary = monthlySummary.find(s => s.cardId === card.id && s.month === activeMonth);
                const categorySummaryId = `${activeMonth} - ${rule.ruleName}`;
                const categoryMonthSummary = monthlyCategorySummary.find(s => s.summaryId === categorySummaryId && s.cardId === card.id);
                
                const currentCategoryCashback = categoryMonthSummary?.cashback || 0;
                const categoryLimit = categoryMonthSummary?.categoryLimit || Infinity;
                const remainingCategoryCashback = categoryLimit - currentCategoryCashback;
                
                let calculatedCashback = null;
                if (!isNaN(numericAmount) && numericAmount > 0) {
                    calculatedCashback = numericAmount * rule.rate;
                    if (rule.capPerTransaction > 0) {
                        calculatedCashback = Math.min(calculatedCashback, rule.capPerTransaction);
                    }
                }
                
                return { 
                    rule, 
                    card, 
                    calculatedCashback, 
                    isMinSpendMet: card.minimumMonthlySpend > 0 ? (cardMonthSummary?.spend || 0) >= card.minimumMonthlySpend : true,
                    isCategoryCapReached: isFinite(remainingCategoryCashback) && remainingCategoryCashback <= 0,
                    isMonthlyCapReached: card.overallMonthlyLimit > 0 ? (cardMonthSummary?.cashback || 0) >= card.overallMonthlyLimit : false,
                    remainingCategoryCashback,
                };
            })
            .filter(Boolean)
            .sort((a, b) => {
                const isACapped = a.isMonthlyCapReached || a.isCategoryCapReached;
                const isBCapped = b.isMonthlyCapReached || b.isCategoryCapReached;
                if (isACapped !== isBCapped) return isACapped ? 1 : -1;

                if (!isNaN(numericAmount)) {
                    return (b.calculatedCashback || 0) - (a.calculatedCashback || 0);
                }
                return b.rule.rate - a.rule.rate;
            });
    }, [selectedMcc, amount, allRules, cardMap, monthlySummary, monthlyCategorySummary, activeMonth]);
    
    // --- RENDER LOGIC ---
    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="mt-4 text-muted-foreground">Finding best options...</p>
                </div>
            );
        }

        if (view === 'options' && searchResult) {
            return <FinderOptionsView searchResult={searchResult} mccMap={mccMap} onSelect={handleOptionSelect} onBack={() => setView('results')} />;
        }

        if (view === 'results' && bestMatchDetails) {
            return (
                <div>
                    {/* Suggestion 1: Unified Results Header */}
                    <div className="p-3 mb-4 bg-slate-50 rounded-lg border">
                        <p className="text-xs text-muted-foreground">Showing rankings for:</p>
                        <div className="flex justify-between items-start gap-2 mt-1">
                            <div>
                                <h3 className="font-bold text-slate-800 leading-tight">{bestMatchDetails.merchant}</h3>
                                <p className="text-xs text-muted-foreground">{bestMatchDetails.vnDesc}</p>
                            </div>
                            <Badge variant="outline" className="font-mono text-sm">{bestMatchDetails.mcc}</Badge>
                        </div>
                        <div className="mt-2 text-center">
                            <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setView('options')}>
                                Not right? View other suggestions
                            </Button>
                        </div>
                    </div>

                    {rankedSuggestions.length > 0 ? (
                        <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                           {rankedSuggestions.map((item, index) => (
                                <RankingCard 
                                    key={item.rule.id}
                                    rank={index + 1}
                                    item={item}
                                    currencyFn={currency}
                                />
                           ))}
                        </div>
                    ) : (
                        // Suggestion 3: Enhanced No Results State
                        <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-4 min-h-[200px]">
                            <Search className="h-8 w-8 mb-3 text-slate-400" />
                            <p className="font-semibold text-primary">No Rules Found for '{searchedTerm}'</p>
                            <p className="text-xs mt-1">Try a more general term or search externally.</p>
                            <div className="flex items-center gap-2 mt-4">
                                <Button asChild variant="outline" size="sm">
                                    <a href={`https://www.google.com/search?q=${encodeURIComponent(searchedTerm + ' mcc code')}`} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Google
                                    </a>
                                </Button>
                                <Button asChild variant="outline" size="sm">
                                    <a href={`https://quanlythe.com/tien-ich/tra-cuu-mcc?query=${encodeURIComponent(searchedTerm)}`} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> QuanLyThe
                                    </a>
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            );
        }
        
        // Suggestion 3: Enhanced Initial State
        return (
             <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-4 min-h-[300px]">
                <Sparkles className="h-10 w-10 mb-3 text-sky-500" />
                <p className="font-semibold text-primary">Find the best card for any purchase.</p>
                <p className="text-xs mt-1">
                    e.g., Shopee, Grab, Supermarket, or a 4-digit MCC like 5411...
                </p>
                {recentSearches.length > 0 && (
                     <div className="mt-6 flex items-center gap-2 flex-wrap justify-center">
                        <span className="text-xs font-semibold">Recent:</span>
                        {recentSearches.map(term => (
                            <button key={term} onClick={() => handleRecentSearchClick(term)} className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-full transition-colors">{term}</button>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetAndClose(); else setIsOpen(true); }}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Search className="mr-2 h-4 w-4" /> Card Finder
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Find the Best Card</DialogTitle>
                    <DialogDescription>
                        Enter a merchant and amount to see your best rewards.
                    </DialogDescription>
                </DialogHeader>
                
                <form id="card-finder-form" onSubmit={handleSearch}>
                    <div className="flex items-center gap-2">
                        <Input
                            placeholder="e.g., Shopee, 5411, Grab..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-grow"
                        />
                        <Input
                            placeholder="Amount (Optional)"
                            value={amount}
                            onChange={handleAmountChange}
                            className="w-32"
                            inputMode="numeric"
                        />
                        <Button type="submit" disabled={isLoading || !searchTerm.trim()} className="shrink-0">
                            <Search className="h-4 w-4" />
                        </Button>
                    </div>
                </form>

                <div className="mt-4">
                    {renderContent()}
                </div>
            </DialogContent>
        </Dialog>
    );
}

// Suggestion 2: New "RankingCard" Sub-component
function RankingCard({ rank, item, currencyFn }) {
    const { card, rule, calculatedCashback, isMinSpendMet, isCategoryCapReached, isMonthlyCapReached, remainingCategoryCashback } = item;
    const isCapped = isCategoryCapReached || isMonthlyCapReached;
    
    const getRateBadgeClass = (rate) => {
        if (rate >= 0.05) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        if (rate >= 0.02) return 'bg-sky-100 text-sky-800 border-sky-200';
        return 'bg-slate-100 text-slate-800 border-slate-200';
    };

    return (
        <div className={cn(
            "border rounded-lg p-3 transition-all",
            rank === 1 && "bg-sky-50/70 border-sky-200",
            isCapped && "opacity-50 bg-slate-100"
        )}>
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    <span className={cn("text-xl font-bold mt-0.5", rank === 1 ? "text-sky-600" : "text-slate-400")}>#{rank}</span>
                    <div>
                        <p className="font-bold text-primary">{card.name}</p>
                        <p className="text-xs text-muted-foreground">{rule.ruleName}</p>
                    </div>
                </div>
                <div className="text-right flex-shrink-0">
                    <Badge variant="outline" className={cn("text-base font-bold", getRateBadgeClass(rule.rate))}>
                        {(rule.rate * 100).toFixed(1)}%
                    </Badge>
                    {calculatedCashback !== null && (
                        <p className="text-sm font-semibold text-emerald-600 mt-1">
                            + {currencyFn(calculatedCashback)}
                        </p>
                    )}
                </div>
            </div>

            {(rule.capPerTransaction > 0 || isFinite(remainingCategoryCashback) || !isMinSpendMet) && (
                 <div className="mt-2 pt-2 border-t flex items-center justify-between gap-x-4 gap-y-1 flex-wrap text-xs text-muted-foreground">
                    {!isMinSpendMet && (
                        <span className="flex items-center gap-1.5 font-medium text-orange-600">
                            <AlertTriangle className="h-3.5 w-3.5" /> Min. Spend Not Met
                        </span>
                    )}
                    {isFinite(remainingCategoryCashback) && (
                         <span className="flex items-center gap-1.5">
                            <Wallet className="h-3.5 w-3.5" />
                            Cap Left: <span className="font-semibold text-slate-700">{currencyFn(remainingCategoryCashback)}</span>
                        </span>
                    )}
                     {rule.capPerTransaction > 0 && (
                         <span className="flex items-center gap-1.5">
                            <DollarSign className="h-3.5 w-3.5" />
                            Max/Tx: <span className="font-semibold text-slate-700">{currencyFn(rule.capPerTransaction)}</span>
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

// Suggestion 4: New Sub-component for the Options View
function FinderOptionsView({ searchResult, mccMap, onSelect, onBack }) {
    return (
        <div>
            <Button variant="ghost" size="sm" onClick={onBack} className="mb-2 -ml-2">
                <ChevronLeft className="h-4 w-4 mr-1" /> Back to Rankings
            </Button>
            <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-2">
                {searchResult.history?.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-1 px-1">From Your History</h4>
                        {searchResult.history.map((item, index) => (
                            <FinderOptionItem key={`h-${index}`} item={item} mccMap={mccMap} onSelect={onSelect} icon={<History className="h-5 w-5 text-slate-500 flex-shrink-0" />} />
                        ))}
                    </div>
                )}
                {searchResult.external?.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-1 px-1">External Suggestions</h4>
                         {searchResult.external.map((item, index) => (
                            <FinderOptionItem key={`e-${index}`} item={item} mccMap={mccMap} onSelect={onSelect} icon={<Globe className="h-5 w-5 text-slate-500 flex-shrink-0" />} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function FinderOptionItem({ item, mccMap, onSelect, icon }) {
     return (
        <button onClick={() => onSelect(item.mcc, item.merchant)} className="w-full text-left p-2 rounded-md hover:bg-muted transition-colors">
            <div className="flex items-center gap-3">
                {icon}
                <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{item.merchant}</p>
                    <p className="text-xs text-muted-foreground">{mccMap[item.mcc]?.vn || 'N/A'}</p>
                </div>
                <Badge variant="outline">{item.mcc}</Badge>
            </div>
        </button>
    );
}