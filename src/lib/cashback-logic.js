/**
 * Calculates the split of cashback into Tier 1 and Tier 2 based on the card's monthly limit.
 *
 * @param {number} actualCashback - The base earned cashback from transactions.
 * @param {number} adjustment - Manual adjustment amount (can be negative).
 * @param {number} monthlyLimit - The "Overall Monthly Limit" of the card (Tier 1 cap).
 * @returns {{ total: number, tier1: number, tier2: number }}
 */
export const calculateCashbackSplit = (actualCashback, adjustment, monthlyLimit) => {
    const total = (actualCashback || 0) + (adjustment || 0);
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
    if (!cashbackMonth || !paymentType || !statementDay) return null;

    // Ensure paymentType is a string before checking for 'point'
    if (typeof paymentType === 'string' && paymentType.toLowerCase().includes('point')) return 'Accumulating';

    const year = parseInt(cashbackMonth.substring(0, 4), 10);
    const month = parseInt(cashbackMonth.substring(4, 6), 10); // 1-12

    let offset = 0;
    if (paymentType === 'M0') offset = 0;
    else if (paymentType === 'M+1') offset = 1;
    else if (paymentType === 'M+2') offset = 2;
    else return null; // Unknown type

    // Calculate target month (0-indexed for Date constructor is month-1)
    // We want the statement date of the target month.
    // e.g. Month 202310 (Oct). Statement Day 20.
    // M0 -> Oct 20.
    // M+1 -> Nov 20.

    // Date constructor: new Date(year, monthIndex, day)
    // monthIndex: 0 = Jan.
    // Our 'month' variable is 1-based. So Oct is 10.
    // To get Oct, we use index 9.
    // But we want (month - 1) + offset.

    const targetDate = new Date(year, (month - 1) + offset, statementDay);
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
