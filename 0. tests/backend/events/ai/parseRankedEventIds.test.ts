import {
    parseRankedEventIds,
} from '../../../../4. backend/src/events/ai/gemini/gemini-event-ranker';

describe('parseRankedEventIds', () => {
    const candidates = [
        { id: 1, name: 'Coffee Meetup' },
        { id: 2, name: 'Outdoor Yoga' },
        { id: 3, name: 'Networking Night' },
    ];

    it('accepts valid ranked candidate IDs in relevance order', () => {
        expect(
            parseRankedEventIds('{"eventIds":[2,1]}', candidates),
        ).toEqual([2, 1]);
    });

    it('accepts an empty ranking', () => {
        expect(
            parseRankedEventIds('{"eventIds":[]}', candidates),
        ).toEqual([]);
    });

    it('rejects invalid JSON', () => {
        expect(() => parseRankedEventIds('not JSON', candidates))
            .toThrow('Gemini returned invalid ranking JSON');
    });

    it('rejects a response without eventIds', () => {
        expect(() => parseRankedEventIds('{"ids":[1]}', candidates))
            .toThrow('Gemini returned an invalid event ranking');
    });

    it('rejects non-integer IDs', () => {
        expect(() => parseRankedEventIds('{"eventIds":[1.5]}', candidates))
            .toThrow('Gemini returned an invalid event ranking');
    });

    it('rejects IDs that are not candidate events', () => {
        expect(() => parseRankedEventIds('{"eventIds":[99]}', candidates))
            .toThrow('Gemini returned unknown or duplicate event IDs');
    });

    it('rejects duplicate IDs', () => {
        expect(() => parseRankedEventIds('{"eventIds":[1,1]}', candidates))
            .toThrow('Gemini returned unknown or duplicate event IDs');
    });
});
