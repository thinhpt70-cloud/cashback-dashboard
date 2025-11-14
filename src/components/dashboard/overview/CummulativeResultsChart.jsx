import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ResponsiveContainer,
  AreaChart, // [Updated]
  Area, // [Updated]
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
} from 'recharts';

/**
 * [Updated] Custom Tooltip
 * - Removed cardColorMap dependency
 * - Colors the spend/cashback values instead of the card name
 */
function CustomLineChartTooltip({ active, payload, label, currencyFn, selectedCard }) {
  // Static colors to match the chart
  const spendColor = '#f59e0b';
  const cashbackColor = '#3b82f6';

  if (active && payload?.length) {
    let cardName, spend, cashback;

    if (selectedCard) {
      // Single card view
      cardName = selectedCard.name;
      spend = payload.find((p) => p.dataKey.includes('Spend'))?.value;
      cashback = payload.find((p) => p.dataKey.includes('Cashback'))?.value;
    } else {
      // "All Cards" aggregate view
      cardName = 'All Cards';
      spend = payload.find((p) => p.dataKey === 'Total Spend')?.value;
      cashback = payload.find((p) => p.dataKey === 'Total Cashback')?.value;
    }

    return (
      <div className="rounded-lg bg-gray-900 p-3 text-sm shadow-xl transition-all">
        <p className="font-bold text-white mb-2">{label}</p>
        <div className="space-y-2">
          <div>
            <p className="font-semibold mb-1 text-white">
              {cardName}
            </p>
            <div className="grid grid-cols-[1fr_auto] gap-x-4">
              {spend !== null && spend !== undefined && (
                <>
                  <span className="text-white flex justify-between items-center">Spend:</span>
                  <span className="font-medium text-right" style={{ color: spendColor }}>
                    {currencyFn(spend)}
                  </span>
                </>
              )}
              {cashback !== null && cashback !== undefined && (
                <>
                  <span className="text-muted-foreground">Cashback:</span>
                  <span className="font-medium text-right" style={{ color: cashbackColor }}>
                    {currencyFn(cashback)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

// [Updated] Main component - removed cardColorMap
export default function CummulativeResultsChart({ data, cards, currencyFn }) {
  const [view, setView] = useState('All');
  const [selectedCardId, setSelectedCardId] = useState('all'); // 'all' or a card.id

  // [New] Standardized colors
  const spendColor = '#f59e0b'; // amber-500
  const cashbackColor = '#3b82f6'; // blue-600

  // Get the currently selected card object
  const selectedCard = useMemo(
    () => cards.find((c) => c.id === selectedCardId),
    [cards, selectedCardId],
  );

  // [Original] Create aggregated *monthly* data for "All Cards" view
  const aggregatedData = useMemo(() => {
    return data.map((monthData) => {
      const totalSpend = cards.reduce(
        (acc, card) => acc + (monthData[`${card.name} Spend`] || 0),
        0,
      );
      const totalCashback = cards.reduce(
        (acc, card) => acc + (monthData[`${card.name} Cashback`] || 0),
        0,
      );
      return {
        ...monthData,
        'Total Spend': totalSpend,
        'Total Cashback': totalCashback,
      };
    });
  }, [data, cards]);

  // [New] Create *cumulative* aggregated data for "All Cards" view
  const cumulativeAggregatedData = useMemo(() => {
    let runningSpend = 0;
    let runningCashback = 0;
    return aggregatedData.map((monthData) => {
      runningSpend += monthData['Total Spend'] || 0;
      runningCashback += monthData['Total Cashback'] || 0;
      return {
        ...monthData,
        'Total Spend': runningSpend,
        'Total Cashback': runningCashback,
      };
    });
  }, [aggregatedData]);

  // [New] Create *cumulative* data for single-card views
  const cumulativeData = useMemo(() => {
    // Initialize running totals for all card metrics
    const runningTotals = {};
    cards.forEach((card) => {
      runningTotals[`${card.name} Spend`] = 0;
      runningTotals[`${card.name} Cashback`] = 0;
    });

    return data.map((monthData) => {
      const cumulativeMonth = { ...monthData }; // Start with month label

      // Iterate over all possible keys and update running totals
      for (const key in runningTotals) {
        if (monthData[key]) {
          runningTotals[key] += monthData[key];
        }
        cumulativeMonth[key] = runningTotals[key];
      }
      return cumulativeMonth;
    });
  }, [data, cards]);

  // [Updated] Select the correct cumulative data based on the dropdown
  const chartData = selectedCardId === 'all' ? cumulativeAggregatedData : cumulativeData;

  return (
    <Card>
      <CardHeader className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Cummulative Results</CardTitle>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          {/* Card Selector Dropdown */}
          <Select value={selectedCardId} onValueChange={setSelectedCardId}>
            <SelectTrigger className="w-full sm:w-[180px]">
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

          {/* View Toggle (All / Spending / Cashback) */}
          <Select value={view} onValueChange={setView}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Select a view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Spending">Spending</SelectItem>
              <SelectItem value="Cashback">Cashback</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
            {/* [New] Gradient definitions */}
            <defs>
              <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={spendColor} stopOpacity={0.4} />
                <stop offset="95%" stopColor={spendColor} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorCashback" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={cashbackColor} stopOpacity={0.4} />
                <stop offset="95%" stopColor={cashbackColor} stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="month"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="left"
              domain={[0, 'auto']}
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={
                view === 'Cashback'
                  ? (v) => `${(v / 1000).toFixed(0)}k`
                  : (v) => `${(v / 1000000).toFixed(0)}M`
              }
            />
            <RechartsTooltip
              content={
                // [Updated] Removed cardColorMap
                <CustomLineChartTooltip
                  currencyFn={currencyFn}
                  selectedCard={selectedCard}
                />
              }
            />

            {/* [Updated] Area Rendering Logic */}
            {selectedCardId === 'all' ? (
              // "All Cards" View
              <React.Fragment>
                {(view === 'All' || view === 'Spending') && (
                  <Area
                    type="monotone"
                    connectNulls
                    dataKey="Total Spend"
                    stroke={spendColor}
                    fill="url(#colorSpend)" // [Updated]
                    fillOpacity={1} // [Updated]
                    strokeWidth={2}
                    yAxisId="left"
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                )}
                {(view === 'All' || view === 'Cashback') && (
                  <Area
                    type="monotone"
                    connectNulls
                    dataKey="Total Cashback"
                    stroke={cashbackColor}
                    fill="url(#colorCashback)" // [Updated]
                    fillOpacity={1} // [Updated]
                    strokeWidth={2}
                    yAxisId="left"
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                )}
              </React.Fragment>
            ) : (
              // Single Card View
              <React.Fragment>
                {(view === 'All' || view === 'Spending') && (
                  <Area
                    type="monotone"
                    connectNulls
                    dataKey={`${selectedCard.name} Spend`}
                    stroke={spendColor}
                    fill="url(#colorSpend)" // [Updated]
                    fillOpacity={1} // [Updated]
                    strokeWidth={2}
                    yAxisId="left"
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                )}
                {(view === 'All' || view === 'Cashback') && (
                  <Area
                    type="monotone"
                    connectNulls
                    dataKey={`${selectedCard.name} Cashback`}
                    stroke={cashbackColor}
                    fill="url(#colorCashback)" // [Updated]
                    fillOpacity={1} // [Updated]
                    strokeWidth={2}
                    yAxisId="left"
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                )}
              </React.Fragment>
            )}
          </AreaChart>
        </ResponsiveContainer>

        {/* [Updated] Dynamic Legend */}
        <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs">
          {selectedCardId === 'all' ? (
            // "All Cards" Legend
            <>
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2 w-4 rounded-sm"
                  style={{ backgroundColor: spendColor }} // [Updated]
                />
                <span>Total Spend</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2 w-4 rounded-sm"
                  style={{ backgroundColor: cashbackColor }} // [Updated]
                />
                <span>Total Cashback</span>
              </div>
            </>
          ) : (
            // Single Card Legend
            <>
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2 w-4 rounded-sm"
                  style={{ backgroundColor: spendColor }} // [Updated]
                />
                <span>Spend</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2 w-4 rounded-sm"
                  style={{ backgroundColor: cashbackColor }} // [Updated]
                />
                <span>Cashback</span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}