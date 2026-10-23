import { GeminiSearchInterpreter } from "../../../4. backend/src/events/gemini-search-interpreter";


describe("GeminiSearchInterpreter", () => {

    it("should include the current Toronto date and timezone in the prompt", async () => {
        const generateContent = jest.fn().mockResolvedValue({
            text: '{"keyword":"coffee"}',
        });

        const interpreter = new GeminiSearchInterpreter(
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
        const interpreter = new GeminiSearchInterpreter("");

        await expect(
            interpreter.interpret("Find coffee events"),
        ).rejects.toThrow(/API key/i);
    });

    it("should return validated filters from Gemini", async () => {
        const generateContent = jest.fn().mockResolvedValue({
            text: '{"keyword":"coffee"}',
        });

        const interpreter = new GeminiSearchInterpreter(
            "test-api-key",
            { models: { generateContent } } as never,
        );

        await expect(
            interpreter.interpret("Find coffee events"),
        ).resolves.toEqual({ keyword: "coffee" });

        expect(generateContent).toHaveBeenCalledTimes(1);
    });

    it("should reject invalid Gemini output", async () => {
        const generateContent = jest.fn().mockResolvedValue({
            text: '{"venueCategory":"coffee shop"}',
        });

        const interpreter = new GeminiSearchInterpreter(
            "test-api-key",
            { models: { generateContent } } as never,
        );

        await expect(
            interpreter.interpret("Find coffee events"),
        ).rejects.toThrow(/unsupported search filter/i);
    });

    it("should return date filters for a relative-date request", async () => {
        const filters = {
            keyword: "coffee",
            startAfter: "2026-10-24T00:00:00-04:00",
            startBefore: "2026-10-27T00:00:00-04:00",
        };

        const generateContent = jest.fn().mockResolvedValue({
            text: JSON.stringify(filters),
        });

        const interpreter = new GeminiSearchInterpreter(
            "test-api-key",
            { models: { generateContent } } as never,
            () => new Date("2026-10-23T16:00:00.000Z"),
        );

        await expect(
            interpreter.interpret("Find coffee events this weekend"),
        ).resolves.toEqual(filters);

        expect(generateContent).toHaveBeenCalledTimes(1);
        expect(generateContent.mock.calls[0][0].contents).toContain(
            "Find coffee events this weekend",
        );
    });

    it("should propagate Gemini API failures", async () => {
        const generateContent = jest.fn().mockRejectedValue(
            new Error("Gemini unavailable"),
        );

        const interpreter = new GeminiSearchInterpreter(
            "test-api-key",
            { models: { generateContent } } as never,
        );

        await expect(
            interpreter.interpret("Find coffee events"),
        ).rejects.toThrow("Gemini unavailable");
    });
});
