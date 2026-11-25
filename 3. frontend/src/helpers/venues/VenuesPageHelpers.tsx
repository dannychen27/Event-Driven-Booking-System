import type { Venue } from "../../types/venues/Venue.ts";
import VenueCard from "../../components/cards/VenueCard.tsx";

export interface VenueFilterCriteria {
    keyword: string;
    venueType: string;
    location: string;
}

export function getVenueTypes(venues: Venue[]): string[] {
    return [...new Set(
        venues
            .map((venue) => venue.venue_type?.trim())
            .filter((type): type is string => Boolean(type)),
    )].sort((a, b) => a.localeCompare(b));
}

export function filterVenues(
    venues: Venue[],
    filters: VenueFilterCriteria,
): Venue[] {
    const keyword = filters.keyword.trim().toLocaleLowerCase();
    const location = filters.location.trim().toLocaleLowerCase();

    return venues.filter((venue) => {
        const matchesKeyword = !keyword || [
            venue.name,
            venue.description ?? "",
            venue.address,
            venue.venue_type ?? "",
        ].some((value) => value.toLocaleLowerCase().includes(keyword));

        const matchesType = !filters.venueType
            || venue.venue_type?.trim() === filters.venueType;

        const matchesLocation = !location
            || venue.address.toLocaleLowerCase().includes(location);

        return matchesKeyword && matchesType && matchesLocation;
    });
}

export function displayNoVenues() {
    return <p className="empty-state-message">No available venues right now.</p>;
}

export function displayAllVenues(venues: Venue[]) {
    return venues.map((venue) => (
        <VenueCard key={venue.id} venue={venue}/>
    ));
}
