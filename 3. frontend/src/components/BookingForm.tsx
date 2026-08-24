import { useState } from "react";
import "../styles/bookings.css";


interface BookingFormProps {
    eventId: number;
}


export default function BookingForm({ eventId }: BookingFormProps) {
    const [name, setName] = useState("");
    const [guests, setGuests] = useState(1);
    const [submitted, setSubmitted] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    function validateForm() {
        const errors: Record<string, string> = {};

        if (!name.trim()) {
            errors.name = "Name is required";
        }

        if (guests < 1) {
            errors.guests = "Number of guests must be at least 1";
        }

        return errors;
    }

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setErrors(errors);
            return;
        }

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
                {errors.name && <p>{errors.name}</p>}
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
                {errors.guests && <p>{errors.guests}</p>}
            </div>

            <button className="booking-button" type="submit">
                Book Event
            </button>
            {submitted && <p>Booking submitted successfully!</p>}
        </form>
    );
}
