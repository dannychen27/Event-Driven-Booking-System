import type {
    CalendarDateRange,
    CalendarTimeSelection,
    ExplicitSelection,
} from "../../types/search/NaturalLanguageSearch.types.ts";
import type { TimeOfDay } from "../../types/search/NaturalLanguageSearch.types.ts";
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

        if (!nextSelection.timeOfDay && !nextSelection.timeRange?.startTime &&
            !nextSelection.timeRange?.endTime) {
            onTimeSelectionChange(undefined);
            return;
        }

        onTimeSelectionChange({
            state: "selected",
            value: nextSelection,
        });
    }

    return (
        <section className="calendar-search-controls" aria-label="Date and time filters">
            <div className="calendar-search-section">
                <div className="calendar-search-section-heading">
                    <h3>Date</h3>
                    <button
                        type="button"
                        className="calendar-search-clear"
                        disabled={disabled || !dateSelection}
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
                        disabled={disabled || !timeSelection}
                        onClick={() =>
                            onTimeSelectionChange({ state: "cleared" })
                        }
                    >
                        Clear time
                    </button>
                </div>

                <div className="calendar-search-fields">
                    <div>
                        <label htmlFor="search-time-of-day">Time of day</label>
                        <select
                            id="search-time-of-day"
                            value={selectedTime?.timeOfDay ?? ""}
                            disabled={disabled}
                            onChange={(event) =>
                                updateTimeSelection({
                                    timeOfDay: event.target.value
                                        ? event.target.value as TimeOfDay
                                        : undefined,
                                })
                            }
                        >
                            <option value="">Any time</option>
                            {TIME_OF_DAY_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="search-start-time">After</label>
                        <input
                            id="search-start-time"
                            type="time"
                            value={selectedTime?.timeRange?.startTime ?? ""}
                            disabled={disabled}
                            onChange={(event) =>
                                updateTimeSelection({
                                    timeRange: {
                                        ...selectedTime?.timeRange,
                                        startTime: event.target.value || undefined,
                                    },
                                })
                            }
                        />
                    </div>

                    <div>
                        <label htmlFor="search-end-time">Before</label>
                        <input
                            id="search-end-time"
                            type="time"
                            value={selectedTime?.timeRange?.endTime ?? ""}
                            disabled={disabled}
                            onChange={(event) =>
                                updateTimeSelection({
                                    timeRange: {
                                        ...selectedTime?.timeRange,
                                        endTime: event.target.value || undefined,
                                    },
                                })
                            }
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
