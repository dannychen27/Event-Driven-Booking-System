import { useState } from "react";
import type {BookingHistoryStatus, EventCardProps} from "../../types/events/EventCard.types.ts";
import type { EventBookingStatus } from "../../types/events/EventCard.types.ts";
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
import { Modal } from "../modals/Modal.tsx";
import BookingForm from "../forms/BookingForm.tsx";
import { getErrorMessage } from "../../helpers/shared/Errors.ts";

function getIsBooked(isBooked: boolean, bookingHistoryStatus: BookingHistoryStatus) {
    return isBooked
        ? "Already booked"
        : bookingHistoryStatus === "loading"
            ? "Checking booking status..."
            : bookingHistoryStatus === "error"
                ? "Booking status unavailable"
                : "Create Booking";
}

export default function EventCard({
    event,
    isBooked,
    bookingHistoryStatus,
    onBookingCreated,
}: EventCardProps) {
    const [bookingStatus, setBookingStatus] =
        useState<EventBookingStatus>("idle");
    const [bookingMessage, setBookingMessage] = useState("");
    const [showBookingForm, setShowBookingForm] = useState(false);

    // Hardcoded user for now. Replace when user accounts are implemented.
    const user_id = BOOKING_USER_ID;

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
                getErrorMessage(error, "Failed to create booking.")
            );
            setBookingStatus("error");

            return false;
        }
    }

    const bookingButtonLabel = getIsBooked(isBooked, bookingHistoryStatus);

    return (
        <div className="card event-card">
            <EventImage
                imageUrl={event.image_url}
                alt={event.name}
            />

            <h2>{event.name}</h2>

            <InfoLabel label="Event Id" value={event.id} />
            <InfoLabel label="Venue" value={event.venue_name} />
            <InfoLabel label="Address" value={event.venue_address} />

            <DateLabel
                label="Date & Time"
                startDateTime={event.start_time}
                endDateTime={event.end_time}
            />

            <InfoLabel label="Capacity" value={event.capacity} />

            <Button
                variant="success"
                onClick={handleOpenBookingForm}
                disabled={
                    bookingHistoryStatus !== "ready" ||
                    isBooked ||
                    bookingStatus === "creating"
                }
            >
                {bookingButtonLabel}
            </Button>

            {isBooked && (
                <p className="status-message" role="status">
                    You already booked this event.
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
