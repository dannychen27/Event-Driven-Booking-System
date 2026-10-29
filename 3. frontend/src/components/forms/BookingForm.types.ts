export interface BookingFormProps {
    onCancel: () => void;
    onBookingCreated: () => void | Promise<void>;
}
