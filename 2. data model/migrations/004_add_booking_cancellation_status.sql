-- Preserve booking history while allowing users to book the same event again.
-- Existing bookings are treated as confirmed.

ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('confirmed', 'cancelled'));

-- Replace the original unconditional uniqueness rule with one that applies
-- only to confirmed bookings.
ALTER TABLE bookings
    DROP CONSTRAINT IF EXISTS bookings_user_id_event_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_one_confirmed_per_user_event
    ON bookings(user_id, event_id)
    WHERE status = 'confirmed';
