export const getPastDateByDays = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
}
export const getPastDateByMonths = (months: number) => {
    const date = new Date();
    date.setMonth(date.getMonth() - months);
    return date;
};
export const formatDateForApiV4 = (date: Date) => {
    return date.toISOString().slice(0, 19);
};
export const getPastDateByYears = (years: number) => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - years);
    return date;
};
export const formatDateForDisplay = (dateString: string | undefined, locale = 'en-US') => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (e) {
        return 'Invalid Date';
    }
}
export const formatDateRelative = (dateString: string | undefined, locale: string = 'en-US'): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);

    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);
    const weeks = Math.round(days / 7);
    const months = Math.round(days / 30);
    const years = Math.round(days / 365);

    try {
        const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

        if (seconds < 60) {
            return rtf.format(-seconds, 'second');
        } else if (minutes < 60) {
            return rtf.format(-minutes, 'minute');
        } else if (hours < 24) {
            return rtf.format(-hours, 'hour');
        } else if (days < 7) {
            return rtf.format(-days, 'day');
        } else if (weeks < 5) {
            return rtf.format(-weeks, 'week');
        } else if (months < 12) {
            return rtf.format(-months, 'month');
        } else {
            return rtf.format(-years, 'year');
        }
    } catch (e) {
        if (years > 0) return `${years} year(s) ago`;
        if (months > 0) return `${months} month(s) ago`;
        if (weeks > 0) return `${weeks} week(s) ago`;
        if (days > 0) return `${days} day(s) ago`;
        if (hours > 0) return `${hours} hour(s) ago`;
        if (minutes > 0) return `${minutes} minute(s) ago`;
        return `just now`;
    }
};
export const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export const formatAxisLabel = (value: number, locale: string = 'en-US'): string => {
    const num = Math.round(value);

    // A more robust way to format large numbers for chart axes, avoiding potential
    // browser/environment inconsistencies with `notation: 'compact'`.
    if (num >= 1000000) {
        return (num / 1000000).toLocaleString(locale, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 1,
        }) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toLocaleString(locale, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 1,
        }) + 'K';
    }
    return num.toLocaleString(locale);
};