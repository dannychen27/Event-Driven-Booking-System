import { formatBookingDate, formatDate } from "../../helpers/DatesHelpers.ts";
import { EVENT_DATE_FORMAT } from "../../constants/dates.ts";
import type { DateLabelProps } from "../../types/DateLabelProps.types.ts";

function getDateRange(startDateTime: string, endDateTime: string) {
    return !startDateTime && !endDateTime
        ? "Date to be announced"
        : `${startDateTime
            ? formatDate(startDateTime, EVENT_DATE_FORMAT)
            : "Not set"} – ${endDateTime
            ? formatDate(endDateTime, EVENT_DATE_FORMAT)
            : "Not set"}`;
}

export function DateLabel({
    label,
    dateTime,
    startDateTime,
    endDateTime,
}: DateLabelProps) {
    const isDateRange =
        startDateTime !== undefined || endDateTime !== undefined;

    if (!isDateRange) {
        return (
            <p>
                {label}:{" "}
                {dateTime ? formatBookingDate(dateTime) : "Not set"}
            </p>
        );
    }

    return (
        <div className="event-datetime">
            <h3>{label}</h3>
            <p>{getDateRange(startDateTime, endDateTime)}</p>
        </div>
    );
}
