import type { Venue } from "../../types/venues/Venue.ts";
import VenueCard from "../../components/cards/VenueCard.tsx";

export function displayNoVenues() {
    return <p className="empty-state-message">No available venues right now.</p>;
}

export function displayAllVenues(venues: Venue[]) {
    return venues.map((venue) => (
        <VenueCard key={venue.id} venue={venue}/>
    ));
}
