// src/components/dashboard/tabs/overview/CashbackByCardChart.jsx

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';

const CustomTooltip = ({ active, payload, label, currencyFn }) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-lg bg-gray-900 p-3 text-sm shadow-xl transition-all">
        <p className="font-bold text-white mb-1">{label}</p>
        <p className="text-white flex justify-between items-center gap-4">
          <span>Cashback:</span>
          <span className="font-bold" style={{ color: payload[0].fill }}>
            {currencyFn(payload[0].value)}
          </span>
        </p>
      </div>
    );
  }
  return null;
};

export default function CashbackByCardChart({ cashbackData, currencyFn, cardColorMap }) {
  
  const sortedData = useMemo(() => {
    if (!Array.isArray(cashbackData)) {
      return [];
    }
    return [...cashbackData].sort((a, b) => b.value - a.value);
  }, [cashbackData]);

  const chartHeight = Math.max(250, sortedData.length * 40 + 50);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cashback by Card</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={sortedData}
            layout="vertical"
            margin={{
              top: 5,
              right: 30,
              left: 30,
              bottom: 5,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              stroke="#e5e7eb"
            />
            <XAxis
              type="number"
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={80} 
              dx={-5}
              tickFormatter={(label) => label.length > 10 ? `${label.substring(0, 9)}...` : label
              }
            />
            <RechartsTooltip
              content={<CustomTooltip currencyFn={currencyFn} />}
              cursor={{ fill: 'transparent' }}
            />
            <Bar
              dataKey="value"
              radius={[0, 4, 4, 0]}
              barSize={20}
            >
              {sortedData.map((entry) => (
                <Cell
                  key={`cell-${entry.name}`}
                  fill={cardColorMap.get(entry.name) || '#cccccc'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}