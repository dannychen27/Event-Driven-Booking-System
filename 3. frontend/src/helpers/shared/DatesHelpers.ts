import { BOOKING_DATE_FORMAT_OPTIONS } from "../../constants/shared/dates.ts";
import type { DateFormatOptions } from "../../types/Dates.types.ts";

// General-purpose date formatter.
export function formatDate(
    isoDate: string,
    options: DateFormatOptions = {}
): string {
    const date = new Date(isoDate);

    return new Intl.DateTimeFormat("en-US", {
        dateStyle: options.dateStyle ?? "long",
        timeStyle: options.timeStyle ?? "medium",
        hour12: options.is12HourFormat ?? false,
    }).format(date);
}

// Applies the standard booking-date format.
export function formatBookingDate(isoDate: string): string {
    return formatDate(isoDate, BOOKING_DATE_FORMAT_OPTIONS);
}
