export type TimeOfDay =
    | 'EARLY_MORNING'
    | 'MORNING'
    | 'AFTERNOON'
    | 'EVENING'
    | 'NIGHT';

export type TimeRange = {
    startTime?: string;
    endTime?: string;
};

export type TimeInterval = {
    /** Inclusive minute offset from midnight, in [0, 1439]. */
    startMinute: number;

    /** Exclusive minute offset from midnight, in [1, 1440]. */
    endMinute: number;
};
