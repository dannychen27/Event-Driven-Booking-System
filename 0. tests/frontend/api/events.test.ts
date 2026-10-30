import { afterEach, describe, expect, it, vi } from "vitest";

import {
    getEvents,
    searchEvents,
    searchEventsNaturalLanguage,
} from "../../../3. frontend/src/api/events";
import { mockFetchResponse } from "../helpers/apiTestHelpers";
import {
    minimalCoffeeMeetupEventFixture,
    minimalTeaMeetupEventFixture
} from "../fixtures/events/eventFixtures";

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("getEvents", () => {
    it("sends a GET request to the events endpoint", async () => {
        const fetchMock = mockFetchResponse([]);

        await getEvents();

        expect(fetchMock).toHaveBeenCalledWith("http://localhost:3000/events");
    });

    it("returns events from a successful response", async () => {
        const events = [minimalCoffeeMeetupEventFixture];
        mockFetchResponse(events);

        await expect(getEvents()).resolves.toEqual(events);
    });

    it("throws an error when the request fails", async () => {
        mockFetchResponse(null, { ok: false });

        await expect(getEvents()).rejects.toThrow("Failed to fetch events");
    });
});

describe("searchEvents", () => {
    it("sends the keyword as an encoded query parameter", async () => {
        const fetchMock = mockFetchResponse([]);

        await searchEvents("coffee & tea");

        expect(fetchMock).toHaveBeenCalledWith(
            "http://localhost:3000/events/search?keyword=coffee+%26+tea"
        );
    });

    it("returns events from a successful response", async () => {
        const events = [minimalTeaMeetupEventFixture];
        mockFetchResponse(events);

        await expect(searchEvents("tea")).resolves.toEqual(events);
    });

    it("throws an error when the request fails", async () => {
        mockFetchResponse(null, { ok: false });

        await expect(searchEvents("tea")).rejects.toThrow("Failed to search events");
    });
});

describe("searchEventsNaturalLanguage", () => {
    it("sends a POST request with the natural-language query", async () => {
        const events = [minimalCoffeeMeetupEventFixture];
        const fetchMock = mockFetchResponse(events);

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
        const events = [minimalCoffeeMeetupEventFixture];
        mockFetchResponse(events);

        await expect(searchEventsNaturalLanguage("Find coffee events"))
            .resolves.toEqual(events);
    });

    it("preserves the backend error message when the request fails", async () => {
        mockFetchResponse(
            {
                message: "AI search is temporarily unavailable. Please try again later.",
            },
            { ok: false },
        );

        await expect(searchEventsNaturalLanguage("Find coffee events"))
            .rejects.toThrow("AI search is temporarily unavailable. Please try again later.");
    });

    it("uses a fallback message when the error response cannot be parsed", async () => {
        mockFetchResponse(null, {
            ok: false,
            rejectJson: true,
        });

        await expect(searchEventsNaturalLanguage("Find coffee events"))
            .rejects.toThrow("Failed to search events with natural language");
    });
});
