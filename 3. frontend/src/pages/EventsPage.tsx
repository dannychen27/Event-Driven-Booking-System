
import { useEffect, useState } from "react";
import type { Event } from "../types/Event";
import "../styles/events-page.css";
import { getEvents, searchEvents } from "../api/events";
import EventCard from "../components/EventCard";


export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [keyword, setKeyword] = useState("");
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState("");
    const [isSearchActive, setIsSearchActive] = useState(false);

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

        setSearching(true);
        setSearchError("");
        setIsSearchActive(true);

        try {
            const results = await searchEvents(trimmedKeyword);
            setEvents(results);
        } catch (error) {
            setSearchError(
                error instanceof Error
                    ? error.message
                    : "Failed to search events"
            );
        } finally {
            setSearching(false);
        }
    }

    async function handleClearSearch() {
        setKeyword("");
        setSearchError("");
        setIsSearchActive(false);
        setSearching(true);

        try {
            setEvents(await getEvents());
        } catch (error) {
            setSearchError(
                error instanceof Error
                    ? error.message
                    : "Failed to load events"
            );
        } finally {
            setSearching(false);
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
                        onChange={(event) => setKeyword(event.target.value)}
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

            {searchError && <p role="alert">{searchError}</p>}
            {searching && <p>Searching events...</p>}

            {!searching && events.length === 0
                ? <p>{isSearchActive ? "No matching events found." : "No available events right now."}</p>
                : events.map((event) => (
                    <EventCard key={event.id} event={event} />
                ))
            }
        </div>
    );
}
