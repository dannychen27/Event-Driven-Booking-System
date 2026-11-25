export type BookingStatus = "confirmed" | "cancelled";

export interface Booking {
    id: number;
    user_id: number;
    event_id: number;
    created_at: string;  // an ISO string.
    status: BookingStatus;

    // These fields are nullable because the SQL uses LEFT JOIN.
    event_name: string | null;
    start_time: string | null;
    end_time: string | null;
    venue_name: string | null;
    venue_address: string | null;
    image_url: string | null;
}

export type BookingCancellationResult = Pick<Booking, "id" | "status">;
