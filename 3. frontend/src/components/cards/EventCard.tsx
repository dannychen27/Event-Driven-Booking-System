import { useState } from "react";
import type {
    EventCardProps,
    EventBookingStatus,
} from "../../types/events/EventCard.types.ts";
import { createBooking } from "../../api/bookings.ts";
import "../../styles/shared/card.css";
import "../../styles/events/event-card.css";
import "../../styles/shared/card-buttons.css";
import "../../styles/errors/error-message.css";
import "../../styles/errors/success-message.css";
import "../../styles/errors/status-message.css";
import { InfoLabel } from "../ui/labels/InfoLabel.tsx";
import { DateLabel } from "../ui/labels/DateLabel.tsx";
import { BOOKING_USER_ID } from "../../constants/bookings/booking.ts";
import Button from "../ui/buttons/Button";
import { EventImage } from "../ui/EventImage.tsx";
import { ImageLightbox } from "../ui/ImageLightbox.tsx";
import { Modal } from "../modals/Modal.tsx";
import BookingForm from "../forms/BookingForm.tsx";
import { getErrorMessage } from "../../helpers/shared/Errors.ts";

export default function EventCard({
    event,
    isBooked,
    bookingHistoryStatus,
    onBookingCreated,
}: EventCardProps) {
    const [bookingStatus, setBookingStatus] = useState<EventBookingStatus>("idle");
    const [bookingMessage, setBookingMessage] = useState("");
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [showImageLightbox, setShowImageLightbox] = useState(false);

    // TODO: Hardcoded user for now. Replace when user accounts are implemented (authentication).
    const user_id = BOOKING_USER_ID;

    const attendeeCount =
        typeof event.attendee_count === "number" &&
        Number.isFinite(event.attendee_count)
            ? event.attendee_count
            : null;

    const capacity =
        typeof event.capacity === "number" &&
        Number.isFinite(event.capacity)
            ? event.capacity
            : null;

    function handleOpenBookingForm() {
        if (
            bookingHistoryStatus !== "ready" ||
            isBooked ||
            bookingStatus === "creating"
        ) {
            return;
        }

        setBookingStatus("idle");
        setBookingMessage("");
        setShowBookingForm(true);
    }

    async function handleCreateBooking() {
        setBookingStatus("creating");
        setBookingMessage("Creating booking...");

        try {
            await createBooking(user_id, event.id);

            setBookingStatus("success");
            setBookingMessage("Booking created successfully.");

            onBookingCreated(event.id);
            setShowBookingForm(false);

            return true;
        } catch (error) {
            setBookingMessage(
                getErrorMessage(error, "Failed to create booking."),
            );
            setBookingStatus("error");

            return false;
        }
    }

    return (
        <div className="card event-card">
            <div className="event-card__image-wrapper">
                <EventImage
                    imageUrl={event.image_url}
                    alt={event.name}
                    onImageClick={() => setShowImageLightbox(true)}
                />

                {isBooked && (
                    <span className="event-booked-badge">
                        <span aria-hidden="true">✓</span>
                        Already booked
                    </span>
                )}
            </div>

            <ImageLightbox
                imageUrl={event.image_url}
                alt={event.name}
                isOpen={showImageLightbox}
                onClose={() => setShowImageLightbox(false)}
            />

            <div className="event-card-header">
                <h2>{event.name}</h2>
            </div>

            {event.description?.trim() && (
                <p className="event-card-description">
                    {event.description}
                </p>
            )}

            <div className="event-card-details">
                <InfoLabel
                    label="Venue"
                    value={event.venue_name?.trim() || "Venue details unavailable"}
                />
                <InfoLabel
                    label="Location"
                    value={event.venue_address?.trim() || "Location to be announced"}
                />
            </div>

            <DateLabel
                label="Date & Time"
                startDateTime={event.start_time}
                endDateTime={event.end_time}
            />

            <InfoLabel
                label="Attendance"
                value={`${attendeeCount ?? "Unknown"} / ${capacity ?? "Unknown"} ${capacity === 1 ? "attendee" : "attendees"}`}
            />

            {!isBooked && bookingHistoryStatus === "loading" && (
                <p className="event-booking-status" role="status">
                    <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 7v5l3 2" />
                    </svg>
                    Checking booking status...
                </p>
            )}

            {!isBooked && bookingHistoryStatus === "error" && (
                <Button variant="success" disabled>
                    Booking status unavailable
                </Button>
            )}

            {!isBooked && bookingHistoryStatus === "ready" && (
                <Button
                    variant="success"
                    onClick={handleOpenBookingForm}
                    disabled={bookingStatus === "creating"}
                >
                    Create Booking
                </Button>
            )}

            {isBooked && (
                <p className="event-booked-message" role="status">
                    <span aria-hidden="true">✓</span>
                    You've already booked this event.
                </p>
            )}

            {showBookingForm && (
                <Modal
                    body={
                        <BookingForm
                            onCancel={() => setShowBookingForm(false)}
                            onBookingCreated={async () => {
                                await handleCreateBooking();
                            }}
                        />
                    }
                />
            )}

            {bookingStatus === "creating" && (
                <p className="status-message" role="status">
                    {bookingMessage}
                </p>
            )}

            {bookingStatus === "success" && (
                <p className="success-message" role="status">
                    {bookingMessage}
                </p>
            )}

            {bookingStatus === "error" && (
                <p className="error-message" role="alert">
                    {bookingMessage}
                </p>
            )}
        </div>
    );
}
