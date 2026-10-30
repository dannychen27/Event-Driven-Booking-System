const createBookingRow = (
    bookingId: number,
    userId: number,
    eventId: number,
) => ({
    id: bookingId,
    user_id: userId,
    event_id: eventId,
    created_at: "2026-09-05T20:00:00Z",
});

export const mockBookingExists = (
    client: any,
    bookingId: number,
    userId: number,
    eventId: number,
) => {
    client.query.mockResolvedValueOnce({
        rows: [createBookingRow(bookingId, userId, eventId)],
    });
};


export const mockBookingDoesNotExist = (client: any) => {
    client.query.mockResolvedValueOnce({
        rows: [],
    });
};


export const mockNoDuplicateBooking = (client: any) => {
    client.query.mockResolvedValueOnce({
        rows: [],
    });
};


export const mockDuplicateBooking = (
    client: any,
    bookingId: number,
) => {
    client.query.mockResolvedValueOnce({
        rows: [{ id: bookingId }],
    });
};


export const mockBookingCount = (
    client: any,
    count: number,
) => {
    client.query.mockResolvedValueOnce({
        rows: [{ booking_count: String(count) }],
    });
};


export const mockNoScheduleConflict = (client: any) => {
    client.query.mockResolvedValueOnce({
        rows: [],
    });
};


export const mockScheduleConflict = (
    client: any,
    bookingId: number,
) => {
    client.query.mockResolvedValueOnce({
        rows: [{ id: bookingId }],
    });
};


export const mockInsertedBooking = (
    client: any,
    bookingId: number,
    userId: number,
    eventId: number,
) => {
    client.query.mockResolvedValueOnce({
        rows: [createBookingRow(bookingId, userId, eventId)],
    });
};


export const mockDeletedBooking = (
    client: any,
    bookingId: number,
    userId: number,
    eventId: number,
) => {
    client.query.mockResolvedValueOnce({
        rows: [createBookingRow(bookingId, userId, eventId)],
    });
};


export const mockBookingHistory = (
    db: any,
    bookings: any[],
) => {
    db.query.mockResolvedValueOnce({
        rows: bookings,
    });
};

