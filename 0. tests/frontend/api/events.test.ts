import { afterEach, describe, expect, it, vi } from "vitest";

import {
    getEvents,
    searchEvents,
    searchEventsNaturalLanguage,
} from "../../../3. frontend/src/api/events";

describe("getEvents", () => {

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("sends a GET request to the events endpoint", async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue([]),
        });
        vi.stubGlobal("fetch", fetchMock);

        await getEvents();

        expect(fetchMock).toHaveBeenCalledWith(
            "http://localhost:3000/events",
        );
    });

    it("returns events from a successful response", async () => {
        const events = [{ id: 1, name: "Coffee Meetup" }];
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue(events),
        });
        vi.stubGlobal("fetch", fetchMock);

        await expect(getEvents()).resolves.toEqual(events);
    });

    it("throws an error when the request fails", async () => {
        const fetchMock = vi.fn().mockResolvedValue({ ok: false });
        vi.stubGlobal("fetch", fetchMock);

        await expect(getEvents()).rejects.toThrow(
            "Failed to fetch events",
        );
    });
});

describe("searchEvents", () => {

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("sends the keyword as an encoded query parameter", async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue([]),
        });
        vi.stubGlobal("fetch", fetchMock);

        await searchEvents("coffee & tea");

        expect(fetchMock).toHaveBeenCalledWith(
            "http://localhost:3000/events/search?keyword=coffee+%26+tea",
        );
    });

    it("returns events from a successful response", async () => {
        const events = [{ id: 2, name: "Tea Meetup" }];
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue(events),
        });
        vi.stubGlobal("fetch", fetchMock);

        await expect(searchEvents("tea")).resolves.toEqual(events);
    });

    it("throws an error when the request fails", async () => {
        const fetchMock = vi.fn().mockResolvedValue({ ok: false });
        vi.stubGlobal("fetch", fetchMock);

        await expect(searchEvents("tea")).rejects.toThrow(
            "Failed to search events",
        );
    });
});

describe("searchEventsNaturalLanguage", () => {

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("sends a POST request with the natural-language query", async () => {
        const events = [{ id: 1, name: "Coffee Meetup" }];
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue(events),
        });
        vi.stubGlobal("fetch", fetchMock);

        await searchEventsNaturalLanguage("Find coffee events");

        expect(fetchMock).toHaveBeenCalledWith(
            "http://localhost:3000/events/natural-language-search",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    query: "Find coffee events",
                }),
            },
        );
    });

    it("returns events from a successful response", async () => {
        const events = [{ id: 1, name: "Coffee Meetup" }];
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue(events),
        });
        vi.stubGlobal("fetch", fetchMock);

        await expect(
            searchEventsNaturalLanguage("Find coffee events"),
        ).resolves.toEqual(events);
    });

    it("preserves the backend error message when the request fails", async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: false,
            json: vi.fn().mockResolvedValue({
                message: "AI search is temporarily unavailable. Please try again later.",
            }),
        });
        vi.stubGlobal("fetch", fetchMock);

        await expect(
            searchEventsNaturalLanguage("Find coffee events"),
        ).rejects.toThrow(
            "AI search is temporarily unavailable. Please try again later.",
        );
    });

    it("uses a fallback message when the error response cannot be parsed", async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: false,
            json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
        });
        vi.stubGlobal("fetch", fetchMock);

        await expect(
            searchEventsNaturalLanguage("Find coffee events"),
        ).rejects.toThrow(
            "Failed to search events with natural language",
        );
    });
});
