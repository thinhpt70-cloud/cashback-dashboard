/**
 * Calculates the split of cashback into Tier 1 and Tier 2 based on the card's monthly limit.
 *
 * @param {number} actualCashback - The base earned cashback from transactions.
 * @param {number} adjustment - Manual adjustment amount (can be negative).
 * @param {number} monthlyLimit - The "Overall Monthly Limit" of the card (Tier 1 cap).
 * @returns {{ total: number, tier1: number, tier2: number }}
 */
export const calculateCashbackSplit = (actualCashback, adjustment, monthlyLimit) => {
    // ACTUAL CASHBACK from Notion already includes the adjustment (via Formula).
    // So we use it directly as the total.
    const total = (actualCashback || 0);

    // If there is no limit, everything is Tier 1 (or treat as single tier)
    if (!monthlyLimit || monthlyLimit <= 0) {
        return { total, tier1: total, tier2: 0 };
    }

    const tier1 = Math.min(total, monthlyLimit);
    const tier2 = Math.max(0, total - monthlyLimit);

    return { total, tier1, tier2 };
};

/**
 * Calculates the expected payment date based on the cashback month and payment method.
 *
 * @param {string} cashbackMonth - Format "YYYYMM" (e.g., "202310").
 * @param {string} paymentType - "M0", "M+1", "M+2", "Points", or null.
 * @param {number} statementDay - The card's statement day.
 * @returns {Date|string|null} - Returns a Date object for definite dates, "Accumulating" for points, or null.
 */
export const calculatePaymentDate = (cashbackMonth, paymentType, statementDay) => {
    // We need cashbackMonth, paymentType, and statementDay to form a date.
    if (!cashbackMonth || !paymentType || !statementDay) return null;

    // Ensure paymentType is a string and normalize it (Trim, Uppercase, Remove spaces)
    // This handles inputs like "m+1", "M + 1", "Points", "points ", etc.
    const normalizedType = String(paymentType).trim().toUpperCase().replace(/\s+/g, '');

    // Check for 'POINT' in the normalized string
    if (normalizedType.includes('POINT')) return 'Accumulating';

    let year, month;
    if (cashbackMonth.includes('-')) {
        // Handle YYYY-MM
        year = parseInt(cashbackMonth.split('-')[0], 10);
        month = parseInt(cashbackMonth.split('-')[1], 10);
    } else {
        // Handle YYYYMM
        year = parseInt(cashbackMonth.substring(0, 4), 10);
        month = parseInt(cashbackMonth.substring(4, 6), 10);
    }

    let offset = 0;
    if (normalizedType === 'M0') offset = 0;
    else if (normalizedType === 'M+1') offset = 1;
    else if (normalizedType === 'M+2') offset = 2;
    // Fallback: If unknown type, return null to avoid bad dates
    else return null;

    // Base target month (1-indexed) after applying offset
    // e.g. Month 10 (Oct), M+1 -> Target 11 (Nov)
    const targetMonth = month + offset;
    const targetYear = year;

    // Use Statement Day.
    // Date(year, monthIndex, day) handles overflow (e.g. monthIndex 12 becomes Jan next year).
    // targetMonth is 1-indexed (1..12+), so we pass targetMonth - 1.
    const targetDate = new Date(targetYear, targetMonth - 1, statementDay);
    return targetDate;
};

/**
 * Checks if the statement for a given month is finalized.
 * A statement is finalized if the current date is past the statement day of that month.
 *
 * @param {string} cashbackMonth - "YYYYMM" or "YYYY-MM"
 * @param {number} statementDay
 * @returns {boolean}
 */
export const isStatementFinalized = (cashbackMonth, statementDay) => {
    if (!cashbackMonth || !statementDay) return true; // Default to true if missing info to avoid locking

    let year, month;
    if (cashbackMonth.includes('-')) {
        // Handle YYYY-MM
        year = parseInt(cashbackMonth.split('-')[0], 10);
        month = parseInt(cashbackMonth.split('-')[1], 10);
    } else {
        // Handle YYYYMM
        year = parseInt(cashbackMonth.substring(0, 4), 10);
        month = parseInt(cashbackMonth.substring(4, 6), 10);
    }

    // Determine the statement date for this specific cashback month
    // Note: statementDay is just a day number. The statement date is that day in the cashback month.
    // e.g., Cashback Month Oct 2023, Statement Day 20 -> Statement Date is Oct 20, 2023.
    // However, if the cashback logic relies on "M+1" for payment, the statement itself
    // is usually generated at the end of the billing cycle.
    // The requirement says: "if the current date is before the statement day then the amount is not finalized"
    // This implies we are checking against the statement day OF THAT MONTH.

    const statementDate = new Date(year, month - 1, statementDay);
    statementDate.setHours(23, 59, 59, 999); // End of the statement day

    const now = new Date();
    return now > statementDate;
};

/**
 * Determines the status of a payment.
 *
 * @param {number} amountDue
 * @param {number} amountPaid
 * @param {Date|string} dueDate
 * @returns {{ status: 'paid'|'partial'|'unpaid'|'overdue', label: string, color: string }}
 */
export const getPaymentStatus = (amountDue, amountPaid, dueDate) => {
    // If nothing due, consider it handled or ignore
    if (amountDue <= 0) return { status: 'paid', label: 'Paid', color: 'bg-green-100 text-green-800' };

    const paid = amountPaid || 0;

    if (paid >= amountDue) {
        return { status: 'paid', label: 'Paid', color: 'bg-green-100 text-green-800' };
    }

    if (paid > 0) {
        return { status: 'partial', label: 'Partial', color: 'bg-yellow-100 text-yellow-800' };
    }

    // It is unpaid. Check if overdue.
    if (dueDate instanceof Date) {
        const today = new Date();
        today.setHours(0,0,0,0);
        // If due date is strictly before today, it's overdue
        if (dueDate < today) {
             return { status: 'overdue', label: 'Overdue', color: 'bg-red-100 text-red-800' };
        }
    }

    return { status: 'unpaid', label: 'Unpaid', color: 'bg-gray-100 text-gray-800' };
};
