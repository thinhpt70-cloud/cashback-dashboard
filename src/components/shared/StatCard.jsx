// src/components/shared/StatCard.jsx
import React from 'react';
import { Card, CardContent } from '../ui/card'; // Adjusted path for Card component
import { cn } from '../../lib/utils'; // Adjusted path for utility functions

// Helper to generate a simple SVG sparkline path
const generateSparklinePath = (data, width, height) => {
    if (!data || data.length < 2) return "";

    const min = Math.min(...data);
    const max = Math.max(...data);

    // Normalize data to fit within height (with some padding)
    const normalizedData = data.map(d => {
        if (max === min) return height / 2; // Flat line if all values are the same
        return height - ((d - min) / (max - min)) * height;
    });

    const step = width / (normalizedData.length - 1);

    let path = `M0,${normalizedData[0]}`;
    for (let i = 1; i < normalizedData.length; i++) {
        path += ` L${i * step},${normalizedData[i]}`;
    }
    return path;
};


export default function StatCard({
    title,
    value,
    icon,
    lastMonthValue, // New prop for trend calculation
    currentMonthLabel, // New prop for month badge
    sparklineData // New prop for sparkline
}) {
    let trend = null;
    let trendColorClass = "";
    let trendArrow = "";

    if (typeof lastMonthValue === 'number' && lastMonthValue !== 0) {
        const percentageChange = ((parseFloat(value.replace(/[^0-9.-]+/g,"")) - lastMonthValue) / lastMonthValue) * 100;
        trend = percentageChange.toFixed(1);
        if (percentageChange > 0) {
            trendColorClass = "text-emerald-600 bg-emerald-100";
            trendArrow = "↑";
        } else if (percentageChange < 0) {
            trendColorClass = "text-red-600 bg-red-100";
            trendArrow = "↓";
        } else {
            trendColorClass = "text-slate-600 bg-slate-100";
        }
    } else if (typeof lastMonthValue === 'number' && lastMonthValue === 0 && parseFloat(value.replace(/[^0-9.-]+/g,"")) > 0) {
        // Handle case where last month was 0 but current is positive (e.g., infinite increase)
        trend = "New";
        trendColorClass = "text-emerald-600 bg-emerald-100";
    }

    return (
        <Card className="flex flex-col justify-between shadow-sm border border-slate-200">
            <CardContent className="p-4 flex-grow flex flex-col justify-between">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center text-sm font-medium text-muted-foreground">
                        {icon && <span className="mr-2">{icon}</span>}
                        {title}
                    </div>
                    {currentMonthLabel && (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                            {currentMonthLabel}
                        </span>
                    )}
                </div>
                <div className="flex flex-col gap-1">
                    <p className="text-2xl font-bold tracking-tight leading-none">
                        {value}
                    </p>
                    {trend !== null && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <span className={cn("rounded-md px-1 py-0.5 text-[0.65rem] font-medium", trendColorClass)}>
                                {trendArrow} {trend}%
                            </span>
                            {/* You can add "vs last month" here if needed, but keeping it compact for now */}
                        </div>
                    )}
                </div>
            </CardContent>
            {sparklineData && sparklineData.length > 1 && (
                <div className="px-4 pb-2"> {/* Padding to match card content */}
                    <svg width="100%" height="40">
                        <path
                            d={generateSparklinePath(sparklineData, 200, 30)} // Width and height for sparkline
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="text-indigo-400" // Example color
                        />
                    </svg>
                </div>
            )}
        </Card>
    );
}