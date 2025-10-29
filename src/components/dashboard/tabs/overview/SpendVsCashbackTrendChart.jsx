// src/components/dashboard/tabs/overview/SpendVsCashbackTrendChart.jsx

import React, { useState, useMemo } from 'react';
import {
    ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip,
    AreaChart, Area, CartesianGrid, Legend
} from 'recharts';
import {
    Card, CardContent, CardHeader, CardTitle
} from "../../../ui/card"; // Assumes path from original setup
import { Button } from "../../../ui/button";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup,
    DropdownMenuRadioItem, DropdownMenuTrigger
} from "../../../ui/dropdown-menu";
import { ChevronsUpDown } from 'lucide-react'; // For the dropdown button

/**
 * Custom Tooltip Component
 * Updated to handle both currency (All/Spend/Cashback) and percentage (Rate) views.
 */
const CustomRechartsTooltip = ({ active, payload, label, isRateView }) => {
    // Defines its own currency formatter, so it's self-contained.
    const currency = (n) => (n || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
    
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

        // --- Standard View (Spend/Cashback) ---
        const spendEntry = payload.find(p => p.dataKey === 'spend');
        const cashbackEntry = payload.find(p => p.dataKey === 'cashback');
        
        const spend = spendEntry ? spendEntry.value : 0;
        const cashback = cashbackEntry ? cashbackEntry.value : 0;
        const effectiveRate = spend > 0 ? (cashback / spend) * 100 : 0;

        return (
            <div className="rounded-lg bg-gray-900 p-3 text-sm shadow-xl transition-all">
                <p className="font-bold text-white mb-2">{label}</p>
                {payload.map((p, i) => (
                    <p key={i} style={{ color: p.color }} className="font-medium flex justify-between items-center gap-4">
                        <span className="capitalize">{p.name}:</span>
                        <span className="font-bold">{currency(p.value)}</span>
                    </p>
                ))}
                {/* Only show rate in tooltip if both are visible */}
                {spendEntry && cashbackEntry && (
                    <div className="mt-2 pt-2 border-t border-gray-600">
                        <p className="font-semibold text-white flex justify-between items-center">
                            <span>Effective Rate:</span>
                            <span className="font-bold">{effectiveRate.toFixed(2)}%</span>
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
export default function SpendVsCashbackTrendChart({ data }) {
    const [chartView, setChartView] = useState("all"); // "all", "spend", "cashback", "rate"
    
    // 1. Calculate effective rate for the chart data
    const chartData = useMemo(() => {
        return data.map(item => ({
            ...item,
            // Calculate rate as a decimal (e.g., 0.05 for 5%)
            effectiveRate: item.spend > 0 ? (item.cashback / item.spend) : 0
        }));
    }, [data]);
    
    // 2. Labels for the dropdown
    const viewLabels = {
        all: "All",
        spend: "Spending",
        cashback: "Cashback",
        rate: "Effective Rate"
    };

    const isRateView = chartView === 'rate';

    return (
        <Card className="flex flex-col min-h-[350px]">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Spend vs Cashback Trend</CardTitle>
                
                {/* 3. Add Dropdown Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-[160px] justify-between">
                            {viewLabels[chartView]}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[160px]">
                        <DropdownMenuRadioGroup value={chartView} onValueChange={setChartView}>
                            <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="spend">Spending</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="cashback">Cashback</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="rate">Effective Rate</DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent className="pl-2 flex-grow">
                <ResponsiveContainer width="100%" height="100%">
                    {/* 4. Swapped LineChart for AreaChart */}
                    <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        
                        {/* 5. Define Gradients for fill */}
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
                        
                        {/* 6. Conditional Y-Axes */}
                        {!isRateView && (
                            <YAxis 
                                yAxisId="left"
                                stroke="#64748b"
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false} 
                                tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`} 
                                dx={-5}
                            />
                        )}
                        {isRateView && (
                            <YAxis 
                                yAxisId="right"
                                orientation="right" // Place on the right side
                                stroke="#64748b"
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false} 
                                // Format decimal as percentage
                                tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} 
                                dx={5}
                                domain={[0, 'auto']} // Start at 0%
                            />
                        )}

                        <RechartsTooltip content={<CustomRechartsTooltip isRateView={isRateView} />} />
                        
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
                        
                        {/* 7. Conditional Area components */}
                        {(chartView === 'all' || chartView === 'spend') && (
                            <Area 
                                type="monotone"
                                dataKey="spend" 
                                stroke="#f59e0b"
                                fillOpacity={1}
                                fill="url(#colorSpend)" // Use gradient fill
                                strokeWidth={2.5}
                                dot={{ r: 3, fill: '#f59e0b' }}
                                activeDot={{ r: 6, stroke: '#f59e0b', fill: '#fff', strokeWidth: 2 }}
                                yAxisId="left" // Assign to left axis
                            />
                        )}
                        {(chartView === 'all' || chartView === 'cashback') && (
                            <Area 
                                type="monotone"
                                dataKey="cashback" 
                                stroke="#3b82f6"
                                fillOpacity={1}
                                fill="url(#colorCashback)" // Use gradient fill
                                strokeWidth={2.5}
                                dot={{ r: 3, fill: '#3b82f6' }}
                                activeDot={{ r: 6, stroke: '#3b82f6', fill: '#fff', strokeWidth: 2 }}
                                yAxisId="left" // Assign to left axis
                            />
                        )}
                        {chartView === 'rate' && (
                            <Area 
                                type="monotone"
                                dataKey="effectiveRate" 
                                name="Effective Rate" // Set name for Legend/Tooltip
                                stroke="#10b981" // emerald-500
                                fillOpacity={1}
                                fill="url(#colorRate)" // Use gradient fill
                                strokeWidth={2.5}
                                dot={{ r: 3, fill: '#10b981' }}
                                activeDot={{ r: 6, stroke: '#10b981', fill: '#fff', strokeWidth: 2 }}
                                yAxisId="right" // Assign to right axis
                            />
                        )}
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}