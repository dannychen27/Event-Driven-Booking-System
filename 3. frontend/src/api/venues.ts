import type { Venue } from "../types/venues/Venue.ts";
import { API_BASE_URL } from "./apiBaseUrl.ts";
import { apiRequest } from "./apiRequest.ts";

export async function getVenues(): Promise<Venue[]> {
    return apiRequest<Venue[]>(
        `${API_BASE_URL}/venues`,
        "Failed to fetch venues",
    );
}
