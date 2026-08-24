import { useState } from "react";
import "../styles/bookings.css";


interface BookingFormProps {
    eventId: number;
}


export default function BookingForm({ eventId }: BookingFormProps) {
    const [name, setName] = useState("");
    const [guests, setGuests] = useState(1);
    const [submitted, setSubmitted] = useState(false);

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setSubmitted(true);

        console.log({
            eventId,
            name,
            guests,
        });
    }

    return (
        <form className="booking-form" onSubmit={handleSubmit}>
            <h2>Book This Event</h2>

            <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                />
            </div>

            <div className="form-group">
                <label htmlFor="guests">Number of Guests</label>
                <input
                    id="guests"
                    type="number"
                    min="1"
                    value={guests}
                    onChange={(event) => setGuests(Number(event.target.value))}
                />
            </div>

            <button className="booking-button" type="submit">
                Book Event
            </button>
            {submitted && <p>Booking submitted successfully!</p>}
        </form>
    );
}
