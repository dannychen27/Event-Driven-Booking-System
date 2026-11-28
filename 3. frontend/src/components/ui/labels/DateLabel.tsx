import { formatBookingDate, formatDate } from "../../../helpers/shared/DatesHelpers.ts";
import { EVENT_DATE_FORMAT } from "../../../constants/shared/dates.ts";
import type { DateLabelProps } from "../../../types/shared/DateLabel.types.ts";
import { useTimeFormat } from "../../../contexts/TimeFormatContext.tsx";
import { CardMetadataLabel } from "./CardMetadataLabel.tsx";

function getDateRange(
    startDateTime: string | null | undefined,
    endDateTime: string | null | undefined,
    is12HourFormat: boolean,
) {
    if (!startDateTime && !endDateTime) {
        return "Date to be announced";
    }

    let formattedStartDate: string;
    let formattedEndDate: string;
    if (startDateTime) {
        formattedStartDate = formatDate(startDateTime, {
            ...EVENT_DATE_FORMAT,
            is12HourFormat,
        });
    } else {
        formattedStartDate = "Not set";
    }

    if (endDateTime) {
        formattedEndDate = formatDate(endDateTime, {
            ...EVENT_DATE_FORMAT,
            is12HourFormat,
        });
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
    const { timeFormat } = useTimeFormat();
    const isDateRange =
        startDateTime !== undefined || endDateTime !== undefined;

    if (!isDateRange) {
        return (
            <CardMetadataLabel
                label={label}
                value={dateTime ? formatBookingDate(dateTime) : "Not set"}
            />
        );
    }

    return (
        <CardMetadataLabel
            label={label}
            value={getDateRange(
                startDateTime,
                endDateTime,
                timeFormat === "12h",
            )}
        />
    );
}
