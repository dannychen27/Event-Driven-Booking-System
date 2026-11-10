import { useEffect, useRef, useState } from "react";
import type { Event } from "../types/events/Event.ts";
import type {
    CalendarDateRange,
    CalendarTimeSelection,
    ExplicitSelection,
    NaturalLanguageSearchResolutions,
    SearchFilterConflict,
    SearchFilterResolution,
} from "../types/search/NaturalLanguageSearch.types.ts";
import "../styles/pages/events-page.css";
import "../styles/errors/error-message.css";
import "../styles/errors/status-message.css";
import "../styles/errors/empty-state-message.css";
import { getErrorMessage } from "../helpers/shared/Errors.ts";
import {
    handleClearSearch,
    handleNaturalLanguageSearch,
    handleResolveNaturalLanguageSearch,
    handleSearch,
} from "../helpers/search/EventSearchHelpers.ts";
import { getEvents } from "../api/events";
import EventSearchForm from "../components/forms/EventSearchForm.tsx";
import AiSearchForm from "../components/forms/AiSearchForm";
import SearchFilterClarification from "../components/forms/SearchFilterClarification.tsx";
import {
    displayAllEvents,
    displayNoEvents,
} from "../helpers/events/EventsPageHelpers.tsx";

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [keyword, setKeyword] = useState("");
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState("");
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [naturalLanguageQuery, setNaturalLanguageQuery] = useState("");
    const [clarificationConflicts, setClarificationConflicts] =
        useState<SearchFilterConflict[] | null>(null);
    const [clarificationResolutions, setClarificationResolutions] =
        useState<NaturalLanguageSearchResolutions>({});

    const [dateSelection, setDateSelection] = useState<
        ExplicitSelection<CalendarDateRange> | undefined
    >(undefined);

    const [timeSelection, setTimeSelection] = useState<
        ExplicitSelection<CalendarTimeSelection> | undefined
    >(undefined);

    const searchRequestId = useRef(0);

    function clearClarification() {
        setClarificationConflicts(null);
        setClarificationResolutions({});
    }

    function updateClarificationConflicts(
        conflicts: SearchFilterConflict[] | null,
    ) {
        setClarificationConflicts(conflicts);

        if (conflicts) {
            setClarificationResolutions({});
        }
    }

    function updateClarificationResolution(
        category: SearchFilterConflict["category"],
        resolution: SearchFilterResolution,
    ) {
        setClarificationResolutions((current) => ({
            ...current,
            [category]: resolution,
        }));
    }

    useEffect(() => {
        async function fetchEvents() {
            try {
                const events = await getEvents();
                setEvents(events);
            } catch (error) {
                setError(getErrorMessage(error, "Failed to load events"));
            } finally {
                setLoading(false);
            }
        }

        void fetchEvents();
    }, []);

    if (loading) {
        return (
            <p className="status-message" role="status">
                Loading events...
            </p>
        );
    }

    if (error) {
        return (
            <p className="error-message" role="alert">
                {error}
            </p>
        );
    }

    return (
        <div className="events-page">
            <h1>Events</h1>

            <EventSearchForm
                keyword={keyword}
                searching={searching}
                onKeywordChange={(value) => {
                    setKeyword(value);
                    setSearchError("");
                    clearClarification();
                }}
                onSearch={(event) =>
                    handleSearch(event, {
                        query: keyword,
                        searchRequestId,
                        setEvents,
                        setSearching,
                        setSearchError,
                        setIsSearchActive,
                    })
                }
                onClearQuery={() =>
                    void handleClearSearch({
                        searchRequestId,
                        setEvents,
                        setSearching,
                        setSearchError,
                        setIsSearchActive,
                        setKeyword,
                        setNaturalLanguageQuery,
                        setClarificationConflicts,
                        setDateSelection,
                        setTimeSelection,
                    }).then(clearClarification)
                }
            />

            <AiSearchForm
                prompt={naturalLanguageQuery}
                searching={searching}
                dateSelection={dateSelection}
                timeSelection={timeSelection}
                onQueryChange={(value) => {
                    setNaturalLanguageQuery(value);
                    setSearchError("");
                    clearClarification();
                }}
                onDateSelectionChange={(selection) => {
                    setDateSelection(selection);
                    setSearchError("");
                    clearClarification();
                }}
                onTimeSelectionChange={(selection) => {
                    setTimeSelection(selection);
                    setSearchError("");
                    clearClarification();
                }}
                onSearch={(event) =>
                    handleNaturalLanguageSearch(event, {
                        query: naturalLanguageQuery,
                        dateSelection,
                        timeSelection,
                        searchRequestId,
                        setEvents,
                        setSearching,
                        setSearchError,
                        setIsSearchActive,
                        setClarificationConflicts: updateClarificationConflicts,
                    })
                }
                onClearQuery={() =>
                    void handleClearSearch({
                        searchRequestId,
                        setEvents,
                        setSearching,
                        setSearchError,
                        setIsSearchActive,
                        setKeyword,
                        setNaturalLanguageQuery,
                        setClarificationConflicts,
                        setDateSelection,
                        setTimeSelection,
                    }).then(clearClarification)
                }
            />

            {clarificationConflicts && (
                <SearchFilterClarification
                    conflicts={clarificationConflicts}
                    resolutions={clarificationResolutions}
                    disabled={searching}
                    onResolutionChange={updateClarificationResolution}
                    onApply={() =>
                        void handleResolveNaturalLanguageSearch({
                            query: naturalLanguageQuery,
                            dateSelection,
                            timeSelection,
                            conflicts: clarificationConflicts,
                            resolutions: clarificationResolutions,
                            searchRequestId,
                            setEvents,
                            setSearching,
                            setSearchError,
                            setIsSearchActive,
                            setClarificationConflicts: updateClarificationConflicts,
                        })
                    }
                />
            )}

            {searchError && (
                <p className="error-message" role="alert">
                    {searchError}
                </p>
            )}

            {searching && (
                <p className="status-message" role="status">
                    Searching events...
                </p>
            )}

            {!searching && events.length === 0
                ? displayNoEvents(isSearchActive)
                : displayAllEvents(events)}
        </div>
    );
}
