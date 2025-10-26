// src/lib/stats.js
import { getPastNMonths } from './date';

/**
 * Generates an array of metric data for a sparkline chart.
 * @param {Array} monthlySummary - The array of all monthly summary data.
 * @param {string} endMonth - The most recent month to include (e.g., '2024-07').
 * @param {number} length - The number of months to retrieve (e.g., 6).
 * @param {string} metric - The key of the metric to sum (e.g., 'spend', 'cashback').
 * @returns {Array<number>} - An array of numerical values for the sparkline.
 */
export const getMetricSparkline = (monthlySummary, endMonth, length, metric) => {
    // Get the array of month strings (e.g., ['2024-02', '2024-03', ..., '2024-07'])
    const months = getPastNMonths(endMonth, length); 
    
    return months.map(month => {
        return monthlySummary
            .filter(s => s.month === month)
            .reduce((acc, curr) => acc + (curr[metric] || 0), 0);
    });
};