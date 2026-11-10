import { DateTime } from 'luxon';

import {
    CalendarDateRange,
    ExplicitSelection,
    SearchFilterConflict,
    SearchFilterResolution,
} from '../types/search/natural-language-search-request.types';

import { SearchFilters } from '../types/search/natural-language-search.types';
import { ResolvedDateRange } from './relative-date-range.resolver';

const TORONTO_TIMEZONE = 'America/Toronto';

type DateFilters = Pick<SearchFilters, 'startAfter' | 'startBefore'>;

type DateReconciliationInput = {
    aiRange?: Partial<ResolvedDateRange>;
    selection?: ExplicitSelection<CalendarDateRange>;
    resolution?: SearchFilterResolution;
};

export type DateReconciliationResult =
    | {
    filters: DateFilters;
    conflict?: never;
}
    | {
    conflict: SearchFilterConflict;
    filters?: never;
};

function calendarRangeToUtc(
    range: CalendarDateRange,
): DateFilters {
    const start = DateTime.fromISO(range.startDate, {
        zone: TORONTO_TIMEZONE,
    }).startOf('day');

    const end = DateTime.fromISO(range.endDate, {
        zone: TORONTO_TIMEZONE,
    })
        .startOf('day')
        .plus({ days: 1 });

    const startAfter = start.toUTC().toISO();
    const startBefore = end.toUTC().toISO();

    if (!startAfter || !startBefore) {
        throw new Error('Unable to convert calendar date selection');
    }

    return { startAfter, startBefore };
}

function getLaterBoundary(
    first?: string,
    second?: string,
): string | undefined {
    if (first === undefined) return second;
    if (second === undefined) return first;

    return Date.parse(first) >= Date.parse(second)
        ? first
        : second;
}

function getEarlierBoundary(
    first?: string,
    second?: string,
): string | undefined {
    if (first === undefined) return second;
    if (second === undefined) return first;

    return Date.parse(first) <= Date.parse(second)
        ? first
        : second;
}

function hasEmptyIntersection(
    range: DateFilters,
): boolean {
    if (
        range.startAfter === undefined ||
        range.startBefore === undefined
    ) {
        return false;
    }

    return Date.parse(range.startAfter) >= Date.parse(range.startBefore);
}

function formatDateRange(
    range?: Partial<DateFilters>,
): string {
    if (!range?.startAfter && !range?.startBefore) {
        return 'No date restriction';
    }

    const start = range.startAfter
        ? DateTime.fromISO(range.startAfter)
            .setZone(TORONTO_TIMEZONE)
            .toFormat('MMM d, yyyy')
        : 'any date';

    const end = range.startBefore
        ? DateTime.fromISO(range.startBefore)
            .setZone(TORONTO_TIMEZONE)
            .minus({ days: 1 })
            .toFormat('MMM d, yyyy')
        : 'any date';

    if (start === end) return start;

    return `${start} – ${end}`;
}

function formatCalendarSelection(
    selection: ExplicitSelection<CalendarDateRange>,
): string {
    if (selection.state === 'cleared') {
        return 'Explicitly cleared date filter';
    }

    return formatDateRange(calendarRangeToUtc(selection.value));
}

export function reconcileDateFilter({
    aiRange,
    selection,
    resolution,
}: DateReconciliationInput): DateReconciliationResult {
    const aiFilters: DateFilters = {
        ...(aiRange?.startAfter !== undefined
            ? { startAfter: aiRange.startAfter }
            : {}),
        ...(aiRange?.startBefore !== undefined
            ? { startBefore: aiRange.startBefore }
            : {}),
    };

    const hasAiRange =
        aiFilters.startAfter !== undefined ||
        aiFilters.startBefore !== undefined;

    // An explicit resolution means the user has already chosen
    // which interpretation should be used.
    if (resolution === 'ai') {
        return { filters: aiFilters };
    }

    if (resolution === 'selection') {
        if (selection?.state === 'selected') {
            return {
                filters: calendarRangeToUtc(selection.value),
            };
        }

        return { filters: {} };
    }

    // An untouched calendar control does not override AI inference.
    if (selection === undefined) {
        return { filters: aiFilters };
    }

    // A cleared control is meaningful only when it conflicts
    // with an AI-inferred restriction.
    if (selection.state === 'cleared') {
        if (!hasAiRange) {
            return { filters: {} };
        }

        return {
            conflict: {
                category: 'date',
                aiInterpretation: formatDateRange(aiFilters),
                userSelection: formatCalendarSelection(selection),
            },
        };
    }

    const calendarFilters = calendarRangeToUtc(selection.value);

    // If AI did not infer a date restriction, use the calendar.
    if (!hasAiRange) {
        return { filters: calendarFilters };
    }

    // Intersect the AI and calendar ranges.
    const intersection: DateFilters = {
        startAfter: getLaterBoundary(
            aiFilters.startAfter,
            calendarFilters.startAfter,
        ),
        startBefore: getEarlierBoundary(
            aiFilters.startBefore,
            calendarFilters.startBefore,
        ),
    };

    if (hasEmptyIntersection(intersection)) {
        return {
            conflict: {
                category: 'date',
                aiInterpretation: formatDateRange(aiFilters),
                userSelection: formatCalendarSelection(selection),
            },
        };
    }

    return {
        filters: {
            ...(intersection.startAfter !== undefined
                ? { startAfter: intersection.startAfter }
                : {}),
            ...(intersection.startBefore !== undefined
                ? { startBefore: intersection.startBefore }
                : {}),
        },
    };
}
