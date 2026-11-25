import { describe, expect, it } from "vitest";
import type { Booking } from "../../../../3. frontend/src/types/bookings/Booking";
import {
    aiResearchConferenceBookingFixture,
    torontoTechMeetupBookingFixture,
} from "../../../fixtures/bookings/bookingFixtures";
import { filterBookings } from "../../../../3. frontend/src/helpers/bookings/BookingsPageHelpers";

const now = new Date("2026-11-24T12:00:00.000Z");

const pastBooking: Booking = {
    ...aiResearchConferenceBookingFixture,
};

const futureBooking: Booking = {
    ...torontoTechMeetupBookingFixture,
    id: 3,
    start_time: "2026-11-25T10:00:00.000Z",
    end_time: "2026-11-25T12:00:00.000Z",
};

const boundaryBooking: Booking = {
    ...futureBooking,
    id: 4,
    start_time: "2026-11-24T11:00:00.000Z",
    end_time: now.toISOString(),
};

const cancelledBooking: Booking = {
    ...pastBooking,
    id: 5,
    status: "cancelled",
};

describe("filterBookings", () => {
    const bookings = [
        pastBooking,
        futureBooking,
        boundaryBooking,
        cancelledBooking,
    ];

    it("returns all bookings, including cancelled bookings, for All", () => {
        expect(filterBookings(bookings, "all", now)).toBe(bookings);
    });

    it("includes cancelled bookings regardless of their dates", () => {
        expect(filterBookings(
            [pastBooking, futureBooking, cancelledBooking],
            "cancelled",
            now,
        )).toEqual([cancelledBooking]);
    });

    it("excludes events ending exactly at now from Upcoming", () => {
        expect(filterBookings(bookings, "upcoming", now)).toEqual([
            futureBooking,
        ]);
    });

    it("includes bookings ending exactly at now under Past", () => {
        expect(filterBookings(bookings, "past", now)).toEqual([
            pastBooking,
            boundaryBooking,
        ]);
    });

    it("places confirmed bookings into mutually exclusive lifecycle categories", () => {
        const startedBooking: Booking = {
            ...futureBooking,
            id: 20,
            start_time: "2026-11-24T11:00:00.000Z",
            end_time: "2026-11-24T13:00:00.000Z",
        };
        const startsNowBooking: Booking = {
            ...startedBooking,
            id: 21,
            start_time: now.toISOString(),
        };
        const endsNowBooking: Booking = {
            ...startedBooking,
            id: 22,
            end_time: now.toISOString(),
        };
        const upcomingBooking: Booking = {
            ...futureBooking,
            id: 23,
            start_time: "2026-11-24T13:00:00.000Z",
            end_time: "2026-11-24T14:00:00.000Z",
        };

        expect(filterBookings(
            [startedBooking, startsNowBooking, endsNowBooking, upcomingBooking],
            "upcoming",
            now,
        )).toEqual([upcomingBooking]);

        expect(filterBookings(
            [startedBooking, startsNowBooking, endsNowBooking, upcomingBooking],
            "happening-now",
            now,
        )).toEqual([startedBooking, startsNowBooking]);

        expect(filterBookings(
            [startedBooking, startsNowBooking, endsNowBooking, upcomingBooking],
            "past",
            now,
        )).toEqual([endsNowBooking]);
    });

    it("excludes bookings with missing or invalid start times from lifecycle filters", () => {
        const invalidStartBooking: Booking = {
            ...futureBooking,
            id: 24,
            start_time: "not-a-date",
        };
        const missingStartBooking = {
            ...futureBooking,
            id: 25,
            start_time: null,
        };

        for (const filter of ["upcoming", "happening-now", "past"] as const) {
            expect(filterBookings(
                [invalidStartBooking, missingStartBooking],
                filter,
                now,
            )).toEqual([]);
        }
    });

    it("excludes cancelled bookings from Upcoming and Past", () => {
        expect(filterBookings(
            [cancelledBooking],
            "upcoming",
            now,
        )).toEqual([]);
        expect(filterBookings(
            [cancelledBooking],
            "past",
            now,
        )).toEqual([]);
    });

    it("excludes bookings with invalid or missing end times", () => {
        const invalidBooking: Booking = {
            ...futureBooking,
            id: 6,
            end_time: "not-a-date",
        };
        const missingEndTimeBooking = {
            ...futureBooking,
            id: 7,
            end_time: undefined,
        } as unknown as Booking;

        expect(filterBookings(
            [invalidBooking, missingEndTimeBooking],
            "upcoming",
            now,
        )).toEqual([]);
        expect(filterBookings(
            [invalidBooking, missingEndTimeBooking],
            "past",
            now,
        )).toEqual([]);
    });
});
