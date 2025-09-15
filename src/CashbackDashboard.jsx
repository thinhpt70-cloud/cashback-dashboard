import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { CreditCard, Wallet, CalendarClock, TrendingUp, DollarSign, AlertTriangle, RefreshCw, Search, Bell, Info, Loader2 } from "lucide-react";
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
import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, BarChart, Bar, PieChart, Pie, Cell, Legend, LabelList, LineChart, Line } from "recharts";
import { ArrowUp, ArrowDown, ChevronsUpDown, ChevronDown, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "./lib/utils";



// --------------------------
// 1) API & DATA FETCHING
// --------------------------
const API_BASE_URL = '/api';

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

    const handleTransactionAdded = (newTransaction) => {
    // 1. Instantly update the list for the current month
    // This makes the UI feel immediate
    if (newTransaction['Transaction Date'].startsWith(activeMonth.replace('-', ''))) {
            setMonthlyTransactions(prevTxs => [newTransaction, ...prevTxs]);
    }

    // 2. Update the recent transactions carousel
    setRecentTransactions(prevRecent => [newTransaction, ...prevRecent].slice(0, 10)); // Assuming you show 10

    // 3. Trigger a full refresh in the background to update all
    //    aggregate data (charts, stats, etc.) without a loading screen.
    fetchData(); 
    };
  

  // --- DATA FETCHING ---
  const fetchData = async () => {
    setLoading(true);
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
            categoriesRes
        ] = await Promise.all([
            fetch(`${API_BASE_URL}/cards`),
            fetch(`${API_BASE_URL}/rules`),
            fetch(`${API_BASE_URL}/monthly-summary`),
            fetch(`${API_BASE_URL}/mcc-codes`),
            fetch(`${API_BASE_URL}/monthly-category-summary`), // Fetches data for the optimized overview
            fetch(`${API_BASE_URL}/recent-transactions`),
            fetch(`${API_BASE_URL}/categories`),
        ]);

        // Check if all network responses are successful
        if (!cardsRes.ok || !rulesRes.ok || !monthlyRes.ok || !mccRes.ok || !monthlyCatRes.ok || !recentTxRes.ok || !categoriesRes.ok) {
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

        // Set all the state variables for the application
        setCards(cardsData);
        setRules(rulesData);
        setMonthlySummary(monthlyData);
        setMccMap(mccData.mccDescriptionMap || {});
        setMonthlyCategorySummary(monthlyCatData); // Set the new state for the overview tab
        setRecentTransactions(recentTxData); // Set the new state
        setAllCategories(categoriesData); // Set the new state for all categories

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
        setLoading(false);
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
                const res = await fetch(`${API_BASE_URL}/transactions?month=${activeMonth}`);
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
    }, [activeMonth]); // This hook runs whenever 'activeMonth' changes

    // --------------------------
    // 2) HELPERS & CALCULATIONS
    // --------------------------

    // --- UTILITIES ---
    const currency = (n) => (n || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
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
    
    // --- MEMOIZED DATA PROCESSING ---
    const cardMap = useMemo(() => new Map(cards.map(c => [c.id, c])), [cards]);

    const calculateDaysLeft = (paymentDateString) => {
        if (!paymentDateString || paymentDateString === "N/A") return null;

        // Use a fixed "today" for consistent results in this example
        const today = new Date("2025-09-12T00:00:00Z"); 
        const dueDate = new Date(paymentDateString + "T00:00:00Z");
        
        if (isNaN(dueDate)) return null;

        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays >= 0 ? diffDays : null;
    };

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
      }));
      
      const cashbackByCard = monthData.map(item => ({
          name: cardMap.get(item.cardId)?.name || "Unknown Card",
          value: item.cashback || 0,
      }));

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
        <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-white shadow-sm px-4 md:px-6 z-10">
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Cashback Optimizer
          </h1>
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
            <Button variant="outline" size="icon" onClick={fetchData}><RefreshCw className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon"><Bell className="h-4 w-4" /></Button>
            <div className="ml-auto flex items-center gap-4">
                {/* This Dialog component creates the popup */}
                <Dialog>
                <DialogTrigger asChild>
                    <Button>Add Transaction</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                    <DialogTitle>Add a New Transaction</DialogTitle>
                    </DialogHeader>
                    {/* The form is now inside the popup content */}
                    <AddTransactionForm
                    cards={cards}
                    categories={allCategories}
                    rules={cashbackRules}
                    monthlyCategories={monthlyCashbackCategories}
                    mccMap={mccMap}
                    onTransactionAdded={handleTransactionAdded}
                    />
                </DialogContent>
                </Dialog>
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
                    <Card className="lg:col-span-4">
                        <CardHeader><CardTitle>Spend vs Cashback Trend</CardTitle></CardHeader>
                        <CardContent className="pl-2">
                            <ResponsiveContainer width="100%" height={300}>
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
                    />
                </div>
                    
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SpendByCardChart
                        spendData={overviewStats.spendByCard}
                        currencyFn={currency}
                    />
                    <CashbackByCardChart
                        cashbackData={overviewStats.cashbackByCard}
                        currencyFn={currency}
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
              />
            </TabsContent>  

            <TabsContent value="cards" className="space-y-4 pt-4">
              
              <CardsOverviewMetrics stats={cardsTabStats} currencyFn={currency} />

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {cards.map(card => {
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

                      return (
                          <Card key={card.id}>
                              <CardHeader>
                                  <div className="flex items-center justify-between">
                                      <CardTitle className="text-lg">{card.name} &bull;&bull;&bull;{card.last4}</CardTitle>
                                      <Badge variant="outline">{card.bank}</Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground pt-1">
                                      Due around day {card.paymentDueDay} of month
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

                                  <div className="flex justify-end pt-2">
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* The summary table takes up 2/3 of the space on large screens */}
                    <div className="lg:col-span-1">
                        <CardRoi cards={cards} currencyFn={currency} feeCycleProgressFn={calculateFeeCycleProgress} />
                    </div>
                    <div className="lg:col-span-2">
                        <PaymentsTab 
                            cards={cards}
                            monthlySummary={monthlySummary}
                            currencyFn={currency}
                            fmtYMShortFn={fmtYMShort}
                            daysLeftFn={calculateDaysLeft}
                        />
                    </div>
                    {/* The new ROI component takes up 1/3 of the space */}
                </div>
            </TabsContent>
          </Tabs>
        </main>
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
          <div className="space-y-2 max-h-56 overflow-y-auto pr-4">
            {rules.map(rule => (
              <Badge key={rule.id} variant="outline" className="w-full justify-between py-3">
                <span className="font-medium text-primary">{rule.ruleName}</span>
                <span className="font-mono text-base text-foreground">{rule.rate * 100}%</span>
              </Badge>
            ))}
            {rules.length === 0 && <p className="text-xs text-muted-foreground">No specific cashback rules found for this card.</p>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TransactionsTab({ transactions, isLoading, activeMonth, cardMap, mccNameFn, allCards }) {
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
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <CardTitle>Transactions for {fmtYMShort(activeMonth)}</CardTitle>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Search..." className="w-full pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <select value={cardFilter} onChange={(e) => setCardFilter(e.target.value)} className="h-9 text-sm rounded-md border border-input bg-transparent px-3 py-1 shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
              <option value="all">All Cards</option>
              {allCards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="h-9 text-sm rounded-md border border-input bg-transparent px-3 py-1 shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
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
                    <TableHead><Button variant="ghost" onClick={() => requestSort('Transaction Date')} className="px-2">Date <SortIcon columnKey="Transaction Date" /></Button></TableHead>
                    <TableHead><Button variant="ghost" onClick={() => requestSort('Transaction Name')} className="px-2">Merchant <SortIcon columnKey="Transaction Name" /></Button></TableHead>
                    <TableHead><Button variant="ghost" onClick={() => requestSort('Card')} className="px-2">Card <SortIcon columnKey="Card" /></Button></TableHead>
                    <TableHead><Button variant="ghost" onClick={() => requestSort('Category')} className="px-2">Category <SortIcon columnKey="Category" /></Button></TableHead>
                    <TableHead className="text-right"><Button variant="ghost" onClick={() => requestSort('estCashback')} className="px-2 justify-end w-full">Cashback <SortIcon columnKey="estCashback" /></Button></TableHead>
                    <TableHead className="text-right"><Button variant="ghost" onClick={() => requestSort('Amount')} className="px-2 justify-end w-full">Amount <SortIcon columnKey="Amount" /></Button></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow><TableCell colSpan={6} className="text-center h-24"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></TableCell></TableRow>
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
                        <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">No transactions found for the selected period or filters.</TableCell></TableRow>
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
        // Find the specific summary for this card and the active month
        const cardMonthSummary = monthlySummary.find(
          summary => summary.cardId === card.id && summary.month === activeMonth
        );

        // Get the pre-calculated cashback from that summary
        const currentCashback = cardMonthSummary ? cardMonthSummary.cashback : 0;
        
        const monthlyLimit = card.overallMonthlyLimit;
        const usedPct = monthlyLimit > 0 ? Math.min(100, Math.round((currentCashback / monthlyLimit) * 100)) : 0;
        
        return {
          cardId: card.id,
          cardName: card.name,
          currentCashback,
          monthlyLimit,
          usedPct,
        };
      });
  }, [cards, activeMonth, monthlySummary]);

  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle>Card Spends Cap</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {cardSpendsCapProgress.map(p => (
          <div key={p.cardId}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">{p.cardName}</span>
              <span className="text-muted-foreground">{currency(p.currentCashback)} / {currency(p.monthlyLimit)}</span>
            </div>
            <Tooltip>
              <TooltipTrigger className="w-full">
                <Progress value={p.usedPct} />
              </TooltipTrigger>
              <TooltipContent>
                <p>{p.usedPct}% used. {currency(p.monthlyLimit - p.currentCashback)} remaining.</p>
              </TooltipContent>
            </Tooltip>
          </div>
        ))}
        {cardSpendsCapProgress.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No monthly limits defined for your cards.</p>
        )}
      </CardContent>
    </Card>
  );
}

