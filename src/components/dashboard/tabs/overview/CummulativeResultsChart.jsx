// src/components/dashboard/tabs/overview/CummulativeResultsChart.jsx

import React, { useState, useMemo } from 'react';
import {
    ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip,
    AreaChart, Area, CartesianGrid, Legend
} from 'recharts';
import {
    Card, CardContent, CardHeader, CardTitle
} from "../../../ui/card";
import { ChevronsUpDown } from 'lucide-react';

const CustomRechartsTooltip = ({ active, payload, label }) => {
    const currency = (n) => (n || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

    if (active && payload?.length) {
        const spendEntry = payload.find(p => p.dataKey === 'spend');
        const cashbackEntry = payload.find(p => p.dataKey === 'cashback');

        return (
            <div className="rounded-lg bg-background/80 backdrop-blur-sm p-3 text-sm shadow-xl transition-all">
                <p className="font-bold text-foreground mb-2">{label}</p>
                {payload.map((p, i) => (
                    <p key={i} style={{ color: p.color }} className="font-medium flex justify-between items-center gap-4">
                        <span className="capitalize">{p.name}:</span>
                        <span className="font-bold">{currency(p.value)}</span>
                    </p>
                ))}

                {(spendEntry && cashbackEntry) && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                        <p className="font-semibold text-foreground flex justify-between items-center">
                            <span>Effective Rate:</span>
                            <span className="font-bold">{((cashbackEntry.value / spendEntry.value) * 100).toFixed(2)}%</span>
                        </p>
                    </div>
                )}
            </div>
        );
    }
    return null;
};

export default function CummulativeResultsChart({ data }) {
    const [chartView, setChartView] = useState("all");

    const chartData = useMemo(() => {
        return data.map(item => ({
            ...item,
            effectiveRate: item.spend > 0 ? (item.cashback / item.spend) : 0
        }));
    }, [data]);

    return (
        <Card className="flex flex-col min-h-[350px]">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Cummulative Results</CardTitle>

                <div className="relative w-40">
                    <select
                        value={chartView}
                        onChange={(e) => setChartView(e.target.value)}
                        className="block w-full h-10 text-sm rounded-md border border-input bg-transparent px-3 py-1 shadow-sm focus:outline-none focus:ring-1 focus:ring-ring appearance-none"
                    >
                        <option value="all">All</option>
                        <option value="spend">Spending</option>
                        <option value="cashback">Cashback</option>
                    </select>
                    <ChevronsUpDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 shrink-0 opacity-50" />
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
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
                        </defs>

                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="hsl(var(--border))"
                        />
                        <XAxis
                            dataKey="month"
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            dy={5}
                        />

                        <YAxis
                            yAxisId="leftCurrency"
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`}
                            dx={-5}
                        />

                        <RechartsTooltip content={<CustomRechartsTooltip />} />

                        <Legend
                            verticalAlign="top"
                            align="right"
                            iconType="circle"
                            iconSize={10}
                            wrapperStyle={{ top: -10, right: 10 }}
                            payload={[
                                { value: 'Total Spend', type: 'line', color: '#f59e0b' },
                                { value: 'Total Cashback', type: 'line', color: '#3b82f6' },
                            ]}
                            formatter={(value) => (
                                <span className="capitalize text-muted-foreground font-medium ml-1">
                                    {value}
                                </span>
                            )}
                        />

                        {(chartView === 'all' || chartView === 'spend') && (
                            <Area
                                type="monotone"
                                dataKey="spend"
                                name="Total Spend"
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
                                name="Total Cashback"
                                stroke="#3b82f6"
                                fillOpacity={1}
                                fill="url(#colorCashback)"
                                strokeWidth={2.5}
                                dot={{ r: 3, fill: '#3b82f6' }}
                                activeDot={{ r: 6, stroke: '#3b82f6', fill: '#fff', strokeWidth: 2 }}
                                yAxisId="leftCurrency"
                            />
                        )}
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}