import { render } from "@testing-library/react";


import BookingForm from "../../3. frontend/src/components/BookingForm";


export function renderBookingForm({
    onCancel = () => {},
    onBookingCreated = () => {},
}: {
    onCancel?: () => void;
    onBookingCreated?: () => void;
} = {}) {
    return render(
        <BookingForm
            eventId={1}
            onCancel={onCancel}
            onBookingCreated={onBookingCreated}
        />,
    );
}

