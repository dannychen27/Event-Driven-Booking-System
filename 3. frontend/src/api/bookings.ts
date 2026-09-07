import type { Booking } from "../types/Booking.ts"


export async function getBookingHistory(user_id: number): Promise<Booking[]> {
    const getBookingsResponse = await fetch(`http://localhost:3000/users/${user_id}/bookings`);
    if (!getBookingsResponse.ok) {
        throw new Error(`Failed to fetch bookings for user ${user_id}`);
    }
    return getBookingsResponse.json();
}

export async function createBooking(user_id: number,event_id: number): Promise<Booking> {
    const createBookingsResponse = await fetch(`http://localhost:3000/events/${event_id}/book`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                user_id: user_id
            }),
        }
    );

    if (!createBookingsResponse.ok) {
        const errorBody = await createBookingsResponse.json();
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
    return createBookingsResponse.json();
}

export async function cancelBooking(user_id: number, booking_id: number): Promise<Booking> {
    const cancelBookingResponse = await fetch(`http://localhost:3000/bookings/${booking_id}`,
        {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                user_id: user_id,
            }),
        }
    );

    if (!cancelBookingResponse.ok) {
        throw new Error("Failed to cancel booking");
    }
    return cancelBookingResponse.json();
}
