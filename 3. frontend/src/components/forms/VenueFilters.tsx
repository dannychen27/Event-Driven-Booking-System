import type { VenueFiltersProps } from "../../types/venues/VenueFilters.types.ts";

export default function VenueFilters({
    venueType,
    location,
    venueTypes,
    onVenueTypeChange,
    onLocationChange,
    onApplyLocation,
}: VenueFiltersProps) {
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
                <form
                    className="venue-filters__location-form"
                    onSubmit={(event) => {
                        event.preventDefault();
                        onApplyLocation();
                    }}
                >
                    <input
                        id="venue-location"
                        type="search"
                        value={location}
                        onChange={(event) => onLocationChange(event.target.value)}
                        placeholder="Search venue addresses"
                    />
                    <button type="submit">Apply location</button>
                </form>
            </div>
        </div>
    );
}