function SpendByCardChart({ spendData, currencyFn }) {
  const COLORS = ['#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ec4899'];

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
              {spendData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <RechartsTooltip formatter={(value) => currencyFn(value)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// NEW COMPONENT 2: CashbackByCardChart
function CashbackByCardChart({ cashbackData, currencyFn }) {
  const COLORS = ['#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ec4899'];

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
              {cashbackData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <RechartsTooltip formatter={(value) => currencyFn(value)} />
            <Legend />
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

function PaymentsTab({ cards, monthlySummary, currencyFn, fmtYMShortFn, daysLeftFn }) {
    // State to track which card's previous statements are expanded
    const [expandedRows, setExpandedRows] = useState({});

    const handleToggleRow = (cardId) => {
        setExpandedRows(prev => ({
            ...prev,
            [cardId]: !prev[cardId]
        }));
    };

    const paymentData = useMemo(() => {
        const data = cards.map(card => {
            const allCardSummaries = monthlySummary
                .filter(s => s.cardId === card.id)
                .sort((a, b) => b.month.localeCompare(a.month));
            
            const latestMonthSummary = allCardSummaries[0];
            
            // MODIFIED: Calculate payment date for all previous statements
            const previousStatements = allCardSummaries.slice(1).map(stmt => {
                const year = parseInt(stmt.month.slice(0, 4), 10);
                // JS month is 0-indexed, but our data's month is 1-indexed. 
                // new Date(year, month, day) will correctly give the *next* month's date.
                // Example: For September (month 9), new Date(2025, 9, 25) creates an October date.
                const month = parseInt(stmt.month.slice(4, 6), 10);
                let paymentDate = "N/A";
                if (card.paymentDueDay) {
                    const dueDate = new Date(year, month, card.paymentDueDay);
                    paymentDate = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')}`;
                }
                return { ...stmt, paymentDate }; // Add the calculated date to the object
            });

            const latestMonth = latestMonthSummary ? latestMonthSummary.month : null;
            const totalPayment = latestMonthSummary ? latestMonthSummary.spend : 0;
            const totalCashback = latestMonthSummary ? latestMonthSummary.cashback : 0;
            const finalPayment = totalPayment - totalCashback;

            let statementDate = "N/A", paymentDate = "N/A", daysLeft = null;

            if (latestMonth) {
                const year = parseInt(latestMonth.slice(0, 4), 10);
                const month = parseInt(latestMonth.slice(4, 6), 10);
                if (card.statementDay) statementDate = `${year}-${String(month).padStart(2, '0')}-${String(card.statementDay).padStart(2, '0')}`;
                if (card.paymentDueDay) {
                    const dueDate = new Date(year, month, card.paymentDueDay);
                    paymentDate = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')}`;
                    daysLeft = daysLeftFn(paymentDate);
                }
            }

            return { ...card, latestMonth, totalPayment, totalCashback, finalPayment, statementDate, paymentDate, daysLeft, previousStatements };
        });

        data.sort((a, b) => {
            if (a.daysLeft === null) return 1;
            if (b.daysLeft === null) return -1;
            return a.daysLeft - b.daysLeft;
        });

        return data;
    }, [cards, monthlySummary, daysLeftFn]);

    return (
        <Card>
            <CardHeader><CardTitle>Monthly Statement Summary</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[250px]">Card</TableHead>
                            <TableHead>Payment Date</TableHead>
                            <TableHead>Days Left</TableHead>
                            <TableHead>Cashback Month</TableHead>
                            <TableHead className="text-right">Total Payment</TableHead>
                            <TableHead className="text-right">Total Cashback</TableHead>
                            <TableHead className="text-right">Final Payment</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paymentData.map(card => (
                            <React.Fragment key={card.id}>
                                <TableRow>
                                    <TableCell>
                                        <div className="flex items-center">
                                            <Button variant="ghost" size="sm" onClick={() => handleToggleRow(card.id)} className="mr-2">
                                                {expandedRows[card.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                            </Button>
                                            <div>
                                                <div className="font-medium">{card.name} ***{card.last4}</div>
                                                <div className="text-xs text-gray-500">Statement: {card.statementDate}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{card.paymentDate}</TableCell>
                                    <TableCell>
                                        {card.daysLeft !== null && (
                                            <Badge variant={card.daysLeft <= 3 ? "destructive" : card.daysLeft <= 7 ? "secondary" : "outline"}>
                                                {card.daysLeft} days
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>{card.latestMonth && <Badge variant="outline">{fmtYMShortFn(card.latestMonth)}</Badge>}</TableCell>
                                    <TableCell className="text-right">{currencyFn(card.totalPayment)}</TableCell>
                                    <TableCell className="text-right text-emerald-600">{currencyFn(card.totalCashback)}</TableCell>
                                    <TableCell className="text-right font-semibold">{currencyFn(card.finalPayment)}</TableCell>
                                </TableRow>
                                {expandedRows[card.id] && card.previousStatements.length > 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="p-0">
                                            <div className="p-4 bg-slate-50">
                                                <h4 className="font-semibold text-sm mb-2">Previous Statements</h4>
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Month</TableHead>
                                                            {/* NEW: Add the table header for the payment date */}
                                                            <TableHead>Payment Date</TableHead>
                                                            <TableHead className="text-right">Total Payment</TableHead>
                                                            <TableHead className="text-right">Total Cashback</TableHead>
                                                            <TableHead className="text-right">Final Payment</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {card.previousStatements.map(stmt => (
                                                            <TableRow key={stmt.month}>
                                                                <TableCell><Badge variant="outline">{fmtYMShortFn(stmt.month)}</Badge></TableCell>
                                                                {/* NEW: Add the table cell to display the payment date */}
                                                                <TableCell>{stmt.paymentDate}</TableCell>
                                                                <TableCell className="text-right">{currencyFn(stmt.spend)}</TableCell>
                                                                <TableCell className="text-right text-emerald-600">{currencyFn(stmt.cashback)}</TableCell>
                                                                <TableCell className="text-right font-semibold">{currencyFn(stmt.spend - stmt.cashback)}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </React.Fragment>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
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
        
        // Sort by the nearest upcoming annual fee date
        data.sort((a, b) => {
            if (!a.nextAnnualFeeDate) return 1;
            if (!b.nextAnnualFeeDate) return -1;
            return new Date(a.nextAnnualFeeDate) - new Date(b.nextAnnualFeeDate);
        });

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
                            <Badge className={cn(
                                "font-semibold", // Base styles for both
                                card.isNetPositive
                                    ? "border-gray-300 border text-gray-600" // Style for "Net Positive"
                                    : "bg-red-500 text-white border-transparent" // Style for "Net Negative"
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

// ... at the bottom of src/CashbackDashboard.jsx

function CategoryCapsUsage({ card, activeMonth, monthlyCategorySummary, monthlySummary, currencyFn }) {
    // Logic to calculate the individual category caps (remains the same)
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

    // Logic to calculate the data for the "Total" box (remains the same)
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
            <h4 className="text-sm font-semibold text-center text-muted-foreground mb-3">Category Caps Usage</h4>
            
            {/* THIS IS THE NEW, SIMPLIFIED LOGIC */}
            {/* Check if there is any category data to display */}
            {categoryCapData.length > 0 ? (
                // If YES, render the grid with the "Total" box and the category boxes
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* The "Total" box will only appear if it has data AND there are categories */}
                    {totalCardData && (
                        <div className="border p-3 rounded-lg space-y-2 flex flex-col bg-slate-100">
                            <div className="flex justify-between items-start">
                                <p className="font-semibold text-sm truncate pr-2">Total</p>
                                <Badge className={cn("font-mono", totalCardData.usedPct >= 90 ? "bg-emerald-500 text-white border-transparent" : "border border-input text-foreground")}>
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

                    {/* The category caps boxes */}
                    {categoryCapData.map(cap => (
                        <div key={cap.id} className="border p-3 rounded-lg space-y-2 flex flex-col">
                            <div className="flex justify-between items-start">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <p className="font-medium text-sm truncate pr-2" title={cap.category}>{cap.category}</p>
                                    </TooltipTrigger>
                                    <TooltipContent><p>{cap.category}</p></TooltipContent>
                                </Tooltip>
                                <Badge className={cn("font-mono", cap.usedPct >= 90 ? "bg-emerald-500 text-white border-transparent" : "border border-input text-foreground")}>
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
                // If NO, render the placeholder box
                <div className="border p-3 rounded-lg flex items-center justify-center h-24">
                    <p className="text-xs text-muted-foreground">No specific categories for this month</p>
                </div>
            )}
        </div>
    );
}

function CardPerformanceLineChart({ data, cards, currencyFn }) {
    const [view, setView] = useState('All'); 
    const COLORS = ['#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ec4899'];
    
    // The CustomDot helper is no longer needed and has been removed.

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
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
                        <RechartsTooltip formatter={(value) => currencyFn(value)} />
                        <Legend />
                        
                        {cards.map((card, index) => {
                            const cardColor = COLORS[index % COLORS.length];
                            return (
                                <React.Fragment key={card.id}>
                                    {(view === 'All' || view === 'Spending') && (
                                        <Line type="linear" connectNulls dataKey={`${card.name} Spend`} stroke={cardColor} strokeWidth={2} yAxisId="left" activeDot={{ r: 6 }} />
                                    )}
                                    {(view === 'All' || view === 'Cashback') && (
                                        <Line type="linear" connectNulls dataKey={`${card.name} Cashback`} stroke={cardColor} strokeWidth={2} strokeDasharray="5 5" yAxisId={view === 'All' ? 'right' : 'left'} activeDot={{ r: 6 }} />
                                    )}
                                </React.Fragment>
                            )
                        })}
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

// ... at the bottom of src/CashbackDashboard.jsx

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
                                <div className="flex justify-between items-start">
                                    <div className="max-w-[70%]">
                                        <p className="font-semibold truncate" title={tx['Transaction Name']}>{tx['Transaction Name']}</p>
                                        <p className="text-xs text-gray-500">{tx['Transaction Date']}</p>
                                    </div>
                                    {card && <Badge variant="secondary">{card.name}</Badge>}
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

// --- FINAL AddTransactionForm COMPONENT ---

function AddTransactionForm({ cards, categories, rules, monthlyCategories, mccMap, onTransactionAdded }) {
    // --- State Management ---
    const [merchant, setMerchant] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [cardId, setCardId] = useState('');
    const [category, setCategory] = useState('');
    const [mccCode, setMccCode] = useState('');
    const [mccName, setMccName] = useState('');
    const [applicableRuleId, setApplicableRuleId] = useState('');
    const [cardSummaryCategoryId, setCardSummaryCategoryId] = useState('new');
    const [estimatedCashback, setEstimatedCashback] = useState(0);
    const [isMccSearching, setIsMccSearching] = useState(false);
    const [setOpen] = useState(false); // State to control dialog visibility

    // --- Memoized Calculations ---
    const selectedCard = useMemo(() => cards.find(c => c.id === cardId), [cardId, cards]);

    const statementDate = useMemo(() => {
        if (!selectedCard || !date) return 'Select a card and date';
        const transactionDate = new Date(date);
        let statementMonth = transactionDate.getMonth();
        let statementYear = transactionDate.getFullYear();
        if (transactionDate.getDate() > selectedCard.statementDay) {
            statementMonth += 1;
        }
        const nextStatementDate = new Date(statementYear, statementMonth, selectedCard.statementDay);
        return `Est. Statement Date: ${nextStatementDate.toLocaleDateString()}`;
    }, [selectedCard, date]);

    const selectedRule = useMemo(() => rules.find(r => r.id === applicableRuleId), [applicableRuleId, rules]);

    const filteredSummaries = useMemo(() => {
        if (!selectedRule || !cardId) return [];
        return monthlyCategories.filter(summary => {
            const cardMatch = summary.cardId === cardId;
            const ruleNameMatch = summary.summaryId.includes(selectedRule.name);
            return cardMatch && ruleNameMatch;
        });
    }, [cardId, monthlyCategories, selectedRule]);

    // --- Effects ---
    useEffect(() => {
        if (cards.length > 0 && !cardId) {
            setCardId(cards[0].id);
        }
    }, [cards, cardId]);

    useEffect(() => {
        if (mccMap && mccCode && mccMap[mccCode]) {
            setMccName(mccMap[mccCode].vn);
        } else {
            setMccName('');
        }
    }, [mccCode, mccMap]);

    useEffect(() => {
        if (selectedRule && amount) {
            const numericAmount = parseFloat(String(amount).replace(/,/g, ''));
            const cashback = (numericAmount * selectedRule.cashbackRate) / 100;
            setEstimatedCashback(cashback > selectedRule.maxCashback ? selectedRule.maxCashback : cashback);
        } else {
            setEstimatedCashback(0);
        }
    }, [amount, selectedRule]);

    // --- Handlers ---
    const resetForm = () => {
        setMerchant('');
        setAmount('');
        setDate(new Date().toISOString().split('T')[0]);
        setCardId(cards.length > 0 ? cards[0].id : '');
        setCategory('');
        setMccCode('');
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

    const adjustAmount = (adjustment) => {
        const currentAmount = parseFloat(String(amount).replace(/,/g, '')) || 0;
        const newAmount = currentAmount + adjustment;
        setAmount(newAmount.toLocaleString('en-US'));
    };

    const handleMccSearch = async () => {
        if (!merchant) return;
        setIsMccSearching(true);
        try {
            const response = await fetch(`/api/find-mcc?merchant=${encodeURIComponent(merchant)}`);
            if (!response.ok) throw new Error('MCC search failed');
            const data = await response.json();
            if (data.mcc) {
                setMccCode(data.mcc);
            }
        } catch (error) {
            console.error("MCC Search Error:", error);
        } finally {
            setIsMccSearching(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const transactionData = {
            merchant,
            amount: parseFloat(String(amount).replace(/,/g, '')),
            date,
            cardId,
            category: category || null,
            mccCode: mccCode || null,
            applicableRuleId: applicableRuleId || null,
            cardSummaryCategoryId: cardSummaryCategoryId === 'new' ? null : cardSummaryCategoryId,
        };

        try {
            const response = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transactionData),
            });
            if (!response.ok) throw new Error('Failed to add transaction');
            const newTransaction = await response.json();
            onTransactionAdded(newTransaction);
            resetForm(); // Reset form fields
            setOpen(false); // Close the dialog
        } catch (error) {
            console.error('Error:', error);
        }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4 py-4">
        {/* Row 1: Merchant & MCC Search */}
        <div className="grid grid-cols-4 items-start gap-4">
          <label htmlFor="merchant" className="text-right pt-2">
            Merchant
          </label>
          <div className="col-span-3">
            <div className="flex items-center gap-2">
              <Input
                id="merchant"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                required
              />
              <Button type="button" size="icon" variant="outline" onClick={handleMccSearch} disabled={!merchant || isMccSearching}>
                {isMccSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Row 2: MCC Code & Name */}
        <div className="grid grid-cols-4 items-start gap-4">
          <label htmlFor="mcc" className="text-right pt-2">
            MCC
          </label>
          <div className="col-span-3">
            <Input
              id="mcc"
              value={mccCode}
              onChange={(e) => setMccCode(e.target.value)}
              placeholder="Enter code or search"
            />
            {mccName && <p className="text-xs text-muted-foreground mt-1 pl-1">{mccName}</p>}
          </div>
        </div>

        {/* Row 3: Amount & Est. Cashback */}
        <div className="grid grid-cols-4 items-start gap-4">
          <label htmlFor="amount" className="text-right pt-2">
            Amount
          </label>
          <div className="col-span-3">
            <div className="flex items-center">
              <Input id="amount" type="text" inputMode="numeric" value={amount} onChange={handleAmountChange} className="flex-grow" required />
              <div className="flex flex-col ml-1">
                <button type="button" onClick={() => adjustAmount(10000)} className="h-5 px-2 border rounded-t-md bg-gray-100 text-lg leading-none flex items-center justify-center">+</button>
                <button type="button" onClick={() => adjustAmount(-10000)} className="h-5 px-2 border rounded-b-md bg-gray-100 text-lg leading-none flex items-center justify-center">-</button>
              </div>
            </div>
            <div className="h-4 mt-1">
              {estimatedCashback > 0 && (
                <p className="text-right text-sm text-green-600 font-medium pr-1">
                  Est. Cashback: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(estimatedCashback)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Row 4: Date */}
        <div className="grid grid-cols-4 items-center gap-4">
          <label htmlFor="date" className="text-right">
            Date
          </label>
          <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="col-span-3" required />
        </div>

        {/* Row 5: Card & Statement Date */}
        <div className="grid grid-cols-4 items-start gap-4">
          <label htmlFor="card" className="text-right pt-2">
            Card
          </label>
          <div className="col-span-3">
            <select id="card" value={cardId} onChange={(e) => setCardId(e.target.value)} className="w-full p-2 border rounded" required>
              {cards.map(card => <option key={card.id} value={card.id}>{card.name}</option>)}
            </select>
            <p className="text-sm text-muted-foreground mt-1">{statementDate}</p>
          </div>
        </div>

        {/* Row 6: Category */}
        <div className="grid grid-cols-4 items-center gap-4">
          <label htmlFor="category" className="text-right">
            Category
          </label>
          <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="col-span-3 p-2 border rounded">
            <option value="">None</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        
        {/* Row 7: Applicable Rule */}
        <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="rule" className="text-right">Applicable Rule</label>
            <select id="rule" value={applicableRuleId} onChange={(e) => setApplicableRuleId(e.target.value)} className="col-span-3 p-2 border rounded">
                <option value="">None</option>
                {rules.map(rule => <option key={rule.id} value={rule.id}>{rule.name}</option>)}
            </select>
        </div>

        {/* Row 8: Monthly Summary (Conditional) */}
        {applicableRuleId && (
            <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="summary" className="text-right">Monthly Summary</label>
                <select id="summary" value={cardSummaryCategoryId} onChange={(e) => setCardSummaryCategoryId(e.target.value)} className="col-span-3 p-2 border rounded">
                    <option value="new">Create New Summary</option>
                    {filteredSummaries.map(summary => <option key={summary.id} value={summary.id}>{summary.summaryId}</option>)}
                </select>
            </div>
        )}

        {/* Row 9: Submit Button */}
        <div className="col-span-4 pt-2">
            <Button type="submit" className="w-full">Add Transaction</Button>
        </div>
      </form>
    );
}