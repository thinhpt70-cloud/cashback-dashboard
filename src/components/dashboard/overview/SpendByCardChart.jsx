// src/components/dashboard/tabs/overview/SpendByCardChart.jsx

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell, // We still use Cell to color each bar
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';

/**
 * NEW: Custom Tooltip (dark theme)
 * This is self-contained and uses the currencyFn prop.
 */
const CustomTooltip = ({ active, payload, label, currencyFn }) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-lg bg-gray-900 p-3 text-sm shadow-xl transition-all">
        <p className="font-bold text-white mb-1">{label}</p>
        <p className="text-white flex justify-between items-center gap-4">
          <span>Spend:</span>
          {/* Use the bar's color in the tooltip */}
          <span className="font-bold" style={{ color: payload[0].fill }}>
            {currencyFn(payload[0].value)}
          </span>
        </p>
      </div>
    );
  }
  return null;
};

export default function SpendByCardChart({ spendData, currencyFn, cardColorMap }) {
  
  // Sort data from highest to lowest spend for better readability
  const sortedData = useMemo(() => {
    // FIX: Check if spendData is an array. If not, use an empty array.
    if (!Array.isArray(spendData)) {
      return [];
    }
    // If it is an array, proceed as normal
    return [...spendData].sort((a, b) => b.value - a.value);
  }, [spendData]);

  // We'll set a min-height for the container to give the bars room
  // 40px per bar + 50px for chrome = a good starting point
  const chartHeight = Math.max(250, sortedData.length * 40 + 50);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending by Card</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Set a dynamic height based on the number of cards */}
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={sortedData}
            layout="vertical" // This makes it a horizontal bar chart
            margin={{
              top: 5,
              right: 30,  // Margin for value labels
              left: 30,   // Increased margin for card names
              bottom: 5,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false} // We want vertical grid lines
              stroke="#e5e7eb"
            />
            <XAxis
              type="number"
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              // Format ticks as millions (e.g., "5M")
              tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
            />
            <YAxis
              type="category"
              dataKey="name" // The card name
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={120} // Give ample space for long card names
              dx={-5}
              // Truncate long labels if needed (optional)
              // tickFormatter={(label) => label.length > 15 ? `${label.substring(0, 15)}...` : label}
            />
            <RechartsTooltip
              // Pass currencyFn to the custom tooltip
              content={<CustomTooltip currencyFn={currencyFn} />}
              cursor={{ fill: 'transparent' }} // Hide the hover background
            />
            {/* The Legend is removed as the Y-Axis labels serve this purpose */}
            <Bar
              dataKey="value"
              radius={[0, 4, 4, 0]} // Rounded end for the bars
              barSize={20} // Set a consistent bar thickness
            >
              {/* Map colors to each bar using Cell */}
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