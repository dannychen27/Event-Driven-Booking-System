import { EventCandidate } from '../events/events.types';
import { SearchFilters } from './natural-language-search.types';
import { TimeOfDay, TimeRange } from './time-range.types';

export type ExplicitSelection<T> =
    | {
    state: 'selected';
    value: T;
}
    | {
    state: 'cleared';
};

export type CalendarDateRange = {
    startDate: string;
    endDate: string;
};

export type CalendarTimeSelection = {
    timeOfDay?: TimeOfDay;
    timeRange?: TimeRange;
};

export type NaturalLanguageSearchFilters = {
    date?: ExplicitSelection<CalendarDateRange>;
    time?: ExplicitSelection<CalendarTimeSelection>;
};

export type SearchFilterResolution = 'ai' | 'selection';

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
    category: 'date' | 'time';
    aiInterpretation: string;
    userSelection: string;
};

export type NaturalLanguageSearchResponse =
    | {
    status: 'success';
    events: EventCandidate[];
    appliedFilters: SearchFilters;
}
    | {
    status: 'clarification_required';
    conflicts: SearchFilterConflict[];
};
