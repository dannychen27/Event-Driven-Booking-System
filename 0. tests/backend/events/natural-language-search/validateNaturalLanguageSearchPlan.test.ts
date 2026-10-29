import {
    validateNaturalLanguageSearchPlan,
} from "../../../../4. backend/src/search/natural-language-search";

import {
    SEARCH_START_BOUNDARY,
    SEARCH_END_BOUNDARY,
} from "../../fixtures/eventSearchFixtures";
import { MAX_NATURAL_LANGUAGE_INTENT_LENGTH } from "../../fixtures/sharedTestFixtures";

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
            startAfter: SEARCH_START_BOUNDARY,
            startBefore: SEARCH_END_BOUNDARY,
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
            intent: "a".repeat(MAX_NATURAL_LANGUAGE_INTENT_LENGTH + 1),
        })).toThrow();
    });

    it("should reject invalid dates", () => {
        expect(() => validateNaturalLanguageSearchPlan({
            startAfter: "not-a-date",
        })).toThrow();
    });

    it("should reject a start boundary that is not earlier than the end boundary", () => {
        expect(() => validateNaturalLanguageSearchPlan({
            startAfter: SEARCH_END_BOUNDARY,
            startBefore: SEARCH_START_BOUNDARY,
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
