import {
    SEARCH_START_BOUNDARY,
    SEARCH_END_BOUNDARY,
} from "../fixtures/events/eventSearchFixtures";
import {
    validateSearchFilters,
} from "../../../4. backend/src/search/natural-language-search";
import { MAX_EVENT_SEARCH_KEYWORD_LENGTH } from "../../../4. backend/src/constants/search.constants";

describe("validateSearchFilters", () => {
    it("should accept a keyword filter", () => {
        expect(validateSearchFilters({ keyword: "Meet and Greet" }))
            .toEqual({ keyword: "Meet and Greet" });
    });

    it("should accept date boundaries", () => {
        const filters = {
            startAfter: SEARCH_START_BOUNDARY,
            startBefore: SEARCH_END_BOUNDARY,
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
        expect(() => validateSearchFilters({
            keyword: "a".repeat(MAX_EVENT_SEARCH_KEYWORD_LENGTH + 1)
        })).toThrow();
    });

    it("should reject invalid dates", () => {
        expect(() => validateSearchFilters({ startAfter: "not-a-date" }))
            .toThrow();
    });

    it("should reject a start boundary that is not earlier than the end boundary", () => {
        expect(() => validateSearchFilters({
            startAfter: SEARCH_END_BOUNDARY,
            startBefore: SEARCH_START_BOUNDARY,
        })).toThrow();
    });

    it("should reject unknown fields", () => {
        expect(() => validateSearchFilters({
            keyword: "coffee",
            sql: "DROP TABLE events",
        } as Record<string, unknown>)).toThrow();
    });
});
