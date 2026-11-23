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

-- These descriptions and images are illustrative showcase content.
-- They do not imply affiliation with, or verified facilities at, these venues.
UPDATE venues AS existing
SET
    description = showcase.description,
    venue_type = showcase.venue_type,
    image_url = showcase.image_url,
    amenities = showcase.amenities,
    accessibility_features = showcase.accessibility_features,
    transit_info = showcase.transit_info
FROM (
    VALUES
        (
            'Toronto Reference Library',
            '789 Yonge St, Toronto, ON',
            'A welcoming public-library setting for talks, learning sessions, and community gatherings.',
            'Public library',
            'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1200&q=80',
            ARRAY[]::TEXT[],
            ARRAY[]::TEXT[],
            NULL::TEXT
        ),
        (
            'Daniels Spectrum',
            '585 Dundas St E, Toronto, ON',
            'A creative community setting suited to arts, culture, and collaborative events.',
            'Arts and culture centre',
            'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=1200&q=80',
            ARRAY[]::TEXT[],
            ARRAY[]::TEXT[],
            NULL::TEXT
        ),
        (
            'The Great Hall',
            '1087 Queen St W, Toronto, ON',
            'An event-oriented setting for performances, celebrations, and community gatherings.',
            'Event venue',
            'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
            ARRAY[]::TEXT[],
            ARRAY[]::TEXT[],
            NULL::TEXT
        ),
        (
            'Bahen Center',
            '40 St George St, Toronto, ON',
            'A university building in the heart of the St. George campus, used here as an illustrative event location.',
            'University building',
            'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1200&q=80',
            ARRAY[]::TEXT[],
            ARRAY[]::TEXT[],
            NULL::TEXT
        )
) AS showcase(
    name,
    address,
    description,
    venue_type,
    image_url,
    amenities,
    accessibility_features,
    transit_info
)
WHERE existing.name = showcase.name
  AND existing.address = showcase.address;


-- Add events. Dates are in Toronto local time (EST, UTC-05:00).
INSERT INTO events (
    name,
    description,
    venue_id,
    start_time,
    end_time,
    capacity,
    image_url
)
SELECT
    e.name,
    e.description,
    v.id,
    e.start_time::timestamptz,
    e.end_time::timestamptz,
    e.capacity,
    e.image_url
