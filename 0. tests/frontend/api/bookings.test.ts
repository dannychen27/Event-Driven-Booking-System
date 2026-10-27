import { afterEach, describe, expect, it, vi } from "vitest";

import {
    createBooking,
    getBookingHistory,
    cancelBooking,
} from "../../../3. frontend/src/api/bookings";
import { apiBookingFixture } from "../fixtures/bookingFixtures";
import {
    mockFetchResponse,
} from "../helpers/bookingApiTestHelpers";

describe("createBooking", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("sends a POST request with the user ID", async () => {
        const fetchMock = mockFetchResponse(apiBookingFixture);

        await createBooking(1, 2);

        expect(fetchMock).toHaveBeenCalledWith(
            "http://localhost:3000/events/2/book",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ user_id: 1 }),
            },
        );
    });

    it("returns the booking from a successful response", async () => {
        mockFetchResponse(apiBookingFixture);

        await expect(createBooking(1, 2)).resolves.toEqual(
            apiBookingFixture,
        );
    });

    it.each([
        ["already booked", "You have already booked this event."],
        ["Event is full", "This event is fully booked."],
        [
            "conflicting booking",
            "You already have another booking that conflicts with this event.",
        ],
        ["User not found", "The user was not found."],
        ["Event not found", "The event was not found."],
    ])("translates backend error %s", async (message, expectedMessage) => {
        mockFetchResponse({ message }, { ok: false });

        await expect(createBooking(1, 2)).rejects.toThrow(expectedMessage);
    });

    it("uses a fallback message when the error response cannot be parsed", async () => {
        mockFetchResponse(null, { ok: false, rejectJson: true });

        await expect(createBooking(1, 2)).rejects.toThrow(
            "Failed to create booking",
        );
    });

    it("uses a fallback message when the error response has no message", async () => {
        mockFetchResponse({}, { ok: false });

        await expect(createBooking(1, 2)).rejects.toThrow(
            "Failed to create booking",
        );
    });
});

describe("getBookingHistory", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("sends a GET request to the user's bookings endpoint", async () => {
        const fetchMock = mockFetchResponse([]);

        await getBookingHistory(1);

        expect(fetchMock).toHaveBeenCalledWith(
            "http://localhost:3000/users/1/bookings",
        );
    });

    it("returns bookings from a successful response", async () => {
        const bookings = [apiBookingFixture];
        mockFetchResponse(bookings);

        await expect(getBookingHistory(1)).resolves.toEqual(bookings);
    });

    it("throws an error when the request fails", async () => {
        mockFetchResponse(null, { ok: false });

        await expect(getBookingHistory(1)).rejects.toThrow(
            "Failed to fetch bookings for user 1",
        );
    });
});

describe("cancelBooking", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("sends a DELETE request with the user ID", async () => {
        const fetchMock = mockFetchResponse(apiBookingFixture);

        await cancelBooking(1, 10);

        expect(fetchMock).toHaveBeenCalledWith(
            "http://localhost:3000/bookings/10",
            {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ user_id: 1 }),
            },
        );
    });

    it("returns the cancelled booking from a successful response", async () => {
        mockFetchResponse(apiBookingFixture);

        await expect(cancelBooking(1, 10)).resolves.toEqual(
            apiBookingFixture,
        );
    });

    it("throws an error when the request fails", async () => {
        mockFetchResponse(null, { ok: false });

        await expect(cancelBooking(1, 10)).rejects.toThrow(
            "Failed to cancel booking",
        );
    });
});
