import { BadRequestException } from "@nestjs/common";
import { EventsController } from "../../../4. backend/src/events/events.controller";
import { EventsService } from "../../../4. backend/src/events/events.service";

import { NaturalLanguageSearchService } from "../../../4. backend/src/events/natural-language-search.service";


describe("EventsController.searchEvents", () => {
    let controller: EventsController;

    let service: {
        getAllEvents: jest.Mock;
        getEvent: jest.Mock;
        getAvailability: jest.Mock;
        searchEvents: jest.Mock;
    };

    let naturalLanguageSearchService: {
        searchNaturalLanguage: jest.Mock;
    };

    beforeEach(() => {
        service = {
            getAllEvents: jest.fn(),
            getEvent: jest.fn(),
            getAvailability: jest.fn(),
            searchEvents: jest.fn().mockResolvedValue([]),
        };

        naturalLanguageSearchService = {
            searchNaturalLanguage: jest.fn().mockResolvedValue([]),
        };

        controller = new EventsController(
            service as unknown as EventsService,
            naturalLanguageSearchService as unknown as NaturalLanguageSearchService,
        );
    });

    it("should pass valid filters to the service", async () => {
        await controller.searchEvents(
            " coffee ",
            "2026-10-24T00:00:00Z",
            "2026-10-26T00:00:00Z",
        );

        expect(service.searchEvents).toHaveBeenCalledWith({
            keyword: "coffee",
            startAfter: "2026-10-24T00:00:00Z",
            startBefore: "2026-10-26T00:00:00Z",
        });
    });

    it("should reject an empty keyword", () => {
        expect(() => controller.searchEvents("   "))
            .toThrow(BadRequestException);
    });

    it("should reject a keyword longer than 100 characters", () => {
        expect(() => controller.searchEvents("a".repeat(101)))
            .toThrow(BadRequestException);
    });

    it("should reject an invalid start date", () => {
        expect(() => controller.searchEvents(undefined, "not-a-date"))
            .toThrow(BadRequestException);
    });

    it("should reject a start date that is not earlier than the end date", () => {
        expect(() => controller.searchEvents(
            undefined,
            "2026-10-26T00:00:00Z",
            "2026-10-24T00:00:00Z",
        )).toThrow(BadRequestException);
    });

    it("should pass a valid natural-language query to the service", async () => {
        const events = [{ id: 1, name: "Coffee Meetup" }];
        naturalLanguageSearchService.searchNaturalLanguage.mockResolvedValue(events);

        const result = await controller.searchEventsInNaturalLanguage({
            query: "  Find coffee events  ",
        });

        expect(naturalLanguageSearchService.searchNaturalLanguage)
            .toHaveBeenCalledWith("Find coffee events");
        expect(result).toEqual(events);
    });

    it("should reject an empty natural-language query", () => {
        expect(() =>
            controller.searchEventsInNaturalLanguage({ query: "   " }),
        ).toThrow(BadRequestException);

        expect(naturalLanguageSearchService.searchNaturalLanguage)
            .not.toHaveBeenCalled();
    });
});
