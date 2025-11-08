// src/components/shared/StatCard.jsx
import React from 'react';
import { Card, CardContent } from '../ui/card'; // Adjusted path
import { cn } from '../../lib/utils'; // Adjusted path
import { ArrowUp, ArrowDown } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

/**
 * A small sparkline chart component using Recharts
 */
function SparklineChart({ data, lineColor, fillColor, dataKey, currencyFn, title }) {
    if (!data || data.length < 2) return null;

    // Format data for Recharts (AreaChart needs objects with keys)
    const formattedData = data.map((value, index) => ({ name: index, [dataKey]: value }));

    const formatTooltipValue = (value) => {
        // 1. If a currency function is provided (passed down from StatCard), use it.
        //    Format it to remove trailing decimals and use grouping.
        if (currencyFn) {
            // Use Intl.NumberFormat directly for more control
            const formatter = new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
                minimumFractionDigits: 0, // Remove .00
                maximumFractionDigits: 0  // Remove .00
            });
            return formatter.format(value);
        }

        // 2. If it's a rate (a decimal between -1 and 1), format as percentage.
        if (value > -1 && value < 1 && value !== 0) { // Exclude exact 0
            return `${(value * 100).toFixed(2)}%`;
        }

        // 3. Fallback for any other number (e.g., if currencyFn is missing).
        //    Format with thousand separators and no decimals.
        return value.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
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
                        formatter={(value) => [formatTooltipValue(value), title]}
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
    value,
    numericValue,
    icon,
    lastMonthValue,
    currentMonthLabel, 
    sparklineData,
    currencyFn,
    invertTrendColor = false // New prop
}) {    
    // --- Trend Calculation Logic ---
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
                trendColorClass = "text-slate-600 bg-slate-100/60 dark:bg-slate-700 dark:text-slate-200";
            } else {
                // Significant change
                trend = `${Math.abs(percentageChange).toFixed(1)}%`;
                const isPositive = percentageChange > 0;

                // Determine colors based on inversion logic
                const positiveColor = invertTrendColor ? "text-red-600 bg-red-100/60 dark:bg-red-900/50 dark:text-red-300" : "text-emerald-600 bg-emerald-100/60 dark:bg-emerald-900/50 dark:text-emerald-300";
                const negativeColor = invertTrendColor ? "text-emerald-600 bg-emerald-100/60 dark:bg-emerald-900/50 dark:text-emerald-300" : "text-red-600 bg-red-100/60 dark:bg-red-900/50 dark:text-red-300";

                if (isPositive) {
                    trendColorClass = positiveColor;
                    TrendIcon = ArrowUp;
                } else {
                    trendColorClass = negativeColor;
                    TrendIcon = ArrowDown;
                }
            }
        } else if (currentVal > 0) {
            // --- Case 2: Previous value was 0, but current is positive ---
            trend = "New";
            // Invert color if needed for "New" trend
            trendColorClass = invertTrendColor ? "text-red-600 bg-red-100/60 dark:bg-red-900/50 dark:text-red-300" : "text-emerald-600 bg-emerald-100/60 dark:bg-emerald-900/50 dark:text-emerald-300";
            TrendIcon = ArrowUp;
        } else {
            // --- Case 3: Both are 0 (or current is 0 and previous was 0) ---
            trend = '0%';
            trendColorClass = "text-slate-600 bg-slate-100/60 dark:bg-slate-700 dark:text-slate-200";
        }
    }
    // If lastMonthValue is not a number (null/undefined), 'trend' remains null and no badge is shown.

    // --- Sparkline Color Logic ---
    let lineColor = "hsl(215 20% 65%)"; // Default slate-500
    let fillColor = "hsl(215 20% 65%)"; 

    // Define colors
    const positiveLineColor = invertTrendColor ? "hsl(0 72% 51%)" : "hsl(142 71% 45%)"; // Red or Green
    const negativeLineColor = invertTrendColor ? "hsl(142 71% 45%)" : "hsl(0 72% 51%)"; // Green or Red

    if (TrendIcon === ArrowUp) {
        lineColor = positiveLineColor;
        fillColor = positiveLineColor;
    } else if (TrendIcon === ArrowDown) {
        lineColor = negativeLineColor;
        fillColor = negativeLineColor;
    }

    return (
        <Card className="flex flex-col justify-between shadow-sm border border-slate-200 overflow-hidden">
            <CardContent className="p-4 flex-grow flex flex-col justify-between">
                {/* --- Top Row: Title and Trend Badge --- */}
                <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center text-sm font-medium text-muted-foreground">
                        {icon && <span className="mr-2">{icon}</span>}
                        {title}
                    </div>
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

                {/* --- Middle Content: Value and Month Label --- */}
                <div className="mb-2"> 
                    <p className="text-2xl font-bold tracking-tight leading-none mt-1">
                        {value}
                    </p>
                    {currentMonthLabel && (
                        <p className="text-xs text-muted-foreground mt-1">
                            {currentMonthLabel}
                        </p>
                    )}
                </div>

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
                        title={title}
                    />
                </div>
            )}
        </Card>
    );
}