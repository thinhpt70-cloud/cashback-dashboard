/**
 * Gets the current month and year string.
 * @param {Date} [date=new Date()] - The date object to use.
 * @returns {string} - The formatted string (e.g., "Oct 2025").
 */
export function getTodaysMonth(date = new Date()) {
  // Using 'en-US' locale for consistent "Oct 2025" format
  return date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
}

/**
 * Gets the previous month and year string relative to a given date.
 * @param {string | Date} monthStrOrDate - The month string ('YYYYMM') or Date object to calculate from.
 * @returns {string} - The formatted string for the previous month (e.g., "Sep 2025").
 */
export function getPreviousMonth(monthStrOrDate) {
    let date;
    if (typeof monthStrOrDate === 'string' && monthStrOrDate.length === 6) {
        const year = parseInt(monthStrOrDate.slice(0, 4), 10);
        const month = parseInt(monthStrOrDate.slice(4, 6), 10);
         // Create date for the 1st of the *given* month
        date = new Date(year, month - 1, 1);
    } else if (monthStrOrDate instanceof Date) {
        date = new Date(monthStrOrDate);
    } else {
         // Default to previous month from today if input is invalid
        date = new Date();
    }

    // Go back one month
    date.setMonth(date.getMonth() - 1);

    // Format the previous month's date
    return date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
}

/**
 * Gets an array of month strings (YYYYMM) for the past N months, ending at endMonth.
 * @param {string} endMonth - The ending month in 'YYYYMM' format (e.g., '202407').
 * @param {number} length - The number of months to retrieve.
 * @returns {string[]} - Array of month strings (e.g., ['202402', ..., '202407']).
 */
export const getPastNMonths = (endMonth, length) => {
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