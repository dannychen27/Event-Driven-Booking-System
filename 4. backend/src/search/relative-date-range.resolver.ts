import { DateTime } from 'luxon';
import { RelativeDateRange, Weekday } from '../types/search/relative-date-range.types';

const TORONTO_TIMEZONE = 'America/Toronto';
const MAX_DATE_OFFSET_DAYS = 365;

const WEEKDAY_NUMBERS: Record<Weekday, number> = {
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
    SUNDAY: 7,
};

export type ResolvedDateRange = {
    startAfter: string;
    startBefore: string;
};

function validateOffset(days: number): void {
    if (
        !Number.isInteger(days) ||
        days < 1 ||
        days > MAX_DATE_OFFSET_DAYS
    ) {
        throw new Error(
            `Date offset must be an integer between 1 and ${MAX_DATE_OFFSET_DAYS}`,
        );
    }
}

function isBusinessDay(date: DateTime): boolean {
    return date.weekday >= 1 && date.weekday <= 5;
}

function addBusinessDays(
    date: DateTime,
    days: number,
    direction: 1 | -1,
): DateTime {
    let result = date;
    let remaining = days;

    while (remaining > 0) {
        result = result.plus({ days: direction });

        if (isBusinessDay(result)) {
            remaining -= 1;
        }
    }

    return result;
}

function getSundayOfWeek(date: DateTime): DateTime {
    return date.minus({ days: date.weekday % 7 });
}

function resolveWeekday(
    today: DateTime,
    weekday: Weekday,
    occurrence: 'THIS' | 'NEXT' | 'LAST',
): DateTime {
    const targetWeekday = WEEKDAY_NUMBERS[weekday];
    const difference = targetWeekday - today.weekday;

    switch (occurrence) {
        case 'THIS':
            return today.plus({ days: difference });

        case 'NEXT':
            return today.plus({
                days: (difference + 7) % 7 || 7,
            });

        case 'LAST':
            return today.minus({
                days: (7 - difference + 7) % 7 || 7,
            });
    }
}

function toUtcIso(date: DateTime): string {
    const iso = date.toUTC().toISO();

    if (!iso) {
        throw new Error('Unable to serialize resolved date boundary');
    }

    return iso;
}

export function resolveRelativeDateRange(
    relativeDate: RelativeDateRange,
    referenceDate: Date,
): ResolvedDateRange {
    if (Number.isNaN(referenceDate.getTime())) {
        throw new Error('Reference date must be valid');
    }

    const today = DateTime.fromJSDate(referenceDate, {
        zone: TORONTO_TIMEZONE,
    }).startOf('day');

    let start: DateTime;
    let end: DateTime;

    switch (relativeDate.kind) {
        case 'TODAY':
            start = today;
            end = start.plus({ days: 1 });
            break;

        case 'TOMORROW':
            start = today.plus({ days: 1 });
            end = start.plus({ days: 1 });
            break;

        case 'YESTERDAY':
            start = today.minus({ days: 1 });
            end = start.plus({ days: 1 });
            break;

        case 'THIS_WEEK':
            start = getSundayOfWeek(today);
            end = start.plus({ days: 7 });
            break;

        case 'NEXT_WEEK':
            start = getSundayOfWeek(today).plus({ days: 7 });
            end = start.plus({ days: 7 });
            break;

        case 'LAST_WEEK':
            start = getSundayOfWeek(today).minus({ days: 7 });
            end = start.plus({ days: 7 });
            break;

        case 'DAYS_FROM_NOW':
            validateOffset(relativeDate.days);
            start = today.plus({ days: relativeDate.days });
            end = start.plus({ days: 1 });
            break;

        case 'DAYS_AGO':
            validateOffset(relativeDate.days);
            start = today.minus({ days: relativeDate.days });
            end = start.plus({ days: 1 });
            break;

        case 'THIS_WEEKEND': {
            const monday = today.minus({ days: today.weekday - 1 });
            start = monday.plus({ days: 5 });
            end = start.plus({ days: 2 });
            break;
        }

        case 'NEXT_WEEKEND': {
            const monday = today.minus({ days: today.weekday - 1 });
            start = monday.plus({ days: 12 });
            end = start.plus({ days: 2 });
            break;
        }

        case 'WEEKDAY':
            start = resolveWeekday(
                today,
                relativeDate.weekday,
                relativeDate.occurrence,
            );
            end = start.plus({ days: 1 });
            break;

        case 'NEXT_BUSINESS_DAY':
            start = addBusinessDays(today, 1, 1);
            end = start.plus({ days: 1 });
            break;

        case 'PREVIOUS_BUSINESS_DAY':
            start = addBusinessDays(today, 1, -1);
            end = start.plus({ days: 1 });
            break;

        case 'BUSINESS_DAYS_FROM_NOW':
            validateOffset(relativeDate.days);
            start = addBusinessDays(today, relativeDate.days, 1);
            end = start.plus({ days: 1 });
            break;

        case 'BUSINESS_DAYS_AGO':
            validateOffset(relativeDate.days);
            start = addBusinessDays(today, relativeDate.days, -1);
            end = start.plus({ days: 1 });
            break;

        default: {
            throw new Error(`Unsupported relative date: ${relativeDate}`);
        }
    }

    return {
        startAfter: toUtcIso(start),
        startBefore: toUtcIso(end),
    };
}
