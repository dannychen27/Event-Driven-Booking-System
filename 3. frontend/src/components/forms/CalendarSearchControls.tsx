import type {
    CalendarDateRange,
    CalendarTimeSelection,
    ExplicitSelection,
    TimeOfDay,
} from "../../types/search/NaturalLanguageSearch.types.ts";
import "../../styles/search/calendar-search-controls.css";

interface CalendarSearchControlsProps {
    dateSelection: ExplicitSelection<CalendarDateRange> | undefined;
    timeSelection: ExplicitSelection<CalendarTimeSelection> | undefined;
    disabled: boolean;
    onDateSelectionChange: (
        selection: ExplicitSelection<CalendarDateRange> | undefined,
    ) => void;
    onTimeSelectionChange: (
        selection: ExplicitSelection<CalendarTimeSelection> | undefined,
    ) => void;
}

const TIME_OF_DAY_OPTIONS: { value: TimeOfDay; label: string }[] = [
    { value: "EARLY_MORNING", label: "Early morning (5 AM–8 AM)" },
    { value: "MORNING", label: "Morning (8 AM–12 PM)" },
    { value: "AFTERNOON", label: "Afternoon (12 PM–5 PM)" },
    { value: "EVENING", label: "Evening (5 PM–9 PM)" },
    { value: "NIGHT", label: "Night (9 PM–5 AM)" },
];

interface TimePickerProps {
    label: "After" | "Before";
    value?: string;
    disabled: boolean;
    onChange: (value: string | undefined) => void;
}

function TimePicker({
    label,
    value,
    disabled,
    onChange,
}: TimePickerProps) {
    function clearTime() {
        onChange(undefined);
    }

    return (
        <div className="calendar-time-picker">
            <div className="calendar-time-picker-heading">
                <span className="calendar-time-picker-label">
                    {label}
                </span>

                <button
                    type="button"
                    className="calendar-time-clear"
                    disabled={disabled || !value}
                    onClick={clearTime}
                    aria-label={`Clear ${label} time`}
                >
                    Clear
                </button>
            </div>

            <div className="calendar-time-picker-fields">
                <label>
                    <span className="visually-hidden">
                        {label} time
                    </span>
                    <input
                        type="time"
                        aria-label={`${label} time`}
                        value={value ?? ""}
                        disabled={disabled}
                        step={60}
                        onChange={(event) =>
                            onChange(event.target.value || undefined)
                        }
                    />
                </label>
            </div>
        </div>
    );
}

