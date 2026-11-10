import type { FormEvent } from "react";
import type { Event } from "../../types/events/Event.ts";
import {
    getEvents,
    searchEvents,
    searchEventsNaturalLanguage,
} from "../../api/events.ts";
import { getErrorMessage } from "../shared/Errors.ts";
import type {
    ClearSearchDependencies,
    NaturalLanguageSearchHandlerDependencies,
    NaturalLanguageSearchResolutionDependencies,
    SearchHandlerDependencies,
} from "../../types/search/SearchDependencies.types.ts";
import type {
    NaturalLanguageSearchRequest,
    SearchFilterConflict,
} from "../../types/search/NaturalLanguageSearch.types.ts";

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

function buildNaturalLanguageSearchRequest(
    dependencies: NaturalLanguageSearchHandlerDependencies,
    resolutions?: NaturalLanguageSearchResolutionDependencies["resolutions"],
): NaturalLanguageSearchRequest {
    const query = dependencies.query.trim();

    const filters = {
        ...(dependencies.dateSelection
            ? { date: dependencies.dateSelection }
            : {}),
        ...(dependencies.timeSelection
            ? { time: dependencies.timeSelection }
            : {}),
    };

    return {
        ...(query ? { query } : {}),
        ...(Object.keys(filters).length > 0 ? { filters } : {}),
        ...(resolutions ? { resolutions } : {}),
    };
}

async function executeNaturalLanguageSearch(
    dependencies: NaturalLanguageSearchHandlerDependencies,
    resolutions?: NaturalLanguageSearchResolutionDependencies["resolutions"],
) {
    const requestId = ++dependencies.searchRequestId.current;

    dependencies.setSearching(true);
    dependencies.setSearchError("");
    dependencies.setIsSearchActive(true);

    try {
        const response = await searchEventsNaturalLanguage(
            buildNaturalLanguageSearchRequest(dependencies, resolutions),
        );

        if (requestId !== dependencies.searchRequestId.current) return;

        if (response.status === "clarification_required") {
            dependencies.setClarificationConflicts(response.conflicts);
            return;
        }

        dependencies.setEvents(response.events);
        dependencies.setClarificationConflicts(null);
    } catch (error) {
        if (requestId !== dependencies.searchRequestId.current) return;

        dependencies.setSearchError(
            getErrorMessage(
                error,
                "Failed to search events with natural language",
            ),
        );
    } finally {
        if (requestId === dependencies.searchRequestId.current) {
            dependencies.setSearching(false);
        }
    }
}

export async function handleNaturalLanguageSearch(
    event: FormEvent<HTMLFormElement>,
    dependencies: NaturalLanguageSearchHandlerDependencies,
) {
    event.preventDefault();

    const query = dependencies.query.trim();
    const hasSelectedDate =
        dependencies.dateSelection?.state === "selected";
    const hasSelectedTime =
        dependencies.timeSelection?.state === "selected";

    if (!query && !hasSelectedDate && !hasSelectedTime) {
        dependencies.setSearchError(
            "Enter a description of the events you're looking for.",
        );
        return;
    }

    dependencies.setClarificationConflicts(null);
    await executeNaturalLanguageSearch(dependencies);
}

export async function handleResolveNaturalLanguageSearch(
    dependencies: NaturalLanguageSearchResolutionDependencies,
) {
    const hasAllResolutions = dependencies.conflicts.every(
        (conflict: SearchFilterConflict) =>
            dependencies.resolutions[conflict.category] !== undefined,
    );

    if (!hasAllResolutions) return;

    await executeNaturalLanguageSearch(
        dependencies,
        dependencies.resolutions,
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
    dependencies.setClarificationConflicts(null);
    dependencies.setDateSelection?.(undefined);
    dependencies.setTimeSelection?.(undefined);

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
