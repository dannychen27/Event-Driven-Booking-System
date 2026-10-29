import {
    GeminiEventRanker,
} from '../../../../4. backend/src/events/search/gemini-event-ranker';
import { geminiClientConfigFixture } from '../../fixtures/geminiClientConfigFixture';
import { GEMINI_TEST_API_KEY } from '../../fixtures/geminiTestConstants';
import {
    GEMINI_EVENT_RANKING_CANDIDATES_FIXTURE,
    GEMINI_EVENT_RANKING_MISSING_KEY_FIXTURE,
    GEMINI_EVENT_RANKING_REQUEST_FIXTURE
} from "../../fixtures/sharedTestFixtures";

jest.mock('@google/genai', () => ({
    GoogleGenAI: jest.fn().mockImplementation(() => ({
        models: {
            generateContent: jest.fn(),
        },
    })),
}));

describe('GeminiEventRanker', () => {
    const candidates = GEMINI_EVENT_RANKING_CANDIDATES_FIXTURE;

    it('configures the default Gemini client with a 20-second timeout and 2 attempts', () => {
        const { GoogleGenAI } = jest.requireMock('@google/genai') as {
            GoogleGenAI: jest.Mock;
        };

        new GeminiEventRanker(GEMINI_TEST_API_KEY);

        expect(GoogleGenAI).toHaveBeenCalledWith(
            geminiClientConfigFixture(GEMINI_TEST_API_KEY),
        );
    });

    it('returns an empty ranking without calling Gemini when there are no candidates', async () => {
        const generateContent = jest.fn();
        const ranker = new GeminiEventRanker('', {
            models: { generateContent },
        });

        await expect(
            ranker.rank('Find an event', 'some intent', []),
        ).resolves.toEqual([]);

        expect(generateContent).not.toHaveBeenCalled();
    });

    it("requires an API key when ranking non-empty candidates", async () => {
        const ranker = new GeminiEventRanker("", undefined);

        await expect(
            ranker.rank(
                GEMINI_EVENT_RANKING_MISSING_KEY_FIXTURE.query,
                GEMINI_EVENT_RANKING_MISSING_KEY_FIXTURE.intent,
                [{ id: 1, name: "Coffee Meetup" }],
            ),
        ).rejects.toThrow("Gemini API key is required");
    });

    it('creates a default Gemini client when an API key is provided', () => {
        expect(() => new GeminiEventRanker(GEMINI_TEST_API_KEY)).not.toThrow();
    });

    it('sends the request and event metadata to Gemini and returns ranked IDs', async () => {
        const generateContent = jest.fn().mockResolvedValue({
            text: '{"eventIds":[2,1]}',
        });
        const ranker = new GeminiEventRanker(GEMINI_TEST_API_KEY, {
            models: { generateContent },
        });

        await expect(
            ranker.rank(
                GEMINI_EVENT_RANKING_REQUEST_FIXTURE.query,
                GEMINI_EVENT_RANKING_REQUEST_FIXTURE.intent,
                candidates,
            ),
        ).resolves.toEqual([2, 1]);

        expect(generateContent).toHaveBeenCalledTimes(1);

        const args = generateContent.mock.calls[0][0];

        expect(args.model).toBe('gemini-3.5-flash-lite');
        expect(args.config).toMatchObject({
            responseMimeType: 'application/json',
            responseSchema: {
                type: 'OBJECT',
                properties: {
                    eventIds: {
                        type: 'ARRAY',
                        items: { type: 'INTEGER' },
                    },
                },
                required: ['eventIds'],
            },
        });

        expect(args.contents).toContain(
            'Original user request: Find a relaxing outdoor activity',
        );
        expect(args.contents).toContain(
            'Interpreted event intent: An outdoor activity that helps people relax',
        );
        expect(args.contents).toContain('"description":"An informal gathering to meet people."');
        expect(args.contents).toContain('"venue":"City Park"');
        expect(args.contents).toContain('"address":"456 Park Road"');
    });

    it('throws when Gemini returns no ranking text', async () => {
        const generateContent = jest.fn().mockResolvedValue({});
        const ranker = new GeminiEventRanker(GEMINI_TEST_API_KEY, {
            models: { generateContent },
        });

        await expect(
            ranker.rank('Find an event', 'some intent', candidates),
        ).rejects.toThrow('Gemini returned an empty ranking');
    });

    it('propagates errors from the Gemini client', async () => {
        const generateContent = jest.fn().mockRejectedValue(
            new Error('Gemini request failed'),
        );
        const ranker = new GeminiEventRanker(GEMINI_TEST_API_KEY, {
            models: { generateContent },
        });

        await expect(
            ranker.rank('Find an event', 'some intent', candidates),
        ).rejects.toThrow('Gemini request failed');
    });

    it('uses empty strings when optional event metadata is missing', async () => {
        const generateContent = jest.fn().mockResolvedValue({
            text: '{"eventIds":[1]}',
        });
        const ranker = new GeminiEventRanker(GEMINI_TEST_API_KEY, {
            models: { generateContent },
        });

        await expect(
            ranker.rank('Find an event', 'some intent', [
                { id: 1, name: 'Community Meetup' },
            ]),
        ).resolves.toEqual([1]);

        const args = generateContent.mock.calls[0][0];
        expect(args.contents).toContain(
            '"description":"","venue":"","address":"","startTime":""',
        );
    });
});