FROM (
    VALUES
        (
            'Practical TypeScript: From Types to Tooling',
            'A hands-on evening for developers exploring safer application design, expressive types, and practical TypeScript tooling. Bring a laptop for the guided exercises.',
            'Bahen Center',
            '40 St George St, Toronto, ON',
            '2026-12-03 18:30:00-05:00',
            '2026-12-03 20:30:00-05:00',
            80,
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80'
        ),
        (
            'Toronto AI Builders Meetup',
            'A friendly meetup for people building with machine learning and generative AI. Share a short project demo, exchange lessons learned, and meet other local builders.',
            'Bahen Center',
            '40 St George St, Toronto, ON',
            '2026-12-10 18:00:00-05:00',
            '2026-12-10 20:00:00-05:00',
            60,
            'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80'
        ),
        (
            'Coffee, Careers & Connections',
            'An informal networking session for students, recent graduates, and early-career professionals. Meet new people and trade practical career advice over coffee.',
            'The Great Hall',
            '1087 Queen St W, Toronto, ON',
            '2026-12-05 10:00:00-05:00',
            '2026-12-05 12:00:00-05:00',
            35,
            'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80'
        ),
        (
            'Independent Film Night: Short Stories',
            'An evening screening of a curated collection of independent short films, followed by a relaxed audience discussion with local film enthusiasts.',
            'Daniels Spectrum',
            '585 Dundas St E, Toronto, ON',
            '2026-12-12 19:00:00-05:00',
            '2026-12-12 21:30:00-05:00',
            120,
            'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80'
        ),
        (
            'Designing Better Digital Experiences',
            'Explore the fundamentals of accessible, user-centred interface design through practical examples and small group activities. Suitable for designers and developers.',
            'Toronto Reference Library',
            '789 Yonge St, Toronto, ON',
            '2026-12-16 18:30:00-05:00',
            '2026-12-16 20:00:00-05:00',
            45,
            'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80'
        ),
        (
            'Board Game Social: New Friends Edition',
            'A welcoming evening of modern board games, light strategy, and conversation. No experience or game collection required; hosts will help everyone find a table.',
            'The Great Hall',
            '1087 Queen St W, Toronto, ON',
            '2026-12-19 17:00:00-05:00',
            '2026-12-19 20:00:00-05:00',
            28,
            'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=1200&q=80'
        ),
        (
            'Creative Writing Workshop: Finding Your Voice',
            'A guided writing workshop with short prompts, quiet writing time, and optional peer feedback. Bring a notebook and an idea you would like to explore.',
            'Toronto Reference Library',
            '789 Yonge St, Toronto, ON',
            '2027-01-09 13:00:00-05:00',
            '2027-01-09 15:00:00-05:00',
            24,
            'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80'
        ),
        (
            'Community Food & Culture Market',
            'Discover local food makers, small creative businesses, and community organizations in a lively afternoon market celebrating Toronto neighbourhoods.',
            'Daniels Spectrum',
            '585 Dundas St E, Toronto, ON',
            '2027-01-16 11:00:00-05:00',
            '2027-01-16 16:00:00-05:00',
            150,
            'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80'
        )
) AS e(
    name,
    description,
    venue_name,
    venue_address,
    start_time,
    end_time,
    capacity,
    image_url
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

-- Update images for showcase events that already existed.
UPDATE events existing
SET image_url = showcase.image_url
    FROM (
    VALUES
        (
            'Practical TypeScript: From Types to Tooling',
            'Bahen Center',
            '40 St George St, Toronto, ON',
            '2026-12-03 18:30:00-05:00',
            'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80'
        ),
        (
            'Toronto AI Builders Meetup',
            'Bahen Center',
            '40 St George St, Toronto, ON',
            '2026-12-10 18:00:00-05:00',
            'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80'
        ),
        (
            'Coffee, Careers & Connections',
            'The Great Hall',
            '1087 Queen St W, Toronto, ON',
            '2026-12-05 10:00:00-05:00',
            'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80'
        ),
        (
            'Independent Film Night: Short Stories',
            'Daniels Spectrum',
            '585 Dundas St E, Toronto, ON',
            '2026-12-12 19:00:00-05:00',
            'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80'
        ),
        (
            'Designing Better Digital Experiences',
            'Toronto Reference Library',
            '789 Yonge St, Toronto, ON',
            '2026-12-16 18:30:00-05:00',
            'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80'
        ),
        (
            'Board Game Social: New Friends Edition',
            'The Great Hall',
            '1087 Queen St W, Toronto, ON',
            '2026-12-19 17:00:00-05:00',
            'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=1200&q=80'
        ),
        (
            'Creative Writing Workshop: Finding Your Voice',
            'Toronto Reference Library',
            '789 Yonge St, Toronto, ON',
            '2027-01-09 13:00:00-05:00',
            'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80'
        ),
        (
            'Community Food & Culture Market',
            'Daniels Spectrum',
            '585 Dundas St E, Toronto, ON',
            '2027-01-16 11:00:00-05:00',
            'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80'
        )
) AS showcase(name, venue_name, venue_address, start_time, image_url)
JOIN venues v
ON v.name = showcase.venue_name
    AND v.address = showcase.venue_address
WHERE existing.venue_id = v.id
  AND existing.name = showcase.name
  AND existing.start_time = showcase.start_time::timestamptz;


-- Assign representative photography and descriptive content to showcase venues.
-- Images are illustrative and do not claim to depict the named venues,
-- except for the Toronto Reference Library photograph.

WITH showcase_venue_data (
    name,
    address,
    image_url,
    venue_type,
    description
) AS (
    VALUES
        (
            'Bahen Center',
            '40 St George St, Toronto, ON',
            'https://images.unsplash.com/photo-1769284008279-46e4c97959db?auto=format&fit=crop&w=1400&q=80',
            'University building',
            'A university building in the heart of the St. George campus, used here as an illustrative event location.'
        ),
        (
            'Toronto Reference Library',
            '789 Yonge St, Toronto, ON',
            'https://images.unsplash.com/photo-1760662173303-97363db3c875?auto=format&fit=crop&w=1400&q=80',
            NULL::VARCHAR(100),
            NULL::TEXT
        ),
        (
            'Daniels Spectrum',
            '585 Dundas St E, Toronto, ON',
            'https://images.unsplash.com/photo-1768366778536-f4e32064cc2c?auto=format&fit=crop&w=1400&q=80',
            NULL::VARCHAR(100),
            NULL::TEXT
        ),
        (
            'The Great Hall',
            '1087 Queen St W, Toronto, ON',
            'https://images.unsplash.com/photo-1780384024889-ad01f3bba07c?auto=format&fit=crop&w=1400&q=80',
            NULL::VARCHAR(100),
            NULL::TEXT
        ),
        (
            'Moss Park Espresso',
            '185 Queen St E',
            'https://images.unsplash.com/photo-1759282336232-140500b6a877?auto=format&fit=crop&w=1400&q=80',
            'Café',
            'A neighbourhood café in downtown Toronto, used here as an illustrative event location.'
        )
)
UPDATE venues AS venue
SET
    image_url = showcase.image_url,
    venue_type = COALESCE(showcase.venue_type, venue.venue_type),
    description = COALESCE(showcase.description, venue.description)
    FROM showcase_venue_data AS showcase
WHERE venue.name = showcase.name
  AND venue.address = showcase.address;

COMMIT;

-- Quick verification:
-- SELECT e.id, e.name, v.name AS venue, e.start_time, e.end_time, e.capacity
-- FROM events e
-- JOIN venues v ON v.id = e.venue_id
-- WHERE e.start_time >= CURRENT_TIMESTAMP
-- ORDER BY e.start_time;
