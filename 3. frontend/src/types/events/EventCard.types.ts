import type { Event } from "./Event.ts";

export type EventBookingStatus = "idle" | "creating" | "success" | "error";

export type BookingHistoryStatus = "loading" | "ready" | "error";

export interface EventCardProps {
    event: Event;
    isBooked: boolean;
    bookingHistoryStatus: BookingHistoryStatus;
    onBookingCreated: (eventId: number) => void;
}
