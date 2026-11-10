import { EventsService } from '../../../4. backend/src/events/events.service';
import { GeminiEventRanker } from '../../../4. backend/src/events/search/gemini-event-ranker';
import { GeminiEventSearchInterpreter } from '../../../4. backend/src/events/search/gemini-event-search-interpreter';
import { NaturalLanguageSearchService } from '../../../4. backend/src/search/natural-language-search.service';

import {
    SEARCH_START_BOUNDARY,
    COFFEE_MEETUP_SEARCH_RESULT_FIXTURE,
} from "../fixtures/events/eventSearchFixtures";


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

    beforeEach(() => {
        eventsService = {
            searchEvents: jest.fn().mockResolvedValue([]),
            searchEventCandidates: jest.fn().mockResolvedValue([]),
        };

        interpreter = {
            interpret: jest.fn(),
        };

        ranker = {
            rank: jest.fn(),
        };

        service = new NaturalLanguageSearchService(
            eventsService as unknown as EventsService,
            interpreter as unknown as GeminiEventSearchInterpreter,
            ranker as unknown as GeminiEventRanker,
        );
    });

    it('validates structured filters and delegates to ordinary event search', async () => {
        await service.search({
            keyword: ' coffee ',
            startAfter: SEARCH_START_BOUNDARY,
        });

        expect(eventsService.searchEvents).toHaveBeenCalledWith({
            keyword: 'coffee',
            startAfter: SEARCH_START_BOUNDARY,
        });
        expect(eventsService.searchEventCandidates).not.toHaveBeenCalled();
        expect(ranker.rank).not.toHaveBeenCalled();
    });

    it('returns the matching events from structured search', async () => {
        eventsService.searchEvents.mockResolvedValueOnce(COFFEE_MEETUP_SEARCH_RESULT_FIXTURE);

        const result = await service.search({ keyword: 'coffee' });

        expect(result).toEqual(COFFEE_MEETUP_SEARCH_RESULT_FIXTURE);
    });

    it('rejects invalid structured filters without querying events', async () => {
        await expect(
            service.search({ keyword: ' ', sql: 'DROP TABLE events' }),
        ).rejects.toThrow();

        expect(eventsService.searchEvents).not.toHaveBeenCalled();
    });

    it.each([
        { includePastEvents: true, includeFutureEvents: true },
        { includePastEvents: false, includeFutureEvents: true },
        { includePastEvents: true, includeFutureEvents: false },
        { includePastEvents: false, includeFutureEvents: false },
    ])('preserves past/future inclusion settings: %j',
        async (flags) => {
        await service.search(flags);

        expect(eventsService.searchEvents).toHaveBeenCalledWith(flags);
        expect(eventsService.searchEventCandidates).not.toHaveBeenCalled();
    });

    it.each([
        { includePastEvents: 'false' },
        { includePastEvents: 0 },
        { includeFutureEvents: 'true' },
        { includeFutureEvents: 1 },
    ])('rejects non-boolean past/future inclusion settings: %j',
        async (flags) => {
        await expect(service.search(flags)).rejects.toThrow();

        expect(eventsService.searchEvents).not.toHaveBeenCalled();
    });

    it.each([
        { timeOfDay: ['EARLY_MORNING'] },
        { timeOfDay: ['MORNING'] },
        { timeOfDay: ['AFTERNOON'] },
        { timeOfDay: ['EVENING'] },
        { timeOfDay: ['NIGHT'] },
        { timeOfDay: ['MORNING', 'EVENING'] },
    ])('preserves valid time-of-day filters: %j', async (filter) => {
        await service.search(filter);

        expect(eventsService.searchEvents).toHaveBeenCalledWith(filter);
    });

    it.each([
        { timeRange: { startTime: '20:00' } },
        { timeRange: { endTime: '10:00' } },
        { timeRange: { startTime: '22:00', endTime: '02:00' } },
        {
            timeOfDay: ['EVENING'],
            timeRange: { startTime: '19:00', endTime: '20:00' },
        },
    ])('preserves valid explicit time ranges: %j',
        async (filter) => {
        await service.search(filter);

        expect(eventsService.searchEvents).toHaveBeenCalledWith(filter);
    });

    it.each([
        { timeOfDay: ['LATE_NIGHT'] },
        { timeOfDay: 12 },
        { timeOfDay: null },
        { timeRange: {} },
        { timeRange: { startTime: undefined } },
        { timeRange: { endTime: undefined } },
        { timeRange: { startTime: '24:00' } },
        { timeRange: { endTime: '12:60' } },
        { timeRange: { startTime: '9:00' } },
        { timeRange: { startTime: '18:00', endTime: '18:00' } },
        { timeRange: { startTime: '18:00', finishTime: '20:00' } },
        { timeRange: null },
    ])('rejects invalid time filters: %j',
        async (filter) => {
        await expect(service.search(filter)).rejects.toThrow();

        expect(eventsService.searchEvents).not.toHaveBeenCalled();
    });
});
