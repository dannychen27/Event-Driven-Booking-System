import {
    CalendarTimeSelection,
    ExplicitSelection,
    SearchFilterConflict,
    SearchFilterResolution,
} from '../types/search/natural-language-search-request.types';
import {
    TimeOfDay,
    TimeRange,
    TimeInterval,
} from '../types/search/time-range.types';

import { buildTimeOfDayIntervals } from './time-of-day-intervals';

const MINUTES_PER_DAY = 24 * 60;

export type NormalizedTimeInterval = TimeInterval;

type TimeReconciliationInput = {
    aiTimeOfDay?: TimeOfDay[];
    aiTimeRange?: TimeRange;
    selection?: ExplicitSelection<CalendarTimeSelection>;
    resolution?: SearchFilterResolution;
};

export type TimeReconciliationResult =
    | {
    intervals?: NormalizedTimeInterval[];
    conflict?: never;
}
    | {
    conflict: SearchFilterConflict;
    intervals?: never;
};

function parseTime(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

function normalizeIntervals(
    intervals: NormalizedTimeInterval[],
): NormalizedTimeInterval[] {
    const sorted = [...intervals]
        .filter(({ startMinute, endMinute }) => startMinute < endMinute)
        .sort((a, b) => a.startMinute - b.startMinute);

    const merged: NormalizedTimeInterval[] = [];

    for (const interval of sorted) {
        const previous = merged[merged.length - 1];

        if (
            previous &&
            interval.startMinute <= previous.endMinute
        ) {
            previous.endMinute = Math.max(
                previous.endMinute,
                interval.endMinute,
            );
        } else {
            merged.push({ ...interval });
        }
    }

    return merged;
}

function intersectIntervals(
    first: NormalizedTimeInterval[],
    second: NormalizedTimeInterval[],
): NormalizedTimeInterval[] {
    const intersections: NormalizedTimeInterval[] = [];

    for (const a of first) {
        for (const b of second) {
            const startMinute = Math.max(
                a.startMinute,
                b.startMinute,
            );

            const endMinute = Math.min(
                a.endMinute,
                b.endMinute,
            );

            if (startMinute < endMinute) {
                intersections.push({
                    startMinute,
                    endMinute,
                });
            }
        }
    }

    return normalizeIntervals(intersections);
}

function timeRangeToIntervals(
    range: TimeRange,
): NormalizedTimeInterval[] {
    const start = range.startTime !== undefined
        ? parseTime(range.startTime)
        : undefined;

    const end = range.endTime !== undefined
        ? parseTime(range.endTime)
        : undefined;

    if (start === undefined && end === undefined) {
        return [];
    }

    if (start !== undefined && end === undefined) {
        return [{
            startMinute: start,
            endMinute: MINUTES_PER_DAY,
        }];
    }

    if (start === undefined && end !== undefined) {
        return [{
            startMinute: 0,
            endMinute: end,
        }];
    }

    // A range whose end is earlier than its start crosses midnight.
    if (start! > end!) {
        return [
            {
                startMinute: 0,
                endMinute: end!,
            },
            {
                startMinute: start!,
                endMinute: MINUTES_PER_DAY,
            },
        ];
    }

    return [{
        startMinute: start!,
        endMinute: end!,
    }];
}

function buildConstraintIntervals(
    timeOfDay?: TimeOfDay[],
    timeRange?: TimeRange,
): NormalizedTimeInterval[] | undefined {
    let intervals = buildTimeOfDayIntervals(timeOfDay);

    if (timeRange !== undefined) {
        const rangeIntervals = timeRangeToIntervals(timeRange);

        intervals = intervals === undefined
            ? rangeIntervals
            : intersectIntervals(intervals, rangeIntervals);
    }

    return intervals;
}

function buildAiIntervals(
    timeOfDay?: TimeOfDay[],
    timeRange?: TimeRange,
): NormalizedTimeInterval[] | undefined {
    return buildConstraintIntervals(timeOfDay, timeRange);
}

function buildSelectionIntervals(
    selection: ExplicitSelection<CalendarTimeSelection>,
): NormalizedTimeInterval[] | undefined {
    if (selection.state === 'cleared') {
        return undefined;
    }

    return buildConstraintIntervals(
        selection.value.timeOfDay,
        selection.value.timeRange,
    );
}

function formatMinute(minute: number): string {
    const normalized = minute === MINUTES_PER_DAY ? 0 : minute;
    const hours = Math.floor(normalized / 60);
    const minutes = normalized % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function formatIntervals(
    intervals?: NormalizedTimeInterval[],
): string {
    if (intervals === undefined) {
        return 'No time restriction';
    }

    if (intervals.length === 0) {
        return 'No overlapping time';
    }

    return intervals
        .map(({ startMinute, endMinute }) => {
            if (
                startMinute === 0 &&
                endMinute === MINUTES_PER_DAY
            ) {
                return 'Any time';
            }

            return `${formatMinute(startMinute)}–${formatMinute(endMinute)}`;
        })
        .join(' and ');
}

function formatTimeOfDay(value?: TimeOfDay[]): string {
    if (value === undefined) {
        return '';
    }

    return value
        .map((period) => period.toLowerCase().replace('_', ' '))
        .join(' or ');
}

function formatTimeRange(value?: TimeRange): string {
    if (value === undefined) return '';

    if (value.startTime && value.endTime) {
        return `${value.startTime}–${value.endTime}`;
    }

    if (value.startTime) return `After ${value.startTime}`;
    if (value.endTime) return `Before ${value.endTime}`;

    return '';
}

function formatAiInterpretation(
    timeOfDay?: TimeOfDay[],
    timeRange?: TimeRange,
): string {
    const parts = [
        formatTimeOfDay(timeOfDay),
        formatTimeRange(timeRange),
    ].filter(Boolean);

    return parts.length > 0
        ? parts.join(', ')
        : 'No time restriction';
}

function formatUserSelection(
    selection: ExplicitSelection<CalendarTimeSelection>,
): string {
    if (selection.state === 'cleared') {
        return 'Explicitly cleared time filter';
    }

    const parts = [
        formatTimeOfDay(selection.value.timeOfDay),
        formatTimeRange(selection.value.timeRange),
    ].filter(Boolean);

    return parts.length > 0
        ? parts.join(', ')
        : 'No time restriction selected';
}

export function reconcileTimeFilter({
    aiTimeOfDay,
    aiTimeRange,
    selection,
    resolution,
}: TimeReconciliationInput): TimeReconciliationResult {
    const aiIntervals = buildAiIntervals(
        aiTimeOfDay,
        aiTimeRange,
    );

    const hasAiRestriction = aiIntervals !== undefined;

    if (resolution === 'ai') {
        return { intervals: aiIntervals };
    }

    if (resolution === 'selection') {
        if (selection?.state === 'selected') {
            return {
                intervals: buildSelectionIntervals(selection),
            };
        }

        return { intervals: undefined };
    }

    if (selection === undefined) {
        return { intervals: aiIntervals };
    }

    if (selection.state === 'cleared') {
        if (!hasAiRestriction) {
            return { intervals: undefined };
        }

        return {
            conflict: {
                category: 'time',
                aiInterpretation: formatAiInterpretation(
                    aiTimeOfDay,
                    aiTimeRange,
                ),
                userSelection: formatUserSelection(selection),
            },
        };
    }

    const selectionIntervals = buildSelectionIntervals(selection);

    if (!hasAiRestriction) {
        return { intervals: selectionIntervals };
    }

    // An empty selected constraint is not a restriction.
    if (selectionIntervals === undefined) {
        return { intervals: aiIntervals };
    }

    const intersection = intersectIntervals(
        aiIntervals,
        selectionIntervals,
    );

    if (intersection.length === 0) {
        return {
            conflict: {
                category: 'time',
                aiInterpretation: formatAiInterpretation(
                    aiTimeOfDay,
                    aiTimeRange,
                ),
                userSelection: formatUserSelection(selection),
            },
        };
    }

    return { intervals: intersection };
}
