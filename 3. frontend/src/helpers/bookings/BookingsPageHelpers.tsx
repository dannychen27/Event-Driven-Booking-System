import type { Booking } from "../../types/bookings/Booking.ts";
import BookingCard from "../../components/cards/BookingCard.tsx";

export function displayNoBookings() {
    return <p className="empty-state-message">No bookings right now.</p>;
}

export function displayAllBookings(
    bookings: Booking[],
    setBookings: (value: (((prevState: Booking[]) => Booking[]) | Booking[])) => void
) {
    return bookings.map((booking) => (
        <BookingCard
            key={booking.id}
            booking={booking}
            onBookingCancelled={() => {
                setBookings(bookings.filter(b => b.id !== booking.id));
            }}
        />
    ));
}
