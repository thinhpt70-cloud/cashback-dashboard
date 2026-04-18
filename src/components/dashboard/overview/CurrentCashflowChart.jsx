import React, { useState, useMemo } from 'react';
import {
    ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip,
    AreaChart, Area, CartesianGrid, Legend
} from 'recharts';
import {
    Card, CardContent, CardHeader, CardTitle
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/**
 * Custom Tooltip Component
 * Updated to handle both currency (All/Spend/Cashback) and percentage (Rate) views.
 */
const CustomRechartsTooltip = ({ active, payload, label, isRateView, isAllView, currencyFn }) => {
    const currency = currencyFn || ((n) => (n || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }));
    
    if (active && payload?.length) {
        // --- Rate View ---
        if (isRateView) {
            const rateEntry = payload.find(p => p.dataKey === 'effectiveRate');
            if (!rateEntry) return null;
            
            const rate = rateEntry.value;
            return (
                <div className="rounded-lg bg-gray-900 p-3 text-sm shadow-xl transition-all">
                    <p className="font-bold text-white mb-2">{label}</p>
                    <p style={{ color: rateEntry.color }} className="font-medium flex justify-between items-center gap-4">
                        <span className="capitalize">{rateEntry.name}:</span>
                        <span className="font-bold">{(rate * 100).toFixed(2)}%</span>
                    </p>
                </div>
            );
        }

        // --- Standard View (Spend/Cashback) or All View ---
        const spendEntry = payload.find(p => p.dataKey === 'spend');
        const cashbackEntry = payload.find(p => p.dataKey === 'cashback');
        const effectiveRateEntry = payload.find(p => p.dataKey === 'effectiveRate'); // Get rate entry

        const spend = spendEntry ? spendEntry.value : 0;
        const cashback = cashbackEntry ? cashbackEntry.value : 0;
        const effectiveRate = effectiveRateEntry ? effectiveRateEntry.value : (spend > 0 ? (cashback / spend) : 0);

        return (
            <div className="rounded-lg bg-gray-900 p-3 text-sm shadow-xl transition-all">
                <p className="font-bold text-white mb-2">{label}</p>
                {payload
                    // Filter out effectiveRate if it's already computed implicitly for the all view
                    .filter(p => !isAllView || p.dataKey !== 'effectiveRate')
                    .map((p, i) => (
                    <p key={i} style={{ color: p.color }} className="font-medium flex justify-between items-center gap-4">
                        <span className="capitalize">{p.name}:</span>
                        <span className="font-bold">{currency(p.value)}</span>
                    </p>
                ))}
                
                {/* --- UPDATE --- */}
                {/* Reverted to show rate in 'All' view tooltip as requested */}
                {(isAllView || (spendEntry && cashbackEntry)) && (
                    <div className="mt-2 pt-2 border-t border-gray-600">
                        <p className="font-semibold text-white flex justify-between items-center">
                            <span>Effective Rate:</span>
                            <span className="font-bold">{(effectiveRate * 100).toFixed(2)}%</span>
                        </p>
                    </div>
                )}
            </div>
        );
    }
    return null;
};


/**
 * Main Chart Component
 */
