import { formatBookingDate, formatDate } from "../../helpers/DatesHelpers.ts";
import { EVENT_DATE_FORMAT } from "../../constants/shared/dates.ts";
import type { DateLabelProps } from "../../types/DateLabelProps.types.ts";

function getDateRange(
    startDateTime: string | null | undefined,
    endDateTime: string | null | undefined,
) {
    if (!startDateTime && !endDateTime) {
        return "Date to be announced";
    }

    let formattedStartDate: string;
    let formattedEndDate: string;
    if (startDateTime) {
        formattedStartDate = formatDate(startDateTime, EVENT_DATE_FORMAT);
    } else {
        formattedStartDate = "Not set";
    }

    if (endDateTime) {
        formattedEndDate = formatDate(endDateTime, EVENT_DATE_FORMAT);
    } else {
        formattedEndDate = "Not set";
    }

    return `${formattedStartDate} – ${formattedEndDate}`;
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
