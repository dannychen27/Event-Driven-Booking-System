import { useState } from "react";
import type { EventCardProps } from "../../types/events/EventCard.types.ts";
import { createBooking, getBookingHistory } from "../../api/bookings.ts";
import "../../styles/shared/card.css";
import "../../styles/events/event-card.css";
import "../../styles/shared/card-buttons.css";
import "../../styles/errors/error-message.css";
import "../../styles/errors/success-message.css";
import "../../styles/errors/status-message.css";
import { InfoLabel } from "../ui/labels/InfoLabel.tsx";
import { DateLabel } from "../ui/labels/DateLabel.tsx";
import type { EventBookingStatus } from "../../types/events/EventCard.types.ts";
import { BOOKING_USER_ID } from "../../constants/bookings/booking.ts";
import Button from "../ui/buttons/Button";
import { Modal } from "../modals/Modal.tsx";
import BookingForm from "../forms/BookingForm.tsx";
import { getErrorMessage } from "../../helpers/shared/Errors.ts";


export default function EventCard({ event }: EventCardProps) {
    const [bookingStatus, setBookingStatus] = useState<EventBookingStatus>("idle");
    const [bookingMessage, setBookingMessage] = useState("");
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [alreadyBooked, setAlreadyBooked] = useState(false);

    // hardcoded constants for now...
    const user_id = BOOKING_USER_ID;  // hardcoded for now...
    // TODO: when we create accounts, we can load that specific user's
    // TODO: bookings (using their own user_id instead of a hardcoded one).

    async function handleOpenBookingForm() {
        try {
            const bookings = await getBookingHistory(user_id);
            const userHasBooking = bookings.some(
                booking => booking.event_id === event.id
            );

            if (userHasBooking) {
                setAlreadyBooked(true);
                return;
            } else {
                setShowBookingForm(true);
            }
        } catch (error) {
            setBookingMessage(
                getErrorMessage(error, "Failed to fetch booking history.")
            );
            setBookingStatus("error");
        }
    }

    async function handleCreateBooking() {
        setBookingStatus("creating");
        setBookingMessage("Creating booking...");

        try {
            await createBooking(user_id, event.id);
            setBookingStatus("success");
            setBookingMessage("Booking created successfully.");
            return true;
        } catch (error) {
            setBookingMessage(
                getErrorMessage(error, "Failed to create booking.")
            );
            setBookingStatus("error");
            return false;
        }
    }

    return (
        <div className="card event-card">
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
                disabled={bookingStatus === "creating"}
            >
                Create Booking
            </Button>
            {alreadyBooked && (
                <p className="error-message">
                    You already booked this event.
                </p>
            )}

            {showBookingForm && (
                <Modal
                    body={
                        <BookingForm
                            onCancel={() => setShowBookingForm(false)}
                            onBookingCreated={async () => {
                                const bookingSuccessful = await handleCreateBooking();
                                if (bookingSuccessful) {
                                    setAlreadyBooked(true);
                                    setShowBookingForm(false);
                                }
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
            {bookingStatus === "error" && <p className="error-message">{bookingMessage}</p>}
        </div>
    );
}
