// src/components/shared/StatCard.jsx
import React from 'react';
import { Card, CardContent } from '../ui/card'; // Adjusted path
import { cn } from '../../lib/utils'; // Adjusted path
import { ArrowUp, ArrowDown } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

/**
 * A small sparkline chart component using Recharts
 */
function SparklineChart({ data, lineColor, fillColor, dataKey, currencyFn }) {
    if (!data || data.length < 2) return null;

    // Format data for Recharts (AreaChart needs objects with keys)
    const formattedData = data.map((value, index) => ({ name: index, [dataKey]: value }));

    const formatTooltipValue = (value) => {
        if (currencyFn) {
            return currencyFn(value);
        }
        // For rates/percentages, format as percentage
        if (value < 1 && value > -1) {
            return `${(value * 100).toFixed(2)}%`;
        }
        return value.toFixed(2);
    };

    return (
        <div className="h-10 w-full"> {/* Sparkline height */}
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={formattedData}
                    margin={{ top: 5, right: 0, left: 0, bottom: 0 }}
                >
                    {/* Gradient definition for the fill */}
                    <defs>
                        <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={fillColor} stopOpacity={0.4}/>
                            <stop offset="95%" stopColor={fillColor} stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <RechartsTooltip
                        contentStyle={{ fontSize: '10px', padding: '2px 4px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.9)', border: '1px solid #ccc' }}
                        itemStyle={{ padding: 0, color: lineColor }}
                        formatter={formatTooltipValue}
                        labelFormatter={() => ''} // Hide the label (index)
                        cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '3 3' }}
                    />
                    <Area
                        type="monotone" // Makes the line curvy
                        dataKey={dataKey}
                        stroke={lineColor}
                        strokeWidth={1.5}
                        fillOpacity={1}
                        fill={`url(#gradient-${dataKey})`} // Apply gradient fill
                        dot={false}
                        activeDot={false}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

/**
 * The main StatCard component
 */
export default function StatCard({
    title,
    value,            // The formatted string for display (e.g., "10.000.000 ₫")
    numericValue,     // The raw number for calculations (e.g., 10000000)
    icon,
    lastMonthValue,   // The raw number for the previous period
    currentMonthLabel,
    sparklineData,
    currencyFn      // Function to format currency in tooltip
}) {
    
    // --- NEW, ROBUST Trend Calculation ---
    let trend = null;
    let trendColorClass = "";
    let TrendIcon = null;

    // Use the raw numeric values for calculation
    const currentVal = typeof numericValue === 'number' ? numericValue : 0;
    const previousVal = typeof lastMonthValue === 'number' ? lastMonthValue : 0;

    // Check if lastMonthValue was provided (it's null/undefined for first-ever month)
    if (typeof lastMonthValue === 'number') { 
        if (previousVal !== 0) {
            // --- Case 1: Previous value is not 0, calculate percentage change ---
            const percentageChange = ((currentVal - previousVal) / Math.abs(previousVal)) * 100;

            if (Math.abs(percentageChange) < 0.1) {
                // Negligible change
                trend = '≈0%';
                trendColorClass = "text-slate-600 bg-slate-100/60";
            } else {
                // Significant change
                trend = `${Math.abs(percentageChange).toFixed(1)}%`;
                if (percentageChange > 0) {
                    trendColorClass = "text-emerald-600 bg-emerald-100/60";
                    TrendIcon = ArrowUp;
                } else {
                    trendColorClass = "text-red-600 bg-red-100/60";
                    TrendIcon = ArrowDown;
                }
            }
        } else if (currentVal > 0) {
            // --- Case 2: Previous value was 0, but current is positive ---
            trend = "New";
            trendColorClass = "text-emerald-600 bg-emerald-100/60";
            TrendIcon = ArrowUp;
        } else {
            // --- Case 3: Both are 0 (or current is 0 and previous was 0) ---
            trend = '0%';
            trendColorClass = "text-slate-600 bg-slate-100/60";
        }
    }
    // If lastMonthValue is not a number (null/undefined), 'trend' remains null and no badge is shown.

    // --- Sparkline Color Logic ---
    // (Based on the trend we just calculated)
    let lineColor = "hsl(215 20% 65%)"; // Default slate-500
    let fillColor = "hsl(215 20% 65%)"; 
    if (TrendIcon === ArrowUp) {
        lineColor = "hsl(142 71% 45%)"; // Emerald-600
        fillColor = "hsl(142 71% 45%)";
    } else if (TrendIcon === ArrowDown) {
        lineColor = "hsl(0 72% 51%)";   // Red-600
        fillColor = "hsl(0 72% 51%)";
    }

    return (
        <Card className="flex flex-col justify-between shadow-sm border border-slate-200 overflow-hidden">
            <CardContent className="p-4 flex-grow flex flex-col justify-between">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center text-sm font-medium text-muted-foreground">
                        {icon && <span className="mr-2">{icon}</span>}
                        {title}
                    </div>
                    {/* --- Trend Badge Display Logic --- */}
                    {trend !== null ? (
                         <div className={cn(
                             "flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold",
                             trendColorClass
                         )}>
                             {TrendIcon && <TrendIcon className="h-3 w-3" />}
                             <span>{trend}</span>
                         </div>
                     ) : currentMonthLabel ? (
                        // Fallback to month label if no trend to show
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                            {currentMonthLabel}
                        </span>
                     ) : null}
                </div>
                
                {/* Main Value Display (uses the formatted string) */}
                <p className="text-2xl font-bold tracking-tight leading-none mt-1 mb-2">
                    {value}
                </p>

            </CardContent>
            
            {/* Sparkline Integration */}
            {sparklineData && sparklineData.length > 1 && (
                <div className="px-1 -mt-2"> {/* Pull sparkline up a bit */}
                     <SparklineChart
                        data={sparklineData}
                        lineColor={lineColor}
                        fillColor={fillColor}
                        dataKey={title.toLowerCase().replace(/\s+/g, '-')} // Unique key
                        currencyFn={title !== 'Effective Rate' ? currencyFn : undefined}
                    />
                </div>
            )}
        </Card>
    );
}