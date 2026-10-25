import {
    validateSearchFilters,
    validateNaturalLanguageSearchPlan,
} from "../../../../4. backend/src/events/search/natural-language-search";

describe("validateSearchFilters", () => {

    it("should accept a keyword filter", () => {
        expect(validateSearchFilters({ keyword: "Meet and Greet" }))
            .toEqual({ keyword: "Meet and Greet" });
    });

    it("should accept date boundaries", () => {
        const filters = {
            startAfter: "2026-10-24T00:00:00Z",
            startBefore: "2026-10-26T00:00:00Z",
        };

        expect(validateSearchFilters(filters)).toEqual(filters);
    });

    it("should accept an empty filter object", () => {
        expect(validateSearchFilters({})).toEqual({});
    });

    it("should reject an empty keyword", () => {
        expect(() => validateSearchFilters({ keyword: "   " }))
            .toThrow();
    });

    it("should reject a keyword longer than 100 characters", () => {
        expect(() => validateSearchFilters({ keyword: "a".repeat(101) }))
            .toThrow();
    });

    it("should reject invalid dates", () => {
        expect(() => validateSearchFilters({ startAfter: "not-a-date" }))
            .toThrow();
    });

    it("should reject a start boundary that is not earlier than the end boundary", () => {
        expect(() => validateSearchFilters({
            startAfter: "2026-10-26T00:00:00Z",
            startBefore: "2026-10-24T00:00:00Z",
        })).toThrow();
    });

    it("should reject unknown fields", () => {
        expect(() => validateSearchFilters({
            keyword: "coffee",
            sql: "DROP TABLE events",
        } as Record<string, unknown>)).toThrow();
    });
});

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
