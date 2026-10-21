import "../styles/booking-form.css";


interface BookingFormProps {
    onCancel: () => void;
    onBookingCreated: () => void | Promise<void>;
}



export default function BookingForm({ onCancel, onBookingCreated }: BookingFormProps) {
    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        onBookingCreated();
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
                <button className="cancel-button" type="button" onClick={onCancel}>
                    Cancel
                </button>

                <button className="booking-button" type="submit">
                    Book Event
                </button>
            </div>
        </form>
    );
}
