// src/components/dashboard/tabs/overview/SpendVsCashbackTrendChart.jsx

import React from 'react';
import {
    ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip,
    LineChart, Line, CartesianGrid, Legend
} from 'recharts';
import {
    Card, CardContent, CardHeader, CardTitle
} from "../../../ui/card"; // Adjust path if needed

/**
 * Custom Tooltip Component
 * This is co-located here as it's only used by the SpendVsCashbackTrendChart.
 */
const CustomRechartsTooltip = ({ active, payload, label }) => {
    // Defines its own currency formatter, so it's self-contained.
    const currency = (n) => (n || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
    
    if (active && payload?.length) {
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
                <div className="mt-2 pt-2 border-t border-gray-600">
                    <p className="font-semibold text-white flex justify-between items-center">
                        <span>Effective Rate:</span>
                        <span className="font-bold">{effectiveRate.toFixed(2)}%</span>
                    </p>
                </div>
            </div>
        );
    }
    return null;
};


/**
 * Main Chart Component
 */
export default function SpendVsCashbackTrendChart({ data }) {
    return (
        <Card className="flex flex-col min-h-[350px]">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Spend vs Cashback Trend</CardTitle>
            </CardHeader>
            <CardContent className="pl-2 flex-grow">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
                        <YAxis 
                            stroke="#64748b"
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
                            formatter={(value) => (
                                <span className="capitalize text-muted-foreground font-medium ml-1">
                                    {value}
                                </span>
                            )}
                        />
                        <Line 
                            type="monotone"
                            dataKey="spend" 
                            stroke="#f59e0b"
                            strokeWidth={2.5}
                            dot={{ r: 3, fill: '#f59e0b' }}
                            activeDot={{ r: 6, stroke: '#f59e0b', fill: '#fff', strokeWidth: 2 }}
                        />
                        <Line 
                            type="monotone"
                            dataKey="cashback" 
                            stroke="#3b82f6"
                            strokeWidth={2.5}
                            dot={{ r: 3, fill: '#3b82f6' }}
                            activeDot={{ r: 6, stroke: '#3b82f6', fill: '#fff', strokeWidth: 2 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}