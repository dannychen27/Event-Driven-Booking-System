import { useState } from "react";
import type { Booking } from "../types/Booking.ts";
import { formatDate } from "../utils/Dates.ts";
import "../styles/booking-card.css";
import "../styles/booking-card-modal.css";
import { cancelBooking } from "../api/bookings.ts";
import { Modal } from "./Modal.tsx";


interface BookingCardProps {
    booking: Booking;
    onBookingCancelled: () => void;
}


export default function BookingCard({
    booking,
    onBookingCancelled,
}: BookingCardProps) {
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancellationError, setCancellationError] = useState("");

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
                className: "keep-booking-button",
                onClick: () => setShowCancelModal(false),
            },
            {
                label: "Cancel Booking",
                className: "cancel-button",
                onClick: async () => {
                    try {
                        await cancelBooking(booking.user_id, booking.id);
                        setShowCancelModal(false);
                        onBookingCancelled();
                    } catch (error) {
                        // display cancellation error
                        if (error instanceof Error) {
                            setCancellationError(error.message);
                        } else {
                            setCancellationError("Failed to cancel booking.");
                        }
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
            <p>Created at: {getFormattedDate()}</p>
            <button
                className="cancel-button"
                onClick={() => setShowCancelModal(true)}
            >
                Cancel Booking
            </button>
            {showCancelModal &&
                <Modal actions={getCancelModalButtons()}>
                    <h2>Cancel Booking?</h2>
                    <p>This action cannot be undone.</p>

                    {cancellationError && <p className="cancellation-error">{cancellationError}</p>}
                </Modal>}
        </div>
    );
}
