import { useEffect, useState } from "react";
import { getVenues } from "../api/venues.ts";
import type { Venue } from "../types/Venue.ts";
import VenueCard from "../components/VenueCard.tsx";
import "../styles/pages/venues-page.css";
import "../styles/errors/error-message.css";
import "../styles/errors/status-message.css";
import "../styles/errors/empty-state-message.css";


export default function VenuesPage() {
    const [venues, setVenues] = useState<Venue[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function fetchVenues() {
            try {
                const venues = await getVenues();
                setVenues(venues);
            } catch {
                setError("Failed to load venues");
            } finally {
                setLoading(false);
            }
        }

        void fetchVenues();  // intentionally not awaiting the promise.
    }, []);

    if (loading) {
        return <p className="status-message" role="status">Loading venues...</p>;
    }

    if (error) {
        return <p className="error-message">{error}</p>;
    }

    return (
        <div className="venues-page">
            <h1>Venues</h1>
            {venues.length === 0
                ? <p className="empty-state-message">No available venues right now.</p>
                : venues.map((venue) => (
                    <VenueCard key={venue.id} venue={venue} />
                ))
            }
        </div>
    );
}
