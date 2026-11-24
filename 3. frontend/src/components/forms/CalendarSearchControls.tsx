import { useState } from "react";
import CompactTimePicker from "./CompactTimePicker.tsx";
import type {
    CalendarDateRange,
    CalendarTimeSelection,
    ExplicitSelection,
    TimeOfDay,
} from "../../types/search/NaturalLanguageSearch.types.ts";
import "../../styles/search/calendar-search-controls.css";
import { getTimeOfDayOptions } from "../../helpers/search/TimeOfDayOptions.ts";
import DateCalendar, {
    getCurrentMonth,
    getMonthForDate,
    shiftMonth,
} from "./DateCalendar.tsx";


type TimeFormat = "12h" | "24h";

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
    onApplyFilters: () => void;
}

export default function CalendarSearchControls({
   dateSelection,
   timeSelection,
   disabled,
   onDateSelectionChange,
   onTimeSelectionChange,
   onApplyFilters,
}: CalendarSearchControlsProps) {
    const [timeFormat, setTimeFormat] = useState<TimeFormat>("12h");

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
        <details className="calendar-search-disclosure">
            <summary>
                <span>Date &amp; time filters</span>
                <span className="calendar-search-disclosure__status">
                    {hasDateFilter || hasTimeFilter ? "Filters active" : "No filters applied"}
                </span>
            </summary>

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

                <div className="calendar-date-calendars">
                    <DateCalendar
                        label="After"
                        initialMonth={getMonthForDate(
                            selectedDate?.startDate,
                            getCurrentMonth(),
                        )}
                        value={selectedDate?.startDate}
                        maxDate={selectedDate?.endDate}
                        disabled={disabled}
                        onChange={(date) =>
                            updateDateRange(
                                date,
                                selectedDate?.endDate ?? "",
                            )
                        }
                    />

                    <DateCalendar
                        label="Before"
                        initialMonth={getMonthForDate(
                            selectedDate?.endDate,
                            shiftMonth(getCurrentMonth(), 1),
                        )}
                        value={selectedDate?.endDate}
                        minDate={selectedDate?.startDate}
                        disabled={disabled}
                        onChange={(date) =>
                            updateDateRange(
                                selectedDate?.startDate ?? "",
                                date,
                            )
                        }
                    />
                </div>

                <div className="calendar-search-fields calendar-date-fields calendar-date-fields--native">
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

            <div className="calendar-search-section calendar-search-section--time">
                <div className="calendar-search-section-heading">
                    <div className="calendar-time-heading">
                        <h3>Time</h3>

                        <div
                            className="calendar-time-format"
                            role="group"
                            aria-label="Time format"
                        >
                            <button
                                type="button"
                                aria-pressed={timeFormat === "12h"}
                                disabled={disabled}
                                onClick={() => setTimeFormat("12h")}
                            >
                                12h
                            </button>

                            <button
                                type="button"
                                aria-pressed={timeFormat === "24h"}
                                disabled={disabled}
                                onClick={() => setTimeFormat("24h")}
                            >
                                24h
                            </button>
                        </div>
                    </div>

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
                        {getTimeOfDayOptions(timeFormat).map((option) => {
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
                    <CompactTimePicker
                        label="After"
                        value={selectedTime?.timeRange?.startTime}
                        format={timeFormat}
                        disabled={disabled}
                        onChange={(value) =>
                            updateTimeBound("startTime", value)
                        }
                    />

                    <CompactTimePicker
                        label="Before"
                        value={selectedTime?.timeRange?.endTime}
                        format={timeFormat}
                        disabled={disabled}
                        onChange={(value) =>
                            updateTimeBound("endTime", value)
                        }
                    />
                </div>
            </div>

            <div className="calendar-search-actions">
                <button
                    type="button"
                    className="calendar-search-apply"
                    disabled={disabled || (!hasDateFilter && !hasTimeFilter)}
                    onClick={onApplyFilters}
                >
                    Apply filters
                </button>
            </div>
            </section>
        </details>
    );
}
