import type { Booking } from "../../../3. frontend/src/types/Booking";

export const bookingHistoryFixture: Booking[] = [
    {
        id: 1,
        user_id: 1,
        event_id: 1,
        created_at: "2026-09-06T12:00:00Z",
        event_name: "Toronto Tech Meetup",
        start_time: "2026-09-10T18:00:00Z",
        end_time: "2026-09-10T20:00:00Z",
        venue_name: "Innovation Hub",
        venue_address: "100 King Street West",
    },
    {
        id: 2,
        user_id: 1,
        event_id: 2,
        created_at: "2026-09-06T13:00:00Z",
        event_name: "AI Research Conference",
        start_time: "2026-09-11T14:00:00Z",
        end_time: "2026-09-11T17:00:00Z",
        venue_name: "Toronto Convention Centre",
        venue_address: "255 Front Street West",
    },
];

export const existingBookingFixture: Booking = bookingHistoryFixture[0];
