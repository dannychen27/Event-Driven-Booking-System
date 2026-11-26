import { useTimeFormat } from "../../contexts/TimeFormatContext.tsx";
import "../../styles/ui/time-format-toggle.css";

interface TimeFormatToggleProps {
    disabled?: boolean;
    className?: string;
}

export default function TimeFormatToggle({
    disabled = false,
    className = "",
}: TimeFormatToggleProps) {
    const { timeFormat, setTimeFormat } = useTimeFormat();

    return (
        <div
            className={`calendar-time-format ${className}`.trim()}
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
    );
}
