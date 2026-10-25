import type { Event } from "../types/Event.ts";
import { API_BASE_URL } from "./apiBaseUrl.ts";


export async function getEvents(): Promise<Event[]> {
    const getEventsResponse = await fetch(`${API_BASE_URL}/events`);
    if (!getEventsResponse.ok) {
        throw new Error("Failed to fetch events");
    }
    return getEventsResponse.json();
}


export async function searchEvents(keyword: string): Promise<Event[]> {
    const params = new URLSearchParams({ keyword });

    const response = await fetch(
        `${API_BASE_URL}/events/search?${params.toString()}`
    );

    if (!response.ok) {
        throw new Error("Failed to search events");
    }

    return response.json();
}


export async function searchEventsNaturalLanguage(query: string,): Promise<Event[]> {
    const response = await fetch(
        `${API_BASE_URL}/events/natural-language-search`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ query }),
        },
    );

    if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(
            body?.message ??
            "Failed to search events with natural language"
        );
    }

    return response.json();
}
