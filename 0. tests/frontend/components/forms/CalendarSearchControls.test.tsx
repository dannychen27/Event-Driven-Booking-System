import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CalendarSearchControls from "../../../../3. frontend/src/components/forms/CalendarSearchControls";
import type {
    CalendarDateRange,
    CalendarTimeSelection,
    ExplicitSelection,
} from "../../../../3. frontend/src/types/search/NaturalLanguageSearch.types";

describe("CalendarSearchControls", () => {
    const onDateSelectionChange = vi.fn();
    const onTimeSelectionChange = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

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

    function getPeriodButton(
        bound: "After" | "Before",
        period: "AM" | "PM",
    ) {
        return within(
            screen.getByRole("group", {
                name: `${bound} AM or PM`,
            }),
        ).getByRole("button", { name: period });
    }

    it("renders all five time-of-day choices as pill buttons", () => {
        renderControls();

        const group = screen.getByRole("group", {
            name: "Time of day",
        });

        const options = [
            "Early morning (5 AM–8 AM)",
            "Morning (8 AM–12 PM)",
            "Afternoon (12 PM–5 PM)",
            "Evening (5 PM–9 PM)",
            "Night (9 PM–5 AM)",
        ];

        for (const option of options) {
            expect(
                within(group).getByRole("button", { name: option }),
            ).toBeInTheDocument();
        }

        expect(within(group).getAllByRole("button")).toHaveLength(5);
    });

    it("exposes selected and unselected periods through aria-pressed", () => {
        renderControls({
            timeSelection: {
                state: "selected",
                value: {
                    timeOfDay: ["MORNING", "EVENING"],
                },
            },
        });

        expect(
            screen.getByRole("button", {
                name: "Morning (8 AM–12 PM)",
            }),
        ).toHaveAttribute("aria-pressed", "true");

        expect(
            screen.getByRole("button", {
                name: "Evening (5 PM–9 PM)",
            }),
        ).toHaveAttribute("aria-pressed", "true");

        expect(
            screen.getByRole("button", {
                name: "Afternoon (12 PM–5 PM)",
            }),
        ).toHaveAttribute("aria-pressed", "false");
    });

    it("allows multiple time-of-day periods to be selected", () => {
        const { rerender } = renderControls();

        fireEvent.click(
            screen.getByRole("button", {
                name: "Morning (8 AM–12 PM)",
            }),
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
            screen.getByRole("button", {
                name: "Evening (5 PM–9 PM)",
            }),
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
            screen.getByRole("button", {
                name: "Morning (8 AM–12 PM)",
            }),
        );

        expect(onTimeSelectionChange).toHaveBeenLastCalledWith({
            state: "selected",
            value: {
                timeOfDay: ["EVENING"],
            },
        });
    });

    it("stores an After time in 24-hour HH:mm format", () => {
        renderControls();

        fireEvent.change(screen.getByLabelText("After hour"), {
            target: { value: "6" },
        });

        fireEvent.change(screen.getByLabelText("After minute"), {
            target: { value: "30" },
        });

        fireEvent.click(getPeriodButton("After", "PM"));

        fireEvent.blur(screen.getByLabelText("After minute"));

        expect(onTimeSelectionChange).toHaveBeenLastCalledWith({
            state: "selected",
            value: {
                timeRange: {
                    startTime: "18:30",
                },
            },
        });
    });

    it("stores a Before midnight time correctly", () => {
        renderControls();

        fireEvent.change(screen.getByLabelText("Before hour"), {
            target: { value: "12" },
        });

        fireEvent.change(screen.getByLabelText("Before minute"), {
            target: { value: "15" },
        });

        fireEvent.click(getPeriodButton("Before", "AM"));

        fireEvent.blur(screen.getByLabelText("Before minute"));

        expect(onTimeSelectionChange).toHaveBeenLastCalledWith({
            state: "selected",
            value: {
                timeRange: {
                    endTime: "00:15",
                },
            },
        });
    });

    it("stores noon correctly", () => {
        renderControls();

        fireEvent.change(screen.getByLabelText("After hour"), {
            target: { value: "12" },
        });

        fireEvent.change(screen.getByLabelText("After minute"), {
            target: { value: "00" },
        });

        fireEvent.click(getPeriodButton("After", "PM"));

        fireEvent.blur(screen.getByLabelText("After minute"));

        expect(onTimeSelectionChange).toHaveBeenLastCalledWith({
            state: "selected",
            value: {
                timeRange: {
                    startTime: "12:00",
                },
            },
        });
    });

    it("renders existing time bounds in the 12-hour time inputs", () => {
        renderControls({
            timeSelection: {
                state: "selected",
                value: {
                    timeRange: {
                        startTime: "18:30",
                        endTime: "22:15",
                    },
                },
            },
        });

        expect(screen.getByLabelText("After hour")).toHaveValue("06");
        expect(screen.getByLabelText("After minute")).toHaveValue("30");

        expect(getPeriodButton("After", "PM")).toHaveAttribute(
            "aria-pressed",
            "true",
        );

        expect(screen.getByLabelText("Before hour")).toHaveValue("10");
        expect(screen.getByLabelText("Before minute")).toHaveValue("15");

        expect(getPeriodButton("Before", "PM")).toHaveAttribute(
            "aria-pressed",
            "true",
        );
    });

    it("does not increment the hour beyond 12", () => {
        renderControls({
            timeSelection: {
                state: "selected",
                value: {
                    timeRange: { startTime: "12:00" },
                },
            },
        });

        expect(
            screen.getByRole("button", { name: "Increase After hour" }),
        ).toBeDisabled();

        expect(screen.getByLabelText("After hour")).toHaveValue("12");
    });

    it("does not decrement the hour below 1", () => {
        renderControls({
            timeSelection: {
                state: "selected",
                value: {
                    timeRange: { startTime: "01:00" },
                },
            },
        });

        expect(
            screen.getByRole("button", { name: "Decrease After hour" }),
        ).toBeDisabled();
    });

    it("does not increment minutes beyond 59", () => {
        renderControls({
            timeSelection: {
                state: "selected",
                value: {
                    timeRange: { startTime: "18:59" },
                },
            },
        });

        expect(
            screen.getByRole("button", { name: "Increase After minute" }),
        ).toBeDisabled();
    });

    it("does not decrement minutes below 00", () => {
        renderControls({
            timeSelection: {
                state: "selected",
                value: {
                    timeRange: { startTime: "18:00" },
                },
            },
        });

        expect(
            screen.getByRole("button", { name: "Decrease After minute" }),
        ).toBeDisabled();
    });

    it("converts midnight to 00:00", () => {
        renderControls();

        fireEvent.click(getPeriodButton("After", "AM"));

        expect(onTimeSelectionChange).toHaveBeenLastCalledWith({
            state: "selected",
            value: {
                timeRange: { startTime: "00:00" },
            },
        });
    });

    it("converts noon to 12:00", () => {
        renderControls();

        fireEvent.click(getPeriodButton("After", "PM"));

        expect(onTimeSelectionChange).toHaveBeenLastCalledWith({
            state: "selected",
            value: {
                timeRange: { startTime: "12:00" },
            },
        });
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
            target: { value: "08" },
        });

        fireEvent.change(screen.getByLabelText("After minute"), {
            target: { value: "00" },
        });

        fireEvent.blur(screen.getByLabelText("After minute"));

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

    it("preserves the opposite clock bound when updating one bound", () => {
        renderControls({
            timeSelection: {
                state: "selected",
                value: {
                    timeRange: {
                        startTime: "18:30",
                        endTime: "22:15",
                    },
                },
            },
        });

        fireEvent.change(screen.getByLabelText("After hour"), {
            target: { value: "07" },
        });

        fireEvent.change(screen.getByLabelText("After minute"), {
            target: { value: "00" },
        });

        fireEvent.click(getPeriodButton("After", "PM"));

        fireEvent.blur(screen.getByLabelText("After minute"));

        expect(onTimeSelectionChange).toHaveBeenLastCalledWith({
            state: "selected",
            value: {
                timeRange: {
                    startTime: "19:00",
                    endTime: "22:15",
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
            screen.getByRole("button", {
                name: "Morning (8 AM–12 PM)",
            }),
        ).toBeDisabled();

        expect(screen.getByLabelText("After hour")).toBeDisabled();
        expect(screen.getByLabelText("After minute")).toBeDisabled();
        expect(screen.getByLabelText("Before hour")).toBeDisabled();
        expect(screen.getByLabelText("Before minute")).toBeDisabled();

        expect(
            screen.getByRole("button", { name: "Clear time" }),
        ).toBeDisabled();
    });

    it("disables Clear date when no date filter is active", () => {
        renderControls();

        expect(
            screen.getByRole("button", { name: "Clear date" }),
        ).toBeDisabled();
    });

    it("enables Clear date when a date range is selected", () => {
        renderControls({
            dateSelection: {
                state: "selected",
                value: {
                    startDate: "2026-11-10",
                    endDate: "2026-11-12",
                },
            },
        });

        expect(
            screen.getByRole("button", { name: "Clear date" }),
        ).toBeEnabled();
    });

    it("disables Clear time when no time filter is active", () => {
        renderControls();

        expect(
            screen.getByRole("button", { name: "Clear time" }),
        ).toBeDisabled();
    });

    it("enables Clear time when time-of-day periods are selected", () => {
        renderControls({
            timeSelection: {
                state: "selected",
                value: {
                    timeOfDay: ["MORNING", "EVENING"],
                },
            },
        });

        expect(
            screen.getByRole("button", { name: "Clear time" }),
        ).toBeEnabled();
    });

    it("enables Clear time when only a clock-time bound is selected", () => {
        renderControls({
            timeSelection: {
                state: "selected",
                value: {
                    timeRange: {
                        startTime: "18:30",
                    },
                },
            },
        });

        expect(
            screen.getByRole("button", { name: "Clear time" }),
        ).toBeEnabled();
    });

    it("keeps Clear buttons disabled after their filters are explicitly cleared", () => {
        renderControls({
            dateSelection: {
                state: "cleared",
            },
            timeSelection: {
                state: "cleared",
            },
        });

        expect(
            screen.getByRole("button", { name: "Clear date" }),
        ).toBeDisabled();

        expect(
            screen.getByRole("button", { name: "Clear time" }),
        ).toBeDisabled();
    });

    it("defaults to 12-hour display format", () => {
        renderControls();

        expect(
            screen.getByRole("button", { name: "12h" }),
        ).toHaveAttribute("aria-pressed", "true");

        expect(
            screen.getByRole("button", { name: "24h" }),
        ).toHaveAttribute("aria-pressed", "false");

        expect(screen.getByLabelText("After hour")).toHaveValue("12");
        expect(getPeriodButton("After", "AM")).toBeInTheDocument();
    });

    it("switches an existing time to 24-hour display without changing its stored value", () => {
        renderControls({
            timeSelection: {
                state: "selected",
                value: {
                    timeRange: {
                        startTime: "18:30",
                        endTime: "00:15",
                    },
                },
            },
        });

        fireEvent.click(screen.getByRole("button", { name: "24h" }));

        expect(screen.getByLabelText("After hour")).toHaveValue("18");
        expect(screen.getByLabelText("After minute")).toHaveValue("30");
        expect(screen.getByLabelText("Before hour")).toHaveValue("00");
        expect(screen.getByLabelText("Before minute")).toHaveValue("15");

        expect(
            screen.queryByRole("group", { name: "After AM or PM" }),
        ).not.toBeInTheDocument();

        expect(
            screen.queryByRole("group", { name: "Before AM or PM" }),
        ).not.toBeInTheDocument();

        expect(onTimeSelectionChange).not.toHaveBeenCalled();
    });

    it("switches back to 12-hour display without changing the stored value", () => {
        renderControls({
            timeSelection: {
                state: "selected",
                value: {
                    timeRange: {
                        startTime: "18:30",
                    },
                },
            },
        });

        fireEvent.click(screen.getByRole("button", { name: "24h" }));
        fireEvent.click(screen.getByRole("button", { name: "12h" }));

        expect(screen.getByLabelText("After hour")).toHaveValue("06");
        expect(screen.getByLabelText("After minute")).toHaveValue("30");

        expect(getPeriodButton("After", "PM")).toHaveAttribute(
            "aria-pressed",
            "true",
        );

        expect(onTimeSelectionChange).not.toHaveBeenCalled();
    });

    it("stores a time entered in 24-hour mode without AM/PM conversion", () => {
        renderControls();

        fireEvent.click(screen.getByRole("button", { name: "24h" }));

        fireEvent.change(screen.getByLabelText("After hour"), {
            target: { value: "18" },
        });

        fireEvent.change(screen.getByLabelText("After minute"), {
            target: { value: "45" },
        });

        fireEvent.blur(screen.getByLabelText("After minute"));

        expect(onTimeSelectionChange).toHaveBeenLastCalledWith({
            state: "selected",
            value: {
                timeRange: {
                    startTime: "18:45",
                },
            },
        });
    });

    it("allows midnight and prevents hours outside 00–23 in 24-hour mode", () => {
        renderControls({
            timeSelection: {
                state: "selected",
                value: {
                    timeRange: {
                        startTime: "00:00",
                    },
                },
            },
        });

        fireEvent.click(screen.getByRole("button", { name: "24h" }));

        expect(screen.getByLabelText("After hour")).toHaveValue("00");

        expect(
            screen.getByRole("button", { name: "Decrease After hour" }),
        ).toBeDisabled();

        fireEvent.click(
            screen.getByRole("button", { name: "Increase After hour" }),
        );

        expect(onTimeSelectionChange).toHaveBeenLastCalledWith({
            state: "selected",
            value: {
                timeRange: {
                    startTime: "01:00",
                },
            },
        });
    });

    it("disables the time format toggle when the controls are disabled", () => {
        renderControls({ disabled: true });

        expect(
            screen.getByRole("button", { name: "12h" }),
        ).toBeDisabled();

        expect(
            screen.getByRole("button", { name: "24h" }),
        ).toBeDisabled();
    });
});
