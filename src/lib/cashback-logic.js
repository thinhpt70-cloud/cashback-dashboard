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
 * @param {number} [paymentDueDay] - The card's payment due day (optional, for more accurate due date calculation).
 * @returns {Date|string|null} - Returns a Date object for definite dates, "Accumulating" for points, or null.
 */
export const calculatePaymentDate = (cashbackMonth, paymentType, statementDay, paymentDueDay) => {
    if (!cashbackMonth || !paymentType || !statementDay) return null;

    // Ensure paymentType is a string before checking for 'point'
    if (typeof paymentType === 'string' && paymentType.toLowerCase().includes('point')) return 'Accumulating';

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
    if (paymentType === 'M0') offset = 0;
    else if (paymentType === 'M+1') offset = 1;
    else if (paymentType === 'M+2') offset = 2;
    // Fallback for custom strings or unknown types (treat as M+1 if not handled?)
    // For now return null if unknown to avoid bad dates
    else if (!['M0', 'M+1', 'M+2'].includes(paymentType)) return null;

    // Base target month (1-indexed) after applying offset
    // e.g. Month 10 (Oct), M+1 -> Target 11 (Nov)
    let targetMonth = month + offset;
    let targetYear = year;

    // If paymentDueDay is provided, use logic similar to Payments Tab to determine exact due date
    if (paymentDueDay) {
        // Rollover logic: If paymentDueDay < statementDay, the due date is in the NEXT month relative to the statement month.
        // Also ensure we compare numbers
        if (Number(paymentDueDay) < Number(statementDay)) {
            targetMonth += 1;
        }
        // Handle year rollover logic is done by Date constructor, but passing correct 0-indexed month is key.
        // Date(year, monthIndex, day) handles overflow (e.g. monthIndex 12 becomes Jan next year).
        // targetMonth is 1-indexed (1..12+), so we pass targetMonth - 1.

        const targetDate = new Date(targetYear, targetMonth - 1, paymentDueDay);
        return targetDate;
    }

    // Fallback to Statement Day if paymentDueDay is not provided (Old behavior)
    const targetDate = new Date(targetYear, targetMonth - 1, statementDay);
    return targetDate;
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
