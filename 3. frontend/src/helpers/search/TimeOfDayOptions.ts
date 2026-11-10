import type { TimeOfDay } from "../../types/search/NaturalLanguageSearch.types.ts";

type TimeFormat = "12h" | "24h";

interface TimeOfDayRange {
    name: string;
    startMinute: number;
    endMinute: number;
}

interface TimeOfDayOption {
    value: TimeOfDay;
    label: string;
}

/**
 * Canonical time-of-day boundaries, expressed as minutes after midnight.
 *
 * Keep these boundaries aligned with the backend's
 * time-of-day-intervals.ts definitions.
 */
export const TIME_OF_DAY_RANGES: Record<TimeOfDay, TimeOfDayRange> = {
    EARLY_MORNING: {
        name: "Early morning",
        startMinute: 5 * 60,
        endMinute: 8 * 60,
    },
    MORNING: {
        name: "Morning",
        startMinute: 8 * 60,
        endMinute: 12 * 60,
    },
    AFTERNOON: {
        name: "Afternoon",
        startMinute: 12 * 60,
        endMinute: 17 * 60,
    },
    EVENING: {
        name: "Evening",
        startMinute: 17 * 60,
        endMinute: 21 * 60,
    },
    NIGHT: {
        name: "Night",
        startMinute: 21 * 60,
        endMinute: 5 * 60,
    },
};

const TIME_OF_DAY_ORDER: TimeOfDay[] = [
    "EARLY_MORNING",
    "MORNING",
    "AFTERNOON",
    "EVENING",
    "NIGHT",
];

function formatBoundary(minute: number, format: TimeFormat): string {
    const normalizedMinute = ((minute % 1440) + 1440) % 1440;
    const hours = Math.floor(normalizedMinute / 60);
    const minutes = normalizedMinute % 60;

    if (format === "24h") {
        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    }

    const displayHour = hours % 12 || 12;
    const period = hours >= 12 ? "PM" : "AM";
    const displayMinute = minutes === 0
        ? ""
        : `:${String(minutes).padStart(2, "0")}`;

    return `${displayHour}${displayMinute} ${period}`;
}

/**
 * Formats a time range using the requested display format.
 * Exported separately so boundary-formatting behaviour can be tested.
 */
export function formatTimeOfDayRange(
    startMinute: number,
    endMinute: number,
    format: TimeFormat,
): string {
    return `${formatBoundary(startMinute, format)}–${formatBoundary(endMinute, format)}`;
}

/**
 * Generates display labels from the canonical time-of-day boundaries.
 */
export function getTimeOfDayOptions(
    format: TimeFormat,
): TimeOfDayOption[] {
    return TIME_OF_DAY_ORDER.map((value) => {
        const range = TIME_OF_DAY_RANGES[value];

        return {
            value,
            label: `${range.name} (${formatTimeOfDayRange(
                range.startMinute,
                range.endMinute,
                format,
            )})`,
        };
    });
}
