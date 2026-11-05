import {
    GeminiEventSearchInterpreter,
} from "../../../4. backend/src/events/search/gemini-event-search-interpreter";
import {
    parseNaturalLanguageSearchPlan
} from "../../../4. backend/src/events/search/ParseNaturalLanguageSearchInterpreterHelpers";

describe("GeminiSearchInterpreter errors", () => {
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
