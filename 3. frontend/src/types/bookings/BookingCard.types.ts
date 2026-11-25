import type {
    Booking,
    BookingCancellationResult,
} from "./Booking.ts";

export interface BookingCardProps {
    booking: Booking;
    onBookingCancelled: (result: BookingCancellationResult) => void;
}
