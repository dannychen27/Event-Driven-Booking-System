-- part 3/3: DELETE CONSTRAINTS


-- USERS --

-- a. user referenced by booking
-- should FAIL: bookings.user_id references this user
DELETE FROM users
WHERE id = 1;


-- EVENTS --

-- a. event referenced by booking
-- should FAIL: bookings.event_id references this event
DELETE FROM events
WHERE id = 1;


-- BOOKINGS --

-- a. booking has no dependent rows
-- should SUCCEED: nothing references bookings.
-- Roll back the successful deletion to preserve seed data.
BEGIN;

DELETE FROM bookings
WHERE id = 1;

ROLLBACK;


-- VENUES --

-- a. venue referenced by events
-- should FAIL: events.venue_id references this venue
DELETE FROM venues
WHERE id = 2;

