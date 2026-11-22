import type { VenueCardProps } from "../../types/venues/VenueCard.types.ts";
import { EventImage } from "../ui/EventImage.tsx";
import "../../styles/shared/card.css";
import "../../styles/venues/venue-card.css";

export default function VenueCard({ venue }: VenueCardProps) {
    const venueName = venue.name.trim() || "Venue details unavailable";
    const venueAddress = venue.address.trim() || "Address to be announced";
    const venueType = venue.venue_type?.trim();
    const description = venue.description?.trim();

    return (
        <div className="card venue-card">
            <div className="venue-card__image">
                <EventImage
                    imageUrl={venue.image_url ?? null}
                    alt={venueName}
                />
            </div>

            <div className="venue-card__content">
                <h2>{venueName}</h2>

                {venueType && (
                    <p className="venue-card__type">
                        {venueType}
                    </p>
                )}

                {description && (
                    <p className="venue-card__description">
                        {description}
                    </p>
                )}

                <address className="venue-card__address">
                    <span className="venue-card__address-label">
                        Location
                    </span>
                    <span>{venueAddress}</span>
                </address>

                <a
                    className="venue-card__events-link"
                    href={`/events?venueId=${venue.id}`}
                >
                    <span>View events at this venue</span>
                    <span aria-hidden="true">→</span>
                </a>
            </div>
        </div>
    );
}
