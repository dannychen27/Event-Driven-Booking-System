import { useEffect, useState } from "react";
import type { Booking } from "../types/Booking.ts";
import { getBookingHistory } from "../api/bookings.ts";
import BookingCard from "../components/BookingCard.tsx";
import BookingForm from "../components/BookingForm.tsx";
import "../styles/booking-page.css";


export default function BookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const user_id = 1;  // hardcoded for now...
    const event_id = 1;  // hardcoded for now...
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
        return <p>{`Loading bookings for user ${user_id}`}</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    return (
        <div className="bookings-page">
            <h1>My Bookings</h1>
            <BookingForm eventId={event_id} onBookingCreated={() => {}} />

            <h2>Booking History</h2>
            {bookings.length === 0
                ? <p>No bookings right now.</p>
                : bookings.map((booking) => (
                    <BookingCard
                        key={booking.id}
                        booking={booking}
                        onBookingCancelled={() => {
                            setBookings(bookings.filter(b => b.id !== booking.id));
                        }}
                    />
                ))}
        </div>
    );
}
