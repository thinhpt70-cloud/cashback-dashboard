import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const spendColor = '#f59e0b'; // amber-500
const cashbackColor = '#3b82f6'; // blue-600

const CustomTooltip = ({ active, payload, label, currencyFn }) => {
  if (active && payload?.length) {
    const spend = payload.find(p => p.dataKey === 'spend')?.value;
    const cashback = payload.find(p => p.dataKey === 'cashback')?.value;

    return (
      <div className="rounded-lg bg-gray-900 p-3 text-sm shadow-xl transition-all">
        <p className="font-bold text-white mb-2">{label}</p>
        <div className="space-y-1">
            {spend !== undefined && (
                <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Spend:</span>
                    <span className="font-medium text-right" style={{ color: spendColor }}>
                        {currencyFn(spend)}
                    </span>
                </div>
            )}
            {cashback !== undefined && (
                <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Cashback:</span>
                    <span className="font-medium text-right" style={{ color: cashbackColor }}>
                        {currencyFn(cashback)}
                    </span>
                </div>
            )}
        </div>
      </div>
    );
  }
  return null;
};

export default function CombinedCardStatsChart({ data, currencyFn, isLiveView, period, onPeriodChange }) {

  // Sort data by spend (highest to lowest) for better readability
  const sortedData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return [...data].sort((a, b) => b.spend - a.spend);
  }, [data]);

  // Dynamic height based on number of cards to ensure bars don't squish on mobile
  const chartHeight = Math.max(300, sortedData.length * 60 + 80);

  return (
    <Card className="flex flex-col w-full overflow-hidden">
      <CardHeader className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between pb-2">
        <CardTitle>Spending & Cashback</CardTitle>
        {isLiveView && (
            <Select value={period} onValueChange={onPeriodChange}>
                <SelectTrigger className="w-1/2 sm:w-[120px] h-8 text-xs">
                    <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="12M">12M</SelectItem>
                    <SelectItem value="6M">6M</SelectItem>
                    <SelectItem value="1M">1M</SelectItem>
                    <SelectItem value="LM">LM</SelectItem>
                    <SelectItem value="1W">1W</SelectItem>
                </SelectContent>
            </Select>
        )}
      </CardHeader>
      <CardContent className="px-0 sm:px-6 grow">
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={sortedData}
            layout="vertical" // Horizontal bars
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            barGap={2}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />

            <YAxis
              type="category"
              dataKey="name"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={90}
              tickFormatter={(label) => label.length > 12 ? `${label.substring(0, 11)}...` : label}
            />

            {/* X Axis for Spend (Top) */}
            <XAxis
              xAxisId="spend"
              type="number"
              orientation="top"
              stroke={spendColor}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
            />

            {/* X Axis for Cashback (Bottom) */}
            <XAxis
              xAxisId="cashback"
              type="number"
              orientation="bottom"
              stroke={cashbackColor}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />

            <RechartsTooltip
              content={<CustomTooltip currencyFn={currencyFn} />}
              cursor={{ fill: 'rgba(0,0,0,0.05)' }}
            />

            <Legend
              verticalAlign="top"
              align="center"
              wrapperStyle={{ paddingBottom: '20px' }}
              iconType="circle"
              formatter={(value) => <span className="capitalize text-muted-foreground text-xs ml-1 font-medium">{value}</span>}
            />

            <Bar
              xAxisId="spend"
              dataKey="spend"
              name="Spend"
              fill={spendColor}
              radius={[0, 4, 4, 0]}
              barSize={16}
            />
            <Bar
              xAxisId="cashback"
              dataKey="cashback"
              name="Cashback"
              fill={cashbackColor}
              radius={[0, 4, 4, 0]}
              barSize={16}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
