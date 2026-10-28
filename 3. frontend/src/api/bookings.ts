import type { Booking } from "../types/Booking.ts"
import { API_BASE_URL } from "./apiBaseUrl.ts";
import { apiRequest } from "./apiRequest.ts";

export async function getBookingHistory(user_id: number): Promise<Booking[]> {
    return apiRequest<Booking[]>(
        `${API_BASE_URL}/users/${user_id}/bookings`,
        `Failed to fetch bookings for user ${user_id}`,
    );
}


export async function createBooking(user_id: number, event_id: number): Promise<Booking> {
    const createBookingsResponse = await fetch(
        `${API_BASE_URL}/events/${event_id}/book`,
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
        let errorMessage: string | undefined;

        try {
            const errorBody = await createBookingsResponse.json();
            if (typeof errorBody.message === "string") {
                errorMessage = errorBody.message;
            }
        } catch {
            // Use the fallback message when the response isn't valid JSON.
        }

        if (!errorMessage) {
            throw new Error("Failed to create booking");
        }

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


export async function cancelBooking(
    user_id: number,
    booking_id: number,
): Promise<Booking> {
    return apiRequest<Booking>(
        `${API_BASE_URL}/bookings/${booking_id}`,
        "Failed to cancel booking",
        {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ user_id }),
        },
    );
}
