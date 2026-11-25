import { useEffect, useState } from "react";
import type { Booking, BookingStatus } from "../types/bookings/Booking.ts";
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
    filterBookings,
    type BookingFilter,
} from "../helpers/bookings/BookingsPageHelpers.tsx";

const BOOKING_FILTERS: { value: BookingFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "upcoming", label: "Upcoming" },
    { value: "happening-now", label: "Happening Now" },
    { value: "past", label: "Past" },
    { value: "cancelled", label: "Cancelled" },
];

export default function BookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [activeFilter, setActiveFilter] = useState<BookingFilter>("all");
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

    function updateBookingStatus(id: number, status: BookingStatus) {
        setBookings((currentBookings) =>
            currentBookings.map((booking) =>
                booking.id === id
                    ? { ...booking, status }
                    : booking
            )
        );
    }

    if (loading) {
        return (
            <section
                className="bookings-page skeleton-loading"
                aria-busy="true"
            >
                <LoadingState message="Loading bookings..." />

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

    const visibleBookings = filterBookings(bookings, activeFilter);

    return (
        <div className="bookings-page">
            <h1>Booking History</h1>

            {bookings.length === 0 ? (
                displayNoBookings()
            ) : (
                <>
                    <div className="booking-filters" role="group" aria-label="Booking filters">
                        {BOOKING_FILTERS.map(({ value, label }) => (
                            <button
                                key={value}
                                type="button"
                                className={`booking-filters__button booking-filters__button--${value}${activeFilter === value ? " booking-filters__button--active" : ""}`}
                                aria-pressed={activeFilter === value}
                                onClick={() => setActiveFilter(value)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {visibleBookings.length === 0
                        ? displayNoBookings(activeFilter)
                        : displayAllBookings(visibleBookings, updateBookingStatus)}
                </>
            )}
        </div>
    );
}