const CurrentCashflowChart = React.memo(({ data, cards, currencyFn }) => {
    const [chartView, setChartView] = useState("all"); // "all", "spend", "cashback", "rate"
    const [selectedCardId, setSelectedCardId] = useState('all'); // 'all' or a card.id

    // 1. Calculate the chart data
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];

        return data.map(monthData => {
            let spend = 0;
            let cashback = 0;

            if (selectedCardId === 'all') {
                if (cards) {
                    spend = cards.reduce((acc, card) => acc + (monthData[`${card.name} Spend`] || 0), 0);
                    cashback = cards.reduce((acc, card) => acc + (monthData[`${card.name} Cashback`] || 0), 0);
                } else {
                    // Fallback if cards not provided but data has 'spend'/'cashback'
                    spend = monthData.spend || 0;
                    cashback = monthData.cashback || 0;
                }
            } else {
                const selectedCard = cards?.find(c => c.id === selectedCardId);
                if (selectedCard) {
                    spend = monthData[`${selectedCard.name} Spend`] || 0;
                    cashback = monthData[`${selectedCard.name} Cashback`] || 0;
                }
            }

            return {
                ...monthData,
                spend,
                cashback,
                // Calculate rate as a decimal (e.g., 0.05 for 5%)
                effectiveRate: spend > 0 ? (cashback / spend) : 0
            };
        });
    }, [data, cards, selectedCardId]);

    const isRateViewOnly = chartView === 'rate'; // Only Effective Rate is visible
    const isAllView = chartView === 'all';
    
    // Right axis is no longer shown
    const showRightAxis = false;

    return (
        <Card className="flex flex-col min-h-[350px]">
            <CardHeader className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>Current Cashflow</CardTitle>
                <div className="flex flex-row items-center gap-2">
                    {/* Card Selector Dropdown */}
                    {cards && (
                        <Select value={selectedCardId} onValueChange={setSelectedCardId}>
                            <SelectTrigger className="w-1/2 sm:w-[180px]">
                                <SelectValue placeholder="Select a card" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Cards</SelectItem>
                                {cards.map((card) => (
                                    <SelectItem key={card.id} value={card.id}>
                                        {card.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {/* View Toggle */}
                    <Select value={chartView} onValueChange={setChartView}>
                        <SelectTrigger className="w-1/2 sm:w-[160px]">
                            <SelectValue placeholder="Select a view" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="spend">Spending</SelectItem>
                            <SelectItem value="cashback">Cashback</SelectItem>
                            <SelectItem value="rate">Effective Rate</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent className="grow">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} 
                        margin={{ 
                            top: 5, 
                            right: 10,
                            left: 0,
                            bottom: 5 
                        }}>
                        
                        <defs>
                            <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorCashback" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        
                        <CartesianGrid 
                            strokeDasharray="3 3" 
                            vertical={false} 
                            stroke="#e5e7eb"
                        />
                        <XAxis 
                            dataKey="month" 
                            stroke="#64748b"
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false} 
                            dy={5}
                        />
                        
                        {/* Primary Y-Axis for currency values */}
                        {!isRateViewOnly && (
                            <YAxis 
                                yAxisId="leftCurrency"
                                stroke="#64748b"
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false} 
                                tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`} 
                                dx={-5}
                            />
                        )}
                        
                        {/* Y-Axis for Rate (LEFT side, for 'rate' view only) */}
                        {isRateViewOnly && (
                            <YAxis 
                                yAxisId="leftRate"
                                stroke="#64748b"
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false} 
                                tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} 
                                dx={-5}
                                domain={[0, 'auto']} // Start at 0%
                            />
                        )}

                        {/* Right Y-Axis is now controlled by 'showRightAxis' which is false */}
                        {showRightAxis && (
                            <YAxis 
                                yAxisId="rightRate"
                                orientation="right"
                                stroke="#64748b"
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false} 
                                tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} 
                                dx={20} 
                                domain={[0, 'auto']} 
                            />
                        )}

                        <RechartsTooltip content={<CustomRechartsTooltip isRateView={isRateViewOnly} isAllView={isAllView} currencyFn={currencyFn} />} />
                        
                        <Legend 
                            verticalAlign="top" 
                            align="right" 
                            iconType="circle"
                            iconSize={10}
                            wrapperStyle={{ top: -10, right: 10 }}
                            formatter={(value) => (
                                <span className="capitalize text-muted-foreground font-medium ml-1">
                                    {value}
                                </span>
                            )}
                        />
                        
                        {/* Conditional Area components */}
                        {(chartView === 'all' || chartView === 'spend') && (
                            <Area 
                                type="monotone"
                                dataKey="spend" 
                                stroke="#f59e0b"
                                fillOpacity={1}
                                fill="url(#colorSpend)"
                                strokeWidth={2.5}
                                dot={{ r: 3, fill: '#f59e0b' }}
                                activeDot={{ r: 6, stroke: '#f59e0b', fill: '#fff', strokeWidth: 2 }}
                                yAxisId="leftCurrency"
                            />
                        )}
                        {(chartView === 'all' || chartView === 'cashback') && (
                            <Area 
                                type="monotone"
                                dataKey="cashback" 
                                stroke="#3b82f6"
                                fillOpacity={1}
                                fill="url(#colorCashback)"
                                strokeWidth={2.5}
                                dot={{ r: 3, fill: '#3b82f6' }}
                                activeDot={{ r: 6, stroke: '#3b82f6', fill: '#fff', strokeWidth: 2 }}
                                yAxisId="leftCurrency"
                            />
                        )}
                        {/* Effective Rate Area (for 'rate' view) */}
                        {chartView === 'rate' && (
                            <Area 
                                type="monotone"
                                dataKey="effectiveRate"
                                name="Effective Rate"
                                stroke="#10b981" // emerald-500
                                fillOpacity={1}
                                fill="url(#colorRate)"
                                strokeWidth={2.5}
                                dot={{ r: 3, fill: '#10b981' }}
                                activeDot={{ r: 6, stroke: '#10b981', fill: '#fff', strokeWidth: 2 }}
                                yAxisId="leftRate"
                            />
                        )}                    
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
});

CurrentCashflowChart.displayName = 'CurrentCashflowChart';

export default CurrentCashflowChart;