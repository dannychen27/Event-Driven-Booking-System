import type { Booking } from "../types/Booking.ts"

export async function getBookingHistory(user_id: number): Promise<Booking[]> {
    const bookingsResponse = await fetch(`http://localhost:3000/users/${user_id}/bookings`);
    if (!bookingsResponse.ok) {
        throw new Error(`Failed to fetch bookings for user ${user_id}`);
    }
    return bookingsResponse.json();
}

export async function createBooking(
    user_id: number,
    event_id: number
): Promise<Booking> {
    const createBookingResponse = await fetch(`http://localhost:3000/events/${event_id}/book`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            user_id: user_id
        }),
    });

    if (!createBookingResponse.ok) {
        const errorBody = await createBookingResponse.json();
        const errorMessage = errorBody.message;

        if (errorMessage.includes("already booked")) {
            throw new Error("You have already booked this event.");
        } else if (errorMessage.includes("full")) {
            throw new Error("This event is fully booked.");
        } else if (errorMessage.includes("conflicting")) {
            throw new Error("You already have another booking that conflicts with this event.");
        } else if (errorMessage.includes("User") && errorMessage.includes("not found")) {
            throw new Error("The user was not found.");
        } else if (errorMessage.includes("Event") && errorMessage.includes("not found")) {
            throw new Error("The event was not found.");
        } else {
            throw new Error(errorMessage);
        }
    }
    return createBookingResponse.json();
}
