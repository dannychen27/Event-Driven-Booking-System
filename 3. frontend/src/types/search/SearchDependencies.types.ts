import type { Event } from "../events/Event.ts";

export interface SearchHandlerDependencies {
    query: string;
    searchRequestId: { current: number };
    setEvents: (events: Event[]) => void;
    setSearching: (searching: boolean) => void;
    setSearchError: (error: string) => void;
    setIsSearchActive: (active: boolean) => void;
}

export interface ClearSearchDependencies {
    searchRequestId: { current: number };
    setEvents: (events: Event[]) => void;
    setSearching: (searching: boolean) => void;
    setSearchError: (error: string) => void;
    setIsSearchActive: (active: boolean) => void;
    setKeyword: (keyword: string) => void;
    setNaturalLanguageQuery: (query: string) => void;
}