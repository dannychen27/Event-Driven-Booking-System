import {
    validateNaturalLanguageSearchPlan,
} from "../../../../4. backend/src/events/search/natural-language-search";

describe("validateNaturalLanguageSearchPlan", () => {
    it("should accept a semantic intent", () => {
        expect(validateNaturalLanguageSearchPlan({
            intent: "Relaxing outdoor activities",
        })).toEqual({
            intent: "Relaxing outdoor activities",
        });
    });

    it("should accept date boundaries without an intent", () => {
        const plan = {
            startAfter: "2026-10-24T00:00:00Z",
            startBefore: "2026-10-26T00:00:00Z",
        };

        expect(validateNaturalLanguageSearchPlan(plan)).toEqual(plan);
    });

    it("should accept an empty plan", () => {
        expect(validateNaturalLanguageSearchPlan({})).toEqual({});
    });

    it("should trim surrounding whitespace from intent", () => {
        expect(validateNaturalLanguageSearchPlan({
            intent: "  relaxing outdoor activities  ",
        })).toEqual({
            intent: "relaxing outdoor activities",
        });
    });

    it("should reject an empty intent", () => {
        expect(() => validateNaturalLanguageSearchPlan({
            intent: "   ",
        })).toThrow();
    });

    it("should reject an intent longer than 300 characters", () => {
        expect(() => validateNaturalLanguageSearchPlan({
            intent: "a".repeat(301),
        })).toThrow();
    });

    it("should reject invalid dates", () => {
        expect(() => validateNaturalLanguageSearchPlan({
            startAfter: "not-a-date",
        })).toThrow();
    });

    it("should reject a start boundary that is not earlier than the end boundary", () => {
        expect(() => validateNaturalLanguageSearchPlan({
            startAfter: "2026-10-26T00:00:00Z",
            startBefore: "2026-10-24T00:00:00Z",
        })).toThrow();
    });

    it("should reject unknown fields", () => {
        expect(() => validateNaturalLanguageSearchPlan({
            intent: "coffee",
            keyword: "coffee",
        } as Record<string, unknown>)).toThrow(/unsupported/i);
    });

    it("should reject non-object input", () => {
        expect(() => validateNaturalLanguageSearchPlan(null)).toThrow();
        expect(() => validateNaturalLanguageSearchPlan([])).toThrow();
    });
});
