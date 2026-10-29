import type { FormEvent } from "react";
import type { Event } from "../types/Event";
import { getEvents, searchEvents, searchEventsNaturalLanguage } from "../api/events";
import { getErrorMessage } from "../utils/Errors";

interface SearchHandlerDependencies {
    query: string;
    searchRequestId: { current: number };
    setEvents: (events: Event[]) => void;
    setSearching: (searching: boolean) => void;
    setSearchError: (error: string) => void;
    setIsSearchActive: (active: boolean) => void;
}

interface ClearSearchDependencies {
    searchRequestId: { current: number };
    setEvents: (events: Event[]) => void;
    setSearching: (searching: boolean) => void;
    setSearchError: (error: string) => void;
    setIsSearchActive: (active: boolean) => void;
    setKeyword: (keyword: string) => void;
    setNaturalLanguageQuery: (query: string) => void;
}

async function executeSearch(
    event: FormEvent<HTMLFormElement>,
    dependencies: SearchHandlerDependencies,
    search: (query: string) => Promise<Event[]>,
    emptyQueryMessage: string,
    failureMessage: string,
) {
    event.preventDefault();

    const query = dependencies.query.trim();

    if (!query) {
        dependencies.setSearchError(emptyQueryMessage);
        return;
    }

    const requestId = ++dependencies.searchRequestId.current;

    dependencies.setSearching(true);
    dependencies.setSearchError("");
    dependencies.setIsSearchActive(true);

    try {
        const results = await search(query);

        if (requestId !== dependencies.searchRequestId.current) return;

        dependencies.setEvents(results);
    } catch (error) {
        if (requestId !== dependencies.searchRequestId.current) return;

        dependencies.setSearchError(getErrorMessage(error, failureMessage));
    } finally {
        if (requestId === dependencies.searchRequestId.current) {
            dependencies.setSearching(false);
        }
    }
}

export function handleSearch(
    event: FormEvent<HTMLFormElement>,
    dependencies: SearchHandlerDependencies,
) {
    return executeSearch(
        event,
        dependencies,
        searchEvents,
        "Enter a keyword to search.",
        "Failed to search events",
    );
}

export function handleNaturalLanguageSearch(
    event: FormEvent<HTMLFormElement>,
    dependencies: SearchHandlerDependencies,
) {
    return executeSearch(
        event,
        dependencies,
        searchEventsNaturalLanguage,
        "Enter a description of the events you're looking for.",
        "Failed to search events with natural language",
    );
}

export async function handleClearSearch(
    dependencies: ClearSearchDependencies,
) {
    const requestId = ++dependencies.searchRequestId.current;

    dependencies.setKeyword("");
    dependencies.setNaturalLanguageQuery("");
    dependencies.setSearchError("");
    dependencies.setSearching(false);
    dependencies.setIsSearchActive(false);

    try {
        const results = await getEvents();

        if (requestId !== dependencies.searchRequestId.current) return;

        dependencies.setEvents(results);
    } catch (error) {
        if (requestId !== dependencies.searchRequestId.current) return;

        dependencies.setSearchError(
            getErrorMessage(error, "Failed to reload events"),
        );
    }
}
