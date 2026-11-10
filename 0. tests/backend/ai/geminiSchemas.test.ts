import { NATURAL_LANGUAGE_SEARCH_SCHEMA } from "../../../4. backend/src/ai/gemini/gemini-schemas";


describe("NATURAL_LANGUAGE_SEARCH_SCHEMA", () => {

    it("should not require any search properties", () => {
        expect(NATURAL_LANGUAGE_SEARCH_SCHEMA).not.toHaveProperty("required");
    });

    it("should expose past/future inclusion properties as optional booleans", () => {
        expect(NATURAL_LANGUAGE_SEARCH_SCHEMA.properties.includePastEvents)
            .toEqual({ type: "BOOLEAN" });

        expect(NATURAL_LANGUAGE_SEARCH_SCHEMA.properties.includeFutureEvents)
            .toEqual({ type: "BOOLEAN" });
    });

    it("should expose time-of-day as an optional array of enum values", () => {
        expect(NATURAL_LANGUAGE_SEARCH_SCHEMA.properties.timeOfDay).toEqual({
            type: "ARRAY",
            items: {
                type: "STRING",
                enum: [
                    "EARLY_MORNING",
                    "MORNING",
                    "AFTERNOON",
                    "EVENING",
                    "NIGHT",
                ],
            },
        });
    });

    it("should expose time-range as an optional object with optional string boundaries", () => {
        expect(NATURAL_LANGUAGE_SEARCH_SCHEMA.properties.timeRange).toEqual({
            type: "OBJECT",
            properties: {
                startTime: { type: "STRING" },
                endTime: { type: "STRING" },
            },
            propertyOrdering: ["startTime", "endTime"],
        });
    });

    it("should include all properties in the expected order", () => {
        expect(NATURAL_LANGUAGE_SEARCH_SCHEMA.propertyOrdering).toEqual([
            "intent",
            "startAfter",
            "startBefore",
            "relativeDate",
            "includePastEvents",
            "includeFutureEvents",
            "timeOfDay",
            "timeRange",
        ]);
    });
});
