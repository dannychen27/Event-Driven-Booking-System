-- Add optional descriptive and presentation details to venues.
-- Arrays default to empty so existing venues remain valid.

ALTER TABLE venues
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS venue_type VARCHAR(100),
    ADD COLUMN IF NOT EXISTS image_url TEXT,
    ADD COLUMN IF NOT EXISTS amenities TEXT[] NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS accessibility_features TEXT[] NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS transit_info TEXT;
