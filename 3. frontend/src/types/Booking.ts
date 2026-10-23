export interface Booking {
    id: number;
    user_id: number;
    event_id: number;
    created_at: string;  // an ISO string.

    // These fields are nullable because the SQL uses LEFT JOIN.
    event_name: string | null;
    start_time: string | null;
    end_time: string | null;
    venue_name: string | null;
    venue_address: string | null;
}
