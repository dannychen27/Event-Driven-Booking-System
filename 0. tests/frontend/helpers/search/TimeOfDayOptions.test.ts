import { describe, expect, it } from "vitest";
import {
    formatTimeOfDayRange,
    getTimeOfDayOptions,
    TIME_OF_DAY_RANGES,
} from "../../../../3. frontend/src/helpers/search/TimeOfDayOptions";

describe("TimeOfDayOptions", () => {

    it("generates all five 12-hour labels from the canonical ranges", () => {
        expect(getTimeOfDayOptions("12h")).toEqual([
            {
                value: "EARLY_MORNING",
                label: "Early morning (5 AM–8 AM)",
            },
            {
                value: "MORNING",
                label: "Morning (8 AM–12 PM)",
            },
            {
                value: "AFTERNOON",
                label: "Afternoon (12 PM–5 PM)",
            },
            {
                value: "EVENING",
                label: "Evening (5 PM–9 PM)",
            },
            {
                value: "NIGHT",
                label: "Night (9 PM–5 AM)",
            },
        ]);
    });

    it("generates all five 24-hour labels from the same canonical ranges", () => {
        expect(getTimeOfDayOptions("24h")).toEqual([
            {
                value: "EARLY_MORNING",
                label: "Early morning (05:00–08:00)",
            },
            {
                value: "MORNING",
                label: "Morning (08:00–12:00)",
            },
            {
                value: "AFTERNOON",
                label: "Afternoon (12:00–17:00)",
            },
            {
                value: "EVENING",
                label: "Evening (17:00–21:00)",
            },
            {
                value: "NIGHT",
                label: "Night (21:00–05:00)",
            },
        ]);
    });

    it("formats a changed range consistently in both display formats", () => {        const changedRange = {
            startMinute: 18 * 60,
            endMinute: 22 * 60,
        };

        expect(
            formatTimeOfDayRange(
                changedRange.startMinute,
                changedRange.endMinute,
                "12h",
            ),
        ).toBe("6 PM–10 PM");

        expect(
            formatTimeOfDayRange(
                changedRange.startMinute,
                changedRange.endMinute,
                "24h",
            ),
        ).toBe("18:00–22:00");
    });

    it("preserves midnight-crossing ranges in both display formats", () => {
        const night = TIME_OF_DAY_RANGES.NIGHT;

        expect(
            formatTimeOfDayRange(
                night.startMinute,
                night.endMinute,
                "12h",
            ),
        ).toBe("9 PM–5 AM");

        expect(
            formatTimeOfDayRange(
                night.startMinute,
                night.endMinute,
                "24h",
            ),
        ).toBe("21:00–05:00");
    });

    it("formats boundaries containing non-zero minutes", () => {
        expect(
            formatTimeOfDayRange(5 * 60 + 30, 8 * 60 + 45, "12h"),
        ).toBe("5:30 AM–8:45 AM");

        expect(
            formatTimeOfDayRange(5 * 60 + 30, 8 * 60 + 45, "24h"),
        ).toBe("05:30–08:45");
    });
});
