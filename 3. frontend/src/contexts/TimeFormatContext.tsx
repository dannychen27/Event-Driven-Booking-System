import {
    createContext,
    useContext,
    useState,
    type ReactNode,
} from "react";

export type TimeFormat = "12h" | "24h";

interface TimeFormatContextValue {
    timeFormat: TimeFormat;
    setTimeFormat: (format: TimeFormat) => void;
}

const TimeFormatContext = createContext<TimeFormatContextValue>({
    timeFormat: "12h",
    setTimeFormat: () => {},
});

export function TimeFormatProvider({
    children,
}: {
    children: ReactNode;
}) {
    const [timeFormat, setTimeFormat] = useState<TimeFormat>("12h");

    return (
        <TimeFormatContext.Provider value={{ timeFormat, setTimeFormat }}>
            {children}
        </TimeFormatContext.Provider>
    );
}

export function useTimeFormat() {
    return useContext(TimeFormatContext);
}
