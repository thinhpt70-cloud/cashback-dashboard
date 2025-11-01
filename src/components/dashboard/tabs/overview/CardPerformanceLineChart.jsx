import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import { Button } from '../../../ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../ui/select'; // <-- Added Select component
import { cn } from '../../../../lib/utils';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
} from 'recharts';

// [Refactored] Tooltip to handle both "All Cards" and single-card views
function CustomLineChartTooltip({ active, payload, label, currencyFn, selectedCard, cardColorMap }) {
  if (active && payload?.length) {
    let cardName, cardColor, spend, cashback;

    if (selectedCard) {
      // Single card view
      cardName = selectedCard.name;
      cardColor = cardColorMap.get(cardName) || '#3b82f6';
      spend = payload.find((p) => p.dataKey.includes('Spend'))?.value;
      cashback = payload.find((p) => p.dataKey.includes('Cashback'))?.value;
    } else {
      // "All Cards" aggregate view
      cardName = 'All Cards';
      cardColor = '#3b82f6'; // Use primary spend color
      spend = payload.find((p) => p.dataKey === 'Total Spend')?.value;
      cashback = payload.find((p) => p.dataKey === 'Total Cashback')?.value;
    }

    return (
      <div className="rounded-lg border bg-white/90 backdrop-blur-sm p-3 text-xs shadow-lg">
        <p className="font-bold mb-2 text-sm">{label}</p>
        <div className="space-y-2">
          <div>
            <p className="font-semibold" style={{ color: cardColor }}>
              {cardName}
            </p>
            <div className="grid grid-cols-[1fr_auto] gap-x-4">
              {spend !== null && spend !== undefined && (
                <>
                  <span className="text-muted-foreground">Spend:</span>
                  <span className="font-medium text-right">{currencyFn(spend)}</span>
                </>
              )}
              {cashback !== null && cashback !== undefined && (
                <>
                  <span className="text-muted-foreground">Cashback:</span>
                  <span className="font-medium text-right">{currencyFn(cashback)}</span>
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

// [Refactored] Main component with dropdown and styling updates
export default function CardPerformanceLineChart({ data, cards, currencyFn, cardColorMap }) {
  const [view, setView] = useState('All');
  const [selectedCardId, setSelectedCardId] = useState('all'); // 'all' or a card.id

  // Get the currently selected card object
  const selectedCard = useMemo(
    () => cards.find((c) => c.id === selectedCardId),
    [cards, selectedCardId],
  );

  // Create aggregated data for "All Cards" view
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

  const chartData = selectedCardId === 'all' ? aggregatedData : data;

  // Colors for "All Cards" view
  const allCardsSpendColor = '#3b82f6'; // e.g., blue-600
  const allCardsCashbackColor = '#94a3b8'; // e.g., slate-400

  return (
    <Card>
      <CardHeader className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Card Performance Trend</CardTitle>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          {/* [New] Card Selector Dropdown */}
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
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 w-full sm:w-auto">
            <Button
              onClick={() => setView('All')}
              variant="ghost"
              size="sm"
              className={cn(
                'h-7 px-3 flex-1',
                view === 'All' && 'bg-white text-primary shadow-sm hover:bg-white',
              )}
            >
              All
            </Button>
            <Button
              onClick={() => setView('Spending')}
              variant="ghost"
              size="sm"
              className={cn(
                'h-7 px-3 flex-1',
                view === 'Spending' && 'bg-white text-primary shadow-sm hover:bg-white',
              )}
            >
              Spending
            </Button>
            <Button
              onClick={() => setView('Cashback')}
              variant="ghost"
              size="sm"
              className={cn(
                'h-7 px-3 flex-1',
                view === 'Cashback' && 'bg-white text-primary shadow-sm hover:bg-white',
              )}
            >
              Cashback
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="month"
              stroke="#888888"
              fontSize={12}
              tickLine={false} // [Updated]
              axisLine={false} // [Updated]
            />
            <YAxis
              yAxisId="left"
              domain={[0, 'auto']}
              stroke="#888888"
              fontSize={12}
              tickLine={false} // [Updated]
              axisLine={false} // [Updated]
              tickFormatter={
                view === 'Cashback'
                  ? (v) => `${(v / 1000).toFixed(0)}k`
                  : (v) => `${(v / 1000000).toFixed(0)}M`
              }
            />
            {view === 'All' && (
              <YAxis
                yAxisId="right"
                domain={[0, 'auto']}
                orientation="right"
                stroke="#888888"
                fontSize={12}
                tickLine={false} // [Updated]
                axisLine={false} // [Updated]
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
            )}
            <RechartsTooltip
              content={
                <CustomLineChartTooltip
                  currencyFn={currencyFn}
                  selectedCard={selectedCard}
                  cardColorMap={cardColorMap}
                />
              }
            />

            {/* [Refactored] Line Rendering Logic */}
            {selectedCardId === 'all' ? (
              // "All Cards" View
              <React.Fragment>
                {(view === 'All' || view === 'Spending') && (
                  <Line
                    type="monotone" // [Updated]
                    connectNulls
                    dataKey="Total Spend"
                    stroke={allCardsSpendColor}
                    strokeWidth={2}
                    yAxisId="left"
                    dot={false} // [Updated]
                    activeDot={{ r: 6 }}
                  />
                )}
                {(view === 'All' || view === 'Cashback') && (
                  <Line
                    type="monotone" // [Updated]
                    connectNulls
                    dataKey="Total Cashback"
                    stroke={allCardsCashbackColor}
                    strokeWidth={2}
                    // [Updated] Removed strokeDasharray
                    yAxisId={view === 'All' ? 'right' : 'left'}
                    dot={false} // [Updated]
                    activeDot={{ r: 6 }}
                  />
                )}
              </React.Fragment>
            ) : (
              // Single Card View
              <React.Fragment>
                {(view === 'All' || view === 'Spending') && (
                  <Line
                    type="monotone" // [Updated]
                    connectNulls
                    dataKey={`${selectedCard.name} Spend`}
                    stroke={cardColorMap.get(selectedCard.name) || '#cccccc'}
                    strokeWidth={2}
                    yAxisId="left"
                    dot={false} // [Updated]
                    activeDot={{ r: 6 }}
                  />
                )}
                {(view === 'All' || view === 'Cashback') && (
                  <Line
                    type="monotone" // [Updated]
                    connectNulls
                    dataKey={`${selectedCard.name} Cashback`}
                    stroke={cardColorMap.get(selectedCard.name) || '#cccccc'}
                    strokeOpacity={0.6} // [Updated] Use opacity instead of dash
                    strokeWidth={2}
                    yAxisId={view === 'All' ? 'right' : 'left'}
                    dot={false} // [Updated]
                    activeDot={{ r: 6 }}
                  />
                )}
              </React.Fragment>
            )}
          </LineChart>
        </ResponsiveContainer>

        {/* [Refactored] Dynamic Legend */}
        <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs">
          {selectedCardId === 'all' ? (
            // "All Cards" Legend
            <>
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2 w-4 rounded-sm"
                  style={{ backgroundColor: allCardsSpendColor }}
                />
                <span>Total Spend</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2 w-4 rounded-sm"
                  style={{ backgroundColor: allCardsCashbackColor }}
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
                  style={{ backgroundColor: cardColorMap.get(selectedCard.name) || '#cccccc' }}
                />
                <span>Spend</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2 w-4 rounded-sm"
                  style={{
                    backgroundColor: cardColorMap.get(selectedCard.name) || '#cccccc',
                    opacity: 0.6,
                  }}
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