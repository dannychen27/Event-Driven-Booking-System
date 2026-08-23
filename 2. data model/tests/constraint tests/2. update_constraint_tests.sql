-- part 2/3: UPDATE CONSTRAINTS


-- USERS --


-- a. NULL name
-- should FAIL: NOT NULL constraint
UPDATE users
SET name = NULL
WHERE id = 1;

-- b. NULL email
-- should FAIL: NOT NULL constraint
UPDATE users
SET email = NULL
WHERE id = 1;

-- c. duplicate primary key
-- should FAIL: duplicate primary key
UPDATE users
SET id = 1
WHERE id = 2;


-- VENUES --


-- a. NULL name
-- should FAIL: NOT NULL constraint
UPDATE venues
SET name = NULL
WHERE id = 1;

-- b. NULL address
-- should FAIL: NOT NULL constraint
UPDATE venues
SET address = NULL
WHERE id = 1;

-- c. duplicate primary key
-- should FAIL: duplicate primary key
UPDATE venues
SET id = 1
WHERE id = 2;


-- EVENTS --


-- a. NULL id
-- should FAIL: NOT NULL constraint
UPDATE events
SET id = NULL
WHERE id = 1;

-- b. NULL name
-- should FAIL: NOT NULL constraint
UPDATE events
SET name = NULL
WHERE id = 1;

-- c. NULL venue_id
-- should FAIL: NOT NULL constraint
UPDATE events
SET venue_id = NULL
WHERE id = 1;

-- d. NULL start_time
-- should FAIL: NOT NULL constraint
UPDATE events
SET start_time = NULL
WHERE id = 1;

-- e. NULL end_time
-- should FAIL: NOT NULL constraint
UPDATE events
SET end_time = NULL
WHERE id = 1;

-- f. NULL capacity
-- should FAIL: NOT NULL constraint
UPDATE events
SET capacity = NULL
WHERE id = 1;

-- g. duplicate primary key
-- should FAIL: duplicate primary key
UPDATE events
SET id = 1
WHERE id = 2;

-- h. nonexistent venue
-- should FAIL: foreign key constraint
UPDATE events
SET venue_id = 999
WHERE id = 1;

-- i. zero capacity
-- should FAIL: CHECK constraint
UPDATE events
SET capacity = 0
WHERE id = 1;

-- j. negative capacity
-- should FAIL: CHECK constraint
UPDATE events
SET capacity = -3
WHERE id = 1;

-- k. event ends when it starts
-- should FAIL: CHECK constraint
UPDATE events
SET end_time = start_time
WHERE id = 1;

-- l. event ends before it starts
-- should FAIL: CHECK constraint
UPDATE events
SET end_time = start_time - INTERVAL '1 second'
WHERE id = 1;


-- BOOKINGS --


-- a. NULL id
-- should FAIL: NOT NULL constraint
UPDATE bookings
SET id = NULL
WHERE id = 1;

-- b. NULL user_id
-- should FAIL: NOT NULL constraint
UPDATE bookings
SET user_id = NULL
WHERE id = 1;

-- c. NULL event_id
-- should FAIL: NOT NULL constraint
UPDATE bookings
SET event_id = NULL
WHERE id = 1;

-- d. NULL created_at
-- should FAIL: NOT NULL constraint
UPDATE bookings
SET created_at = NULL
WHERE id = 1;

-- e. duplicate primary key
-- should FAIL: duplicate primary key
UPDATE bookings
SET id = 1
WHERE id = 2;

-- f. nonexistent user
-- should FAIL: foreign key constraint
UPDATE bookings
SET user_id = 999
WHERE id = 1;

-- g. nonexistent event
-- should FAIL: foreign key constraint
UPDATE bookings
SET event_id = 999
WHERE id = 1;

-- h. duplicate (user_id, event_id)
-- should FAIL: UNIQUE constraint
UPDATE bookings
SET user_id = 1, event_id = 1
WHERE id = 2;
-- provided another booking already has (1,1).

