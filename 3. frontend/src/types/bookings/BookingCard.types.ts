import type { Booking } from "./Booking.ts";

export interface BookingCardProps {
    booking: Booking;
    onBookingCancelled: () => void;
}
