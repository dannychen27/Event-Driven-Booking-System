import type { Event } from "../types/Event";

interface EventCardProps {
    event: Event;
}

export default function EventCard({ event }: EventCardProps) {
    return (
        <div className="event-card">
            <h2>{event.name}</h2>
            <p>Venue: {event.venue}</p>
            <p>Capacity: {event.capacity}</p>
        </div>
    );
}