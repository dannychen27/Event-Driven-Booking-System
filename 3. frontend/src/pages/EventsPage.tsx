import { useEffect, useState, useRef } from "react";
import type { Event } from "../types/Event";
import "../styles/pages/events-page.css";
import "../styles/search/event-search-bar.css";
import "../styles/search/ai-search-bar.css";
import "../styles/shared/event-search-bar-shared.css";
import { getEvents, searchEvents, searchEventsNaturalLanguage, } from "../api/events";
import EventCard from "../components/EventCard";


export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [keyword, setKeyword] = useState("");
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState("");
    const [isSearchActive, setIsSearchActive] = useState(false);
    const searchRequestId = useRef(0);

    const [naturalLanguageQuery, setNaturalLanguageQuery] = useState("");

    useEffect(() => {
        async function fetchEvents() {
            try {
                const events = await getEvents();
                setEvents(events);
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error.message
                        : "Failed to load events"
                );
            } finally {
                setLoading(false);
            }
        }

        void fetchEvents();
    }, []);

    async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const trimmedKeyword = keyword.trim();
        if (!trimmedKeyword) {
            setSearchError("Enter a keyword to search.");
            return;
        }

        const requestId = ++searchRequestId.current;

        setSearching(true);
        setSearchError("");
        setIsSearchActive(true);

        try {
            const results = await searchEvents(trimmedKeyword);
            if (requestId !== searchRequestId.current) return;
            setEvents(results);
        } catch (error) {
            if (requestId !== searchRequestId.current) return;

            setSearchError(
                error instanceof Error
                    ? error.message
                    : "Failed to search events"
            );
        } finally {
            if (requestId === searchRequestId.current) {
                setSearching(false);
            }
        }
    }

    async function handleNaturalLanguageSearch(event: React.FormEvent<HTMLFormElement>,) {
        event.preventDefault();

        const query = naturalLanguageQuery.trim();
        if (!query) {
            setSearchError("Enter a description of the events you're looking for.");
            return;
        }

        const requestId = ++searchRequestId.current;

        setSearching(true);
        setSearchError("");
        setIsSearchActive(true);

        try {
            const results = await searchEventsNaturalLanguage(query);
            if (requestId !== searchRequestId.current) return;

            setEvents(results);
        } catch (error) {
            if (requestId !== searchRequestId.current) return;

            setSearchError(
                error instanceof Error
                    ? error.message
                    : "Failed to search events with natural language",
            );
        } finally {
            if (requestId === searchRequestId.current) {
                setSearching(false);
            }
        }
    }

    async function handleClearSearch() {
        const requestId = ++searchRequestId.current;

        setKeyword("");
        setNaturalLanguageQuery("");
        setSearchError("");
        setIsSearchActive(false);
        setSearching(true);

        try {
            const results = await getEvents();

            if (requestId !== searchRequestId.current) return;

            setEvents(results);
        } catch (error) {
            if (requestId !== searchRequestId.current) return;

            setSearchError(
                error instanceof Error
                    ? error.message
                    : "Failed to load events"
            );
        } finally {
            if (requestId === searchRequestId.current) {
                setSearching(false);
            }
        }
    }

    if (loading) {
        return <p>Loading events...</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    return (
        <div className="events-page">
            <h1>Events</h1>


            <form className="event-search-form" onSubmit={handleSearch}>
                <label htmlFor="event-search">Search events</label>
                <div className="event-search-controls">
                    <input
                        id="event-search"
                        type="text"
                        value={keyword}
                        onChange={(event) => {
                            setKeyword(event.target.value);
                            setSearchError("");
                        }}
                        placeholder="e.g. Meet and Greet"
                    />
                    <button type="submit" disabled={searching}>
                        {searching ? "Searching..." : "Search"}
                    </button>
                    {isSearchActive && (
                        <button
                            className="clear-search-button"
                            type="button"
                            onClick={handleClearSearch}
                            disabled={searching}
                        >
                            Clear search
                        </button>
                    )}
                </div>
            </form>

            <form
                className="event-search-form ai-search-form"
                onSubmit={handleNaturalLanguageSearch}
            >
                <label htmlFor="natural-language-search">
                    Describe the events you're looking for
                </label>

                <p className="ai-search-help" id="natural-language-search-help">
                    Describe a topic, date, or type of event in your own words.
                    AI will interpret your request and find matching events.
                </p>

                <div className="event-search-controls">
                    <input
                        id="natural-language-search"
                        type="text"
                        value={naturalLanguageQuery}
                        aria-describedby="natural-language-search-help"
                        onChange={(event) => {
                            setNaturalLanguageQuery(event.target.value);
                            setSearchError("");
                        }}
                        placeholder="e.g. Find relaxed networking events next weekend"
                    />
                    <button type="submit" disabled={searching}>
                        {searching ? "Searching..." : "Ask AI"}
                    </button>
                </div>
            </form>

            {searchError && <p role="alert">{searchError}</p>}
            {searching && <p role="status">Searching events...</p>}

            {!searching && events.length === 0
                ? <p>{isSearchActive ? "No matching events found." : "No available events right now."}</p>
                : events.map((event) => (
                    <EventCard key={event.id} event={event} />
                ))
            }
        </div>
    );
}
