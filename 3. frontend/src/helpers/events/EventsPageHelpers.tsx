import type { Event } from "../../types/Event.ts";
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

export function displayAllEvents(events: Event[]) {
    return events.map((event) => (
        <EventCard key={event.id} event={event}/>
    ));
}
