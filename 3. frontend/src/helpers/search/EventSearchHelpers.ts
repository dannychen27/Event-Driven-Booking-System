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
    NaturalLanguageSearchFilters,
    NaturalLanguageSearchRequest,
    SearchFilterConflict,
} from "../../types/search/NaturalLanguageSearch.types.ts";

function buildCalendarSearchFilters(
    dependencies: SearchHandlerDependencies,
): NaturalLanguageSearchFilters | undefined {
    const filters = {
        ...(dependencies.dateSelection
            ? { date: dependencies.dateSelection }
            : {}),
        ...(dependencies.timeSelection
            ? { time: dependencies.timeSelection }
            : {}),
    };

    return Object.keys(filters).length > 0 ? filters : undefined;
}

async function executeSearch(
    event: FormEvent<HTMLFormElement>,
    dependencies: SearchHandlerDependencies,
    search: (
        query: string,
        filters?: NaturalLanguageSearchFilters,
    ) => Promise<Event[]>,
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
        const results = await search(
            query,
            buildCalendarSearchFilters(dependencies),
        );

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

export async function handleApplyCalendarFilters(
    dependencies: NaturalLanguageSearchHandlerDependencies,
) {
    const hasSelectedDate =
        dependencies.dateSelection?.state === "selected" &&
        Boolean(
            dependencies.dateSelection.value.startDate ||
            dependencies.dateSelection.value.endDate,
        );

    const hasSelectedTime =
        dependencies.timeSelection?.state === "selected" &&
        Boolean(
            dependencies.timeSelection.value.timeOfDay?.length ||
            dependencies.timeSelection.value.timeRange?.startTime ||
            dependencies.timeSelection.value.timeRange?.endTime,
        );

    if (!hasSelectedDate && !hasSelectedTime) {
        dependencies.setSearchError("Select at least one date or time filter.");
        return;
    }

    dependencies.setClarificationConflicts(null);

    // Deliberately suppress any AI prompt currently in the text box.
    // This guarantees that applying filters never invokes Gemini.
    await executeNaturalLanguageSearch({
        ...dependencies,
        query: "",
    });
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
