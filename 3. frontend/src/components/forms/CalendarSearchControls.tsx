import { useEffect, useState } from "react";
import type {
    CalendarDateRange,
    CalendarTimeSelection,
    ExplicitSelection,
    TimeOfDay,
} from "../../types/search/NaturalLanguageSearch.types.ts";
import "../../styles/search/calendar-search-controls.css";
import { getTimeOfDayOptions } from "../../helpers/search/TimeOfDayOptions.ts";


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
}


interface TimePickerProps {
    label: "After" | "Before";
    value?: string;
    format: TimeFormat;
    disabled: boolean;
    onChange: (value: string | undefined) => void;
}

function parseTime(value?: string, format: TimeFormat = "12h") {
    if (!value || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
        return {
            hour: format === "24h" ? "00" : "12",
            minute: "00",
            period: "AM" as const,
        };
    }

    const [hours, minutes] = value.split(":").map(Number);

    return {
        hour: format === "24h"
            ? String(hours).padStart(2, "0")
            : String(hours % 12 || 12).padStart(2, "0"),
        minute: String(minutes).padStart(2, "0"),
        period: (hours >= 12 ? "PM" : "AM") as "AM" | "PM",
    };
}

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

function TimePicker({
    label,
    value,
    format,
    disabled,
    onChange,
}: TimePickerProps) {
    const parsed = parseTime(value, format);

    const [hour, setHour] = useState(parsed.hour);
    const [minute, setMinute] = useState(parsed.minute);
    const [period, setPeriod] = useState(parsed.period);

    const minHour = format === "24h" ? 0 : 1;
    const maxHour = format === "24h" ? 23 : 12;

    useEffect(() => {
        const next = parseTime(value, format);
        setHour(next.hour);
        setMinute(next.minute);
        setPeriod(next.period);
    }, [value, format]);

    function commitTime(
        nextHour: string,
        nextMinute: string,
        nextPeriod: "AM" | "PM",
    ) {
        const normalizedHour = clamp(
            Number.parseInt(nextHour, 10) || 0,
            minHour,
            maxHour,
        );

        const normalizedMinute = clamp(
            Number.parseInt(nextMinute, 10) || 0,
            0,
            59,
        );

        const hour24 = format === "24h"
            ? normalizedHour
            : normalizedHour === 12
                ? nextPeriod === "AM" ? 0 : 12
                : nextPeriod === "PM"
                    ? normalizedHour + 12
                    : normalizedHour;

        const formattedHour = String(normalizedHour).padStart(2, "0");
        const formattedMinute = String(normalizedMinute).padStart(2, "0");

        setHour(formattedHour);
        setMinute(formattedMinute);

        onChange(
            `${String(hour24).padStart(2, "0")}:${formattedMinute}`,
        );
    }

    function changeHour(amount: number) {
        const next = clamp(
            (Number.parseInt(hour, 10) || 0) + amount, minHour, maxHour
        );

        commitTime(String(next), minute, period);
    }

    function changeMinute(amount: number) {
        const next = clamp(
            (Number.parseInt(minute, 10) || 0) + amount, 0, 59,
        );

        commitTime(hour, String(next), period);
    }

    function clearTime() {
        onChange(undefined);
    }

    function preventWheelChange(
        event: React.WheelEvent<HTMLInputElement>,
    ) {
        event.preventDefault();
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

            <div
                className="calendar-time-picker-fields"
                role="group"
                aria-label={`${label} time`}
            >
                <div className="calendar-time-segment">
                    <label htmlFor={`calendar-${label.toLowerCase()}-hour`}>
                        Hour
                    </label>

                    <div className="calendar-time-segment-controls">
                        <button
                            type="button"
                            aria-label={`Increase ${label} hour`}
                            disabled={disabled || Number(hour) >= maxHour}
                            onClick={() => changeHour(1)}
                        >
                            +
                        </button>

                        <input
                            id={`calendar-${label.toLowerCase()}-hour`}
                            aria-label={`${label} hour`}
                            type="text"
                            inputMode="numeric"
                            maxLength={2}
                            value={hour}
                            disabled={disabled}
                            onWheel={preventWheelChange}
                            onChange={(event) =>
                                setHour(event.target.value.replace(/\D/g, ""))
                            }
                            onBlur={() =>
                                commitTime(hour, minute, period)
                            }
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    event.currentTarget.blur();
                                }
                            }}
                        />

                        <button
                            type="button"
                            aria-label={`Decrease ${label} hour`}
                            disabled={disabled || Number(hour) <= minHour}
                            onClick={() => changeHour(-1)}
                        >
                            −
                        </button>
                    </div>
                </div>

                <span className="calendar-time-separator" aria-hidden="true">
                    :
                </span>

                <div className="calendar-time-segment">
                    <label htmlFor={`calendar-${label.toLowerCase()}-minute`}>
                        Minute
                    </label>

                    <div className="calendar-time-segment-controls">
                        <button
                            type="button"
                            aria-label={`Increase ${label} minute`}
                            disabled={disabled || Number(minute) >= 59}
                            onClick={() => changeMinute(1)}
                        >
                            +
                        </button>

                        <input
                            id={`calendar-${label.toLowerCase()}-minute`}
                            aria-label={`${label} minute`}
                            type="text"
                            inputMode="numeric"
                            maxLength={2}
                            value={minute}
                            disabled={disabled}
                            onWheel={preventWheelChange}
                            onChange={(event) =>
                                setMinute(event.target.value.replace(/\D/g, ""))
                            }
                            onBlur={() =>
                                commitTime(hour, minute, period)
                            }
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    event.currentTarget.blur();
                                }
                            }}
                        />

                        <button
                            type="button"
                            aria-label={`Decrease ${label} minute`}
                            disabled={disabled || Number(minute) <= 0}
                            onClick={() => changeMinute(-1)}
                        >
                            −
                        </button>
                    </div>
                </div>

                {format === "12h" && (
                    <div
                        className="calendar-time-period"
                        role="group"
                        aria-label={`${label} AM or PM`}
                    >
                        <button
                            type="button"
                            aria-pressed={period === "AM"}
                            disabled={disabled}
                            onClick={() => {
                                setPeriod("AM");
                                commitTime(hour, minute, "AM");
                            }}
                        >
                            AM
                        </button>

                        <button
                            type="button"
                            aria-pressed={period === "PM"}
                            disabled={disabled}
                            onClick={() => {
                                setPeriod("PM");
                                commitTime(hour, minute, "PM");
                            }}
                        >
                            PM
                        </button>
                    </div>
                )}
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

                    <div className="calendar-time-heading-actions">
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
                    <TimePicker
                        label="After"
                        value={selectedTime?.timeRange?.startTime}
                        format={timeFormat}
                        disabled={disabled}
                        onChange={(value) =>
                            updateTimeBound("startTime", value)
                        }
                    />

                    <TimePicker
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
        </section>
    );
}
