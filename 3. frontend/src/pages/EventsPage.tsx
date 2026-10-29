import { useEffect, useRef, useState } from "react";
import type { Event } from "../types/Event";
import "../styles/pages/events-page.css";
import "../styles/errors/error-message.css";
import "../styles/errors/status-message.css";
import "../styles/errors/empty-state-message.css";
import { getErrorMessage } from "../helpers/Errors.ts";
import { handleClearSearch, handleNaturalLanguageSearch, handleSearch } from "../helpers/EventSearchHelpers.ts";
import { getEvents } from "../api/events";
import EventSearchForm from "../components/forms/EventSearchForm.tsx";
import AiSearchForm from "../components/forms/AiSearchForm";
import { displayAllEvents, displayNoEvents } from "../helpers/EventsPageHelpers.tsx";


export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [keyword, setKeyword] = useState("");
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState("");
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [naturalLanguageQuery, setNaturalLanguageQuery] = useState("");

    const searchRequestId = useRef(0);

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
        return <p className="status-message" role="status">Loading events...</p>;
    }

    if (error) {
        return <p className="error-message" role="alert">{error}</p>;
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
                    })
                }
            />

            <AiSearchForm
                prompt={naturalLanguageQuery}
                searching={searching}
                onQueryChange={(value) => {
                    setNaturalLanguageQuery(value);
                    setSearchError("");
                }}
                onSearch={(event) =>
                    handleNaturalLanguageSearch(event, {
                        query: naturalLanguageQuery,
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
                    })
                }
            />

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
