import type { VenueFiltersProps } from "../../types/venues/VenueFilters.types.ts";

export default function VenueFilters({
    venueType,
    location,
    venueTypes,
    onVenueTypeChange,
    onLocationChange,
    onClear,
}: VenueFiltersProps) {
    const hasActiveFilters = Boolean(venueType || location.trim());

    return (
        <div className="venue-filters">
            <div className="venue-filters__field">
                <label htmlFor="venue-type">Venue type</label>
                <select
                    id="venue-type"
                    value={venueType}
                    onChange={(event) => onVenueTypeChange(event.target.value)}
                >
                    <option value="">All venue types</option>
                    {venueTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </select>
            </div>

            <div className="venue-filters__field">
                <label htmlFor="venue-location">Location</label>
                <input
                    id="venue-location"
                    type="search"
                    value={location}
                    onChange={(event) => onLocationChange(event.target.value)}
                    placeholder="Search venue addresses"
                />
            </div>

            <button
                type="button"
                className="venue-filters__clear"
                onClick={onClear}
                disabled={!hasActiveFilters}
            >
                Clear filters
            </button>
        </div>
    );
}
