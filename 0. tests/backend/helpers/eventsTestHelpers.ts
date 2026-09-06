export const mockEventLookupExists = (
    db: any,
    eventId: number,
    capacity = 10,
    startTime = "2026-09-10T10:00:00Z",
    endTime = "2026-09-10T11:00:00Z",
) => {
    db.query.mockResolvedValueOnce({
        rows: [
            {
                id: eventId,
                start_time: startTime,
                end_time: endTime,
                capacity,
            },
        ],
    });
};


export const mockAvailability = (
    db: any,
    capacity: number,
    booked: number,
    available: number,
) => {
    db.query.mockResolvedValueOnce({
        rows: [
            {
                capacity,
                booked,
                available,
            },
        ],
    });
};

