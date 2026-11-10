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

    it("stores an After time directly in 24-hour HH:mm format", () => {
        renderControls();

        fireEvent.change(screen.getByLabelText("After time"), {
            target: { value: "18:30" },
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

    it("stores a Before midnight time correctly", () => {
        renderControls();

        fireEvent.change(screen.getByLabelText("Before time"), {
            target: { value: "00:15" },
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

    it("stores noon correctly", () => {
        renderControls();

        fireEvent.change(screen.getByLabelText("After time"), {
            target: { value: "12:00" },
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

    it("renders existing time bounds in the native time inputs", () => {
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

        expect(screen.getByLabelText("After time")).toHaveValue("18:30");
        expect(screen.getByLabelText("Before time")).toHaveValue("22:15");
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

        fireEvent.change(screen.getByLabelText("After time"), {
            target: { value: "08:00" },
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

        fireEvent.change(screen.getByLabelText("After time"), {
            target: { value: "19:00" },
        });

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

        expect(screen.getByLabelText("After time")).toBeDisabled();
        expect(screen.getByLabelText("Before time")).toBeDisabled();

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
});
