import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DateLabel } from "../../../../3. frontend/src/components/ui/labels/DateLabel";
import {
    formatBookingDate,
    formatDate,
} from "../../../../3. frontend/src/helpers/shared/DatesHelpers";

const DATE_FORMAT = {
    dateStyle: "medium",
    timeStyle: "short",
} as const;

const startDate = "2026-11-10T14:30:00Z";
const endDate = "2026-11-10T16:30:00Z";

describe("DateLabel", () => {
    it("shows a message when both range dates are missing", () => {
        render(
            <DateLabel
                label="Date & Time"
                startDateTime={null}
                endDateTime={null}
            />
        );

        expect(screen.getByText("Date & Time")).toBeInTheDocument();
        expect(screen.getByText("Date to be announced")).toBeInTheDocument();
    });

    it("shows Not set when the start date is missing", () => {
        render(
            <DateLabel
                label="Date & Time"
                startDateTime={null}
                endDateTime={endDate}
            />
        );

        expect(
            screen.getByText(`Not set – ${formatDate(endDate, DATE_FORMAT)}`)
        ).toBeInTheDocument();
    });

    it("shows Not set when the end date is missing", () => {
        render(
            <DateLabel
                label="Date & Time"
                startDateTime={startDate}
                endDateTime={null}
            />
        );

        expect(
            screen.getByText(`${formatDate(startDate, DATE_FORMAT)} – Not set`)
        ).toBeInTheDocument();
    });

    it("formats both dates when the range is available", () => {
        render(
            <DateLabel
                label="Date & Time"
                startDateTime={startDate}
                endDateTime={endDate}
            />
        );

        expect(
            screen.getByText(
                `${formatDate(startDate, DATE_FORMAT)} – ${formatDate(endDate, DATE_FORMAT)}`
            )
        ).toBeInTheDocument();
    });

    it("shows Not set when a single date is missing", () => {
        render(<DateLabel label="Booked at" dateTime={null} />);

        expect(screen.getByText("Booked at: Not set")).toBeInTheDocument();
    });

    it("formats a single date using the booking date format", () => {
        render(<DateLabel label="Booked at" dateTime={startDate} />);

        expect(
            screen.getByText(`Booked at: ${formatBookingDate(startDate)}`)
        ).toBeInTheDocument();
    });
});
