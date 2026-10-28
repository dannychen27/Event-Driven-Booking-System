
import type { Booking } from "../../../3. frontend/src/types/Booking";

import {
    bookingHistoryFixture as sharedBookingHistoryFixture,
    torontoTechMeetupBookingFixture,
} from "../../fixtures/bookingFixtures";

export const bookingHistoryFixture: Booking[] = sharedBookingHistoryFixture;

export const existingBookingFixture: Booking = {
    ...torontoTechMeetupBookingFixture,
    event_id: 1,
};

export const apiBookingFixture = {
    id: 10,
    user_id: 1,
    event_id: 2,
};

export const bookingCardFixture: Booking = {
    ...torontoTechMeetupBookingFixture,
    id: 1,
    event_id: 1,
    created_at: "2026-09-06T12:00:00Z",
};
