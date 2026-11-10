import { EventsService } from '../../../4. backend/src/events/events.service';
import { GeminiEventRanker } from '../../../4. backend/src/events/search/gemini-event-ranker';
import { GeminiEventSearchInterpreter } from '../../../4. backend/src/events/search/gemini-event-search-interpreter';
import { NaturalLanguageSearchService } from '../../../4. backend/src/search/natural-language-search.service';

import {
    SEARCH_START_BOUNDARY,
    SEARCH_LATER_BOUNDARY,
} from "../fixtures/events/eventSearchFixtures";
import { NATURAL_LANGUAGE_SEARCH_CANDIDATES_FIXTURE } from "../fixtures/shared/sharedTestFixtures";

describe("NaturalLanguageSearchService", () => {
    let service: NaturalLanguageSearchService;

    let eventsService: {
        searchEvents: jest.Mock;
        searchEventCandidates: jest.Mock;
    };

    let interpreter: {
        interpret: jest.Mock;
    };

    let ranker: {
        rank: jest.Mock;
    };

    const candidates = NATURAL_LANGUAGE_SEARCH_CANDIDATES_FIXTURE;

    const expectedUnrestrictedTimeFilters = {
        startAfter: undefined,
        startBefore: undefined,
        includePastEvents: undefined,
        includeFutureEvents: undefined,
        timeIntervals: undefined,
    };

    beforeEach(() => {
        eventsService = {
            searchEvents: jest.fn().mockResolvedValue([]),
            searchEventCandidates: jest.fn().mockResolvedValue(candidates),
        };

        interpreter = {
            interpret: jest.fn().mockResolvedValue({
                intent: 'relaxing outdoor activities',
                startAfter: SEARCH_START_BOUNDARY,
                startBefore: SEARCH_LATER_BOUNDARY,
            }),
        };

        ranker = {
            rank: jest.fn().mockResolvedValue([2, 1]),
        };

        service = new NaturalLanguageSearchService(
            eventsService as unknown as EventsService,
            interpreter as unknown as GeminiEventSearchInterpreter,
            ranker as unknown as GeminiEventRanker,
        );
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('retrieves date-filtered candidates and returns them in semantic ranking order', async () => {
        const query = 'Find something relaxing outdoors this weekend';
        const result = await service.searchNaturalLanguage({ query });

        expect(interpreter.interpret).toHaveBeenCalledWith(query);

        expect(eventsService.searchEventCandidates).toHaveBeenCalledWith({
            startAfter: SEARCH_START_BOUNDARY,
            startBefore: SEARCH_LATER_BOUNDARY,
            includePastEvents: undefined,
            includeFutureEvents: undefined,
            timeIntervals: undefined,
        });

        expect(ranker.rank).toHaveBeenCalledWith(
            query,
            'relaxing outdoor activities',
            candidates,
        );

        expect(result).toEqual({
            status: 'success',
            events: [candidates[1], candidates[0]],
            appliedFilters: {
                startAfter: SEARCH_START_BOUNDARY,
                startBefore: SEARCH_LATER_BOUNDARY,
                includePastEvents: undefined,
                includeFutureEvents: undefined,
                timeIntervals: undefined,
            },
        });

        expect(eventsService.searchEvents).not.toHaveBeenCalled();
    });

    it('returns date-filtered candidates without ranking when there is no intent', async () => {
        interpreter.interpret.mockResolvedValueOnce({
            startAfter: SEARCH_START_BOUNDARY,
        });

        const result = await service.searchNaturalLanguage({
            query: 'Show me events after October 24',
        });

        expect(eventsService.searchEventCandidates).toHaveBeenCalledWith({
            startAfter: SEARCH_START_BOUNDARY,
            startBefore: undefined,
            includePastEvents: undefined,
            includeFutureEvents: undefined,
            timeIntervals: undefined,
        });

        expect(result).toEqual({
            status: 'success',
            events: candidates,
            appliedFilters: {
                startAfter: SEARCH_START_BOUNDARY,
                startBefore: undefined,
                includePastEvents: undefined,
                includeFutureEvents: undefined,
                timeIntervals: undefined,
            },
        });

        expect(ranker.rank).not.toHaveBeenCalled();
    });

    it('does not call the ranker when there are no candidates', async () => {
        eventsService.searchEventCandidates.mockResolvedValueOnce([]);

        const result = await service.searchNaturalLanguage({
            query: 'Find relaxing outdoor activities',
        });

        expect(result).toMatchObject({
            status: 'success',
            events: [],
        });

        expect(ranker.rank).not.toHaveBeenCalled();
    });

    it('returns only the events whose IDs Gemini ranked', async () => {
        ranker.rank.mockResolvedValueOnce([2]);

        const result = await service.searchNaturalLanguage({
            query: 'Find something relaxing outdoors',
        });

        expect(result).toMatchObject({
            status: 'success',
            events: [candidates[1]],
        });
    });

    it('returns no events when Gemini ranks no candidates as relevant', async () => {
        ranker.rank.mockResolvedValueOnce([]);

        const result = await service.searchNaturalLanguage({
            query: 'Find something relaxing outdoors',
        });

        expect(result).toMatchObject({
            status: 'success',
            events: [],
        });
    });

    it('resolves a relative TODAY filter using the Toronto calendar date', async () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-11-08T17:00:00.000Z'));

        interpreter.interpret.mockResolvedValueOnce({
            intent: 'outdoor activities',
            relativeDate: { kind: 'TODAY' },
        });

        await service.searchNaturalLanguage({
            query: 'Find events today',
        });

        expect(eventsService.searchEventCandidates).toHaveBeenCalledWith({
            startAfter: '2026-11-08T05:00:00.000Z',
            startBefore: '2026-11-09T05:00:00.000Z',
            includePastEvents: undefined,
            includeFutureEvents: undefined,
            timeIntervals: undefined,
        });
    });

    it('resolves THIS_WEEKEND to the current Toronto weekend, even on Sunday', async () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-11-08T17:00:00.000Z'));

        interpreter.interpret.mockResolvedValueOnce({
            intent: 'outdoor activities',
            relativeDate: { kind: 'THIS_WEEKEND' },
        });

        await service.searchNaturalLanguage({
            query: 'Find events this weekend',
        });

        expect(eventsService.searchEventCandidates).toHaveBeenCalledWith({
            startAfter: '2026-11-07T05:00:00.000Z',
            startBefore: '2026-11-09T05:00:00.000Z',
            includePastEvents: undefined,
            includeFutureEvents: undefined,
            timeIntervals: undefined,
        });
    });

    it('resolves NEXT_WEEK to the full Sunday-through-Saturday Toronto calendar week', async () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-11-09T17:00:00.000Z'));

        interpreter.interpret.mockResolvedValueOnce({
            intent: 'outdoor activities',
            relativeDate: { kind: 'NEXT_WEEK' },
        });

        const result = await service.searchNaturalLanguage({
            query: 'Find outdoor events next week',
        });

        expect(eventsService.searchEventCandidates).toHaveBeenCalledWith({
            startAfter: '2026-11-15T05:00:00.000Z',
            startBefore: '2026-11-22T05:00:00.000Z',
            includePastEvents: undefined,
            includeFutureEvents: undefined,
            timeIntervals: undefined,
        });

        expect(result).toMatchObject({
            status: 'success',
            appliedFilters: {
                startAfter: '2026-11-15T05:00:00.000Z',
                startBefore: '2026-11-22T05:00:00.000Z',
            },
        });

        expect(ranker.rank).toHaveBeenCalledTimes(1);
    });

    it('intersects NEXT_WEEK with a compatible calendar date selection', async () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-11-09T17:00:00.000Z'));

        interpreter.interpret.mockResolvedValueOnce({
            intent: 'outdoor activities',
            relativeDate: { kind: 'NEXT_WEEK' },
        });

        const result = await service.searchNaturalLanguage({
            query: 'Find outdoor events next week',
            filters: {
                date: {
                    state: 'selected',
                    value: {
                        startDate: '2026-11-16',
                        endDate: '2026-11-18',
                    },
                },
            },
        });

        expect(eventsService.searchEventCandidates).toHaveBeenCalledWith({
            startAfter: '2026-11-16T05:00:00.000Z',
            startBefore: '2026-11-19T05:00:00.000Z',
            includePastEvents: undefined,
            includeFutureEvents: undefined,
            timeIntervals: undefined,
        });

        expect(result).toMatchObject({
            status: 'success',
            appliedFilters: {
                startAfter: '2026-11-16T05:00:00.000Z',
                startBefore: '2026-11-19T05:00:00.000Z',
            },
        });

        expect(ranker.rank).toHaveBeenCalledTimes(1);
    });

    it('returns a date conflict when the calendar selection falls outside NEXT_WEEK', async () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-11-09T17:00:00.000Z'));

        interpreter.interpret.mockResolvedValueOnce({
            intent: 'outdoor activities',
            relativeDate: { kind: 'NEXT_WEEK' },
        });

        const result = await service.searchNaturalLanguage({
            query: 'Find outdoor events next week',
            filters: {
                date: {
                    state: 'selected',
                    value: {
                        startDate: '2026-11-22',
                        endDate: '2026-11-22',
                    },
                },
            },
        });

        expect(result).toMatchObject({
            status: 'clarification_required',
            conflicts: [
                {
                    category: 'date',
                },
            ],
        });

        expect(eventsService.searchEventCandidates).not.toHaveBeenCalled();
        expect(eventsService.searchEvents).not.toHaveBeenCalled();
        expect(ranker.rank).not.toHaveBeenCalled();
    });

    it('forwards unspecified inclusion preferences to candidate retrieval', async () => {
        interpreter.interpret.mockResolvedValueOnce({
            intent: 'outdoor activities',
        });

        await service.searchNaturalLanguage({
            query: 'Find future and past events',
        });

        expect(eventsService.searchEventCandidates).toHaveBeenCalledWith(
            expectedUnrestrictedTimeFilters,
        );
    });

    it('forwards true inclusion preferences to candidate retrieval', async () => {
        interpreter.interpret.mockResolvedValueOnce({
            intent: 'outdoor activities',
            includePastEvents: true,
            includeFutureEvents: true,
        });

        await service.searchNaturalLanguage({
            query: 'Find all events',
        });

        expect(eventsService.searchEventCandidates).toHaveBeenCalledWith({
            ...expectedUnrestrictedTimeFilters,
            includePastEvents: true,
            includeFutureEvents: true,
        });
    });

    it('intersects AI time-of-day and explicit time-range filters before ranking', async () => {
        interpreter.interpret.mockResolvedValueOnce({
            intent: 'evening activities',
            timeOfDay: 'EVENING',
            timeRange: {
                startTime: '18:00',
                endTime: '20:00',
            },
        });

        const query = 'Find evening events between 6 and 8';

        const result = await service.searchNaturalLanguage({ query });

        expect(eventsService.searchEventCandidates).toHaveBeenCalledWith({
            ...expectedUnrestrictedTimeFilters,
            timeIntervals: [
                { startMinute: 1080, endMinute: 1200 },
            ],
        });

        expect(ranker.rank).toHaveBeenCalledWith(
            query,
            'evening activities',
            candidates,
        );

        expect(result).toMatchObject({
            status: 'success',
            appliedFilters: {
                timeIntervals: [
                    { startMinute: 1080, endMinute: 1200 },
                ],
            },
        });
    });

    it('runs a calendar-only search without invoking the interpreter or ranker', async () => {
        const result = await service.searchNaturalLanguage({
            filters: {
                date: {
                    state: 'selected',
                    value: {
                        startDate: '2026-11-08',
                        endDate: '2026-11-08',
                    },
                },
                time: {
                    state: 'selected',
                    value: {
                        timeOfDay: 'EVENING',
                    },
                },
            },
        });

        expect(interpreter.interpret).not.toHaveBeenCalled();

        expect(eventsService.searchEventCandidates).toHaveBeenCalledWith({
            startAfter: '2026-11-08T05:00:00.000Z',
            startBefore: '2026-11-09T05:00:00.000Z',
            includePastEvents: undefined,
            includeFutureEvents: undefined,
            timeIntervals: [
                { startMinute: 1020, endMinute: 1260 },
            ],
        });

        expect(ranker.rank).not.toHaveBeenCalled();

        expect(result).toMatchObject({
            status: 'success',
            events: candidates,
        });
    });

    it('intersects compatible AI and calendar date selections', async () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-11-08T17:00:00.000Z'));

        interpreter.interpret.mockResolvedValueOnce({
            intent: 'outdoor activities',
            relativeDate: { kind: 'TODAY' },
        });

        const result = await service.searchNaturalLanguage({
            query: 'Find outdoor events today',
            filters: {
                date: {
                    state: 'selected',
                    value: {
                        startDate: '2026-11-08',
                        endDate: '2026-11-08',
                    },
                },
            },
        });

        expect(result).toMatchObject({
            status: 'success',
            appliedFilters: {
                startAfter: '2026-11-08T05:00:00.000Z',
                startBefore: '2026-11-09T05:00:00.000Z',
            },
        });

        expect(eventsService.searchEventCandidates).toHaveBeenCalledTimes(1);
    });

    it('returns a date conflict without querying candidates or ranking', async () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-11-08T17:00:00.000Z'));

        interpreter.interpret.mockResolvedValueOnce({
            intent: 'outdoor activities',
            relativeDate: { kind: 'TODAY' },
        });

        const result = await service.searchNaturalLanguage({
            query: 'Find outdoor events today',
            filters: {
                date: {
                    state: 'selected',
                    value: {
                        startDate: '2026-11-09',
                        endDate: '2026-11-09',
                    },
                },
            },
        });

        expect(result).toMatchObject({
            status: 'clarification_required',
            conflicts: [
                {
                    category: 'date',
                    aiInterpretation: 'Nov 8, 2026',
                    userSelection: 'Nov 9, 2026',
                },
            ],
        });

        expect(eventsService.searchEventCandidates).not.toHaveBeenCalled();
        expect(ranker.rank).not.toHaveBeenCalled();
    });

    it('returns a time conflict without querying candidates or ranking', async () => {
        interpreter.interpret.mockResolvedValueOnce({
            intent: 'evening activities',
            timeOfDay: 'EVENING',
        });

        const result = await service.searchNaturalLanguage({
            query: 'Find evening events',
            filters: {
                time: {
                    state: 'selected',
                    value: {
                        timeOfDay: 'MORNING',
                    },
                },
            },
        });

        expect(result).toMatchObject({
            status: 'clarification_required',
            conflicts: [
                {
                    category: 'time',
                    aiInterpretation: 'evening',
                    userSelection: 'morning',
                },
            ],
        });

        expect(eventsService.searchEventCandidates).not.toHaveBeenCalled();
        expect(ranker.rank).not.toHaveBeenCalled();
    });

    it('reports both date and time conflicts before candidate retrieval', async () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-11-08T17:00:00.000Z'));

        interpreter.interpret.mockResolvedValueOnce({
            intent: 'evening activities',
            relativeDate: { kind: 'TODAY' },
            timeOfDay: 'EVENING',
        });

        const result = await service.searchNaturalLanguage({
            query: 'Find evening events today',
            filters: {
                date: {
                    state: 'selected',
                    value: {
                        startDate: '2026-11-09',
                        endDate: '2026-11-09',
                    },
                },
                time: {
                    state: 'selected',
                    value: {
                        timeOfDay: 'MORNING',
                    },
                },
            },
        });

        expect(result).toMatchObject({
            status: 'clarification_required',
            conflicts: [
                { category: 'date' },
                { category: 'time' },
            ],
        });

        expect(eventsService.searchEventCandidates).not.toHaveBeenCalled();
        expect(ranker.rank).not.toHaveBeenCalled();
    });

    it('treats an explicit date clear as a conflict with an AI date restriction', async () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-11-08T17:00:00.000Z'));

        interpreter.interpret.mockResolvedValueOnce({
            intent: 'outdoor activities',
            relativeDate: { kind: 'TODAY' },
        });

        const result = await service.searchNaturalLanguage({
            query: 'Find outdoor events today',
            filters: {
                date: { state: 'cleared' },
            },
        });

        expect(result).toMatchObject({
            status: 'clarification_required',
            conflicts: [
                {
                    category: 'date',
                    userSelection: 'Explicitly cleared date filter',
                },
            ],
        });

        expect(eventsService.searchEventCandidates).not.toHaveBeenCalled();
        expect(ranker.rank).not.toHaveBeenCalled();
    });

    it('uses the explicitly selected date after the user resolves a date conflict', async () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-11-08T17:00:00.000Z'));

        interpreter.interpret.mockResolvedValueOnce({
            intent: 'outdoor activities',
            relativeDate: { kind: 'TODAY' },
        });

        const result = await service.searchNaturalLanguage({
            query: 'Find outdoor events today',
            filters: {
                date: {
                    state: 'selected',
                    value: {
                        startDate: '2026-11-09',
                        endDate: '2026-11-09',
                    },
                },
            },
            resolutions: {
                date: 'selection',
            },
        });

        expect(result).toMatchObject({
            status: 'success',
            appliedFilters: {
                startAfter: '2026-11-09T05:00:00.000Z',
                startBefore: '2026-11-10T05:00:00.000Z',
            },
        });

        expect(eventsService.searchEventCandidates).toHaveBeenCalledTimes(1);
        expect(ranker.rank).toHaveBeenCalledTimes(1);
    });

    it('uses the AI date interpretation after the user resolves a date conflict', async () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-11-08T17:00:00.000Z'));

        interpreter.interpret.mockResolvedValueOnce({
            intent: 'outdoor activities',
            relativeDate: { kind: 'TODAY' },
        });

        const result = await service.searchNaturalLanguage({
            query: 'Find outdoor events today',
            filters: {
                date: {
                    state: 'selected',
                    value: {
                        startDate: '2026-11-09',
                        endDate: '2026-11-09',
                    },
                },
            },
            resolutions: {
                date: 'ai',
            },
        });

        expect(result).toMatchObject({
            status: 'success',
            appliedFilters: {
                startAfter: '2026-11-08T05:00:00.000Z',
                startBefore: '2026-11-09T05:00:00.000Z',
            },
        });
    });

    it('uses the explicitly selected time after the user resolves a time conflict', async () => {
        interpreter.interpret.mockResolvedValueOnce({
            intent: 'evening activities',
            timeOfDay: 'EVENING',
        });

        const result = await service.searchNaturalLanguage({
            query: 'Find evening events',
            filters: {
                time: {
                    state: 'selected',
                    value: {
                        timeOfDay: 'MORNING',
                    },
                },
            },
            resolutions: {
                time: 'selection',
            },
        });

        expect(result).toMatchObject({
            status: 'success',
            appliedFilters: {
                timeIntervals: [
                    { startMinute: 480, endMinute: 720 },
                ],
            },
        });

        expect(eventsService.searchEventCandidates).toHaveBeenCalledTimes(1);
    });

    it('preserves compatible time constraints when resolving a date conflict', async () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-11-08T17:00:00.000Z'));

        interpreter.interpret.mockResolvedValueOnce({
            intent: 'evening activities',
            relativeDate: { kind: 'TODAY' },
            timeOfDay: 'EVENING',
        });

        const result = await service.searchNaturalLanguage({
            query: 'Find evening events today',
            filters: {
                date: {
                    state: 'selected',
                    value: {
                        startDate: '2026-11-09',
                        endDate: '2026-11-09',
                    },
                },
                time: {
                    state: 'selected',
                    value: {
                        timeRange: {
                            startTime: '18:00',
                            endTime: '20:00',
                        },
                    },
                },
            },
            resolutions: {
                date: 'selection',
            },
        });

        expect(result).toMatchObject({
            status: 'success',
            appliedFilters: {
                startAfter: '2026-11-09T05:00:00.000Z',
                startBefore: '2026-11-10T05:00:00.000Z',
                timeIntervals: [
                    { startMinute: 1080, endMinute: 1200 },
                ],
            },
        });
    });
});
