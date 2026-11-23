-- Showcase-only demo user and confirmed bookings.
-- This file is loaded only by setup-showcase.sh.
-- It must never be included in development seed data.

BEGIN;

DO $$
DECLARE
    existing_user users%ROWTYPE;
    user_exists BOOLEAN;
    matching_events INT;
BEGIN
    SELECT *
    INTO existing_user
    FROM users
    WHERE id = 1;

    user_exists := FOUND;

    IF user_exists AND (
        existing_user.name <> 'Showcase Demo User'
        OR existing_user.email <> 'demo@booking-system.example'
    ) THEN
        RAISE EXCEPTION
            'Refusing to overwrite an unexpected user with ID 1.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM users
        WHERE email = 'demo@booking-system.example'
          AND id <> 1
    ) THEN
        RAISE EXCEPTION
            'Showcase demo email already belongs to another user.';
    END IF;

    IF NOT user_exists THEN
        INSERT INTO users (id, name, email)
        VALUES (1, 'Showcase Demo User', 'demo@booking-system.example');
    END IF;

    IF EXISTS (
        SELECT 1 FROM venues WHERE name = 'Moss Park Espresso'
    ) OR EXISTS (
        SELECT 1 FROM events WHERE name = 'Meet and Greet'
    ) THEN
        RAISE EXCEPTION
            'Development-only venue or event found in showcase database.';
    END IF;

    SELECT COUNT(*)
    INTO matching_events
    FROM (
        VALUES
            ('Practical TypeScript: From Types to Tooling',
             '2026-12-03 18:30:00-05'),
            ('Toronto AI Builders Meetup',
             '2026-12-10 18:00:00-05'),
            ('Independent Film Night: Short Stories',
             '2026-12-12 19:00:00-05'),
            ('Board Game Social: New Friends Edition',
             '2026-12-19 17:00:00-05')
    ) AS expected(name, start_time)
    JOIN events e
      ON e.name = expected.name
     AND e.start_time = expected.start_time::timestamptz;

    IF matching_events <> 4 THEN
        RAISE EXCEPTION
            'Expected exactly four matching showcase events; found %.',
            matching_events;
    END IF;
END $$;

INSERT INTO bookings (user_id, event_id, created_at)
SELECT
    1,
    e.id,
    showcase.created_at::timestamptz
FROM (
    VALUES
        ('Practical TypeScript: From Types to Tooling',
         '2026-12-03 18:30:00-05',
         '2026-11-14 12:15:00-05'),
        ('Toronto AI Builders Meetup',
         '2026-12-10 18:00:00-05',
         '2026-11-16 16:40:00-05'),
        ('Independent Film Night: Short Stories',
         '2026-12-12 19:00:00-05',
         '2026-11-18 19:05:00-05'),
        ('Board Game Social: New Friends Edition',
         '2026-12-19 17:00:00-05',
         '2026-11-20 14:30:00-05')
) AS showcase(name, start_time, created_at)
JOIN events e
  ON e.name = showcase.name
 AND e.start_time = showcase.start_time::timestamptz
WHERE NOT EXISTS (
    SELECT 1
    FROM bookings b
    WHERE b.user_id = 1
      AND b.event_id = e.id
);

SELECT setval(
    pg_get_serial_sequence('users', 'id'),
    GREATEST((SELECT COALESCE(MAX(id), 1) FROM users), 1),
    true
);

DO $$
DECLARE
    demo_booking_count INT;
BEGIN
    SELECT COUNT(*)
    INTO demo_booking_count
    FROM bookings
    WHERE user_id = 1;

    IF demo_booking_count <> 4 THEN
        RAISE EXCEPTION
            'Expected four showcase demo bookings; found %.',
            demo_booking_count;
    END IF;
END $$;

COMMIT;
