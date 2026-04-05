import { useMemo, useState } from 'react';
import { getMetricSparkline } from '../lib/stats';
import { getTodaysMonth, getPreviousMonth, getCurrentCashbackMonthForCard } from '../lib/date';
import { fmtYMShort } from '../lib/formatters';

export default function useDashboardStats({
    activeMonth,
    monthlySummary,
    liveSummary,
    cards,
    recentTransactions,
    monthlyTransactions
}) {
    const [liveChartPeriod, setLiveChartPeriod] = useState('1M'); // '12M', '6M', '1M', 'LM', '1W'

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


    const overviewChartStats = useMemo(() => {
        const monthData = monthlySummary.filter(s => s.month === activeMonth);

        const combinedData = cards.map(card => {
            const summary = monthData.find(s => s.cardId === card.id);
            return {
                name: card.name,
                spend: summary?.spend || 0,
                cashback: summary?.cashback || 0
            };
        });

        return combinedData;
    }, [activeMonth, monthlySummary, cards]);

    // --- NEW: Live Chart Stats (12M, 6M, 1M, LM, 1W) ---
    const liveOverviewChartStats = useMemo(() => {
        if (activeMonth !== 'live') return [];

        const spendMap = new Map();
        const cashbackMap = new Map();

        cards.forEach(card => {
            spendMap.set(card.id, 0);
            cashbackMap.set(card.id, 0);
        });

        if (liveChartPeriod === '1W') {
            // For 1W, we filter transactions from the last 7 days.
            // Using recentTransactions (and maybe monthlyTransactions if needed, but recent usually has the latest).
            // Combine both to ensure we have recent ones, avoiding duplicates.
            const allRecent = [...recentTransactions, ...monthlyTransactions];
            const uniqueTxs = Array.from(new Map(allRecent.map(tx => [tx.id, tx])).values());

            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            sevenDaysAgo.setHours(0, 0, 0, 0);

            uniqueTxs.forEach(tx => {
                const txDate = new Date(tx['Transaction Date']);
                if (txDate >= sevenDaysAgo && tx['Card']) {
                    const cardId = tx['Card'][0];
                    if (spendMap.has(cardId)) {
                        spendMap.set(cardId, spendMap.get(cardId) + (tx.Amount || 0));
                        cashbackMap.set(cardId, cashbackMap.get(cardId) + (tx.Cashback || 0));
                    }
                }
            });
        } else {
            // For month-based periods, we use monthlySummary
            cards.forEach(card => {
                const currentMonth = getCurrentCashbackMonthForCard(card);
                let targetMonths = [];

                if (liveChartPeriod === '1M') {
                    targetMonths = [currentMonth];
                } else if (liveChartPeriod === 'LM') {
                    targetMonths = [getPreviousMonth(currentMonth)];
                } else {
                    const count = liveChartPeriod === '6M' ? 6 : 12;
                    let m = currentMonth;
                    for (let i = 0; i < count; i++) {
                        targetMonths.push(m);
                        m = getPreviousMonth(m);
                    }
                }

                // Sum up for target months
                targetMonths.forEach(m => {
                    const summary = monthlySummary.find(s => s.month === m && s.cardId === card.id);
                    if (summary) {
                        spendMap.set(card.id, spendMap.get(card.id) + (summary.spend || 0));
                        cashbackMap.set(card.id, cashbackMap.get(card.id) + (summary.cashback || 0));
                    }
                });
            });
        }

        const combinedData = cards.map(card => ({
            name: card.name,
            spend: spendMap.get(card.id) || 0,
            cashback: cashbackMap.get(card.id) || 0
        }));

        return combinedData;
    }, [activeMonth, liveChartPeriod, cards, monthlySummary, recentTransactions, monthlyTransactions]);

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

    return {
        liveChartPeriod,
        setLiveChartPeriod,
        displayStats,
        overviewChartStats,
        liveOverviewChartStats,
        cardPerformanceData
    };
}