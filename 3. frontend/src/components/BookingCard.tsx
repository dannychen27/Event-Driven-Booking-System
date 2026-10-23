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
    const [isCancelling, setIsCancelling] = useState(false);

    function getFormattedDate() {
        return formatDate(
            booking.created_at,
            {
                dateStyle: "long",
                timeStyle: "medium",
                is12HourFormat: false,
            }
        );
    }

    async function handleCancellation() {
        if (isCancelling) {
            return;
        }

        setIsCancelling(true);
        setCancellationError("");

        try {
            await cancelBooking(booking.user_id, booking.id);
            setShowCancelModal(false);
            onBookingCancelled();
        } catch (error) {
            if (error instanceof Error) {
                setCancellationError(error.message);
            } else {
                setCancellationError("Failed to cancel booking.");
            }
        } finally {
            setIsCancelling(false);
        }
    }

    function getCancelModalButtons() {
        return [
            {
                label: "Keep Booking",
                className: "keep-booking-button",
                disabled: isCancelling,
                onClick: () => setShowCancelModal(false),
            },
            {
                label: isCancelling ? "Cancelling..." : "Cancel Booking",
                className: "cancel-button",
                disabled: isCancelling,
                onClick: handleCancellation,
            },
        ];
    }

    return (
        <div className="booking-card">
            <h2>{booking.event_name ?? `Event ${booking.event_id}`}</h2>
            <p>Booking Id: {booking.id}</p>
            <p>Event Id: {booking.event_id}</p>
            <p>User Id: {booking.user_id}</p>
            <p>Starts at: {
                booking.start_time
                    ? formatDate(booking.start_time, {
                        dateStyle: "long",
                        timeStyle: "medium",
                        is12HourFormat: false,
                    })
                    : "Unavailable"
            }</p>
            <p>Ends at: {
                booking.end_time
                    ? formatDate(booking.end_time, {
                        dateStyle: "long",
                        timeStyle: "medium",
                        is12HourFormat: false,
                    })
                    : "Unavailable"
            }</p>
            <p>Venue: {booking.venue_name ?? "Unavailable"}</p>
            {booking.venue_address && <p>Address: {booking.venue_address}</p>}
            <p>Booked at: {getFormattedDate()}</p>

            <button
                className="cancel-button"
                disabled={isCancelling}
                onClick={() => {
                    setCancellationError("");
                    setShowCancelModal(true);
                }}
            >
                Cancel Booking
            </button>

            {showCancelModal && (
                <Modal actions={getCancelModalButtons()}>
                    <h2>Cancel Booking?</h2>
                    <p>This action cannot be undone.</p>
                    {cancellationError && (
                        <p className="cancellation-error">
                            {cancellationError}
                        </p>
                    )}
                </Modal>
            )}
        </div>
    );
}
