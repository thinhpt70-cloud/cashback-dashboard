// src/components/dashboard/tabs/overview/CashbackByCardChart.jsx

import React from 'react';
import {
    ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend
} from 'recharts';
import {
    Card, CardContent, CardHeader, CardTitle
} from "../../../ui/card";

export default function CashbackByCardChart({ cashbackData, currencyFn, cardColorMap }) {
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
