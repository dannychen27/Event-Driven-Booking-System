import { useEffect, useState } from "react";
import { getVenues } from "../api/venues.ts";
import type { Venue } from "../types/Venue.ts";
import VenueCard from "../components/VenueCard.tsx";


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
        return <p>Loading venues...</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    return (
        <div className="events-page">
            <h1>Venues</h1>

            {venues.map((venue) => (
                <VenueCard key={venue.id} venue={venue} />
            ))}
        </div>
    );
}
