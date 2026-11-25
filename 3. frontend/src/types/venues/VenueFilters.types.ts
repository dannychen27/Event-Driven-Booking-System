
export interface VenueFiltersProps {
    venueType: string;
    location: string;
    venueTypes: string[];
    onVenueTypeChange: (value: string) => void;
    onLocationChange: (value: string) => void;
    onClear: () => void;
}
