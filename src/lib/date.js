/**
 * Gets the current month and year string in YYYYMM format.
 * @param {Date} [date=new Date()] - The date object to use.
 * @returns {string} - The formatted string (e.g., "202510").
 */
export function getTodaysMonth(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}${month}`; // Returns 'YYYYMM'
}

/**
 * Gets the previous month string relative to a given 'YYYYMM' string.
 * @param {string} monthString - The month string ('YYYYMM') to calculate from.
 * @returns {string | null} - The formatted string for the previous month (e.g., "202509").
 */
export const getPreviousMonth = (monthString) => {
    // Expects "YYYYMM" format
    if (!monthString || monthString.length !== 6) return null;
    
    const year = parseInt(monthString.substring(0, 4), 10);
    const month = parseInt(monthString.substring(4, 6), 10); // 1-12
    
    // new Date(year, month - 2) creates a date for the *previous* month.
    // (Month is 0-indexed, so 10 (Oct) becomes 9. 9-1 = 8, which is September)
    const prevMonthDate = new Date(year, month - 2, 1);
    
    const prevYear = prevMonthDate.getFullYear();
    const prevMonth = String(prevMonthDate.getMonth() + 1).padStart(2, '0');
    
    return `${prevYear}${prevMonth}`;
};

/**
 * Gets an array of month strings (YYYYMM) for the past N months, ending at endMonth.
 * @param {string} endMonth - The ending month in 'YYYYMM' format (e.g., '202407').
 * @param {number} length - The number of months to retrieve.
 * @returns {string[]} - Array of month strings (e.g., ['202402', ..., '202407']).
 */
export const getPastNMonths = (endMonth, length) => {
    // Add this check to prevent the 'slice of null' error
    if (!endMonth || typeof endMonth !== 'string' || endMonth.length !== 6) {
        console.warn('getPastNMonths called with invalid endMonth:', endMonth);
        return [];
    }

    const months = [];
    const year = parseInt(endMonth.slice(0, 4), 10);
    const month = parseInt(endMonth.slice(4, 6), 10) - 1; // 0-indexed month

    for (let i = 0; i < length; i++) {
        const d = new Date(year, month - i, 1);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        months.push(`${y}${m}`);
    }
    return months.reverse(); // Return in chronological order
};

/**
 * Calculates the number of days left until a given payment date string.
 * @param {string} paymentDateString - The due date in 'YYYY-MM-DD' format.
 * @returns {number | null} - The number of days remaining, or null if invalid or past.
 */
export const calculateDaysLeft = (paymentDateString) => {
    if (!paymentDateString || paymentDateString === "N/A") return null;

    const today = new Date(); 
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(paymentDateString);
    dueDate.setHours(0, 0, 0, 0);
    
    if (isNaN(dueDate)) return null;

    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays >= 0 ? diffDays : null;
};

/**
 * Calculates the days left in a given cashback month (e.g., '202510').
 * @param {string} cashbackMonth - The month in 'YYYYMM' format.
 * @returns {{days: number | null, status: string}} - An object with days left and status.
 */
export const calculateDaysLeftInCashbackMonth = (cashbackMonth) => {
    if (!cashbackMonth) return { days: null, status: 'N/A' };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const year = parseInt(cashbackMonth.slice(0, 4), 10);
    const month = parseInt(cashbackMonth.slice(4, 6), 10);

    const lastDayOfMonth = new Date(year, month, 0);
    
    if (isNaN(lastDayOfMonth.getTime())) return { days: null, status: 'N/A' };

    const diffTime = lastDayOfMonth.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return { days: null, status: 'Completed' };
    }
    return { days: diffDays, status: 'Upcoming' };
};

/**
 * Calculates the days until the next statement date for a given month.
 * @param {number} statementDay - The day of the month the statement is generated.
 * @param {string} activeMonth - The month to check in 'YYYYMM' format.
 * @returns {{days: number | null, status: string}} - An object with days left and status.
 */
export const calculateDaysUntilStatement = (statementDay, activeMonth) => {
    if (!statementDay || !activeMonth) return { days: null, status: 'N/A' };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const year = parseInt(activeMonth.slice(0, 4), 10);
    const month = parseInt(activeMonth.slice(4, 6), 10);
    
    const statementDate = new Date(year, month - 1, statementDay);

    if (isNaN(statementDate.getTime())) return { days: null, status: 'N/A' };
    
    const diffTime = statementDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return { days: null, status: 'Completed' };
    }
    return { days: diffDays, status: 'Upcoming' };
};

/**
 * --- NEW REPLACEMENT FUNCTION ---
 * Gets the current cashback month for a specific card based on its statement day.
 * If no card is provided, defaults to the current calendar month.
 * @param {object} [card] - The card object (must have statementDay and useStatementMonthForPayments).
 * @param {string} [transactionDateStr] - An optional date string to calculate for.
 * @returns {string} - The current month in 'YYYYMM' format.
 */
export const getCurrentCashbackMonthForCard = (card = null, transactionDateStr = null) => {
    const effectiveDate = transactionDateStr ? new Date(transactionDateStr) : new Date();

    let year = effectiveDate.getFullYear();
    let month = effectiveDate.getMonth(); // 0-indexed

    // Default to current calendar month if no card is passed
    if (!card) {
        const finalMonth = month + 1;
        return `${year}${String(finalMonth).padStart(2, '0')}`;
    }

    if (card.useStatementMonthForPayments) {
        const currentMonth = month + 1;
        return `${year}${String(currentMonth).padStart(2, '0')}`;
    }

    if (effectiveDate.getDate() >= card.statementDay) {
        month += 1;
    }

    if (month > 11) {
        month = 0;
        year += 1;
    }

    const finalMonth = month + 1;
    return `${year}${String(finalMonth).padStart(2, '0')}`;
};
/**
 * Calculates the progress of the annual fee cycle.
 * @param {string} openDateStr - The card open date string.
 * @param {string} nextFeeDateStr - The next annual fee date string.
 * @returns {{daysPast: number, progressPercent: number}} - Object containing days past and progress percentage.
 */
export const calculateFeeCycleProgress = (openDateStr, nextFeeDateStr) => {
    if (!openDateStr || !nextFeeDateStr) return { daysPast: 0, progressPercent: 0 };

    const openDate = new Date(openDateStr);
    const nextFeeDate = new Date(nextFeeDateStr);
    const today = new Date();

    const totalDuration = nextFeeDate.getTime() - openDate.getTime();
    const elapsedDuration = today.getTime() - openDate.getTime();

    if (totalDuration <= 0) return { daysPast: 0, progressPercent: 0 };

    const daysPast = Math.floor(elapsedDuration / (1000 * 60 * 60 * 24));
    const progressPercent = Math.min(100, Math.round((elapsedDuration / totalDuration) * 100));

    return { daysPast, progressPercent };
};

/**
 * Formats a date string into a standard date format (e.g., "06 Jan 2026").
 * @param {string} dateStr - The date string to format.
 * @returns {string} - The formatted date string.
 */
export const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
        return dateStr;
    }
};

/**
 * Formats a date string into a date and time format (e.g., "06 Jan • 00:32").
 * @param {string} dateStr - The date string to format.
 * @returns {string} - The formatted date and time string.
 */
export const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ' • ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch (e) {
        return dateStr;
    }
};

/**
 * Formats a date string for transactions.
 * Includes time if the input string indicates presence of time (e.g. ISO format).
 * Returns "DD MMM YYYY" or "DD MMM YYYY • HH:mm".
 * @param {string} dateStr - The date string to format.
 * @returns {string} - The formatted string.
 */
export const formatTransactionDate = (dateStr) => {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;

        // Simple heuristic: YYYY-MM-DD is 10 chars. ISO string with time is longer.
        const hasTime = dateStr.length > 10;

        const datePart = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

        if (hasTime) {
            const timePart = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
            return `${datePart} • ${timePart}`;
        }

        return datePart;
    } catch (e) {
        return dateStr;
    }
};

/**
 * Formats a date string into a full verbose date and time format (e.g., "Tuesday, 06 Jan 2026 at 00:32").
 * @param {string} dateStr - The date string to format.
 * @returns {string} - The formatted full date and time string.
 */
export const formatFullDateTime = (dateStr) => {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' }) + ' at ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch (e) {
        return dateStr;
    }
};
