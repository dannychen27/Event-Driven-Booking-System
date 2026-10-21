import { afterEach, describe, expect, it, vi } from "vitest";


import { searchEventsNaturalLanguage } from "../../../3. frontend/src/api/events";


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

        await expect(searchEventsNaturalLanguage("Find coffee events"),)
            .resolves.toEqual(events);
    });

    it("throws an error when the request fails", async () => {
        const fetchMock = vi.fn().mockResolvedValue({ ok: false, });
        vi.stubGlobal("fetch", fetchMock);

        await expect(searchEventsNaturalLanguage("Find coffee events"),)
            .rejects.toThrow("Failed to search events with natural language",);
    });
});
