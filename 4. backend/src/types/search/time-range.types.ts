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
