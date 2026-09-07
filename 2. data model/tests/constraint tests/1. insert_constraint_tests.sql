-- part 1/3: INSERT CONSTRAINTS


-- USERS --


-- a. duplicate primary key
-- should FAIL: duplicate primary key
INSERT INTO users (id, name, email)
VALUES
    (1, 'Alice', 'alice@example.com');

-- b. NULL name
-- should FAIL: NOT NULL constraint
INSERT INTO users (id, name, email)
VALUES
    (4, NULL, 'alice@example.com');

-- c. NULL email
-- should FAIL: NOT NULL constraint
INSERT INTO users (id, name, email)
VALUES
    (5, 'Alice', NULL);


-- VENUES --


-- a. duplicate primary key
-- should FAIL: duplicate primary key
INSERT INTO venues (id, name, address)
VALUES
    (1, 'Bahen Center', '40 St George St');

-- b. NULL name
-- should FAIL: NOT NULL constraint
INSERT INTO venues (id, name, address)
VALUES
    (4, NULL, '40 St George St');

-- c. NULL address
-- should FAIL: NOT NULL constraint
INSERT INTO venues (id, name, address)
VALUES
    (5, 'Bahen Center', NULL);


-- EVENTS --


-- a. duplicate primary key
-- should FAIL: duplicate primary key
INSERT INTO events (id, name, venue_id, start_time, end_time, capacity)
VALUES
    (1, 'Meet and Greet', 2,
     '2026-08-08 18:00:00-04:00',
     '2026-08-08 20:00:00-04:00',
     1);

-- b. NULL name
-- should FAIL: NOT NULL constraint
INSERT INTO events (id, name, venue_id, start_time, end_time, capacity)
VALUES
    (4, NULL, 2,
     '2026-08-08 18:00:00-04:00',
     '2026-08-08 20:00:00-04:00',
     1);

-- c. NULL venue_id
-- should FAIL: NOT NULL constraint
INSERT INTO events (id, name, venue_id, start_time, end_time, capacity)
VALUES
    (5, 'Meet and Greet', NULL,
     '2026-08-08 18:00:00-04:00',
     '2026-08-08 20:00:00-04:00',
     1);

-- d. NULL start_time
-- should FAIL: NOT NULL constraint
INSERT INTO events (id, name, venue_id, start_time, end_time, capacity)
VALUES
    (6, 'Meet and Greet', 2,
     NULL,
     '2026-08-08 20:00:00-04:00',
     1);

-- e. NULL end_time
-- should FAIL: NOT NULL constraint
INSERT INTO events (id, name, venue_id, start_time, end_time, capacity)
VALUES
    (7, 'Meet and Greet', 2,
     '2026-08-08 18:00:00-04:00',
     NULL,
     1);

-- f. NULL capacity
-- should FAIL: NOT NULL constraint
INSERT INTO events (id, name, venue_id, start_time, end_time, capacity)
VALUES
    (8, 'Meet and Greet', 2,
     '2026-08-08 18:00:00-04:00',
     '2026-08-08 20:00:00-04:00',
     NULL);

-- g. negative capacity
-- should FAIL: CHECK constraint
INSERT INTO events (id, name, venue_id, start_time, end_time, capacity)
VALUES
    (9, 'Negative People Event', 2,
     '2026-08-08 18:00:00-04:00',
     '2026-08-08 20:00:00-04:00',
     -3);

-- h. zero capacity
-- should FAIL: CHECK constraint
INSERT INTO events (id, name, venue_id, start_time, end_time, capacity)
VALUES
    (10, 'Empty Event', 2,
     '2026-08-08 18:00:00-04:00',
     '2026-08-08 20:00:00-04:00',
     0);

-- i. nonexistent venue
-- should FAIL: foreign key constraint
INSERT INTO events (id, name, venue_id, start_time, end_time, capacity)
VALUES
    (11, 'Fake Event', 999,
     '2026-08-08 18:00:00-04:00',
     '2026-08-08 20:00:00-04:00',
     1);

-- j. event ends before it starts
-- should FAIL: CHECK constraint
INSERT INTO events (id, name, venue_id, start_time, end_time, capacity)
VALUES
    (12, 'Backwards Event', 2,
     '2026-08-08 20:00:00-04:00',
     '2026-08-08 18:00:00-04:00',
     10);

-- k. event ends when it starts
-- should FAIL: CHECK constraint
INSERT INTO events (id, name, venue_id, start_time, end_time, capacity)
VALUES
    (13, 'Zero Duration', 2,
     '2026-08-08 18:00:00-04:00',
     '2026-08-08 18:00:00-04:00',
     10);


-- BOOKINGS --


-- a. nonexistent user
-- should FAIL: foreign key constraint
INSERT INTO bookings (id, user_id, event_id)
VALUES
    (2, 99, 1);

-- b. nonexistent event
-- should FAIL: foreign key constraint
INSERT INTO bookings (id, user_id, event_id)
VALUES
    (3, 1, 99);

-- c. duplicate (user_id, event_id) i.e. double booking
-- should FAIL: UNIQUE constraint
INSERT INTO bookings (id, user_id, event_id)
VALUES
    (4, 1, 1);

