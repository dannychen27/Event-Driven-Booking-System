import { GeminiSearchInterpreter } from "../../../4. backend/src/events/gemini-search-interpreter";


describe("GeminiSearchInterpreter", () => {

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
