import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import { Button } from '../../../ui/button';
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

/**
 * [Refactored] A simpler tooltip that only needs to display
 * spend/cashback for a single card.
 */
function CustomLineChartTooltip({ active, payload, label, currencyFn, cardName, cardColor }) {
  if (active && payload?.length) {
    const spendEntry = payload.find((p) => p.dataKey.includes('Spend'));
    const cashbackEntry = payload.find((p) => p.dataKey.includes('Cashback'));

    return (
      <div className="rounded-lg border bg-white/90 backdrop-blur-sm p-3 text-xs shadow-lg">
        <p className="font-bold mb-2 text-sm">{label}</p>
        <div className="space-y-2">
          <div>
            <p className="font-semibold" style={{ color: cardColor }}>
              {cardName}
            </p>
            <div className="grid grid-cols-[1fr_auto] gap-x-4">
              {spendEntry && spendEntry.value !== null && (
                <>
                  <span className="text-muted-foreground">Spend:</span>
                  <span className="font-medium text-right">{currencyFn(spendEntry.value)}</span>
                </>
              )}
              {cashbackEntry && cashbackEntry.value !== null && (
                <>
                  <span className="text-muted-foreground">Cashback:</span>
                  <span className="font-medium text-right">{currencyFn(cashbackEntry.value)}</span>
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

// Custom dot for the cashback line
const SquareDot = (props) => {
  const { cx, cy, stroke, value } = props;
  const size = 7;
  if (value === null || value === undefined) return null;
  return <rect x={cx - size / 2} y={cy - size / 2} width={size} height={size} fill={stroke} />;
};

/**
 * [New Component]
 * This component renders an individual Card for each card's performance trend,
 * similar to how SingleCapCard works in the other file.
 */
function SingleCardLineChart({ card, data, currencyFn, cardColor }) {
  const [view, setView] = useState('All');
  const cardName = card.name;
  const color = cardColor || '#cccccc';

  return (
    <Card>
      <CardHeader className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Card Title with Color Legend */}
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
          <CardTitle className="text-lg">{cardName}</CardTitle>
        </div>

        {/* View Toggles (All, Spending, Cashback) */}
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
          <Button
            onClick={() => setView('All')}
            variant="ghost"
            size="sm"
            className={cn('h-7 px-3', view === 'All' && 'bg-white text-primary shadow-sm hover:bg-white')}
          >
            All
          </Button>
          <Button
            onClick={() => setView('Spending')}
            variant="ghost"
            size="sm"
            className={cn('h-7 px-3', view === 'Spending' && 'bg-white text-primary shadow-sm hover:bg-white')}
          >
            Spending
          </Button>
          <Button
            onClick={() => setView('Cashback')}
            variant="ghost"
            size="sm"
            className={cn('h-7 px-3', view === 'Cashback' && 'bg-white text-primary shadow-sm hover:bg-white')}
          >
            Cashback
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            {/* Left Y-Axis (defaults to Spend) */}
            <YAxis
              yAxisId="left"
              domain={[0, 'auto']}
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={
                view === 'Cashback'
                  ? (v) => `${(v / 1000).toFixed(0)}k` // Show 'k' if only cashback
                  : (v) => `${(v / 1000000).toFixed(0)}M` // Show 'M' for spend
              }
            />
            {/* Right Y-Axis (for Cashback when 'All' is selected) */}
            {view === 'All' && (
              <YAxis
                yAxisId="right"
                domain={[0, 'auto']}
                orientation="right"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
            )}
            <RechartsTooltip
              content={<CustomLineChartTooltip currencyFn={currencyFn} cardName={cardName} cardColor={color} />}
            />

            {/* Spend Line */}
            {(view === 'All' || view === 'Spending') && (
              <Line
                type="linear"
                connectNulls
                dataKey={`${cardName} Spend`}
                stroke={color}
                strokeWidth={2}
                yAxisId="left"
                activeDot={{ r: 6 }}
                dot={{ r: 4 }}
              />
            )}
            {/* Cashback Line */}
            {(view === 'All' || view === 'Cashback') && (
              <Line
                type="linear"
                connectNulls
                dataKey={`${cardName} Cashback`}
                stroke={color}
                strokeWidth={2}
                strokeDasharray="5 5"
                yAxisId={view === 'All' ? 'right' : 'left'} // Use right axis in 'All' view, left otherwise
                activeDot={{ r: 6 }}
                dot={<SquareDot />}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

/**
 * [Refactored] This is the main component.
 * It now acts as a list container, similar to CardSpendsCap.
 */
export default function CardPerformanceLineChart({ data, cards, currencyFn, cardColorMap }) {
  return (
    // This div replaces the original outer <Card>
    <div>
      {/* This h3 replaces the original <CardTitle> */}
      <h3 className="text-lg font-semibold mb-4 px-1">Card Performance Trend</h3>

      {/* This div replaces the original <CardContent> */}
      <div>
        {cards.length > 0 ? (
          <div className="space-y-4"> {/* This stacks the new <SingleCardLineChart> components */}
            {cards.map((card) => (
              <SingleCardLineChart
                key={card.id}
                card={card}
                data={data}
                currencyFn={currencyFn}
                cardColor={cardColorMap.get(card.name)}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6"> {/* Add pt-6 to match default CardContent padding */}
              <p className="text-sm text-muted-foreground text-center py-4">
                No card performance data available.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}