import { useState } from "react";
import type { BookingCardProps } from "../../types/BookingCardProps.ts";
import { getErrorMessage } from "../../helpers/Errors.ts";
import { getCancelModalButtons } from "../../helpers/BookingCardHelpers.ts";
import { BookingCardModalBody } from "./BookingCard.modal";
import { DateLabel } from "./DateLabel.tsx";
import "../../styles/shared/card.css";
import "../../styles/bookings/booking-card.css";
import "../../styles/shared/card-buttons.css";
import "../../styles/errors/error-message.css";
import { cancelBooking } from "../../api/bookings.ts";
import { Modal } from "../modals/Modal.tsx";
import Button from "../ui/buttons/Button";
import { InfoLabel } from "./InfoLabel.tsx";


export default function BookingCard({
    booking,
    onBookingCancelled,
}: BookingCardProps) {
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancellationError, setCancellationError] = useState("");
    const [isCancelling, setIsCancelling] = useState(false);

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
            setCancellationError(
                getErrorMessage(error, "Failed to cancel booking.")
            );
        } finally {
            setIsCancelling(false);
        }
    }

    return (
        <div className="card booking-card">
            <h2>{booking.event_name ?? `Event ${booking.event_id}`}</h2>

            <InfoLabel label="Booking Id" value={booking.id} />
            <InfoLabel label="Event Id" value={booking.event_id} />
            <InfoLabel label="User Id" value={booking.user_id} />
            <InfoLabel
                label="Venue"
                value={booking.venue_name ?? "Unavailable"}
            />
            <DateLabel label="Starts at" dateTime={booking.start_time} />
            <DateLabel label="Ends at" dateTime={booking.end_time} />
            {booking.venue_address && (
                <InfoLabel label="Address" value={booking.venue_address} />
            )}
            <DateLabel label="Booked at" dateTime={booking.created_at} />

            <Button
                variant="danger"
                disabled={isCancelling}
                onClick={() => {
                    setCancellationError("");
                    setShowCancelModal(true);
                }}
            >
                Cancel Booking
            </Button>

            {showCancelModal && (
                <Modal
                    body={<BookingCardModalBody cancellationError={cancellationError} />}
                    actions={getCancelModalButtons({
                        isCancelling,
                        onKeepBooking: () => setShowCancelModal(false),
                        onCancelBooking: handleCancellation,
                    })}
                />
            )}
        </div>
    );
}
