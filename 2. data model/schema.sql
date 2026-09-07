-- So I'd say your next mini-milestone is:
--
-- Turn this conceptual schema into a proper relational schema with PKs, FKs,
-- UNIQUE constraints, CHECK constraints, and indexes.
--
-- You're actually at a nice transition point: the entities are mostly settled;
-- now we're designing the invariants.


CREATE TABLE users (
    id          SERIAL          PRIMARY KEY,
    name        VARCHAR(255)    NOT NULL,
    email       VARCHAR(255)    NOT NULL
);


CREATE TABLE venues (
    id          SERIAL          PRIMARY KEY,
    name        VARCHAR(255)    NOT NULL,
    address     VARCHAR(255)    NOT NULL
);


CREATE TABLE events (
    id          SERIAL          PRIMARY KEY,
    name        VARCHAR(255)    NOT NULL,
    venue_id    INT             NOT NULL REFERENCES venues(id),
    start_time  TIMESTAMPTZ     NOT NULL,
    end_time    TIMESTAMPTZ     NOT NULL,
    capacity    INT             NOT NULL CHECK (capacity > 0),
    CHECK (start_time < end_time)
);


CREATE TABLE bookings (
    id          SERIAL          PRIMARY KEY,
    user_id     INT             NOT NULL REFERENCES users(id),
    event_id    INT             NOT NULL REFERENCES events(id),
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, event_id)
);

