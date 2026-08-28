import { useState } from "react";
import type { Event } from "../types/Event";
import { createBooking } from "../api/bookings.ts";
import "../styles/event-card.css";


interface EventCardProps {
    event: Event;
}


export default function EventCard({ event }: EventCardProps) {
    const [showDetails, setShowDetails] = useState(false);
    const [bookingStatus, setBookingStatus] = useState<
        "idle" | "creating" | "success" | "error"
    >("idle");
    const [bookingMessage, setBookingMessage] = useState("");

    // hardcoded constants for now...
    const user_id = 1;

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

    return (
        <div className="event-card">
            <h2>{event.name}</h2>
            <p>Venue: {event.venue}</p>
            <button onClick={() => setShowDetails(!showDetails)}>
                {showDetails ? "Hide Details" : "View Details"}
            </button>
            {showDetails && <p>Capacity: {event.capacity}</p>}

            <button
                onClick={handleCreateBooking}
                disabled={bookingStatus === "creating"}
            >
                Create Booking
            </button>
            {bookingStatus === "creating" && <p>{bookingMessage}</p>}
            {bookingStatus === "success" && <p className="booking-success">{bookingMessage}</p>}
            {bookingStatus === "error" && <p className="booking-error">{bookingMessage}</p>}
        </div>
    );
}
