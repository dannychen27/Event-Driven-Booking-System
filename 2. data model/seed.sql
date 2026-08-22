-- USERS
INSERT INTO users (id, name, email)
VALUES
    (1, 'Alice', 'alice@example.com'),
    (2, 'Bob', 'bob@example.com'),

    -- a. duplicate (name, email) should be OK.
    (3, 'Alice', 'alice@example.com');

-- edge cases
INSERT INTO users (id, name, email)
VALUES
    -- a. duplicate primary keys
    (1, 'Alice', 'alice@example.com'),

    -- b. NULL where NOT NULL is required
    (4, NULL, 'alice@example.com'),
    (5, 'Alice', NULL);


-- VENUES
INSERT INTO venues (id, name, address)
VALUES
    (1, 'Bahen Center', '40 St George St'),
    (2, 'Moss Park Espresso', '185 Queen St E'),

    -- a, duplicate (name, address) should be OK.
    (3, 'Bahen Center', '40 St George St');

-- edge cases
INSERT INTO venues (id, name, address)
VALUES
    -- a. duplicate primary keys
    (1, 'Bahen Center', '40 St George St'),

    -- b. NULL where NOT NULL is required
    (4, NULL, '40 St George St'),
    (5, 'Bahen Center', NULL);


-- EVENTS
INSERT INTO events (id, name, venue_id, start_time, end_time, capacity)
VALUES
    (1, 'Meet and Greet', 2,
     '2026-08-08 18:00:00-04:00',
     '2026-08-08 20:00:00-04:00',
     1),

    -- a. duplicate (name, venue_id, start_time, end_time, capacity) should be OK.
    (2, 'Meet and Greet', 2,
    '2026-08-08 18:00:00-04:00',
    '2026-08-08 20:00:00-04:00',
    1);


-- edge cases
INSERT INTO events (id, name, venue_id, start_time, end_time, capacity)
VALUES
    -- a. duplicate primary keys
    (1, 'Meet and Greet', 2,
     '2026-08-08 18:00:00-04:00',
     '2026-08-08 20:00:00-04:00',
     1),

    -- b. NULL where NOT NULL is required
    (4, NULL, 2,
        '2026-08-08 18:00:00-04:00',
        '2026-08-08 20:00:00-04:00',
        1),
    (4, 'Meet and Greet', NULL,
     '2026-08-08 18:00:00-04:00',
     '2026-08-08 20:00:00-04:00',
     1),
    (4, 'Meet and Greet', 2,
     NULL,
     '2026-08-08 20:00:00-04:00',
     1),
    (4, 'Meet and Greet', 2,
     '2026-08-08 18:00:00-04:00',
     '2026-08-08 20:00:00-04:00',
     1),
    (4, 'Meet and Greet', 2,
     '2026-08-08 18:00:00-04:00',
     NULL,
     NULL),

    -- c. <= 0 capacity
    (5, 'X', 2,
     '2026-08-08 18:00:00-04:00',
     '2026-08-08 20:00:00-04:00',
     -3),
    (5, 'X', 2,
     '2026-08-08 18:00:00-04:00',
     '2026-08-08 20:00:00-04:00',
     0),

    -- d. foreign key violation


-- BOOKINGS
INSERT INTO bookings (id, user_id, event_id, created_at)
VALUES
    (1, 1, 1),

    -- a. nonexistent user
    (2, 99, 1),

    -- b. nonexistent event
    (3, 1, 99),

    -- c. duplicate unique value:
    -- double booking the same (user, event)
    (2, 1, 1),

    -- d. foreign key violation
    
