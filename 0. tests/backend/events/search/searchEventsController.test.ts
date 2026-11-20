import { BadRequestException } from "@nestjs/common";
import { EventsController } from "../../../../4. backend/src/events/events.controller";
import { EventsService } from "../../../../4. backend/src/events/events.service";

import { NaturalLanguageSearchService } from "../../../../4. backend/src/search/natural-language-search.service";


import { COFFEE_MEETUP_SEARCH_RESULT_FIXTURE, } from "../../fixtures/events/eventSearchFixtures";
import { MAX_EVENT_SEARCH_KEYWORD_LENGTH } from "../../../../4. backend/src/constants/search.constants";


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
        searchWithKeyword: jest.Mock;
    };

    beforeEach(() => {
        service = {
            getAllEvents: jest.fn(),
            getEvent: jest.fn(),
            getAvailability: jest.fn(),
            searchEvents: jest.fn().mockResolvedValue([]),
        };

        naturalLanguageSearchService = {
            searchNaturalLanguage: jest.fn().mockResolvedValue({
                status: "success",
                events: [],
                appliedFilters: {},
            }),
            searchWithKeyword: jest.fn().mockResolvedValue([]),
        };

        controller = new EventsController(
            service as unknown as EventsService,
            naturalLanguageSearchService as unknown as NaturalLanguageSearchService,
        );
    });

    describe("keyword search", () => {
        it("should pass the trimmed keyword to the search service", async () => {
            naturalLanguageSearchService.searchWithKeyword.mockResolvedValueOnce(COFFEE_MEETUP_SEARCH_RESULT_FIXTURE);

            const result = await controller.searchEvents(" coffee ");

            expect(naturalLanguageSearchService.searchWithKeyword).toHaveBeenCalledWith({
                query: "coffee",
            });

            expect(result).toEqual(COFFEE_MEETUP_SEARCH_RESULT_FIXTURE);
            expect(service.searchEvents).not.toHaveBeenCalled();
            expect(naturalLanguageSearchService.searchNaturalLanguage).not.toHaveBeenCalled();
        });

        it("should pass parsed calendar filters alongside the keyword", async () => {
            const filters = {
                date: {
                    state: "selected",
                    value: {
                        startDate: "2026-11-10",
                        endDate: "2026-11-12",
                    },
                },
                time: {
                    state: "selected",
                    value: {
                        timeOfDay: ["MORNING"],
                    },
                },
            };

            await controller.searchEvents(" coffee ", JSON.stringify(filters));

            expect(naturalLanguageSearchService.searchWithKeyword)
                .toHaveBeenCalledWith({
                    query: "coffee",
                    filters
                });

            expect(naturalLanguageSearchService.searchNaturalLanguage).not.toHaveBeenCalled();
        });

        it("should reject malformed calendar filter JSON", () => {
            expect(() =>
                controller
                    .searchEvents("coffee", "{invalid json"))
                    .toThrow(BadRequestException);

            expect(naturalLanguageSearchService.searchWithKeyword).not.toHaveBeenCalled();
        });

        it("should reject an empty keyword", () => {
            expect(() =>
                controller.searchEvents("   ")).toThrow(BadRequestException);

            expect(naturalLanguageSearchService.searchWithKeyword).not.toHaveBeenCalled();
        });

        it("should reject a keyword longer than 100 characters", () => {
            expect(() =>
                controller.searchEvents("a".repeat(MAX_EVENT_SEARCH_KEYWORD_LENGTH + 1)))
                .toThrow(BadRequestException);

            expect(naturalLanguageSearchService.searchWithKeyword).not.toHaveBeenCalled();
        });
    });

    describe("natural-language search", () => {
        it("should pass the complete structured request to the service", async () => {
            const request = {
                query: "  Find coffee events  ",
                filters: {
                    date: {
                        state: "selected" as const,
                        value: {
                            startDate: "2026-11-10",
                            endDate: "2026-11-12",
                        },
                    },
                },
            };

            const response = {
                status: "success",
                events: COFFEE_MEETUP_SEARCH_RESULT_FIXTURE,
                appliedFilters: {},
            };

            naturalLanguageSearchService.searchNaturalLanguage
                .mockResolvedValueOnce(response);

            const result =
                await controller.searchEventsInNaturalLanguage(request);

            expect(naturalLanguageSearchService.searchNaturalLanguage)
                .toHaveBeenCalledWith(request);
            expect(result).toEqual(response);
        });

        it("should pass a calendar-only request to the service", async () => {
            const request = {
                filters: {
                    time: {
                        state: "selected" as const,
                        value: {
                            timeOfDay: ["EVENING"] as const,
                        },
                    },
                },
            };

            naturalLanguageSearchService.searchNaturalLanguage
                .mockResolvedValueOnce({
                    status: "success",
                    events: [],
                    appliedFilters: {},
                });

            await controller.searchEventsInNaturalLanguage(request);

            expect(naturalLanguageSearchService.searchNaturalLanguage)
                .toHaveBeenCalledWith(request);
        });

        it("should return clarification responses from the service unchanged", async () => {
            const response = {
                status: "clarification_required",
                conflicts: [
                    {
                        category: "date",
                        aiInterpretation: "Tomorrow",
                        userSelection: "November 12, 2026",
                    },
                ],
            };

            naturalLanguageSearchService.searchNaturalLanguage
                .mockResolvedValueOnce(response);

            const result =
                await controller.searchEventsInNaturalLanguage({
                    query: "Find events tomorrow",
                    filters: {
                        date: {
                            state: "selected",
                            value: {
                                startDate: "2026-11-12",
                                endDate: "2026-11-12",
                            },
                        },
                    },
                });

            expect(result).toEqual(response);
        });
    });
});
