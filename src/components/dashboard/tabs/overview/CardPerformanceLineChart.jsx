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

// Co-locating the custom tooltip component here is a good practice.
function CustomLineChartTooltip({ active, payload, label, currencyFn, cards }) {
  if (active && payload?.length) {
    // Group payload items by card name
    const dataByCard = payload.reduce((acc, entry) => {
      const cardName = cards.find((c) => entry.dataKey.startsWith(c.name))?.name;
      if (!cardName) return acc;

      const type = entry.dataKey.includes('Spend') ? 'spend' : 'cashback';

      if (!acc[cardName]) {
        acc[cardName] = { color: entry.stroke, name: cardName };
      }
      acc[cardName][type] = entry.value;

      return acc;
    }, {});

    return (
      <div className="rounded-lg border bg-white/90 backdrop-blur-sm p-3 text-xs shadow-lg">
        <p className="font-bold mb-2 text-sm">{label}</p>
        <div className="space-y-2">
          {Object.values(dataByCard).map((cardData) => (
            <div key={cardData.name}>
              <p className="font-semibold" style={{ color: cardData.color }}>
                {cardData.name}
              </p>
              <div className="grid grid-cols-[1fr_auto] gap-x-4">
                <span className="text-muted-foreground">Spend:</span>
                <span className="font-medium text-right">{currencyFn(cardData.spend)}</span>
                <span className="text-muted-foreground">Cashback:</span>
                <span className="font-medium text-right">{currencyFn(cardData.cashback)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

// This is the main component for this file.
export default function CardPerformanceLineChart({ data, cards, currencyFn, cardColorMap }) {
  const [view, setView] = useState('All');

  const SquareDot = (props) => {
    const { cx, cy, stroke, value } = props;
    const size = 7;
    if (value === null || value === undefined) return null;
    return <rect x={cx - size / 2} y={cy - size / 2} width={size} height={size} fill={stroke} />;
  };

  return (
    <Card>
      <CardHeader className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Card Performance Trend</CardTitle>
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
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
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
            <RechartsTooltip content={<CustomLineChartTooltip currencyFn={currencyFn} cards={cards} />} />

            {cards.map((card) => {
              const cardColor = cardColorMap.get(card.name) || '#cccccc';
              return (
                <React.Fragment key={card.id}>
                  {(view === 'All' || view === 'Spending') && (
                    <Line
                      type="linear"
                      connectNulls
                      dataKey={`${card.name} Spend`}
                      stroke={cardColor}
                      strokeWidth={2}
                      yAxisId="left"
                      activeDot={{ r: 6 }}
                      dot={{ r: 4 }}
                    />
                  )}
                  {(view === 'All' || view === 'Cashback') && (
                    <Line
                      type="linear"
                      connectNulls
                      dataKey={`${card.name} Cashback`}
                      stroke={cardColor}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      yAxisId={view === 'All' ? 'right' : 'left'}
                      activeDot={{ r: 6 }}
                      dot={<SquareDot />}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs">
          {cards.map((card) => (
            <div key={card.id} className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: cardColorMap.get(card.name) || '#cccccc' }}
              />
              <span>{card.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}