export type TimeOfDay =
    | 'EARLY_MORNING'
    | 'MORNING'
    | 'AFTERNOON'
    | 'EVENING'
    | 'NIGHT';

export interface TimeOfDayRange {
    startMinute: number;
    endMinute: number;
}

export interface TimeInterval {
    /** Inclusive minute offset from midnight, in [0, 1439]. */
    startMinute: number;

    /** Exclusive minute offset from midnight, in [1, 1440]. */
    endMinute: number;
}

export const TIME_OF_DAY_RANGES: Record<TimeOfDay, TimeOfDayRange> = {
    EARLY_MORNING: {
        startMinute: 300,
        endMinute: 480,
    },
    MORNING: {
        startMinute: 480,
        endMinute: 720,
    },
    AFTERNOON: {
        startMinute: 720,
        endMinute: 1020,
    },
    EVENING: {
        startMinute: 1020,
        endMinute: 1260,
    },
    NIGHT: {
        startMinute: 1260,
        endMinute: 300,
    },
};

export function getTimeOfDayIntervals(period: TimeOfDay): TimeInterval[] {
    const { startMinute, endMinute } = TIME_OF_DAY_RANGES[period];

    if (endMinute > startMinute) {
        return [{ startMinute, endMinute }];
    }

    return [
        {
            startMinute: 0,
            endMinute,
        },
        {
            startMinute,
            endMinute: 1440,
        },
    ];
}
