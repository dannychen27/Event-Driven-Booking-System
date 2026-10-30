import {
    GeminiEventSearchInterpreter,

} from "../../../4. backend/src/events/search/gemini-event-search-interpreter";
import { geminiClientConfigFixture } from '../fixtures/gemini/geminiClientConfigFixture';
import { GEMINI_TEST_API_KEY } from '../fixtures/gemini/geminiTestConstants';
import {
    parseNaturalLanguageSearchPlan
} from "../../../4. backend/src/events/search/ParseNaturalLanguageSearchInterpreterHelpers";


jest.mock('@google/genai', () => ({
    GoogleGenAI: jest.fn().mockImplementation(() => ({
        models: {
            generateContent: jest.fn(),
        },
    })),
}));


describe("GeminiSearchInterpreter", () => {

    it('configures the default Gemini client with a 20-second timeout and 2 attempts', () => {
        const { GoogleGenAI } = jest.requireMock('@google/genai') as {
            GoogleGenAI: jest.Mock;
        };

        new GeminiEventSearchInterpreter(GEMINI_TEST_API_KEY);

        expect(GoogleGenAI).toHaveBeenCalledWith(
            geminiClientConfigFixture(GEMINI_TEST_API_KEY),
        );
    });

    it("should include the current Toronto date and timezone in the prompt", async () => {
        const generateContent = jest.fn().mockResolvedValue({
            text: '{"intent":"coffee events"}',
        });

        const interpreter = new GeminiEventSearchInterpreter(
            "test-api-key",
            { models: { generateContent } } as never,
            () => new Date("2026-10-24T16:00:00.000Z"),
        );

        await interpreter.interpret("Find coffee events this weekend");

        const prompt = generateContent.mock.calls[0][0].contents;

        expect(prompt).toContain("Current date: 2026-10-24");
        expect(prompt).toContain("Timezone: America/Toronto.");
    });

    it("should reject a missing API key", async () => {
        const interpreter = new GeminiEventSearchInterpreter("");

        await expect(
            interpreter.interpret("Find coffee events"),
        ).rejects.toThrow(/API key/i);
    });

    it("should return a validated semantic intent", async () => {
        const generateContent = jest.fn().mockResolvedValue({
            text: '{"intent":"Relaxing outdoor activities"}',
        });

        const interpreter = new GeminiEventSearchInterpreter(
            "test-api-key",
            { models: { generateContent } } as never,
        );

        await expect(
            interpreter.interpret("Find something relaxing outdoors"),
        ).resolves.toEqual({
            intent: "Relaxing outdoor activities",
        });

        expect(generateContent).toHaveBeenCalledTimes(1);

        const request = generateContent.mock.calls[0][0];

        expect(request.config.responseMimeType).toBe("application/json");
        expect(request.config.responseSchema.properties).toHaveProperty("intent");
        expect(request.config.responseSchema.properties).not.toHaveProperty("keyword");
    });

    it("should prompt Gemini to interpret semantic preferences", async () => {
        const generateContent = jest.fn().mockResolvedValue({
            text: '{"intent":"Relaxing outdoor activities"}',
        });

        const interpreter = new GeminiEventSearchInterpreter(
            "test-api-key",
            { models: { generateContent } } as never,
        );

        await interpreter.interpret("Find something relaxing outdoors");

        const prompt = generateContent.mock.calls[0][0].contents;

        expect(prompt).toContain("semantic event preferences");
        expect(prompt).toContain("literal keywords");
        expect(prompt).toContain("startAfter and startBefore");
    });

    it("should reject invalid Gemini output", async () => {
        const generateContent = jest.fn().mockResolvedValue({
            text: '{"venueCategory":"coffee shop"}',
        });

        const interpreter = new GeminiEventSearchInterpreter(
            "test-api-key",
            { models: { generateContent } } as never,
        );

        await expect(
            interpreter.interpret("Find coffee events"),
        ).rejects.toThrow(/unsupported natural-language search field/i);
    });

    it("should return date filters for a relative-date request", async () => {
        const plan = {
            intent: "Coffee events",
            startAfter: "2026-10-24T00:00:00-04:00",
            startBefore: "2026-10-27T00:00:00-04:00",
        };

        const generateContent = jest.fn().mockResolvedValue({
            text: JSON.stringify(plan),
        });

        const interpreter = new GeminiEventSearchInterpreter(
            "test-api-key",
            { models: { generateContent } } as never,
            () => new Date("2026-10-23T16:00:00.000Z"),
        );

        await expect(
            interpreter.interpret("Find coffee events this weekend"),
        ).resolves.toEqual(plan);

        expect(generateContent).toHaveBeenCalledTimes(1);
        expect(generateContent.mock.calls[0][0].contents).toContain(
            "Find coffee events this weekend",
        );
    });

    it("should allow date-only requests without an intent", async () => {
        const generateContent = jest.fn().mockResolvedValue({
            text: JSON.stringify({
                startAfter: "2026-10-24T00:00:00-04:00",
                startBefore: "2026-10-27T00:00:00-04:00",
            }),
        });

        const interpreter = new GeminiEventSearchInterpreter(
            "test-api-key",
            { models: { generateContent } } as never,
        );

        await expect(
            interpreter.interpret("Show me events this weekend"),
        ).resolves.toEqual({
            startAfter: "2026-10-24T00:00:00-04:00",
            startBefore: "2026-10-27T00:00:00-04:00",
        });
    });

    it("should reject invalid JSON", () => {
        expect(() => parseNaturalLanguageSearchPlan("not JSON"))
            .toThrow("Gemini returned invalid JSON");
    });

    it("should propagate Gemini API failures", async () => {
        const generateContent = jest.fn().mockRejectedValue(
            new Error("Gemini unavailable"),
        );

        const interpreter = new GeminiEventSearchInterpreter(
            "test-api-key",
            { models: { generateContent } } as never,
        );

        await expect(
            interpreter.interpret("Find coffee events"),
        ).rejects.toThrow("Gemini unavailable");
    });
});
