interface BookingCardModalBodyProps {
    cancellationError: string | null;
}

export function BookingCardModalBody({
    cancellationError,
}: BookingCardModalBodyProps) {
    return (
        <>
            <h2>Cancel Booking?</h2>
            <p>This action cannot be undone.</p>
            {cancellationError && (
                <p className="error-message">
                    {cancellationError}
                </p>
            )}
        </>
    );
}
