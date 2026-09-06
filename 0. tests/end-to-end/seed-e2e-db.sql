-- Deterministic data for E2E tests

INSERT INTO users (id, name, email)
VALUES (1, 'E2E Test User', 'e2e@example.com');

INSERT INTO venues (id, name, address)
VALUES (1, 'E2E Test Venue', '1 Test Street');

INSERT INTO events (id, name, venue_id, start_time, end_time, capacity)
VALUES (
    1, 'E2E Test Event', 1,
    '2026-09-10T10:00:00Z', '2026-09-10T11:00:00Z',10);