export default function CalendarSearchControls({
   dateSelection,
   timeSelection,
   disabled,
   onDateSelectionChange,
   onTimeSelectionChange,
}: CalendarSearchControlsProps) {
    const selectedDate =
        dateSelection?.state === "selected"
            ? dateSelection.value
            : undefined;

    const selectedTime =
        timeSelection?.state === "selected"
            ? timeSelection.value
            : undefined;

    const hasDateFilter = Boolean(
        selectedDate?.startDate || selectedDate?.endDate,
    );

    const hasTimeFilter = Boolean(
        selectedTime?.timeOfDay?.length ||
        selectedTime?.timeRange?.startTime ||
        selectedTime?.timeRange?.endTime,
    );

    function updateDateRange(startDate: string, endDate: string) {
        if (!startDate && !endDate) {
            onDateSelectionChange(undefined);
            return;
        }

        const effectiveStart = startDate || endDate;
        const effectiveEnd = endDate || effectiveStart;

        if (effectiveEnd < effectiveStart) {
            onDateSelectionChange({
                state: "selected",
                value: {
                    startDate: effectiveStart,
                    endDate: effectiveStart,
                },
            });
            return;
        }

        onDateSelectionChange({
            state: "selected",
            value: {
                startDate: effectiveStart,
                endDate: effectiveEnd,
            },
        });
    }

    function updateTimeSelection(
        updates: Partial<CalendarTimeSelection>,
    ) {
        const nextSelection: CalendarTimeSelection = {
            ...selectedTime,
            ...updates,
        };

        if ("timeRange" in updates) {
            const range = updates.timeRange;

            nextSelection.timeRange =
                range?.startTime || range?.endTime
                    ? range
                    : undefined;
        }

        if (
            (!nextSelection.timeOfDay ||
                nextSelection.timeOfDay.length === 0) &&
            !nextSelection.timeRange?.startTime &&
            !nextSelection.timeRange?.endTime
        ) {
            onTimeSelectionChange(undefined);
            return;
        }

        onTimeSelectionChange({
            state: "selected",
            value: nextSelection,
        });
    }

    function updateTimeBound(
        bound: "startTime" | "endTime",
        value: string | undefined,
    ) {
        const nextRange = {
            ...selectedTime?.timeRange,
            [bound]: value,
        };

        updateTimeSelection({
            timeRange: nextRange,
        });
    }

    function toggleTimeOfDay(
        timeOfDay: TimeOfDay,
        checked: boolean,
    ) {
        const current = selectedTime?.timeOfDay ?? [];

        const next = checked
            ? [...current, timeOfDay]
            : current.filter((value) => value !== timeOfDay);

        updateTimeSelection({
            timeOfDay: next.length > 0 ? next : undefined,
        });
    }

    return (
        <section
            className="calendar-search-controls"
            aria-label="Date and time filters"
        >
            <div className="calendar-search-section">
                <div className="calendar-search-section-heading">
                    <h3>Date</h3>
                    <button
                        type="button"
                        className="calendar-search-clear"
                        disabled={disabled || !hasDateFilter}
                        onClick={() =>
                            onDateSelectionChange({ state: "cleared" })
                        }
                    >
                        Clear date
                    </button>
                </div>

                <div className="calendar-search-fields">
                    <div>
                        <label htmlFor="search-start-date">From</label>
                        <input
                            id="search-start-date"
                            type="date"
                            value={selectedDate?.startDate ?? ""}
                            disabled={disabled}
                            max={selectedDate?.endDate}
                            onChange={(event) =>
                                updateDateRange(
                                    event.target.value,
                                    selectedDate?.endDate ?? "",
                                )
                            }
                        />
                    </div>

                    <div>
                        <label htmlFor="search-end-date">To</label>
                        <input
                            id="search-end-date"
                            type="date"
                            value={selectedDate?.endDate ?? ""}
                            disabled={disabled}
                            min={selectedDate?.startDate}
                            onChange={(event) =>
                                updateDateRange(
                                    selectedDate?.startDate ?? "",
                                    event.target.value,
                                )
                            }
                        />
                    </div>
                </div>
            </div>

            <div className="calendar-search-section">
                <div className="calendar-search-section-heading">
                    <h3>Time</h3>
                    <button
                        type="button"
                        className="calendar-search-clear"
                        disabled={disabled || !hasTimeFilter}
                        onClick={() =>
                            onTimeSelectionChange({ state: "cleared" })
                        }
                    >
                        Clear time
                    </button>
                </div>

                <div
                    className="calendar-time-of-day"
                    role="group"
                    aria-label="Time of day"
                >
                    <span className="calendar-time-of-day-legend">
                        Time of day
                    </span>

                    <div className="calendar-time-of-day-options">
                        {TIME_OF_DAY_OPTIONS.map((option) => {
                            const selected =
                                selectedTime?.timeOfDay?.includes(option.value) ??
                                false;

                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    className="calendar-time-of-day-option"
                                    aria-pressed={selected}
                                    disabled={disabled}
                                    onClick={() =>
                                        toggleTimeOfDay(option.value, !selected)
                                    }
                                >
                                    {option.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="calendar-time-range">
                    <TimePicker
                        label="After"
                        value={selectedTime?.timeRange?.startTime}
                        disabled={disabled}
                        onChange={(value) =>
                            updateTimeBound("startTime", value)
                        }
                    />

                    <TimePicker
                        label="Before"
                        value={selectedTime?.timeRange?.endTime}
                        disabled={disabled}
                        onChange={(value) =>
                            updateTimeBound("endTime", value)
                        }
                    />
                </div>
            </div>
        </section>
    );
}
