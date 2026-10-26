import { useState } from "react";
import type { Event } from "../types/Event";
import { createBooking, getBookingHistory } from "../api/bookings.ts";
import "../styles/shared/card.css";
import "../styles/events/event-card.css";
import "../styles/shared/card-buttons.css";
import "../styles/buttons/create-booking-button.css";
import { Modal } from "./Modal.tsx";
import BookingForm from "./BookingForm.tsx";
import { formatDate } from "../utils/Dates.ts";


interface EventCardProps {
    event: Event;
}


export default function EventCard({ event }: EventCardProps) {
    const [bookingStatus, setBookingStatus] = useState<
        "idle" | "creating" | "success" | "error"
    >("idle");
    const [bookingMessage, setBookingMessage] = useState("");
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [alreadyBooked, setAlreadyBooked] = useState(false);

    // hardcoded constants for now...
    const user_id = 1;  // hardcoded for now...
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
                error instanceof Error
                    ? error.message
                    : "Failed to fetch booking history."
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
            if (error instanceof Error) {
                setBookingMessage(error.message);
            } else {
                setBookingMessage("Failed to create booking.");
            }
            setBookingStatus("error");
            return false;
        }
    }

    return (
        <div className="card event-card">
            <h2>{event.name}</h2>

            <p>Event Id: {event.id}</p>

            <p>Venue: {event.venue_name}</p>
            <p>Address: {event.venue_address}</p>

            <div className="event-datetime">
                <h3>Date & Time</h3>
                <p>
                    {formatDate(event.start_time, {
                        dateStyle: "medium",
                        timeStyle: "short",
                    })}
                    {" – "}
                    {formatDate(event.end_time, {
                        dateStyle: "medium",
                        timeStyle: "short",
                    })}
                </p>
            </div>

            <p>Capacity: {event.capacity}</p>
            <button
                className="create-booking-button"
                onClick={handleOpenBookingForm}
                disabled={bookingStatus === "creating"}
            >
                Create Booking
            </button>
            {alreadyBooked && (
                <p className="booking-error">
                    You already booked this event.
                </p>
            )}

            {showBookingForm &&
                <Modal actions={[]}>
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
                </Modal>
            }
            {bookingStatus === "creating" && <p>{bookingMessage}</p>}
            {bookingStatus === "success" && <p className="booking-success">{bookingMessage}</p>}
            {bookingStatus === "error" && <p className="booking-error">{bookingMessage}</p>}
        </div>
    );
}
