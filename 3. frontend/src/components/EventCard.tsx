import { useState } from "react";
import type { Event } from "../types/Event";
import { createBooking, getBookingHistory } from "../api/bookings.ts";
import "../styles/event-card.css";
import { Modal } from "./Modal.tsx";
import BookingForm from "./BookingForm.tsx";


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
    }

    async function handleCreateBooking() {
        setBookingStatus("creating");
        setBookingMessage("Creating booking...");

        try {
            await createBooking(user_id, event.id);
            setBookingStatus("success");
            setBookingMessage("Booking created successfully.");
        } catch (error) {
            if (error instanceof Error) {
                setBookingMessage(error.message);
            } else {
                setBookingMessage("Failed to create booking.");
            }
            setBookingStatus("error");
        }
    }

    function getBookingModalActions() {
        return [
            {
                label: "Cancel",
                onClick: () => setShowBookingForm(false),
            },
            {
                label: "Create Booking",
                onClick: () => {
                    handleCreateBooking();
                    setShowBookingForm(false);
                },
            },
        ];
    }

    return (
        <div className="event-card">
            <h2>{event.name}</h2>
            <p>Venue: {event.venue}</p>
            {/* TODO: event.venue is undefined.
            TODO: figure out how to convert Event's venue_id's into venue objects
            TODO: to extract the venue name. */}
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
                <Modal actions={getBookingModalActions()}>
                    <BookingForm
                        eventId={event.id}
                        onBookingCreated={() => setShowBookingForm(false)}
                    />
                </Modal>
            }
            {bookingStatus === "creating" && <p>{bookingMessage}</p>}
            {bookingStatus === "success" && <p className="booking-success">{bookingMessage}</p>}
            {bookingStatus === "error" && <p className="booking-error">{bookingMessage}</p>}
        </div>
    );
}
