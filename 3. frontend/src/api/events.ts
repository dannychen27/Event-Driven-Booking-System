import type { Event } from "../types/Event.ts";


export async function getEvents(): Promise<Event[]> {
    const getEventsResponse = await fetch("http://localhost:3000/events");
    if (!getEventsResponse.ok) {
        throw new Error("Failed to fetch events");
    }
    return getEventsResponse.json();
}


export async function searchEvents(keyword: string): Promise<Event[]> {
    const params = new URLSearchParams({ keyword });

    const response = await fetch(
        `http://localhost:3000/events/search?${params.toString()}`
    );

    if (!response.ok) {
        throw new Error("Failed to search events");
    }

    return response.json();
}

