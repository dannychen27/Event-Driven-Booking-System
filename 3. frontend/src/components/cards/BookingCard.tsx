import { useState } from "react";
import type { BookingCardProps } from "../../types/bookings/BookingCard.types.ts";
import { getErrorMessage } from "../../helpers/shared/Errors.ts";
import { getCancelModalButtons } from "../../helpers/bookings/BookingCardHelpers.ts";
import { BookingCardModalBody } from "./BookingCardModalBody.tsx";
import { DateLabel } from "../ui/labels/DateLabel.tsx";
import "../../styles/shared/card.css";
import "../../styles/bookings/booking-card.css";
import "../../styles/shared/card-buttons.css";
import "../../styles/errors/error-message.css";
import { cancelBooking } from "../../api/bookings.ts";
import { EventImage } from "../ui/EventImage.tsx";
import { ImageLightbox } from "../ui/ImageLightbox.tsx";
import { Modal } from "../modals/Modal.tsx";
import Button from "../ui/buttons/Button";
import { formatBookingDate } from "../../helpers/shared/DatesHelpers.ts";


export default function BookingCard({
    booking,
    onBookingCancelled,
}: BookingCardProps) {
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancellationError, setCancellationError] = useState("");
    const [isCancelling, setIsCancelling] = useState(false);
    const [showImageLightbox, setShowImageLightbox] = useState(false);

    async function handleCancellation() {
        if (isCancelling) {
            return;
        }

        setIsCancelling(true);
        setCancellationError("");

        try {
            const cancelledBooking = await cancelBooking(booking.user_id, booking.id);
            setShowCancelModal(false);
            onBookingCancelled(cancelledBooking);
        } catch (error) {
            setCancellationError(
                getErrorMessage(error, "Failed to cancel booking.")
            );
        } finally {
            setIsCancelling(false);
        }
    }

    const eventName = booking.event_name?.trim() || "Event details unavailable";
    const venueName = booking.venue_name?.trim() || "Venue details unavailable";
    const venueAddress = booking.venue_address?.trim() || "Location to be announced";

    return (
        <div className="card booking-card">
            <div className="booking-card__layout">
                <div className="booking-card__content">
                    <div className="booking-card__heading">
                        <h2>{eventName}</h2>
                    </div>

                    <div className="booking-card__image">
                        <EventImage
                            imageUrl={booking.image_url}
                            alt={eventName}
                            onImageClick={() => setShowImageLightbox(true)}
                        />
                        <span
                            className={`booking-card__status booking-card__status--${booking.status}`}
                        >
                            {booking.status === "cancelled" ? "Cancelled" : "Confirmed"}
                        </span>
                    </div>

                    <ImageLightbox
                        imageUrl={booking.image_url}
                        alt={eventName}
                        isOpen={showImageLightbox}
                        onClose={() => setShowImageLightbox(false)}
                    />

                    <div className="booking-card__details">
                        <div className="booking-card__detail">
                            <span className="booking-card__detail-label">
                                Venue:
                            </span>
                            <span className="booking-card__detail-value">
                                {venueName}
                            </span>
                        </div>

                        <div className="booking-card__detail">
                            <span className="booking-card__detail-label">
                                Location:
                            </span>
                            <span className="booking-card__detail-value">
                                {venueAddress}
                            </span>
                        </div>
                    </div>

                    <DateLabel
                        label="Date & Time"
                        startDateTime={booking.start_time}
                        endDateTime={booking.end_time}
                    />

                    <div className="booking-card__booking-meta">
                        <span className="booking-card__detail-label">
                            Booked at:
                        </span>
                        <span className="booking-card__detail-value">
                            {booking.created_at
                                ? formatBookingDate(booking.created_at)
                                : "Not set"}
                        </span>
                    </div>
                </div>
            </div>

            {booking.status === "confirmed" && (
                <div className="booking-card__actions">
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
                </div>
            )}

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
