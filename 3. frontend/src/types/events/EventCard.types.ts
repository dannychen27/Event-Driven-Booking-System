import type { Event } from "./Event.ts";

export type EventBookingStatus = "idle" | "creating" | "success" | "error";

export interface EventCardProps {
    event: Event;
}
