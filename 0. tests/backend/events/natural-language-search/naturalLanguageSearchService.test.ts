import { ServiceUnavailableException } from '@nestjs/common';
import { EventsService } from '../../../../4. backend/src/events/events.service';


import { GeminiEventRanker } from '../../../../4. backend/src/events/ai/gemini/gemini-event-ranker';
import { GeminiSearchInterpreter } from '../../../../4. backend/src/events/ai/gemini/gemini-search-interpreter';
import { NaturalLanguageSearchService } from '../../../../4. backend/src/events/search/natural-language-search.service';

import {
    SEARCH_START_BOUNDARY,
    SEARCH_LATER_BOUNDARY,
    COFFEE_MEETUP_SEARCH_RESULT_FIXTURE,
} from "../../fixtures/eventSearchFixtures";
import { NATURAL_LANGUAGE_SEARCH_CANDIDATES_FIXTURE } from "../../fixtures/sharedTestFixtures";

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
            interpreter as unknown as GeminiSearchInterpreter,
            ranker as unknown as GeminiEventRanker,
        );
    });

    describe('structured search', () => {
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

    describe('natural-language search', () => {
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
    });

    describe('provider failures', () => {
        it('maps interpreter service-unavailable errors to ServiceUnavailableException', async () => {
            interpreter.interpret.mockRejectedValueOnce({ status: 503 });

            await expect(
                service.searchNaturalLanguage('Find coffee events'),
            ).rejects.toThrow(ServiceUnavailableException);

            expect(eventsService.searchEventCandidates).not.toHaveBeenCalled();
            expect(ranker.rank).not.toHaveBeenCalled();
        });

        it('maps ranker service-unavailable errors to ServiceUnavailableException', async () => {
            ranker.rank.mockRejectedValueOnce({ status: 503 });

            await expect(
                service.searchNaturalLanguage('Find coffee events'),
            ).rejects.toThrow(ServiceUnavailableException);
        });

        it('returns a controlled unavailable error when Gemini interpretation times out', async () => {
            const timeoutError = new Error('The operation was aborted.');
            timeoutError.name = 'AbortError';
            interpreter.interpret.mockRejectedValueOnce(timeoutError);

            await expect(
                service.searchNaturalLanguage('Find coffee events'),
            ).rejects.toThrow(ServiceUnavailableException);

            expect(eventsService.searchEventCandidates).not.toHaveBeenCalled();
            expect(ranker.rank).not.toHaveBeenCalled();
        });

        it('returns a controlled unavailable error when Gemini ranking times out', async () => {
            const timeoutError = new Error('The operation was aborted.');
            timeoutError.name = 'AbortError';
            ranker.rank.mockRejectedValueOnce(timeoutError);

            await expect(
                service.searchNaturalLanguage('Find coffee events'),
            ).rejects.toThrow(ServiceUnavailableException);
        });

        it('returns a controlled unavailable error when Gemini returns 504', async () => {
            const deadlineError = Object.assign(
                new Error('Deadline expired before operation could complete.'),
                { status: 504 },
            );

            interpreter.interpret.mockRejectedValueOnce(deadlineError);

            await expect(
                service.searchNaturalLanguage('Find coffee events'),
            ).rejects.toThrow(ServiceUnavailableException);

            expect(eventsService.searchEventCandidates).not.toHaveBeenCalled();
            expect(ranker.rank).not.toHaveBeenCalled();
        });
    });
});
