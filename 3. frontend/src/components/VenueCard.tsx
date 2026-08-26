import { useState } from "react";
import type { Venue } from "../types/Venue.ts";


interface VenueCardProps {
    venue: Venue;
}

export default function VenueCard({ venue }: VenueCardProps) {
    const [showDetails, setShowDetails] = useState(false);
    return (
        <div className="venue-card">
            <h2>{venue.name}</h2>
            <button onClick={() => setShowDetails(!showDetails)}>
                {showDetails ? "Hide Details" : "View Details"}
            </button>
            {showDetails && (
                <p>Address: {venue.address}</p>
            )}
        </div>
    );
}