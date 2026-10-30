import { RANKED_EVENT_CANDIDATES_FIXTURE } from "../../fixtures/sharedTestFixtures";
import { parseRankedEventIds } from "../../../../4. backend/src/helpers/events/search/geminiEventRankerHelpers";

describe('parseRankedEventIds', () => {

    it('accepts valid ranked candidate IDs in relevance order', () => {
        expect(
            parseRankedEventIds('{"eventIds":[2,1]}', RANKED_EVENT_CANDIDATES_FIXTURE),
        ).toEqual([2, 1]);
    });

    it('accepts an empty ranking', () => {
        expect(
            parseRankedEventIds('{"eventIds":[]}', RANKED_EVENT_CANDIDATES_FIXTURE),
        ).toEqual([]);
    });

    it('rejects invalid JSON', () => {
        expect(() => parseRankedEventIds('not JSON', RANKED_EVENT_CANDIDATES_FIXTURE))
            .toThrow('Gemini returned invalid ranking JSON');
    });

    it('rejects a response without eventIds', () => {
        expect(() => parseRankedEventIds('{"ids":[1]}', RANKED_EVENT_CANDIDATES_FIXTURE))
            .toThrow('Gemini returned an invalid event ranking');
    });

    it('rejects non-integer IDs', () => {
        expect(() => parseRankedEventIds('{"eventIds":[1.5]}', RANKED_EVENT_CANDIDATES_FIXTURE))
            .toThrow('Gemini returned an invalid event ranking');
    });

    it('rejects IDs that are not candidate events', () => {
        expect(() => parseRankedEventIds('{"eventIds":[99]}', RANKED_EVENT_CANDIDATES_FIXTURE))
            .toThrow('Gemini returned unknown or duplicate event IDs');
    });

    it('rejects duplicate IDs', () => {
        expect(() => parseRankedEventIds('{"eventIds":[1,1]}', RANKED_EVENT_CANDIDATES_FIXTURE))
            .toThrow('Gemini returned unknown or duplicate event IDs');
    });
});
