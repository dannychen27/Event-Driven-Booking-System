type DateFormatOptions = {
    dateStyle?: "full" | "long" | "medium" | "short";
    timeStyle?: "short" | "medium" | "long" | "full";
    is12HourFormat?: boolean;
};

export function formatDate(isoDate: string, options: DateFormatOptions = {}): string {
    const date = new Date(isoDate);

    return new Intl.DateTimeFormat(
        "en-US",
        {
            dateStyle: options.dateStyle ?? "long",
            timeStyle: options.timeStyle ?? "medium",
            hour12: options.is12HourFormat ?? false,
        }
    ).format(date);
}
