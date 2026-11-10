import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CalendarSearchControls from "../../../../3. frontend/src/components/forms/CalendarSearchControls";
import type {
    CalendarDateRange,
    CalendarTimeSelection,
    ExplicitSelection,
} from "../../../../3. frontend/src/types/search/NaturalLanguageSearch.types";

describe("CalendarSearchControls", () => {
    const onDateSelectionChange = vi.fn();
    const onTimeSelectionChange = vi.fn();

    function renderControls({
        dateSelection,
        timeSelection,
        disabled = false,
    }: {
        dateSelection?: ExplicitSelection<CalendarDateRange>;
        timeSelection?: ExplicitSelection<CalendarTimeSelection>;
        disabled?: boolean;
    } = {}) {
        return render(
            <CalendarSearchControls
                dateSelection={dateSelection}
                timeSelection={timeSelection}
                disabled={disabled}
                onDateSelectionChange={onDateSelectionChange}
                onTimeSelectionChange={onTimeSelectionChange}
            />,
        );
    }

    it("renders all five time-of-day choices", () => {
        renderControls();

        const group = screen.getByRole("group", {
            name: "Time of day",
        });

        expect(
            within(group).getByLabelText(
                "Early morning (5 AM–8 AM)",
            ),
        ).toBeInTheDocument();

        expect(
            within(group).getByLabelText(
                "Morning (8 AM–12 PM)",
            ),
        ).toBeInTheDocument();

        expect(
            within(group).getByLabelText(
                "Afternoon (12 PM–5 PM)",
            ),
        ).toBeInTheDocument();

        expect(
            within(group).getByLabelText(
                "Evening (5 PM–9 PM)",
            ),
        ).toBeInTheDocument();

        expect(
            within(group).getByLabelText(
                "Night (9 PM–5 AM)",
            ),
        ).toBeInTheDocument();
    });

    it("allows multiple time-of-day periods to be selected", () => {
        const { rerender } = renderControls();

        fireEvent.click(
            screen.getByLabelText("Morning (8 AM–12 PM)"),
        );

        expect(onTimeSelectionChange).toHaveBeenLastCalledWith({
            state: "selected",
            value: {
                timeOfDay: ["MORNING"],
            },
        });

        // Simulate the parent applying the first selection and rerendering.
        rerender(
            <CalendarSearchControls
                dateSelection={undefined}
                timeSelection={{
                    state: "selected",
                    value: {
                        timeOfDay: ["MORNING"],
                    },
                }}
                disabled={false}
                onDateSelectionChange={onDateSelectionChange}
                onTimeSelectionChange={onTimeSelectionChange}
            />,
        );

        fireEvent.click(
            screen.getByLabelText("Evening (5 PM–9 PM)"),
        );

        expect(onTimeSelectionChange).toHaveBeenLastCalledWith({
            state: "selected",
            value: {
                timeOfDay: ["MORNING", "EVENING"],
            },
        });
    });

    it("removes an individual time-of-day period without removing the others", () => {
        renderControls({
            timeSelection: {
                state: "selected",
                value: {
                    timeOfDay: ["MORNING", "EVENING"],
                },
            },
        });

        fireEvent.click(
            screen.getByLabelText("Morning (8 AM–12 PM)"),
        );

        expect(onTimeSelectionChange).toHaveBeenLastCalledWith({
            state: "selected",
            value: {
                timeOfDay: ["EVENING"],
            },
        });
    });

    it("converts an After selection from 12-hour input to 24-hour API format", () => {
        renderControls();

        fireEvent.change(screen.getByLabelText("After hour"), {
            target: { value: "6" },
        });

        fireEvent.change(screen.getByLabelText("After minute"), {
            target: { value: "30" },
        });

        fireEvent.change(screen.getByLabelText("After AM/PM"), {
            target: { value: "PM" },
        });

        expect(onTimeSelectionChange).toHaveBeenLastCalledWith({
            state: "selected",
            value: {
                timeRange: {
                    startTime: "18:30",
                },
            },
        });
    });

    it("converts midnight correctly for the Before selection", () => {
        renderControls();

        fireEvent.change(screen.getByLabelText("Before hour"), {
            target: { value: "12" },
        });

        fireEvent.change(screen.getByLabelText("Before minute"), {
            target: { value: "15" },
        });

        fireEvent.change(screen.getByLabelText("Before AM/PM"), {
            target: { value: "AM" },
        });

        expect(onTimeSelectionChange).toHaveBeenLastCalledWith({
            state: "selected",
            value: {
                timeRange: {
                    endTime: "00:15",
                },
            },
        });
    });

    it("converts noon correctly", () => {
        renderControls();

        fireEvent.change(screen.getByLabelText("After hour"), {
            target: { value: "12" },
        });

        fireEvent.change(screen.getByLabelText("After minute"), {
            target: { value: "00" },
        });

        fireEvent.change(screen.getByLabelText("After AM/PM"), {
            target: { value: "PM" },
        });

        expect(onTimeSelectionChange).toHaveBeenLastCalledWith({
            state: "selected",
            value: {
                timeRange: {
                    startTime: "12:00",
                },
            },
        });
    });

    it("provides bounded hour and minute choices", () => {
        renderControls();

        const hourOptions = within(
            screen.getByLabelText("After hour"),
        ).getAllByRole("option");

        const minuteOptions = within(
            screen.getByLabelText("After minute"),
        ).getAllByRole("option");

        expect(hourOptions).toHaveLength(13);
        expect(minuteOptions).toHaveLength(61);

        expect(hourOptions[1]).toHaveValue("1");
        expect(hourOptions[12]).toHaveValue("12");

        expect(minuteOptions[1]).toHaveValue("00");
        expect(minuteOptions[60]).toHaveValue("59");
    });

    it("preserves an existing time-of-day selection when updating a clock bound", () => {
        renderControls({
            timeSelection: {
                state: "selected",
                value: {
                    timeOfDay: ["MORNING", "EVENING"],
                },
            },
        });

        fireEvent.change(screen.getByLabelText("After hour"), {
            target: { value: "8" },
        });

        fireEvent.change(screen.getByLabelText("After minute"), {
            target: { value: "00" },
        });

        fireEvent.change(screen.getByLabelText("After AM/PM"), {
            target: { value: "AM" },
        });

        expect(onTimeSelectionChange).toHaveBeenLastCalledWith({
            state: "selected",
            value: {
                timeOfDay: ["MORNING", "EVENING"],
                timeRange: {
                    startTime: "08:00",
                },
            },
        });
    });

    it("clears the complete time selection explicitly", () => {
        renderControls({
            timeSelection: {
                state: "selected",
                value: {
                    timeOfDay: ["MORNING"],
                },
            },
        });

        fireEvent.click(
            screen.getByRole("button", { name: "Clear time" }),
        );

        expect(onTimeSelectionChange).toHaveBeenCalledWith({
            state: "cleared",
        });
    });

    it("disables all time controls while disabled", () => {
        renderControls({ disabled: true });

        expect(
            screen.getByLabelText("Morning (8 AM–12 PM)"),
        ).toBeDisabled();

        expect(screen.getByLabelText("After hour")).toBeDisabled();
        expect(screen.getByLabelText("After minute")).toBeDisabled();
        expect(screen.getByLabelText("After AM/PM")).toBeDisabled();
        expect(screen.getByRole("button", { name: "Clear time" }))
            .toBeDisabled();
    });
});
