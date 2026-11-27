import { useEffect, useState } from "react";
import { getVenues } from "../api/venues.ts";
import type { Venue } from "../types/venues/Venue.ts";
import "../styles/pages/venues-page.css";
import "../styles/venues/venue-filters.css";
import "../styles/errors/error-message.css";
import "../styles/errors/empty-state-message.css";
import ErrorState from "../components/ui/ErrorState";
import LoadingState from "../components/ui/LoadingState";
import Skeleton from "../components/ui/Skeleton";
import VenueCardSkeleton from "../components/ui/skeletons/VenueCardSkeleton";
import VenueFilters from "../components/forms/VenueFilters.tsx";
import VenueSearchForm from "../components/forms/VenueSearchForm.tsx";
import ActiveFilterSummary from "../components/ui/ActiveFilterSummary.tsx";
import {
    displayAllVenues,
    displayNoVenues,
    filterVenues,
    getVenueTypes,
} from "../helpers/venues/VenuesPageHelpers.tsx";

export default function VenuesPage() {
    const [venues, setVenues] = useState<Venue[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [venuesRetry, setVenuesRetry] = useState(0);
    const [keyword, setKeyword] = useState("");
    const [submittedKeyword, setSubmittedKeyword] = useState("");
    const [venueType, setVenueType] = useState("");
    const [location, setLocation] = useState("");
    const [submittedLocation, setSubmittedLocation] = useState("");

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
                    setError("failed");
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

    function clearAllFilters() {
        setKeyword("");
        setSubmittedKeyword("");
        setVenueType("");
        setLocation("");
        setSubmittedLocation("");
    }

    if (loading) {
        return (
            <section
                className="venues-page skeleton-loading"
                aria-busy="true"
            >
                <LoadingState message="Loading venues..." />

                <h1>
                    <Skeleton width="9rem" height="2rem" variant="text" />
                </h1>

                <div className="skeleton-loading__cards" aria-hidden="true">
                    <VenueCardSkeleton />
                    <VenueCardSkeleton />
                    <VenueCardSkeleton />
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <ErrorState
                title="We couldn't load the venues."
                description={
                    <>
                        <p>We couldn't retrieve the venues.</p>
                        <p>You can try the following:</p>
                        <ul>
                            <li>Check your internet connection and try again.</li>
                            <li>Refresh the page.</li>
                            <li>Wait a moment and try again.</li>
                        </ul>
                    </>
                }
                onRetry={retryVenues}
                retryLabel="Try again"
                className="error-state--page"
            />
        );
    }

    const filteredVenues = filterVenues(venues, {
        keyword: submittedKeyword,
        venueType,
        location: submittedLocation,
    });

    const activeFilters = [
        ...(submittedKeyword.trim()
            ? [{
                id: "keyword",
                label: "Keyword",
                value: submittedKeyword.trim(),
                onRemove: () => {
                    setKeyword("");
                    setSubmittedKeyword("");
                },
            }]
            : []),
        ...(venueType
            ? [{
                id: "venue-type",
                label: "Venue type",
                value: venueType,
                onRemove: () => setVenueType(""),
            }]
            : []),
        ...(submittedLocation.trim()
            ? [{
                id: "location",
                label: "Location",
                value: submittedLocation.trim(),
                onRemove: () => {
                    setLocation("");
                    setSubmittedLocation("");
                },
            }]
            : []),
    ];

    return (
        <main className="venues-page">
            <h1>Venues</h1>

            {venues.length === 0 ? (
                displayNoVenues()
            ) : (
                <div className="venues-page__layout">
                    <aside
                        className="venues-page__sidebar"
                        aria-label="Venue search and filters"
                    >
                        <details className="venues-search-disclosure" open>
                            <summary>Keyword search</summary>
                            <VenueSearchForm
                                keyword={keyword}
                                onKeywordChange={setKeyword}
                                onSearch={(event) => {
                                    event.preventDefault();
                                    setSubmittedKeyword(keyword);
                                }}
                                onClearQuery={() => {
                                    setKeyword("");
                                    setSubmittedKeyword("");
                                }}
                            />
                        </details>

                        <VenueFilters
                            venueType={venueType}
                            location={location}
                            venueTypes={getVenueTypes(venues)}
                            onVenueTypeChange={setVenueType}
                            onLocationChange={setLocation}
                            onApplyLocation={() => setSubmittedLocation(location)}
                        />
                    </aside>

                    <section
                        className="venues-page__results"
                        aria-label="Venue results"
                        aria-live="polite"
                    >
                        <ActiveFilterSummary
                            filters={activeFilters}
                            resultCount={filteredVenues.length}
                            resultNoun="venue"
                            hint="Venue type updates automatically; keyword and location searches apply when submitted."
                            onClearAll={clearAllFilters}
                        />

                        {filteredVenues.length === 0 ? (
                            <p className="empty-state-message">
                                No venues match your filters.
                            </p>
                        ) : (
                            <div className="venues-page__grid">
                                {displayAllVenues(filteredVenues)}
                            </div>
                        )}
                    </section>
                </div>
            )}
        </main>
    );
}
