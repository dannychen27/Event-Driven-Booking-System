import type { VenueCardProps } from "../../types/venues/VenueCard.types.ts";
import "../../styles/shared/card.css";
import "../../styles/venues/venue-card.css";

export default function VenueCard({ venue }: VenueCardProps) {
    const venueName = venue.name.trim() || "Venue details unavailable";
    const venueAddress = venue.address.trim() || "Address to be announced";

    return (
        <div className="card venue-card">
            <h2>{venueName}</h2>
            <address className="venue-card__address">
                <span className="venue-card__address-label">Location</span>
                <span>{venueAddress}</span>
            </address>
        </div>
    );
}
