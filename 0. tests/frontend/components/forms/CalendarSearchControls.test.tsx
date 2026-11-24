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
    const onApplyFilters = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    function renderControls({
        dateSelection,
        timeSelection,
        disabled = false,
        open = true,
    }: {
        dateSelection?: ExplicitSelection<CalendarDateRange>;
        timeSelection?: ExplicitSelection<CalendarTimeSelection>;
        disabled?: boolean;
        open?: boolean;
    } = {}) {
        const result = render(
            <CalendarSearchControls
                dateSelection={dateSelection}
                timeSelection={timeSelection}
                disabled={disabled}
                onDateSelectionChange={onDateSelectionChange}
                onTimeSelectionChange={onTimeSelectionChange}
                onApplyFilters={onApplyFilters}
            />,
        );

        if (open) {
            fireEvent.click(screen.getByText("Date & time filters"));
        }

        return result;
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

    it("starts with date and time filters collapsed and allows them to expand", () => {
        renderControls({ open: false });

        const summary = screen.getByText("Date & time filters");
        const disclosure = summary.closest("details");

        expect(disclosure).not.toHaveAttribute("open");
        expect(screen.getByLabelText("After hour")).toBeInTheDocument();

        fireEvent.click(summary);

        expect(disclosure).toHaveAttribute("open");
        expect(screen.getByLabelText("After hour")).toBeInTheDocument();
    });

    it("preserves the time format preference when filters are collapsed and reopened", () => {
        renderControls();

        const summary = screen.getByText("Date & time filters");
        const disclosure = summary.closest("details");

        fireEvent.click(screen.getByRole("button", { name: "24h" }));
        expect(screen.getByRole("button", { name: "24h" }))
            .toHaveAttribute("aria-pressed", "true");

        fireEvent.click(summary);
        expect(disclosure).not.toHaveAttribute("open");

        fireEvent.click(summary);
        expect(disclosure).toHaveAttribute("open");

        expect(screen.getByRole("button", { name: "24h" }))
            .toHaveAttribute("aria-pressed", "true");
        expect(screen.getByLabelText("After hour")).toHaveValue("00");
    });

    it("preserves selected time-of-day filters when collapsed and reopened", () => {
        renderControls({
            timeSelection: {
                state: "selected",
                value: {
                    timeOfDay: ["MORNING"],
                },
            },
        });

        const summary = screen.getByText("Date & time filters");

        fireEvent.click(summary);
        fireEvent.click(summary);

        expect(
            screen.getByRole("button", {
                name: "Morning (8 AM–12 PM)",
            }),
        ).toHaveAttribute("aria-pressed", "true");
    });

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

    it("clamps an entered 12-hour value to the upper hour boundary", () => {
        renderControls();

        const hour = screen.getByLabelText("After hour");
        fireEvent.change(hour, { target: { value: "13" } });
        fireEvent.blur(hour);

        expect(hour).toHaveValue("12");
        expect(onTimeSelectionChange).toHaveBeenLastCalledWith({
            state: "selected",
            value: { timeRange: { startTime: "00:00" } },
        });
    });

    it("clamps an entered 12-hour value to the lower hour boundary", () => {
        renderControls();

        const hour = screen.getByLabelText("After hour");
        fireEvent.change(hour, { target: { value: "0" } });
        fireEvent.blur(hour);

        expect(hour).toHaveValue("01");
        expect(onTimeSelectionChange).toHaveBeenLastCalledWith({
            state: "selected",
            value: { timeRange: { startTime: "01:00" } },
        });
    });

    it("clamps an entered minute value to the upper boundary", () => {
        renderControls();

        const minute = screen.getByLabelText("After minute");
        fireEvent.change(minute, { target: { value: "99" } });
        fireEvent.blur(minute);

        expect(minute).toHaveValue("59");
        expect(onTimeSelectionChange).toHaveBeenLastCalledWith({
            state: "selected",
            value: { timeRange: { startTime: "00:59" } },
        });
    });

    it("clamps an empty minute input to the lower boundary", () => {
        renderControls();

        const minute = screen.getByLabelText("After minute");
        fireEvent.change(minute, { target: { value: "" } });
        fireEvent.blur(minute);

        expect(minute).toHaveValue("00");
        expect(onTimeSelectionChange).toHaveBeenLastCalledWith({
            state: "selected",
            value: { timeRange: { startTime: "00:00" } },
        });
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

    it("renders both desktop date calendars and retains the native date inputs", () => {
        renderControls();

        expect(
            screen.getByRole("group", { name: "After date calendar" }),
        ).toBeInTheDocument();

        expect(
            screen.getByRole("group", { name: "Before date calendar" }),
        ).toBeInTheDocument();

        expect(screen.getByLabelText("From")).toHaveAttribute("type", "date");
        expect(screen.getByLabelText("To")).toHaveAttribute("type", "date");
    });

    it("updates the existing date range when a date is selected in the After calendar", () => {
        renderControls();

        const dateButton = screen.getAllByRole("button", {
            name: /^Select After date /,
        }).find((button) => !button.hasAttribute("disabled"));

        expect(dateButton).toBeDefined();

        fireEvent.click(dateButton!);

        const lastCall = onDateSelectionChange.mock.calls.at(-1)?.[0];

        expect(lastCall).toEqual({
            state: "selected",
            value: {
                startDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
                endDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
            },
        });

        expect(lastCall.value.startDate).toBe(lastCall.value.endDate);
    });

    it("prevents selecting a Before date earlier than the selected After date", () => {
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
            screen.getByRole("button", {
                name: "Select Before date November 9, 2026",
            }),
        ).toBeDisabled();

        expect(
            screen.getByRole("button", {
                name: "Select Before date November 10, 2026",
            }),
        ).toBeEnabled();
    });

    it("allows navigating the After calendar between months", () => {
        renderControls();

        const monthHeading = screen.getByRole("heading", {
            name: "After calendar month",
        });
        const initialMonth = monthHeading.textContent;

        fireEvent.click(
            screen.getByRole("button", {
                name: "Next month for After date",
            }),
        );

        expect(monthHeading.textContent).not.toBe(initialMonth);
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

    it("updates time-of-day labels when switching between 12-hour and 24-hour formats", () => {
        renderControls();

        // Default 12-hour labels.
        expect(
            screen.getByRole("button", {
                name: "Early morning (5 AM–8 AM)",
            }),
        ).toBeInTheDocument();

        // Switch to 24-hour labels.
        fireEvent.click(screen.getByRole("button", { name: "24h" }));

        const twentyFourHourLabels = [
            "Early morning (05:00–08:00)",
            "Morning (08:00–12:00)",
            "Afternoon (12:00–17:00)",
            "Evening (17:00–21:00)",
            "Night (21:00–05:00)",
        ];

        for (const label of twentyFourHourLabels) {
            expect(
                screen.getByRole("button", { name: label }),
            ).toBeInTheDocument();
        }

        expect(
            screen.queryByRole("button", {
                name: "Early morning (5 AM–8 AM)",
            }),
        ).not.toBeInTheDocument();

        // Switch back to 12-hour labels.
        fireEvent.click(screen.getByRole("button", { name: "12h" }));

        expect(
            screen.getByRole("button", {
                name: "Early morning (5 AM–8 AM)",
            }),
        ).toBeInTheDocument();

        expect(
            screen.queryByRole("button", {
                name: "Early morning (05:00–08:00)",
            }),
        ).not.toBeInTheDocument();
    });

    it("preserves selected time-of-day periods when switching display formats", () => {
        renderControls({
            timeSelection: {
                state: "selected",
                value: {
                    timeOfDay: ["MORNING", "EVENING"],
                },
            },
        });

        fireEvent.click(screen.getByRole("button", { name: "24h" }));

        expect(
            screen.getByRole("button", {
                name: "Morning (08:00–12:00)",
            }),
        ).toHaveAttribute("aria-pressed", "true");

        expect(
            screen.getByRole("button", {
                name: "Evening (17:00–21:00)",
            }),
        ).toHaveAttribute("aria-pressed", "true");

        expect(
            screen.getByRole("button", {
                name: "Afternoon (12:00–17:00)",
            }),
        ).toHaveAttribute("aria-pressed", "false");

        // Display-format changes must not update the underlying selection.
        expect(onTimeSelectionChange).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole("button", { name: "12h" }));

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

        expect(onTimeSelectionChange).not.toHaveBeenCalled();
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

    it("allows midnight and clamps entered hours to 00–23 in 24-hour mode", () => {
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

        const hour = screen.getByLabelText("After hour");
        expect(hour).toHaveValue("00");

        fireEvent.change(hour, { target: { value: "24" } });
        fireEvent.blur(hour);

        expect(hour).toHaveValue("23");
        expect(onTimeSelectionChange).toHaveBeenLastCalledWith({
            state: "selected",
            value: {
                timeRange: {
                    startTime: "23:00",
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
