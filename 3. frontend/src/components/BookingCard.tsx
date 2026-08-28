import { useState } from "react";
import type { Booking } from "../types/Booking.ts";
import { formatDate } from "../utils/Dates.ts";
import "../styles/booking-card.css";


interface BookingCardProps {
    booking: Booking;
}


export default function BookingCard({ booking }: BookingCardProps) {
    const [showDetails, setShowDetails] = useState(false);

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

    return (
        <div className="booking-card">
            <h2>Booking Id: {booking.id}</h2>   {/* TODO: replace with booking name? */}
            <p>Event Id: {booking.event_id}</p>   {/* TODO: replace with event's name and address? */}
            <p>User Id: {booking.user_id}</p>   {/* TODO: replace with user's name? */}
            <button onClick={() => setShowDetails(!showDetails)}>
                {showDetails ? "Hide Details" : "View Details"}
            </button>
            {showDetails && <p>Created at: {getFormattedDate()}</p>}
        </div>
    );
}
