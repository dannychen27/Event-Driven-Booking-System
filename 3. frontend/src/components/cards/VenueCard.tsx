import { useState } from "react";
import { Link } from "react-router-dom";
import type { VenueCardProps } from "../../types/venues/VenueCard.types.ts";
import { EventImage } from "../ui/EventImage.tsx";
import { ImageLightbox } from "../ui/ImageLightbox.tsx";
import "../../styles/shared/card.css";
import "../../styles/venues/venue-card.css";
import "../../styles/shared/card-metadata.css";
import { getVenueTypeColorClass } from "../../helpers/venues/venueTypeColor.ts";
import { CardMetadataLabel } from "../ui/labels/CardMetadataLabel.tsx";

export default function VenueCard({ venue }: VenueCardProps) {
    const [showImageLightbox, setShowImageLightbox] = useState(false);

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
                    onImageClick={() => setShowImageLightbox(true)}
                />
            </div>

            <ImageLightbox
                imageUrl={venue.image_url ?? null}
                alt={venueName}
                isOpen={showImageLightbox}
                onClose={() => setShowImageLightbox(false)}
            />

            <div className="venue-card__content">
                <h2>{venueName}</h2>

                {venueType && (
                    <p className={`venue-card__type ${getVenueTypeColorClass(venueType)}`}>
                        {venueType}
                    </p>
                )}

                {description && (
                    <p className="venue-card__description">
                        {description}
                    </p>
                )}

                <CardMetadataLabel
                    label="Location"
                    value={venueAddress}
                />

                <Link
                    className="venue-card__events-link"
                    to={`/events?venueId=${venue.id}`}
                >
                    <span>View events at this venue</span>
                    <span aria-hidden="true">→</span>
                </Link>
            </div>
        </div>
    );
}
