import type { Venue } from "../types/Venue"

export async function getVenues(): Promise<Venue[]> {
    const venueResponse = await fetch("http://localhost:3000/venues");
    if (!venueResponse.ok) {
        throw new Error("Failed to fetch venues");
    }
    return venueResponse.json();
}
