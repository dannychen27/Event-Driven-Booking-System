CREATE INDEX idx_events_venue_id
    ON events(venue_id);

CREATE INDEX idx_bookings_user_id
    ON bookings(user_id);

CREATE INDEX idx_bookings_event_id
    ON bookings(event_id);

-- Enforce one active hold per user per event.
CREATE UNIQUE INDEX idx_booking_holds_one_active_per_user_event
    ON booking_holds(user_id, event_id)
    WHERE status = 'active';

-- Support event capacity checks against active holds.
CREATE INDEX idx_booking_holds_event_expiration
    ON booking_holds(event_id, expires_at)
    WHERE status = 'active';
