/**
 * Assigns a stable colour class to a free-form venue type.
 *
 * Known categories use intentional colour assignments.
 * Unrecognized categories use deterministic hashing as a fallback.
 */
const VENUE_TYPE_COLORS: Record<string, string> = {
    "arts and culture centre": "venue-card__type--palette-1",
    "café": "venue-card__type--palette-3",
    "event venue": "venue-card__type--palette-4",
    "public library": "venue-card__type--palette-2",
    "university building": "venue-card__type--palette-0",
};

export function getVenueTypeColorClass(venueType: string): string {
    const normalizedType = venueType.trim().replace(/\s+/g, " ").toLowerCase();

    if (!normalizedType) {
        return "venue-card__type--default";
    }

    const knownColor = VENUE_TYPE_COLORS[normalizedType];

    if (knownColor) {
        return knownColor;
    }

    // FNV-1a: deterministic fallback for unrecognized venue types.
    let hash = 2166136261;

    for (let index = 0; index < normalizedType.length; index += 1) {
        hash = Math.imul(hash ^ normalizedType.charCodeAt(index), 16777619);
    }

    const paletteIndex = (hash >>> 0) % 8;

    return `venue-card__type--palette-${paletteIndex}`;
}
