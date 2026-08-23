CREATE INDEX idx_events_venue_id
    ON events(venue_id);

CREATE INDEX idx_bookings_user_id
    ON bookings(user_id);

CREATE INDEX idx_bookings_event_id
    ON bookings(event_id);
