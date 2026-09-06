-- Deterministic data for E2E tests


-- E2E test user
INSERT INTO users (id, name, email)
VALUES (1, 'E2E Test User', 'e2e@example.com');


-- E2E test venue
INSERT INTO venues (id, name, address)
VALUES (1, 'E2E Test Venue', '1 Test Street');


-- E2E: Event 1 → happy-path booking/cancellation
INSERT INTO events (id, name, venue_id, start_time, end_time, capacity)
VALUES (
    1, 'E2E Test Event', 1,
    '2026-09-10T10:00:00Z',
    '2026-09-10T11:00:00Z',
    10
);


-- E2E: Event 2 → overlapping schedule
INSERT INTO events (id, name, venue_id, start_time, end_time, capacity)
VALUES (
    2,'E2E Conflicting Event',1,
    '2026-09-10T10:30:00Z',
    '2026-09-10T11:30:00Z',
    10
);


-- E2E: Event 3 → full capacity
INSERT INTO events (id, name, venue_id, start_time, end_time, capacity)
VALUES (
   3,'E2E Full Event',1,
    '2026-09-10T12:00:00Z',
    '2026-09-10T13:00:00Z',
    1
);


-- E2E: Booking user 1 → Event 3 → fills Event 3
INSERT INTO bookings (user_id, event_id)
VALUES (1, 3);

