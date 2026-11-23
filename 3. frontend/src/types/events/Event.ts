export interface Event {
    id: number;
    name: string;
    description?: string | null;
    venue_id: number;
    venue_name: string;
    venue_address: string;
    start_time: string;
    end_time: string;
    capacity: number;
    attendee_count: number;
    image_url: string | null;
}

