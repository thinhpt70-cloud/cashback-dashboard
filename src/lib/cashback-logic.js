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

// Regex for [Redeemed <amount> (on <date>)?: <note>]
// Updated to support decimal amounts and optional commas: ([\d,]+(?:\.\d+)?)
// Updated to support optional time: (\d{4}-\d{2}-\d{2}(?:\s+\d{2}:\d{2})?)
export const RE_REDEMPTION_LOG = /\[Redeemed\s+([\d,]+(?:\.\d+)?)(?:\s+on\s+(\d{4}-\d{2}-\d{2}(?:\s+\d{2}:\d{2})?))?(?::\s*(.*?))?\]/g;

/**
 * Groups monthly summary items into a unified history timeline.
 *
 * @param {Array} items - Array of monthly summary items (from cardData.items)
 * @param {number} [statementDay] - Optional statement day to determine the exact earn date
 * @returns {Array} - Sorted array of events { type: 'earned'|'redeemed', date, amount, ... }
 */
export const groupRedemptionEvents = (items, statementDay) => {
    const events = [];
    const redemptionMap = new Map(); // Key: "date-note", Value: { totalAmount, contributors: [] }

    if (!items) return [];

    // 1. Process Items
    items.forEach(item => {
        let loggedRedemption = 0; // Track logged amount to detect manual adjustments

        // Parse month info once
        let year, month;
        if (item.month.includes('-')) {
             const p = item.month.split('-');
             year = parseInt(p[0], 10);
             month = parseInt(p[1], 10);
        } else {
             year = parseInt(item.month.substring(0, 4), 10);
             month = parseInt(item.month.substring(4, 6), 10);
        }

        // A. Earned Events
        if (item.totalEarned > 0) {
            // Use statement day if available, otherwise 1st of month
            const day = statementDay || 1;
            // Basic YYYY-MM-DD formatting
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            events.push({
                type: 'earned',
                id: `earned-${item.id}`,
                date: dateStr,
                amount: item.totalEarned,
                month: item.month,
                item: item
            });
        }

        // B. Redemption Logs
        if (item.notes) {
            let match;
            // Reset regex lastIndex
            RE_REDEMPTION_LOG.lastIndex = 0;

            while ((match = RE_REDEMPTION_LOG.exec(item.notes)) !== null) {
                const amount = Number(match[1].replace(/,/g, ''));
                loggedRedemption += amount;

                let dateStr = match[2];
                let note = match[3] ? match[3].trim() : '';
                const fullLog = match[0];

                // Legacy format handling (if needed, copying logic from CashbackTracker)
                if (!dateStr) {
                    // Fallback to item month end if date missing
                    const d = new Date(year, month, 0).getDate();
                    dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                }

                const key = `${dateStr}|${note || 'Redemption'}`;

                if (!redemptionMap.has(key)) {
                    redemptionMap.set(key, {
                        type: 'redeemed',
                        id: `redeem-${key}`,
                        date: dateStr,
                        note: note || 'Redemption',
                        amount: 0,
                        contributors: []
                    });
                }

                const event = redemptionMap.get(key);
                event.amount += amount;
                event.contributors.push({
                    itemId: item.id,
                    month: item.month,
                    amount: amount,
                    originalLog: fullLog
                });
            }
        }

        // C. Detect Manual/Unlogged Redemptions
        // If the total Amount Redeemed is greater than what's logged in notes, capture the difference.
        const totalRedeemed = Number(item.amountRedeemed) || 0;
        if (totalRedeemed > loggedRedemption + 0.01) {
             const diff = totalRedeemed - loggedRedemption;

             // Default to Statement Date for manual adjustments
             const day = statementDay || 1;
             const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
             const note = "Manual Redemption";

             const key = `${dateStr}|${note}`;

             if (!redemptionMap.has(key)) {
                  redemptionMap.set(key, {
                      type: 'redeemed',
                      id: `redeem-manual-${dateStr}`,
                      date: dateStr,
                      note: note,
                      amount: 0,
                      contributors: []
                  });
             }
             const event = redemptionMap.get(key);
             event.amount += diff;
             event.contributors.push({
                 itemId: item.id,
                 month: item.month,
                 amount: diff,
                 originalLog: "(Manual Adjustment)"
             });
        }
    });

    // 2. Merge Redemptions into Events
    redemptionMap.forEach(event => events.push(event));

    // 3. Sort by Date Descending
    // Note: Earned events date might be YYYYMM or YYYY-MM. Redeemed is YYYY-MM-DD.
    // We normalize to string comparison which works for YYYY...
    return events.sort((a, b) => b.date.localeCompare(a.date));
};
