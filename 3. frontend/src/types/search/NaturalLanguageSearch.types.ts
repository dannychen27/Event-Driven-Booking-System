import type { Event } from "../events/Event.ts";

export type TimeOfDay =
    | "EARLY_MORNING"
    | "MORNING"
    | "AFTERNOON"
    | "EVENING"
    | "NIGHT";

export type TimeRange = {
    startTime?: string;
    endTime?: string;
};

export type TimeInterval = {
    startMinute: number;
    endMinute: number;
};

export type SearchFilters = {
    keyword?: string;
    startAfter?: string;
    startBefore?: string;
    timeOfDay?: TimeOfDay[];
    timeRange?: TimeRange;
    timeIntervals?: TimeInterval[];
    includePastEvents?: boolean;
    includeFutureEvents?: boolean;
};

export type ExplicitSelection<T> =
    | {
    state: "selected";
    value: T;
}
    | {
    state: "cleared";
};

export type CalendarDateRange = {
    startDate: string;
    endDate: string;
};

export type CalendarTimeSelection = {
    timeOfDay?: TimeOfDay[];
    timeRange?: TimeRange;
};

export type NaturalLanguageSearchFilters = {
    date?: ExplicitSelection<CalendarDateRange>;
    time?: ExplicitSelection<CalendarTimeSelection>;
};

export type SearchFilterResolution = "ai" | "selection";

export type NaturalLanguageSearchResolutions = {
    date?: SearchFilterResolution;
    time?: SearchFilterResolution;
};

export type NaturalLanguageSearchRequest = {
    query?: string;
    filters?: NaturalLanguageSearchFilters;
    resolutions?: NaturalLanguageSearchResolutions;
};

export type SearchFilterConflict = {
    category: "date" | "time";
    aiInterpretation: string;
    userSelection: string;
};

export type NaturalLanguageSearchResponse =
    | {
    status: "success";
    events: Event[];
    appliedFilters: SearchFilters;
}
    | {
    status: "clarification_required";
    conflicts: SearchFilterConflict[];
};
