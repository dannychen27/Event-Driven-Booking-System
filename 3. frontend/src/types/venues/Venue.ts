export interface Venue {
    id: number;
    name: string;
    address: string;
    description?: string | null;
    venue_type?: string | null;
    image_url?: string | null;
    amenities?: string[];
    accessibility_features?: string[];
    transit_info?: string | null;
}
