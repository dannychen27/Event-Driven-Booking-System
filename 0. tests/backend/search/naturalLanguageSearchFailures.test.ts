import { ServiceUnavailableException } from '@nestjs/common';

import { NATURAL_LANGUAGE_SEARCH_CANDIDATES_FIXTURE } from "../fixtures/shared/sharedTestFixtures";
import { EventsService } from '../../../4. backend/src/events/events.service';
import { GeminiEventRanker } from '../../../4. backend/src/events/search/gemini-event-ranker';
import { GeminiEventSearchInterpreter } from '../../../4. backend/src/events/search/gemini-event-search-interpreter';
import { NaturalLanguageSearchService } from '../../../4. backend/src/search/natural-language-search.service';


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
        ranker.rank.mockRejectedValueOnce(
            Object.assign(new Error('The operation was aborted.'), {
                name: 'AbortError',
            }),
        );

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
