import type { BookingFilter } from "../../helpers/bookings/BookingsPageHelpers.tsx";
import type { BookingFiltersProps } from "../../types/bookings/BookingFilters.types.ts";

const BOOKING_FILTERS: { value: BookingFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "upcoming", label: "Upcoming" },
    { value: "happening-now", label: "Happening Now" },
    { value: "past", label: "Past" },
    { value: "cancelled", label: "Cancelled" },
];

export default function BookingFilters({
    activeFilter,
    onFilterChange,
}: BookingFiltersProps) {
    return (
        <div className="booking-filters" role="group" aria-label="Booking filters">
            {BOOKING_FILTERS.map(({ value, label }) => (
                <button
                    key={value}
                    type="button"
                    className={`booking-filters__button booking-filters__button--${value}${activeFilter === value ? " booking-filters__button--active" : ""}`}
                    aria-pressed={activeFilter === value}
                    onClick={() => onFilterChange(value)}
                >
                    {label}
                </button>
            ))}
        </div>
    );
}
