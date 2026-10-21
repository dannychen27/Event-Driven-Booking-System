import { EventsService } from "../../../4. backend/src/events/events.service";
import { ServiceUnavailableException } from "@nestjs/common";


import { NaturalLanguageSearchService } from "../../../4. backend/src/events/natural-language-search.service";
import { GeminiSearchInterpreter } from "../../../4. backend/src/events/gemini-search-interpreter";


describe("NaturalLanguageSearchService", () => {
    let service: NaturalLanguageSearchService;
    let eventsService: {
        searchEvents: jest.Mock;
    };
    let interpreter: {
        interpret: jest.Mock;
    };

    beforeEach(() => {
        eventsService = {
            searchEvents: jest.fn().mockResolvedValue([]),
        };

        interpreter = {
            interpret: jest.fn().mockResolvedValue({
                keyword: "coffee",
            }),
        };

        service = new NaturalLanguageSearchService(
            eventsService as unknown as EventsService,
            interpreter as unknown as GeminiSearchInterpreter,
        );
    });

    it("should validate filters and delegate to event search", async () => {
        await service.search({
            keyword: " coffee ",
            startAfter: "2026-10-24T00:00:00Z",
        });

        expect(eventsService.searchEvents).toHaveBeenCalledWith({
            keyword: "coffee",
            startAfter: "2026-10-24T00:00:00Z",
        });
    });

    it("should return the matching events", async () => {
        const events = [{ id: 1, name: "Coffee Meetup" }];
        eventsService.searchEvents.mockResolvedValueOnce(events);

        const result = await service.search({ keyword: "coffee" });

        expect(result).toEqual(events);
    });

    it("should reject invalid filters without querying events", async () => {
        await expect(service.search({ keyword: " ", sql: "DROP TABLE events" }),)
            .rejects.toThrow();

        expect(eventsService.searchEvents).not.toHaveBeenCalled();
    });

    it("should interpret natural language and search using its filters", async () => {
        const events = [{ id: 1, name: "Coffee Meetup" }];
        interpreter.interpret.mockResolvedValueOnce({ keyword: "coffee", });
        eventsService.searchEvents.mockResolvedValueOnce(events);

        const result = await service.searchNaturalLanguage(
            "Find coffee events",
        );

        expect(interpreter.interpret).toHaveBeenCalledWith("Find coffee events");
        expect(eventsService.searchEvents).toHaveBeenCalledWith({ keyword: "coffee", });
        expect(result).toEqual(events);
    });

    it("should return a service-unavailable error when Gemini is unavailable", async () => {
        interpreter.interpret.mockRejectedValueOnce({
            status: 503,
        });

        await expect(service.searchNaturalLanguage("Find coffee events"),)
            .rejects.toThrow(ServiceUnavailableException);

        expect(eventsService.searchEvents).not.toHaveBeenCalled();
    });
});
