import { useState } from "react";
import type { Booking } from "../types/Booking.ts";
import { formatDate } from "../utils/Dates.ts";
import "../styles/booking-card.css";
import { cancelBooking } from "../api/bookings.ts";


interface BookingCardProps {
    booking: Booking;
    onBookingCancelled: () => void;
}


export default function BookingCard({ booking }: BookingCardProps) {
    const [showDetails, setShowDetails] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);

    function getFormattedDate() {
        return formatDate(
            booking.created_at,
            {
                dateStyle: "long",
                timeStyle: "medium",
                is12HourFormat: false,
            }
        )
    }

    return (
        <div className="booking-card">
            <h2>Booking Id: {booking.id}</h2>   {/* TODO: replace with booking name? */}
            <p>Event Id: {booking.event_id}</p>   {/* TODO: replace with event's name and address? */}
            <p>User Id: {booking.user_id}</p>   {/* TODO: replace with user's name? */}
            <button onClick={() => setShowDetails(!showDetails)}>
                {showDetails ? "Hide Details" : "View Details"}
            </button>
            {showDetails && <p>Created at: {getFormattedDate()}</p>}
            <button onClick={() => setShowCancelModal(true)}>Cancel Booking</button>
            {showCancelModal && (
                <div className="cancel-modal">
                    <div className="cancel-modal-content">
                        <p>Are you sure you want to cancel this booking?</p>

                        <button onClick={() => setShowCancelModal(false)}>Keep Booking</button>
                        <button onClick={async () => {
                                try {
                                    await cancelBooking(booking.user_id, booking.id);
                                    setShowCancelModal(false);
                                } catch (error) {
                                    // display cancellation error
                                }
                            }}
                        >
                            Cancel Booking
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
