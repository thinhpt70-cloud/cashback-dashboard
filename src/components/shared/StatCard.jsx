// src/components/shared/StatCard.jsx
import React from 'react';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';
import { ArrowUp, ArrowDown } from 'lucide-react'; // Import icons

// --- NEW SPARKLINE COMPONENT ---
import { AreaChart, Area, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

function SparklineChart({ data, lineColor, fillColor, dataKey, currencyFn }) {
    if (!data || data.length < 2) return null;

    const formattedData = data.map((value, index) => ({ name: index, [dataKey]: value }));

    return (
        <div className="h-10 w-full"> {/* Adjust height as needed */}
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={formattedData}
                    margin={{ top: 5, right: 0, left: 0, bottom: 0 }}
                >
                    {/* Add gradient definition */}
                    <defs>
                        <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={fillColor} stopOpacity={0.4}/>
                            <stop offset="95%" stopColor={fillColor} stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <RechartsTooltip
                        contentStyle={{ fontSize: '10px', padding: '2px 4px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.9)' }}
                        itemStyle={{ padding: 0 }}
                        formatter={(value) => currencyFn ? currencyFn(value) : value.toFixed(2)} // Use currencyFn if provided
                        labelFormatter={() => ''} // Hide the label (index)
                    />
                    <Area
                        type="monotone" // Makes the line curvy
                        dataKey={dataKey}
                        stroke={lineColor}
                        strokeWidth={1.5} // Adjusted stroke width
                        fillOpacity={1}
                        fill={`url(#gradient-${dataKey})`} // Apply gradient fill
                        dot={false} // Hide dots on the line
                        activeDot={false} // Hide dot on hover
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

// --- UPDATED StatCard Component ---
export default function StatCard({
    title,
    value,
    icon,
    lastMonthValue,
    currentMonthLabel,
    sparklineData,
    currencyFn // Add currencyFn prop
}) {
    let trend = null;
    let trendColorClass = "";
    let TrendIcon = null;

    // --- REVISED Trend Calculation ---
    // Calculate raw value for comparison and percentage calculation
    const numericValue = typeof value === 'string'
        ? parseFloat(value.replace(/[^0-9.-]+/g, ""))
        : typeof value === 'number' ? value : 0;

    const numericLastMonthValue = typeof lastMonthValue === 'number' ? lastMonthValue : 0;

    // Calculate percentage change only if last month's value is not zero
    if (typeof lastMonthValue === 'number') {
        if (numericLastMonthValue !== 0) {
            const percentageChange = ((numericValue - numericLastMonthValue) / Math.abs(numericLastMonthValue)) * 100;
             // Only show trend if the change is significant (e.g., > 0.1%)
             if (Math.abs(percentageChange) >= 0.1) {
                trend = `${Math.abs(percentageChange).toFixed(1)}%`; // Always show positive %
                 if (percentageChange > 0) {
                    trendColorClass = "text-emerald-600 bg-emerald-100/60";
                    TrendIcon = ArrowUp;
                } else {
                    trendColorClass = "text-red-600 bg-red-100/60";
                    TrendIcon = ArrowDown;
                }
             } else {
                 // Indicate negligible change if below threshold
                 trend = '≈0%'; // Use ≈ symbol or similar
                 trendColorClass = "text-slate-600 bg-slate-100/60";
             }
        } else if (numericValue > 0) {
            // Handle case where last month was 0 but current is positive
            trend = "New";
            trendColorClass = "text-emerald-600 bg-emerald-100/60";
            TrendIcon = ArrowUp;
        } else {
            // Case where both are 0 or last month was 0 and current is also 0
             trend = '0%';
             trendColorClass = "text-slate-600 bg-slate-100/60";
        }
    }


    // Determine sparkline colors based on trend
    let lineColor = "hsl(215 20% 65%)"; // Default slate-500
    let fillColor = "hsl(215 20% 65%)"; // Default slate-500
    if (TrendIcon === ArrowUp) {
        lineColor = "hsl(142 71% 45%)"; // Emerald-600
        fillColor = "hsl(142 71% 45%)"; // Emerald-600
    } else if (TrendIcon === ArrowDown) {
        lineColor = "hsl(0 72% 51%)";   // Red-600
        fillColor = "hsl(0 72% 51%)";   // Red-600
    }


    return (
        <Card className="flex flex-col justify-between shadow-sm border border-slate-200 overflow-hidden"> {/* Added overflow-hidden */}
            <CardContent className="p-4 flex-grow flex flex-col justify-between">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center text-sm font-medium text-muted-foreground">
                        {icon && <span className="mr-2">{icon}</span>}
                        {title}
                    </div>
                     {/* --- Badge Display Logic --- */}
                    {trend !== null && (
                         <div className={cn(
                             "flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold",
                             trendColorClass
                         )}>
                             {TrendIcon && <TrendIcon className="h-3 w-3" />}
                             <span>{trend}</span>
                         </div>
                     )}
                </div>
                 {/* Main Value Display */}
                <p className="text-2xl font-bold tracking-tight leading-none mt-1 mb-2">
                    {value}
                </p>

            </CardContent>
            {/* Sparkline Integration */}
            {sparklineData && sparklineData.length > 1 && (
                <div className="px-1 -mt-2"> {/* Negative margin to pull sparkline up */}
                     <SparklineChart
                        data={sparklineData}
                        lineColor={lineColor}
                        fillColor={fillColor}
                        dataKey={title.toLowerCase().replace(/\s+/g, '-')} // Unique key based on title
                        currencyFn={title !== 'Effective Rate' ? currencyFn : undefined} // Pass currencyFn unless it's a rate
                    />
                </div>
            )}
        </Card>
    );
}