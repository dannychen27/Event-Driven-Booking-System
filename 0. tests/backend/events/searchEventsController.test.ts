import { BadRequestException } from "@nestjs/common";
import { EventsController } from "../../../4. backend/src/events/events.controller";
import { EventsService } from "../../../4. backend/src/events/events.service";

import { NaturalLanguageSearchService } from "../../../4. backend/src/events/search/natural-language-search.service";


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

    describe("structured search", () => {
        it("should pass valid filters to the service", async () => {
            const events = [{ id: 1, name: "Coffee Meetup" }];
            service.searchEvents.mockResolvedValueOnce(events);

            const result = await controller.searchEvents(
                " coffee ",
                undefined,
                undefined,
            );

            expect(service.searchEvents).toHaveBeenCalledWith({
                keyword: "coffee",
            });
            expect(result).toEqual(events);
        });

        it("should reject an empty keyword", () => {
            expect(() =>
                controller.searchEvents("   ", undefined, undefined),
            ).toThrow(BadRequestException);

            expect(service.searchEvents).not.toHaveBeenCalled();
        });

        it("should reject a keyword longer than 100 characters", () => {
            expect(() =>
                controller.searchEvents("a".repeat(101), undefined, undefined),
            ).toThrow(BadRequestException);

            expect(service.searchEvents).not.toHaveBeenCalled();
        });

        it("should reject an invalid start date", () => {
            expect(() =>
                controller.searchEvents(
                    "coffee",
                    "not-a-date",
                    undefined,
                ),
            ).toThrow(BadRequestException);

            expect(service.searchEvents).not.toHaveBeenCalled();
        });

        it("should reject a start date that is not earlier than the end date", () => {
            expect(() =>
                controller.searchEvents(
                    "coffee",
                    "2026-10-24T00:00:00Z",
                    "2026-10-24T00:00:00Z",
                ),
            ).toThrow(BadRequestException);

            expect(service.searchEvents).not.toHaveBeenCalled();
        });
    });

    describe("natural-language search", () => {
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
});
