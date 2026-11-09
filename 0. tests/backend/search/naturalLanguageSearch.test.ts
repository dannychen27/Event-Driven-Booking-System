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
        const result = await service.searchNaturalLanguage(
            'Find something relaxing outdoors this weekend',
        );

        expect(interpreter.interpret).toHaveBeenCalledWith(
            'Find something relaxing outdoors this weekend',
        );
        expect(eventsService.searchEventCandidates).toHaveBeenCalledWith({
            startAfter: SEARCH_START_BOUNDARY,
            startBefore: SEARCH_LATER_BOUNDARY,
        });
        expect(ranker.rank).toHaveBeenCalledWith(
            'Find something relaxing outdoors this weekend',
            'relaxing outdoor activities',
            candidates,
        );
        expect(result).toEqual([candidates[1], candidates[0]]);
        expect(eventsService.searchEvents).not.toHaveBeenCalled();
    });

    it('returns date-filtered candidates without ranking when there is no intent', async () => {
        interpreter.interpret.mockResolvedValueOnce({
            startAfter: SEARCH_START_BOUNDARY,
        });

        const result = await service.searchNaturalLanguage(
            'Show me events after October 24',
        );

        expect(eventsService.searchEventCandidates).toHaveBeenCalledWith({
            startAfter: SEARCH_START_BOUNDARY,
            startBefore: undefined,
        });
        expect(result).toEqual(candidates);
        expect(ranker.rank).not.toHaveBeenCalled();
    });

    it('does not call the ranker when there are no candidates', async () => {
        eventsService.searchEventCandidates.mockResolvedValueOnce([]);

        const result = await service.searchNaturalLanguage(
            'Find relaxing outdoor activities',
        );

        expect(result).toEqual([]);
        expect(ranker.rank).not.toHaveBeenCalled();
    });

    it('returns only the events whose IDs Gemini ranked', async () => {
        ranker.rank.mockResolvedValueOnce([2]);

        const result = await service.searchNaturalLanguage(
            'Find something relaxing outdoors',
        );

        expect(result).toEqual([candidates[1]]);
    });

    it('returns no events when Gemini ranks no candidates as relevant', async () => {
        ranker.rank.mockResolvedValueOnce([]);

        const result = await service.searchNaturalLanguage(
            'Find something relaxing outdoors',
        );

        expect(result).toEqual([]);
    });

    it('resolves a relative TODAY filter using the Toronto calendar date', async () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-11-08T17:00:00.000Z'));

        interpreter.interpret.mockResolvedValueOnce({
            intent: 'outdoor activities',
            relativeDate: { kind: 'TODAY' },
        });

        await service.searchNaturalLanguage('Find events today');

        expect(eventsService.searchEventCandidates).toHaveBeenCalledWith({
            startAfter: '2026-11-08T05:00:00.000Z',
            startBefore: '2026-11-09T05:00:00.000Z',
        });
    });

    it('resolves THIS_WEEKEND to the current Toronto weekend, even on Sunday', async () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-11-08T17:00:00.000Z'));

        interpreter.interpret.mockResolvedValueOnce({
            intent: 'outdoor activities',
            relativeDate: { kind: 'THIS_WEEKEND' },
        });

        await service.searchNaturalLanguage('Find events this weekend');

        expect(eventsService.searchEventCandidates).toHaveBeenCalledWith({
            startAfter: '2026-11-07T05:00:00.000Z',
            startBefore: '2026-11-09T05:00:00.000Z',
        });
    });
});
