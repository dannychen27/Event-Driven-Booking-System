import type { Event } from "../types/Event";
import "../styles/events.css";
import EventCard from "../components/EventCard";
import BookingForm from "../components/BookingForm";

const events: Event[] = [
    {
        id: 1,
        name: "Taylor Swift Concert",
        venue: "Scotiabank Arena",
        capacity: 500,
    },
    {
        id: 2,
        name: "Raptors Game",
        venue: "Scotiabank Arena",
        capacity: 100,
    },
];

export default function EventsPage() {
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
