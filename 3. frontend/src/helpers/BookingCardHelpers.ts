interface GetCancelModalButtonsParams {
    isCancelling: boolean;
    onKeepBooking: () => void;
    onCancelBooking: () => void;
}

export const getCancelModalButtons = ({
    isCancelling,
    onKeepBooking,
    onCancelBooking,
}: GetCancelModalButtonsParams) => [
    {
        label: "Keep Booking",
        variant: "success" as const,
        className: "keep-booking-button",
        disabled: isCancelling,
        onClick: onKeepBooking,
    },
    {
        label: isCancelling ? "Cancelling..." : "Cancel Booking",
        variant: "danger" as const,
        className: "cancel-button",
        disabled: isCancelling,
        onClick: onCancelBooking,
    },
];
