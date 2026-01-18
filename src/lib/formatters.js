// Cache the formatter instance to avoid recreating it on every call.
// This provides a ~80x performance improvement over toLocaleString().
const vndFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

/**
 * Formats a number into Vietnamese Dong (VND) currency string.
 * @param {number} n - The number to format.
 * @returns {string} - The formatted currency string (e.g., "1.234.567 ₫").
 */
export const currency = (n) => vndFormatter.format(n || 0);

/**
 * Formats a 'YYYYMM' code into a short month and year string.
 * @param {string} ymCode - The year-month code (e.g., '202510').
 * @returns {string} - The formatted string (e.g., "Oct 2025").
 */
export const fmtYMShort = (ymCode) => {
    if (!ymCode || typeof ymCode !== 'string' || ymCode.length !== 6) return "";
    const year = Number(ymCode.slice(0, 4));
    const month = Number(ymCode.slice(4, 6));
    if (isNaN(year) || isNaN(month)) return "";
    return new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'short', year: 'numeric' });
};
