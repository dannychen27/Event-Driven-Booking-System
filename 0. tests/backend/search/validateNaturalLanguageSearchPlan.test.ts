import {
    validateNaturalLanguageSearchPlan,
} from "../../../4. backend/src/search/natural-language-search";
import {
    validateNaturalLanguageSearchRequest,
} from "../../../4. backend/src/search/natural-language-search-request.validation";
import { MAX_NATURAL_LANGUAGE_INTENT_LENGTH } from "../../../4. backend/src/constants/search.constants";

import {
    SEARCH_START_BOUNDARY,
    SEARCH_END_BOUNDARY,
} from "../fixtures/events/eventSearchFixtures";


const NUM_DAYS_IN_CALENDAR_YEAR = 365;

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

    it.each([
        { includePastEvents: true, includeFutureEvents: true },
        { includePastEvents: false, includeFutureEvents: true },
        { includePastEvents: true, includeFutureEvents: false },
        { includePastEvents: false, includeFutureEvents: false },
    ])("should accept past/future inclusion settings: %j", (flags) => {
        expect(validateNaturalLanguageSearchPlan(flags)).toEqual(flags);
    });

    it.each([
        { includePastEvents: "false" },
        { includePastEvents: 0 },
        { includePastEvents: null },
        { includeFutureEvents: "true" },
        { includeFutureEvents: 1 },
        { includeFutureEvents: null },
    ])("should reject non-boolean past/future inclusion settings: %j", (flags) => {
        expect(() => validateNaturalLanguageSearchPlan(flags)).toThrow();
    });

    it.each([
        { timeOfDay: ['EARLY_MORNING'] },
        { timeOfDay: ['MORNING'] },
        { timeOfDay: ['AFTERNOON'] },
        { timeOfDay: ['EVENING'] },
        { timeOfDay: ['NIGHT'] },
        { timeOfDay: ['MORNING', 'EVENING'] },
        { timeOfDay: ['EARLY_MORNING', 'MORNING', 'AFTERNOON'] },
    ])('preserves valid time-of-day filters: %j', (plan) => {
        expect(validateNaturalLanguageSearchPlan(plan)).toMatchObject(plan);
    });

    it.each([
        { timeRange: { startTime: '20:00' } },
        { timeRange: { endTime: '10:00' } },
        { timeRange: { startTime: '22:00', endTime: '02:00' } },
        {
            timeOfDay: ['EVENING'],
            timeRange: { startTime: '19:00', endTime: '20:00' },
        },
    ])('preserves valid explicit time ranges: %j', (plan) => {
        expect(validateNaturalLanguageSearchPlan(plan)).toMatchObject(plan);
    });

    it.each([
        { timeOfDay: 'LATE_NIGHT' },
        { timeOfDay: 12 },
        { timeOfDay: null },
        { timeRange: {} },
        { timeRange: { startTime: undefined } },
        { timeRange: { endTime: undefined } },
        { timeRange: { startTime: '24:00' } },
        { timeRange: { endTime: '12:60' } },
        { timeRange: { startTime: '9:00' } },
        { timeRange: { startTime: '18:00', endTime: '18:00' } },
        { timeRange: { startTime: '18:00', finishTime: '20:00' } },
        { timeRange: null },
        { timeOfDay: 'EVENING' },
        { timeOfDay: [] },
        { timeOfDay: ['LATE_NIGHT'] },
        { timeOfDay: ['EVENING', 'EVENING'] },
        { timeOfDay: ['EVENING', 12] },
    ])('rejects invalid time filters: %j', (plan) => {
        expect(() => validateNaturalLanguageSearchPlan(plan)).toThrow();
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

    it.each([
        { kind: "TODAY" },
        { kind: "TOMORROW" },
        { kind: "YESTERDAY" },
        { kind: "THIS_WEEKEND" },
        { kind: "NEXT_WEEKEND" },
        { kind: "DAYS_FROM_NOW", days: 3 },
        { kind: "DAYS_AGO", days: 2 },
        { kind: "WEEKDAY", weekday: "FRIDAY", occurrence: "NEXT" },
        { kind: "WEEKDAY", weekday: "MONDAY", occurrence: "THIS" },
        { kind: "WEEKDAY", weekday: "SUNDAY", occurrence: "LAST" },
        { kind: "NEXT_BUSINESS_DAY" },
        { kind: "PREVIOUS_BUSINESS_DAY" },
        { kind: "BUSINESS_DAYS_FROM_NOW", days: 5 },
        { kind: "BUSINESS_DAYS_AGO", days: 2 },
    ])("should accept valid relative date: %j", (relativeDate) => {
        expect(validateNaturalLanguageSearchPlan({
            intent: "concerts",
            relativeDate,
        })).toEqual({
            intent: "concerts",
            relativeDate,
        });
    });

    it.each([0, -1, 1.5, NUM_DAYS_IN_CALENDAR_YEAR + 1])(
        "should reject an invalid calendar/business-day offset: %s",
        (days) => {
            expect(() => validateNaturalLanguageSearchPlan({
                relativeDate: {
                    kind: "DAYS_FROM_NOW",
                    days,
                },
            })).toThrow();
        },
    );

    it("should reject an offset variant with missing days", () => {
        expect(() => validateNaturalLanguageSearchPlan({
            relativeDate: { kind: "DAYS_FROM_NOW" },
        })).toThrow();
    });

    it("should reject invalid weekday values", () => {
        expect(() => validateNaturalLanguageSearchPlan({
            relativeDate: {
                kind: "WEEKDAY",
                weekday: "FUNDAY",
                occurrence: "NEXT",
            },
        })).toThrow();
    });

    it("should reject invalid weekday occurrences", () => {
        expect(() => validateNaturalLanguageSearchPlan({
            relativeDate: {
                kind: "WEEKDAY",
                weekday: "FRIDAY",
                occurrence: "SOMEDAY",
            },
        })).toThrow();
    });

    it("should reject unsupported relative date kinds", () => {
        expect(() => validateNaturalLanguageSearchPlan({
            relativeDate: { kind: "NEXT_MONTH" },
        })).toThrow();
    });

    it("should reject unexpected fields in relative date variants", () => {
        expect(() => validateNaturalLanguageSearchPlan({
            relativeDate: {
                kind: "TODAY",
                days: 1,
            },
        })).toThrow();
    });

    it("should reject relative dates combined with absolute date boundaries", () => {
        expect(() => validateNaturalLanguageSearchPlan({
            relativeDate: { kind: "TODAY" },
            startAfter: SEARCH_START_BOUNDARY,
        })).toThrow(/cannot combine/i);

        expect(() => validateNaturalLanguageSearchPlan({
            relativeDate: { kind: "TODAY" },
            startBefore: SEARCH_END_BOUNDARY,
        })).toThrow(/cannot combine/i);
    });

    it("should reject null relative dates", () => {
        expect(() => validateNaturalLanguageSearchPlan({
            relativeDate: null,
        })).toThrow();
    });
});
