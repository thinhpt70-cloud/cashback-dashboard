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