import type { Event } from "../types/Event";

export async function getEvents(): Promise<Event[]> {
    const response = await fetch("http://localhost:3000/events");

    if (!response.ok) {
        throw new Error("Failed to fetch events");
    }

    return response.json();
}
