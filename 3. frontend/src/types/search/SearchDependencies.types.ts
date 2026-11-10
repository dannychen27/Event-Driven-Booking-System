import type { Event } from "../events/Event.ts";
import type {
    CalendarDateRange,
    CalendarTimeSelection,
    ExplicitSelection,
    NaturalLanguageSearchResolutions,
    SearchFilterConflict,
} from "./NaturalLanguageSearch.types.ts";

export interface SearchHandlerDependencies {
    query: string;
    searchRequestId: { current: number };
    setEvents: (events: Event[]) => void;
    setSearching: (searching: boolean) => void;
    setSearchError: (error: string) => void;
    setIsSearchActive: (active: boolean) => void;
}

export interface NaturalLanguageSearchHandlerDependencies
    extends SearchHandlerDependencies {
    dateSelection?: ExplicitSelection<CalendarDateRange>;
    timeSelection?: ExplicitSelection<CalendarTimeSelection>;
    setClarificationConflicts: (
        conflicts: SearchFilterConflict[] | null,
    ) => void;
}

export interface NaturalLanguageSearchResolutionDependencies
    extends NaturalLanguageSearchHandlerDependencies {
    conflicts: SearchFilterConflict[];
    resolutions: NaturalLanguageSearchResolutions;
}

export interface ClearSearchDependencies {
    searchRequestId: { current: number };
    setEvents: (events: Event[]) => void;
    setSearching: (searching: boolean) => void;
    setSearchError: (error: string) => void;
    setIsSearchActive: (active: boolean) => void;
    setKeyword: (keyword: string) => void;
    setNaturalLanguageQuery: (query: string) => void;
    setClarificationConflicts: (
        conflicts: SearchFilterConflict[] | null,
    ) => void;
    setDateSelection?: (
        selection: ExplicitSelection<CalendarDateRange> | undefined,
    ) => void;
    setTimeSelection?: (
        selection: ExplicitSelection<CalendarTimeSelection> | undefined,
    ) => void;
}
