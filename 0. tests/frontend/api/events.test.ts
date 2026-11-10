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
    const request = {
        query: "Find coffee events",
        filters: {
            date: {
                state: "selected" as const,
                value: {
                    startDate: "2026-11-14",
                    endDate: "2026-11-15",
                },
            },
        },
    };

    it("sends a POST request with the complete search request", async () => {
        const response = {
            status: "success",
            events: [minimalCoffeeMeetupEventFixture],
            appliedFilters: {},
        };
        const fetchMock = mockFetchResponse(response);

        await searchEventsNaturalLanguage(request);

        expect(fetchMock).toHaveBeenCalledWith(
            "http://localhost:3000/events/natural-language-search",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(request),
            },
        );
    });

    it("returns a successful search response", async () => {
        const response = {
            status: "success" as const,
            events: [minimalCoffeeMeetupEventFixture],
            appliedFilters: {},
        };
        mockFetchResponse(response);

        await expect(searchEventsNaturalLanguage(request))
            .resolves.toEqual(response);
    });

    it("returns a clarification response without treating it as events", async () => {
        const response = {
            status: "clarification_required" as const,
            conflicts: [
                {
                    category: "date" as const,
                    aiInterpretation: "Tomorrow",
                    userSelection: "November 16, 2026",
                },
            ],
        };
        mockFetchResponse(response);

        await expect(searchEventsNaturalLanguage(request))
            .resolves.toEqual(response);
    });

    it("preserves the backend error message when the request fails", async () => {
        mockFetchResponse(
            {
                message: "AI search is temporarily unavailable. Please try again later.",
            },
            { ok: false },
        );

        await expect(searchEventsNaturalLanguage(request))
            .rejects.toThrow(
                "AI search is temporarily unavailable. Please try again later.",
            );
    });

    it("uses a fallback message when the error response cannot be parsed", async () => {
        mockFetchResponse(null, {
            ok: false,
            rejectJson: true,
        });

        await expect(searchEventsNaturalLanguage(request))
            .rejects.toThrow(
                "Failed to search events with natural language",
            );
    });
});
