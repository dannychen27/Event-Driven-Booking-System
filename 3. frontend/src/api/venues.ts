import type { Venue } from "../types/Venue.ts"


export async function getVenues(): Promise<Venue[]> {
    const getVenuesResponse = await fetch("http://localhost:3000/venues");
    if (!getVenuesResponse.ok) {
        throw new Error("Failed to fetch venues");
    }
    return getVenuesResponse.json();
}
