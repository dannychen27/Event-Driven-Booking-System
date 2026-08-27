import { useEffect, useState } from "react";
import type { Event } from "../types/Event";
import "../styles/events.css";
import "../styles/venues.css";
import { getEvents } from "../api/events";
import EventCard from "../components/EventCard";
import BookingForm from "../components/BookingForm";


export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function fetchEvents() {
            try {
                const events = await getEvents();
                setEvents(events);
            } catch {
                setError("Failed to load events");
            } finally {
                setLoading(false);
            }
        }

        void fetchEvents();  // intentionally not awaiting the promise.
    }, []);

    if (loading) {
        return <p>Loading events...</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    return (
        <div className="events-page">
            <h1>Events</h1>

            {events.map((event) => (
                <EventCard key={event.id} event={event} />
            ))}

            <BookingForm eventId={1} />
        </div>
    );
}
