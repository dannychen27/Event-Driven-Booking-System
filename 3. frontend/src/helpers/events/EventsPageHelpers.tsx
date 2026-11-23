import type { Event } from "../../types/events/Event.ts";
import type { BookingHistoryStatus } from "../../types/events/EventCard.types.ts";
import EventCard from "../../components/cards/EventCard.tsx";

export function displayNoEvents(isSearchActive: boolean) {
    return (
        <p className="empty-state-message">
            {isSearchActive
                ? "No matching events found."
                : "No available events right now."}
        </p>
    );
}

export function displayAllEvents(
    events: Event[],
    bookedEventIds: Set<number>,
    bookingHistoryStatus: BookingHistoryStatus,
    onBookingCreated: (eventId: number) => void,
) {
    return (
        <div className="events-page__grid">
            {events.map((event) => (
                <EventCard
                    key={event.id}
                    event={event}
                    isBooked={bookedEventIds.has(event.id)}
                    bookingHistoryStatus={bookingHistoryStatus}
                    onBookingCreated={onBookingCreated}
                />
            ))}
        </div>
    );
}
