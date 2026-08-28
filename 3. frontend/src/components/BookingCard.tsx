import { useState } from "react";
import type { Booking } from "../types/Booking.ts";
import { formatDate } from "../utils/Dates.ts";
import "../styles/booking-card.css";
import { cancelBooking } from "../api/bookings.ts";
import { Modal } from "./Modal.tsx";


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

    function getCancelModalButtons() {
        return [
            {
                label: "Keep Booking",
                onClick: () => setShowCancelModal(false),
            },
            {
                label: "Cancel Booking",
                onClick: async () => {
                    try {
                        await cancelBooking(booking.user_id, booking.id);
                        setShowCancelModal(false);
                    } catch (error) {
                        // display cancellation error
                    }
                },
            },
        ];
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
            {showCancelModal &&
                <Modal actions={getCancelModalButtons()}>
                    <h2>Cancel Booking?</h2>
                    <p>This action cannot be undone.</p>
                </Modal>}
        </div>
    );
}
