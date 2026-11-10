import { GeminiEventSearchInterpreter } from "../../../4. backend/src/events/search/gemini-event-search-interpreter";
import { geminiClientConfigFixture } from '../fixtures/gemini/geminiClientConfigFixture';
import { GEMINI_TEST_API_KEY } from '../fixtures/gemini/geminiTestConstants';

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
        expect(prompt).toContain("structured relativeDate object");
        expect(prompt).toContain("Do not calculate absolute date boundaries");
        expect(prompt).toContain("For explicit absolute dates or date ranges");
        expect(prompt).toContain("Timezone: America/Toronto.");

        expect(prompt).toContain("Interpret relative dates using the current date and timezone below.");

        expect(prompt).toContain("TIME INTERPRETATION");
        expect(prompt).toContain("Interpret all event times in the America/Toronto timezone.");
        expect(prompt).toContain("EARLY_MORNING (05:00–08:00)");
        expect(prompt).toContain("MORNING (08:00–12:00)");
        expect(prompt).toContain("AFTERNOON (12:00–17:00)");
        expect(prompt).toContain("EVENING (17:00–21:00)");
        expect(prompt).toContain("NIGHT (21:00–05:00 the following day)");

        expect(prompt).toContain('For requests such as "after 8 PM", use startTime: "20:00".');
        expect(prompt).toContain('For requests such as "before 10 AM", use endTime: "10:00".');
        expect(prompt).toContain('startTime: "22:00" and endTime: "02:00"');

        expect(prompt).toContain("start-inclusive and end-exclusive boundaries");
        expect(prompt).toContain("backend will intersect the timeRange with the union of the selected periods.",);
        expect(prompt).toContain("Omit timeOfDay and timeRange when the user expresses no time preference.");
    });

    it("should return a structured relative-date plan for a relative-date request", async () => {
        const plan = {
            intent: "Coffee events",
            relativeDate: { kind: "THIS_WEEKEND" },
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

    it("should allow relative-date-only requests without an intent", async () => {
        const plan = {
            relativeDate: { kind: "THIS_WEEKEND" },
        };

        const generateContent = jest.fn().mockResolvedValue({
            text: JSON.stringify(plan),
        });

        const interpreter = new GeminiEventSearchInterpreter(
            "test-api-key",
            { models: { generateContent } } as never,
        );

        await expect(
            interpreter.interpret("Show me events this weekend"),
        ).resolves.toEqual(plan);
    });

    it("should preserve absolute date boundaries for explicit dates", async () => {
        const plan = {
            startAfter: "2026-10-24T00:00:00-04:00",
            startBefore: "2026-10-27T00:00:00-04:00",
        };

        const generateContent = jest.fn().mockResolvedValue({
            text: JSON.stringify(plan),
        });

        const interpreter = new GeminiEventSearchInterpreter(
            "test-api-key",
            { models: { generateContent } } as never,
        );

        await expect(
            interpreter.interpret("Show me events from October 24 to October 26"),
        ).resolves.toEqual(plan);
    });
});
