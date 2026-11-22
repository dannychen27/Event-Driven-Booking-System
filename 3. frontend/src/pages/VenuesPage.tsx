import { useEffect, useState } from "react";
import { getVenues } from "../api/venues.ts";
import type { Venue } from "../types/venues/Venue.ts";
import "../styles/pages/venues-page.css";
import "../styles/errors/error-message.css";
import "../styles/errors/status-message.css";
import "../styles/errors/empty-state-message.css";
import ErrorState from "../components/ui/ErrorState";
import {
    displayAllVenues,
    displayNoVenues,
} from "../helpers/venues/VenuesPageHelpers.tsx";

export default function VenuesPage() {
    const [venues, setVenues] = useState<Venue[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [venuesRetry, setVenuesRetry] = useState(0);

    useEffect(() => {
        let isActive = true;

        async function fetchVenues() {
            try {
                const fetchedVenues = await getVenues();

                if (isActive) {
                    setVenues(fetchedVenues);
                    setError("");
                }
            } catch {
                if (isActive) {
                    setError(
                        "We couldn't connect to the venues service.\nCheck your connection and try again.",
                    );
                }
            } finally {
                if (isActive) {
                    setLoading(false);
                }
            }
        }

        void fetchVenues();

        return () => {
            isActive = false;
        };
    }, [venuesRetry]);

    function retryVenues() {
        setError("");
        setLoading(true);
        setVenuesRetry((current) => current + 1);
    }

    if (loading) {
        return (
            <p className="status-message" role="status">
                Loading venues...
            </p>
        );
    }

    if (error) {
        return (
            <ErrorState
                title="Couldn't load venues"
                description={error}
                onRetry={retryVenues}
                retryLabel="Retry loading venues"
                className="error-state--page"
            />
        );
    }

    return (
        <div className="venues-page">
            <h1>Venues</h1>
            {venues.length === 0 ? displayNoVenues() : displayAllVenues(venues)}
        </div>
    );
}
