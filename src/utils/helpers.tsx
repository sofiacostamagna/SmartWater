import moment from "moment";

export const formatDateTime = (
    date: string,
    year: Intl.DateTimeFormatOptions['year'],
    month: Intl.DateTimeFormatOptions['month'],
    day: Intl.DateTimeFormatOptions['day'],
    addTime: boolean = false,
    keepLocal: boolean = false
) => {
    const dateToFormat = keepLocal ? moment.utc(date).local().toDate() : new Date(date);

    const options: Intl.DateTimeFormatOptions = { year, month, day };

    if (addTime) {
        options.hour12 = false;
        options.hour = '2-digit';
        options.minute = '2-digit';
    }

    return dateToFormat.toLocaleDateString('es-AR', options);
};

export const convertTo12HourIntl = (time24: string) => {
    const [hours, minutes] = time24.split(':').map(Number);

    const date = new Date();
    date.setHours(hours, minutes);

    const formatter = new Intl.DateTimeFormat('es-AR', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });

    return formatter.format(date);
}

export function popUpWasBlocked(popUp: Window | null) {
    return !popUp || popUp.closed || typeof popUp.closed === 'undefined'
}