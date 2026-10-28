import type { VenueCardProps } from "../../types/VenueCardProps.ts";
import "../../styles/shared/card.css";
import "../../styles/venues/venue-card.css";


export default function VenueCard({ venue }: VenueCardProps) {
    return (
        <div className="card venue-card">
            <h2>{venue.name}</h2>
            <p>Address: {venue.address}</p>
        </div>
    );
}
