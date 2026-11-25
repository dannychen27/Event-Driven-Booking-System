import type { BookingFilter } from "../../helpers/bookings/BookingsPageHelpers.tsx";

export interface BookingFiltersProps {
    activeFilter: BookingFilter;
    onFilterChange: (filter: BookingFilter) => void;
}
