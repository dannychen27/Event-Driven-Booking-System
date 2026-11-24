import { useEffect, useState } from "react";

type TimeFormat = "12h" | "24h";

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

export default function CompactTimePicker({
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



    return (
        <div className="calendar-time-picker calendar-time-picker--compact">
            <div className="calendar-time-picker-heading">
                <span className="calendar-time-picker-label">{label}</span>

                <button
                    type="button"
                    className="calendar-time-clear"
                    disabled={disabled || !value}
                    onClick={() => onChange(undefined)}
                    aria-label={`Clear ${label} time`}
                >
                    Clear
                </button>
            </div>

            <div
                className="calendar-time-picker-fields calendar-time-compact-fields"
                role="group"
                aria-label={`${label} time`}
            >
                <label className="calendar-time-compact-segment">
                    <input
                        aria-label={`${label} hour`}
                        type="text"
                        inputMode="numeric"
                        maxLength={2}
                        value={hour}
                        disabled={disabled}
                        onChange={(event) =>
                            setHour(event.target.value.replace(/\D/g, ""))
                        }
                        onBlur={() => commitTime(hour, minute, period)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                event.currentTarget.blur();
                            }
                        }}
                    />
                </label>

                <span className="calendar-time-compact-separator" aria-hidden="true">
                    :
                </span>

                <label className="calendar-time-compact-segment">
                    <input
                        aria-label={`${label} minute`}
                        type="text"
                        inputMode="numeric"
                        maxLength={2}
                        value={minute}
                        disabled={disabled}
                        onChange={(event) =>
                            setMinute(event.target.value.replace(/\D/g, ""))
                        }
                        onBlur={() => commitTime(hour, minute, period)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                event.currentTarget.blur();
                            }
                        }}
                    />
                </label>

                <div
                    className={`calendar-time-period calendar-time-compact-period ${
                        format === "24h" ? "calendar-time-compact-period--hidden" : ""
                    }`}
                    role={format === "12h" ? "group" : undefined}
                    aria-label={format === "12h" ? `${label} AM or PM` : undefined}
                    aria-hidden={format === "24h"}
                >
                    {format === "12h" && (
                        <>
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
                        </>
                    )}
                </div>
            </div>


        </div>
    );
}
