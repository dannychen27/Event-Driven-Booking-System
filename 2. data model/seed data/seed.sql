INSERT INTO users (id, name, email)
VALUES
    (1, 'Alice', 'alice@example.com'),
    (2, 'Bob', 'bob@example.com'),

    -- a. duplicate (name, email) should be OK.
    (3, 'Alice', 'alice@example.com');


INSERT INTO venues (id, name, address)
VALUES
    (1, 'Bahen Center', '40 St George St'),
    (2, 'Moss Park Espresso', '185 Queen St E'),

    -- a. duplicate (name, address) should be OK.
    (3, 'Bahen Center', '40 St George St');


INSERT INTO events (id, name, venue_id, start_time, end_time, capacity)
VALUES
    (1, 'Meet and Greet', 2,
     '2026-08-08 18:00:00-04:00',
     '2026-08-08 20:00:00-04:00',
     1),

    -- a. duplicate attributes should be OK.
    (2, 'Meet and Greet', 2,
    '2026-08-08 18:00:00-04:00',
    '2026-08-08 20:00:00-04:00',
    1);


-- BOOKINGS
INSERT INTO bookings (id, user_id, event_id)
VALUES
    (1, 1, 1),
    (2, 2, 2);
