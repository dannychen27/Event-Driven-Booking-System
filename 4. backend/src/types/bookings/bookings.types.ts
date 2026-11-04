export type BookingId = {
  id: number;
};

export type Booking = {
  id: number;
  user_id: number;
  event_id: number;
  created_at: string | Date;
};

export type EventBookingCount = {
  booking_count: number;
};

export type BookingHistoryEntry = Booking & {
  event_name: string | null;
  start_time: string | Date | null;
  end_time: string | Date | null;
  venue_name: string | null;
  venue_address: string | null;
};

export type BookingHoldId = {
  id: number;
};

export type BookingHoldStatus =
    | 'active'
    | 'confirmed'
    | 'expired'
    | 'cancelled';

export type BookingHold = {
  id: number;
  user_id: number;
  event_id: number;
  created_at: string | Date;
  expires_at: string | Date;
  status: BookingHoldStatus;
};

export type EventHoldCount = {
  hold_count: string;
};

export type BookingEventId = {
  event_id: number;
};

export type EventCapacityCount = EventBookingCount & EventHoldCount;
