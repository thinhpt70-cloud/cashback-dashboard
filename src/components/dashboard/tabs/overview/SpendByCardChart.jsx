import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';

// This component now receives all its data and functions as props.
export default function SpendByCardChart({ spendData, currencyFn, cardColorMap }) {
  // The label function is kept inside the component as it's only used here.
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    if (percent < 0.05) return null; // Don't render labels for very small slices
    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-xs font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending by Card</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={spendData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              innerRadius={60}
              outerRadius={90}
              dataKey="value"
              nameKey="name"
              paddingAngle={3}
            >
              {spendData.map((entry) => (
                <Cell
                  key={`cell-${entry.name}`}
                  fill={cardColorMap.get(entry.name) || '#cccccc'}
                />
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