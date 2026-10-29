import { useEffect, useState } from "react";
import type { Booking } from "../types/Booking.ts";
import { getBookingHistory } from "../api/bookings.ts";
import { BOOKING_USER_ID } from "../constants/booking.ts";
import "../styles/pages/booking-page.css";
import "../styles/errors/error-message.css";
import "../styles/errors/status-message.css";
import "../styles/errors/empty-state-message.css";
import { displayAllBookings, displayNoBookings } from "../helpers/BookingsPageHelpers.tsx";


export default function BookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const user_id = BOOKING_USER_ID;  // hardcoded for now...
    // TODO: when we create accounts, we can load that specific user's
    // TODO: bookings (using their own user_id instead of a hardcoded one).

    useEffect(() => {
        async function fetchBookings() {
            try {
                const bookings = await getBookingHistory(user_id);
                setBookings(bookings);
            } catch {
                setError(`Failed to load bookings for user ${user_id}`);
            } finally {
                setLoading(false);
            }
        }

        void fetchBookings();  // intentionally not awaiting the promise.
    }, []);

    if (loading) {
        return (
            <p className="status-message" role="status">
                {`Loading bookings for user ${user_id}`}
            </p>
        );
    }

    if (error) {
        return <p className="error-message">{error}</p>;
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
