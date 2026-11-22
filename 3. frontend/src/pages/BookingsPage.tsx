import { useEffect, useState } from "react";
import type { Booking } from "../types/bookings/Booking.ts";
import { getBookingHistory } from "../api/bookings.ts";
import { BOOKING_USER_ID } from "../constants/bookings/booking.ts";
import "../styles/pages/booking-page.css";
import "../styles/errors/empty-state-message.css";
import ErrorState from "../components/ui/ErrorState";
import LoadingState from "../components/ui/LoadingState";
import Skeleton from "../components/ui/Skeleton";
import BookingCardSkeleton from "../components/ui/skeletons/BookingCardSkeleton";
import {
    displayAllBookings,
    displayNoBookings,
} from "../helpers/bookings/BookingsPageHelpers.tsx";

export default function BookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [bookingsRetry, setBookingsRetry] = useState(0);

    const user_id = BOOKING_USER_ID;  // hardcoded for now...
    // TODO: when we create accounts, we can load that specific user's
    // TODO: bookings (using their own user_id instead of a hardcoded one).

    useEffect(() => {
        let isActive = true;

        async function fetchBookings() {
            try {
                const fetchedBookings = await getBookingHistory(user_id);

                if (isActive) {
                    setBookings(fetchedBookings);
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

        void fetchBookings();

        return () => {
            isActive = false;
        };
    }, [bookingsRetry]);

    function retryBookings() {
        setError("");
        setLoading(true);
        setBookingsRetry((current) => current + 1);
    }

    if (loading) {
        return (
            <section
                className="bookings-page skeleton-loading"
                aria-busy="true"
            >
                <LoadingState message="Loading your bookings..." />

                <h1>
                    <Skeleton width="13rem" height="2rem" variant="text" />
                </h1>

                <div className="skeleton-loading__cards" aria-hidden="true">
                    <BookingCardSkeleton />
                    <BookingCardSkeleton />
                    <BookingCardSkeleton />
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <ErrorState
                title="We couldn't load your bookings."
                description={
                    <>
                        <p>We couldn't retrieve your booking history.</p>
                        <p>You can try the following:</p>
                        <ul>
                            <li>Check your internet connection and try again.</li>
                            <li>Refresh the page.</li>
                            <li>Wait a moment and try again.</li>
                        </ul>
                    </>
                }
                onRetry={retryBookings}
                retryLabel="Try again"
                className="error-state--page"
            />
        );
    }

    return (
        <div className="bookings-page">
            <h1>Booking History</h1>
            {bookings.length === 0
                ? displayNoBookings()
                : displayAllBookings(bookings, setBookings)
            }
        </div>
    );
}
