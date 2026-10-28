import "../../styles/bookings/booking-form.css";
import { useState } from "react";
import Button from "../ui/buttons/Button";


interface BookingFormProps {
    onCancel: () => void;
    onBookingCreated: () => void | Promise<void>;
}

export default function BookingForm({
    onCancel,
    onBookingCreated,
}: BookingFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        try {
            await onBookingCreated();
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <form
            className="booking-form"
            onSubmit={handleSubmit}
            noValidate
        >
            <h2>Book This Event</h2>

            <p>Are you sure you want to book this event?</p>

            <div className="booking-form-actions">
                <Button
                    variant="danger"
                    className="cancel-button"
                    type="button"
                    onClick={onCancel}
                    disabled={isSubmitting}
                >
                    Cancel
                </Button>

                <Button
                    variant="success"
                    className="booking-button"
                    type="submit"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Booking..." : "Book Event"}
                </Button>
            </div>
        </form>
    );
}
