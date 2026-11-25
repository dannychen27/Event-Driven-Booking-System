import type {
    Booking,
    BookingStatus,
} from "../../types/bookings/Booking.ts";
import BookingCard from "../../components/cards/BookingCard.tsx";

export type BookingFilter =
    | "all"
    | "upcoming"
    | "happening-now"
    | "past"
    | "cancelled";

export function filterBookings(
    bookings: Booking[],
    filter: BookingFilter,
    now: Date = new Date(),
): Booking[] {
    if (filter === "all") {
        return bookings;
    }

    if (filter === "cancelled") {
        return bookings.filter((booking) => booking.status === "cancelled");
    }

    const nowTime = now.getTime();

    return bookings.filter((booking) => {
        if (
            booking.status !== "confirmed"
            || !booking.start_time
            || !booking.end_time
        ) {
            return false;
        }

        const startTime = new Date(booking.start_time).getTime();
        const endTime = new Date(booking.end_time).getTime();

        if (
            Number.isNaN(startTime)
            || Number.isNaN(endTime)
            || endTime <= startTime
        ) {
            return false;
        }

        switch (filter) {
            case "upcoming":
                return startTime > nowTime;
            case "happening-now":
                return startTime <= nowTime && nowTime < endTime;
            case "past":
                return endTime <= nowTime;
            default:
                return false;
        }
    });
}

export function getBookingFilterEmptyMessage(filter: BookingFilter): string {
    const messages: Record<BookingFilter, string> = {
        all: "No bookings right now.",
        upcoming: "No upcoming bookings.",
        "happening-now": "No events happening right now.",
        past: "No past bookings.",
        cancelled: "No cancelled bookings.",
    };

    return messages[filter];
}

export function displayNoBookings(filter: BookingFilter = "all") {
    return (
        <p className="empty-state-message">
            {getBookingFilterEmptyMessage(filter)}
        </p>
    );
}

export function displayAllBookings(
    bookings: Booking[],
    onBookingCancelled: (id: number, status: BookingStatus) => void,
) {
    return (
        <div className="bookings-list" role="region" aria-label="Booking results">
            {bookings.map((booking) => (
                <BookingCard
                    key={booking.id}
                    booking={booking}
                    onBookingCancelled={(result) => {
                        onBookingCancelled(result.id, result.status);
                    }}
                />
            ))}
        </div>
    );
}
