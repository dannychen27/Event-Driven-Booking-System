import type { Booking } from "../types/Booking.ts"

export async function getBookingHistory(user_id: number): Promise<Booking[]> {
    const bookingsResponse = await fetch(`http://localhost:3000/users/${user_id}/bookings`);
    if (!bookingsResponse.ok) {
        throw new Error(`Failed to fetch bookings for user ${user_id}`);
    }
    return bookingsResponse.json();
}
