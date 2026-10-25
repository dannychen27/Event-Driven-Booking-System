import type { Venue } from "../types/Venue.ts"
import { API_BASE_URL } from "./apiBaseUrl.ts";


export async function getVenues(): Promise<Venue[]> {
    const getVenuesResponse = await fetch(`${API_BASE_URL}/venues`);
    if (!getVenuesResponse.ok) {
        throw new Error("Failed to fetch venues");
    }
    return getVenuesResponse.json();
}
