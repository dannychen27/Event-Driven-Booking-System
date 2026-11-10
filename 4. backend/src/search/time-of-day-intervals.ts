import {
    getTimeOfDayIntervals,
    type TimeOfDay,
    type TimeInterval,
} from '../../../5. shared/src/time-of-day';

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
        (period) => getTimeOfDayIntervals(period),
    );

    return normalizeIntervals(intervals);
}
