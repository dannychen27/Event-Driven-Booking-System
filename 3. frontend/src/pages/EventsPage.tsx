import { useEffect, useRef, useState } from "react";
import type { Event } from "../types/Event";
import "../styles/pages/events-page.css";
import "../styles/errors/error-message.css";
import "../styles/errors/status-message.css";
import "../styles/errors/empty-state-message.css";
import {
    getEvents,
    searchEvents,
    searchEventsNaturalLanguage,
} from "../api/events";
import EventCard from "../components/EventCard";
import EventSearchForm from "../components/EventSearchForm.tsx";
import AiSearchForm from "../components/AiSearchForm";


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
                setError(
                    error instanceof Error
                        ? error.message
                        : "Failed to load events",
                );
            } finally {
                setLoading(false);
            }
        }

        void fetchEvents();
    }, []);

    async function handleSearch(
        event: React.FormEvent<HTMLFormElement>,
    ) {
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
                    : "Failed to search events",
            );
        } finally {
            if (requestId === searchRequestId.current) {
                setSearching(false);
            }
        }
    }

    async function handleNaturalLanguageSearch(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        const query = naturalLanguageQuery.trim();
        if (!query) {
            setSearchError(
                "Enter a description of the events you're looking for.",
            );
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
                    : "Failed to load events",
            );
        } finally {
            if (requestId === searchRequestId.current) {
                setSearching(false);
            }
        }
    }

    if (loading) {
        return <p className="status-message" role="status">Loading events...</p>;
    }

    if (error) {
        return <p className="error-message">{error}</p>;
    }

    return (
        <div className="events-page">
            <h1>Events</h1>

            <EventSearchForm
                keyword={keyword}
                searching={searching}
                isSearchActive={isSearchActive}
                onKeywordChange={(value) => {
                    setKeyword(value);
                    setSearchError("");
                }}
                onSearch={handleSearch}
                onClearQuery={() => {
                    setKeyword("");
                    setSearchError("");
                }}
                onClearSearch={handleClearSearch}
            />

            <AiSearchForm
                query={naturalLanguageQuery}
                searching={searching}
                onQueryChange={(value) => {
                    setNaturalLanguageQuery(value);
                    setSearchError("");
                }}
                onSearch={handleNaturalLanguageSearch}
                onClearQuery={() => {
                    setNaturalLanguageQuery("");
                    setSearchError("");
                }}
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

            {!searching && events.length === 0 ? (
                <p className="empty-state-message">
                    {isSearchActive
                        ? "No matching events found."
                        : "No available events right now."}
                </p>
            ) : (
                events.map((event) => (
                    <EventCard key={event.id} event={event} />
                ))
            )}
        </div>
    );
}
