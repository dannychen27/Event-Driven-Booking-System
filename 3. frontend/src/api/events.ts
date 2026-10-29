import type { Event } from "../types/events/Event.ts";
import { API_BASE_URL } from "./apiBaseUrl.ts";
import { apiRequest } from "./apiRequest.ts";
import { getApiErrorMessage } from "./apiError.ts";

export async function getEvents(): Promise<Event[]> {
    return apiRequest<Event[]>(
        `${API_BASE_URL}/events`,
        "Failed to fetch events",
    );
}

export async function searchEvents(
    keyword: string,
): Promise<Event[]> {
    const params = new URLSearchParams({ keyword });

    return apiRequest<Event[]>(
        `${API_BASE_URL}/events/search?${params.toString()}`,
        "Failed to search events",
    );
}

export async function searchEventsNaturalLanguage(
    query: string,
): Promise<Event[]> {
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
        throw new Error(
            await getApiErrorMessage(
                response,
                "Failed to search events with natural language",
            ),
        );
    }

    return response.json();
}
