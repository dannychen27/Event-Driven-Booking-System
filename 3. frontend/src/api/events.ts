import type { Event } from "../types/Event.ts";


export async function getEvents(): Promise<Event[]> {
    const getEventsResponse = await fetch("http://localhost:3000/events");
    if (!getEventsResponse.ok) {
        throw new Error("Failed to fetch events");
    }
    return getEventsResponse.json();
}
