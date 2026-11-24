import { useState } from "react";

interface DateCalendarProps {
    label: "After" | "Before";
    initialMonth: string;
    value?: string;
    minDate?: string;
    maxDate?: string;
    disabled: boolean;
    onChange: (date: string) => void;
}

export function getCurrentMonth() {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Toronto",
        year: "numeric",
        month: "2-digit",
    }).formatToParts(new Date());

    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;

    if (!year || !month) {
        throw new Error("Unable to determine the current calendar month.");
    }

    return `${year}-${month}`;
}

export function shiftMonth(month: string, amount: number) {
    const [year, monthNumber] = month.split("-").map(Number);
    const shifted = new Date(Date.UTC(year, monthNumber - 1 + amount, 1));

    return [
        shifted.getUTCFullYear(),
        String(shifted.getUTCMonth() + 1).padStart(2, "0"),
    ].join("-");
}

export function getMonthForDate(date: string | undefined, fallback: string) {
    return date && /^\d{4}-\d{2}-\d{2}$/.test(date)
        ? date.slice(0, 7)
        : fallback;
}

function formatCalendarDate(date: string) {
    const [year, month, day] = date.split("-").map(Number);

    return new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
    }).format(new Date(Date.UTC(year, month - 1, day)));
}

function formatCalendarMonth(month: string) {
    const [year, monthNumber] = month.split("-").map(Number);

    return new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
    }).format(new Date(Date.UTC(year, monthNumber - 1, 1)));
}

export default function DateCalendar({
    label,
    initialMonth,
    value,
    minDate,
    maxDate,
    disabled,
    onChange,
}: DateCalendarProps) {
    const [visibleMonth, setVisibleMonth] = useState(initialMonth);

    const [year, monthNumber] = visibleMonth.split("-").map(Number);
    const firstWeekday = new Date(
        Date.UTC(year, monthNumber - 1, 1),
    ).getUTCDay();
    const daysInMonth = new Date(
        Date.UTC(year, monthNumber, 0),
    ).getUTCDate();

    const days: (string | undefined)[] = [
        ...Array.from({ length: firstWeekday }, () => undefined),
        ...Array.from({ length: daysInMonth }, (_, index) => {
            const day = String(index + 1).padStart(2, "0");

            return `${visibleMonth}-${day}`;
        }),
    ];

    return (
        <div
            className="calendar-date-calendar"
            role="group"
            aria-label={`${label} date calendar`}
        >
            <div className="calendar-date-calendar-heading">
                <button
                    type="button"
                    className="calendar-date-calendar-nav"
                    aria-label={`Previous month for ${label} date`}
                    disabled={disabled}
                    onClick={() =>
                        setVisibleMonth((current) => shiftMonth(current, -1))
                    }
                >
                    <span aria-hidden="true">‹</span>
                </button>

                <h4 aria-label={`${label} calendar month`}>
                    {formatCalendarMonth(visibleMonth)}
                </h4>

                <button
                    type="button"
                    className="calendar-date-calendar-nav"
                    aria-label={`Next month for ${label} date`}
                    disabled={disabled}
                    onClick={() =>
                        setVisibleMonth((current) => shiftMonth(current, 1))
                    }
                >
                    <span aria-hidden="true">›</span>
                </button>
            </div>

            <div className="calendar-date-calendar-grid">
                {["S", "M", "T", "W", "T", "F", "S"].map(
                    (weekday, index) => (
                        <span
                            key={`${weekday}-${index}`}
                            className="calendar-date-calendar-weekday"
                            aria-hidden="true"
                        >
                            {weekday}
                        </span>
                    ),
                )}

                {days.map((date, index) => {
                    if (!date) {
                        return (
                            <span
                                key={`empty-${index}`}
                                className="calendar-date-calendar-empty"
                                aria-hidden="true"
                            />
                        );
                    }

                    const day = Number(date.slice(-2));
                    const outsideRange =
                        (minDate !== undefined && date < minDate) ||
                        (maxDate !== undefined && date > maxDate);

                    return (
                        <button
                            key={date}
                            type="button"
                            className="calendar-date-calendar-day"
                            aria-label={`Select ${label} date ${formatCalendarDate(date)}`}
                            aria-pressed={value === date}
                            disabled={disabled || outsideRange}
                            onClick={() => onChange(date)}
                        >
                            {day}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
