-- Portfolio showcase dataset
--
-- Adds four Toronto venues and eight upcoming events for screenshots/demo use.
-- Run after the base schema and seed.sql have been applied.
--
-- This script intentionally does not create users, bookings, or booking holds.
-- It is safe to rerun: existing venues are matched by (name, address), and
-- existing events are matched by (venue, name, start_time).
--
-- All event/venue data below is illustrative sample data. No affiliation with
-- the listed public venues is implied.

BEGIN;

-- Synchronize SERIAL sequences after seed.sql inserts explicit IDs.
SELECT setval(
    pg_get_serial_sequence('venues', 'id'),
    COALESCE((SELECT MAX(id) FROM venues), 1),
    EXISTS (SELECT 1 FROM venues)
);

SELECT setval(
    pg_get_serial_sequence('events', 'id'),
    COALESCE((SELECT MAX(id) FROM events), 1),
    EXISTS (SELECT 1 FROM events)
);

-- Add venues only when the same name/address pair does not already exist.
INSERT INTO venues (name, address)
SELECT v.name, v.address
FROM (
    VALUES
        ('Toronto Reference Library', '789 Yonge St, Toronto, ON'),
        ('Daniels Spectrum', '585 Dundas St E, Toronto, ON'),
        ('The Great Hall', '1087 Queen St W, Toronto, ON'),
        ('Bahen Center', '40 St George St, Toronto, ON')
) AS v(name, address)
WHERE NOT EXISTS (
    SELECT 1
    FROM venues existing
    WHERE existing.name = v.name
      AND existing.address = v.address
);

-- Add events. Dates are in Toronto local time (EST, UTC-05:00).
INSERT INTO events (
    name,
    description,
    venue_id,
    start_time,
    end_time,
    capacity
)
SELECT
    e.name,
    e.description,
    v.id,
    e.start_time::timestamptz,
    e.end_time::timestamptz,
    e.capacity
FROM (
    VALUES
        (
            'Practical TypeScript: From Types to Tooling',
            'A hands-on evening for developers exploring safer application design, expressive types, and practical TypeScript tooling. Bring a laptop for the guided exercises.',
            'Bahen Center',
            '40 St George St, Toronto, ON',
            '2026-12-03 18:30:00-05:00',
            '2026-12-03 20:30:00-05:00',
            80
        ),
        (
            'Toronto AI Builders Meetup',
            'A friendly meetup for people building with machine learning and generative AI. Share a short project demo, exchange lessons learned, and meet other local builders.',
            'Bahen Center',
            '40 St George St, Toronto, ON',
            '2026-12-10 18:00:00-05:00',
            '2026-12-10 20:00:00-05:00',
            60
        ),
        (
            'Coffee, Careers & Connections',
            'An informal networking session for students, recent graduates, and early-career professionals. Meet new people and trade practical career advice over coffee.',
            'The Great Hall',
            '1087 Queen St W, Toronto, ON',
            '2026-12-05 10:00:00-05:00',
            '2026-12-05 12:00:00-05:00',
            35
        ),
        (
            'Independent Film Night: Short Stories',
            'An evening screening of a curated collection of independent short films, followed by a relaxed audience discussion with local film enthusiasts.',
            'Daniels Spectrum',
            '585 Dundas St E, Toronto, ON',
            '2026-12-12 19:00:00-05:00',
            '2026-12-12 21:30:00-05:00',
            120
        ),
        (
            'Designing Better Digital Experiences',
            'Explore the fundamentals of accessible, user-centred interface design through practical examples and small group activities. Suitable for designers and developers.',
            'Toronto Reference Library',
            '789 Yonge St, Toronto, ON',
            '2026-12-16 18:30:00-05:00',
            '2026-12-16 20:00:00-05:00',
            45
        ),
        (
            'Board Game Social: New Friends Edition',
            'A welcoming evening of modern board games, light strategy, and conversation. No experience or game collection required; hosts will help everyone find a table.',
            'The Great Hall',
            '1087 Queen St W, Toronto, ON',
            '2026-12-19 17:00:00-05:00',
            '2026-12-19 20:00:00-05:00',
            28
        ),
        (
            'Creative Writing Workshop: Finding Your Voice',
            'A guided writing workshop with short prompts, quiet writing time, and optional peer feedback. Bring a notebook and an idea you would like to explore.',
            'Toronto Reference Library',
            '789 Yonge St, Toronto, ON',
            '2027-01-09 13:00:00-05:00',
            '2027-01-09 15:00:00-05:00',
            24
        ),
        (
            'Community Food & Culture Market',
            'Discover local food makers, small creative businesses, and community organizations in a lively afternoon market celebrating Toronto neighbourhoods.',
            'Daniels Spectrum',
            '585 Dundas St E, Toronto, ON',
            '2027-01-16 11:00:00-05:00',
            '2027-01-16 16:00:00-05:00',
            150
        )
) AS e(
    name,
    description,
    venue_name,
    venue_address,
    start_time,
    end_time,
    capacity
)
JOIN LATERAL (
    SELECT id
    FROM venues
    WHERE name = e.venue_name
      AND address = e.venue_address
    ORDER BY id
        LIMIT 1
) v ON TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM events existing
    WHERE existing.venue_id = v.id
      AND existing.name = e.name
      AND existing.start_time = e.start_time::timestamptz
);

COMMIT;

-- Quick verification:
-- SELECT e.id, e.name, v.name AS venue, e.start_time, e.end_time, e.capacity
-- FROM events e
-- JOIN venues v ON v.id = e.venue_id
-- WHERE e.start_time >= CURRENT_TIMESTAMP
-- ORDER BY e.start_time;
