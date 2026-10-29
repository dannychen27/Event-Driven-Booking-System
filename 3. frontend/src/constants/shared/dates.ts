// Standard formatting options for booking dates.
export const BOOKING_DATE_FORMAT_OPTIONS = {
    dateStyle: "long",
    timeStyle: "medium",
    is12HourFormat: false,
} as const;

// Standard formatting options for event date ranges.
export const EVENT_DATE_FORMAT = {
    dateStyle: "medium",
    timeStyle: "short",
} as const;
