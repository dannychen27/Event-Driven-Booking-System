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
});
