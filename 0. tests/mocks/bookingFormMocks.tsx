import { render } from "@testing-library/react";


import BookingForm from "../../3. frontend/src/components/BookingForm";


export function renderBookingForm({
    onCancel = () => {},
    onBookingCreated = () => {},
}: {
    onCancel?: () => void;
    onBookingCreated?: () => void | Promise<void>;
} = {}) {
    return render(
        <BookingForm
            onCancel={onCancel}
            onBookingCreated={onBookingCreated}
        />,
    );
}

