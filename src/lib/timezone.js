export const DEFAULT_TIMEZONE = 'Asia/Ho_Chi_Minh';

export const getTimezone = () => {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('app_timezone');
        if (stored) return stored;
    }
    return DEFAULT_TIMEZONE;
};

export const setTimezone = (tz) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('app_timezone', tz);
    }
};

/**
 * Returns a local Date object that corresponds to the wall-clock time
 * of the provided date in the selected timezone.
 * Useful for extracting year, month, date, hours matching the timezone.
 * DO NOT use this for absolute time comparisons (.getTime()) against real UTC dates.
 */
export const getZonedDate = (date = new Date()) => {
    const tz = getTimezone();
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false
    });

    const parts = formatter.formatToParts(date);
    const getPart = (type) => parts.find(p => p.type === type)?.value;

    const year = parseInt(getPart('year'), 10);
    const month = parseInt(getPart('month'), 10) - 1;
    const day = parseInt(getPart('day'), 10);
    let hour = parseInt(getPart('hour'), 10);
    if (hour === 24) hour = 0; // en-US hour12: false can return 24 for midnight
    const minute = parseInt(getPart('minute'), 10);
    const second = parseInt(getPart('second'), 10);

    return new Date(year, month, day, hour, minute, second);
};
