import { afterEach, describe, expect, it, vi } from "vitest";

import {
    createBooking,
    getBookingHistory,
    cancelBooking,
} from "../../../3. frontend/src/api/bookings";

describe("createBooking", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("sends a POST request with the user ID", async () => {
        const booking = { id: 10, user_id: 1, event_id: 2 };
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue(booking),
        });
        vi.stubGlobal("fetch", fetchMock);

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
        const booking = { id: 10, user_id: 1, event_id: 2 };
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue(booking),
        });
        vi.stubGlobal("fetch", fetchMock);

        await expect(createBooking(1, 2)).resolves.toEqual(booking);
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
        const fetchMock = vi.fn().mockResolvedValue({
            ok: false,
            json: vi.fn().mockResolvedValue({ message }),
        });
        vi.stubGlobal("fetch", fetchMock);

        await expect(createBooking(1, 2)).rejects.toThrow(expectedMessage);
    });

    it("uses a fallback message when the error response cannot be parsed", async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: false,
            json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
        });
        vi.stubGlobal("fetch", fetchMock);

        await expect(createBooking(1, 2)).rejects.toThrow(
            "Failed to create booking",
        );
    });

    it("uses a fallback message when the error response has no message", async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: false,
            json: vi.fn().mockResolvedValue({}),
        });
        vi.stubGlobal("fetch", fetchMock);

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
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue([]),
        });
        vi.stubGlobal("fetch", fetchMock);

        await getBookingHistory(1);

        expect(fetchMock).toHaveBeenCalledWith(
            "http://localhost:3000/users/1/bookings",
        );
    });

    it("returns bookings from a successful response", async () => {
        const bookings = [{ id: 10, user_id: 1, event_id: 2 }];
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue(bookings),
        });
        vi.stubGlobal("fetch", fetchMock);

        await expect(getBookingHistory(1)).resolves.toEqual(bookings);
    });

    it("throws an error when the request fails", async () => {
        const fetchMock = vi.fn().mockResolvedValue({ ok: false });
        vi.stubGlobal("fetch", fetchMock);

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
        const booking = { id: 10, user_id: 1, event_id: 2 };
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue(booking),
        });
        vi.stubGlobal("fetch", fetchMock);

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
        const booking = { id: 10, user_id: 1, event_id: 2 };
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue(booking),
        });
        vi.stubGlobal("fetch", fetchMock);

        await expect(cancelBooking(1, 10)).resolves.toEqual(booking);
    });

    it("throws an error when the request fails", async () => {
        const fetchMock = vi.fn().mockResolvedValue({ ok: false });
        vi.stubGlobal("fetch", fetchMock);

        await expect(cancelBooking(1, 10)).rejects.toThrow(
            "Failed to cancel booking",
        );
    });
});
