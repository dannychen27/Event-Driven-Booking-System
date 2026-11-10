import { TimeInterval, TimeOfDay } from '../types/search/time-range.types';

const TIME_OF_DAY_INTERVALS: Record<TimeOfDay, TimeInterval[]> = {
    EARLY_MORNING: [
        { startMinute: 300, endMinute: 480 },
    ],
    MORNING: [
        { startMinute: 480, endMinute: 720 },
    ],
    AFTERNOON: [
        { startMinute: 720, endMinute: 1020 },
    ],
    EVENING: [
        { startMinute: 1020, endMinute: 1260 },
    ],
    NIGHT: [
        { startMinute: 0, endMinute: 300 },
        { startMinute: 1260, endMinute: 1440 },
    ],
};

function normalizeIntervals(intervals: TimeInterval[]): TimeInterval[] {
    const sortedIntervals = [...intervals].sort(
        (a, b) => a.startMinute - b.startMinute,
    );

    const normalized: TimeInterval[] = [];

    for (const interval of sortedIntervals) {
        const previous = normalized[normalized.length - 1];

        if (!previous || interval.startMinute > previous.endMinute) {
            normalized.push({ ...interval });
            continue;
        }

        previous.endMinute = Math.max(
            previous.endMinute,
            interval.endMinute,
        );
    }

    return normalized;
}

/**
 * Converts selected time-of-day periods into normalized intervals.
 *
 * Multiple periods are combined using OR. Adjacent or overlapping
 * intervals are merged to simplify downstream SQL filtering.
 *
 * Returns undefined when no time-of-day filter was supplied.
 * Returns an empty array when an empty selection was supplied.
 */
export function buildTimeOfDayIntervals(
    timeOfDay?: TimeOfDay[],
): TimeInterval[] | undefined {
    if (timeOfDay === undefined) {
        return undefined;
    }

    const intervals = timeOfDay.flatMap(
        (period) => TIME_OF_DAY_INTERVALS[period].map(
            (interval) => ({ ...interval }),
        ),
    );

    return normalizeIntervals(intervals);
}
