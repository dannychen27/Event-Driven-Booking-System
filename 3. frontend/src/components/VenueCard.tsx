import type { Venue } from "../types/Venue.ts";
import "../styles/venue-card.css";


interface VenueCardProps {
    venue: Venue;
}


export default function VenueCard({ venue }: VenueCardProps) {
    return (
        <div className="venue-card">
            <h2>{venue.name}</h2>
            <p>Address: {venue.address}</p>
        </div>
    );
}
