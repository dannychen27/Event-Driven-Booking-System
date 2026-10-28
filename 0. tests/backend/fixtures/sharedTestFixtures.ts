export const BOOKING_RESULT_FIXTURE = {
    id: 123,
    user_id: 1,
    event_id: 1,
    created_at: "2026-09-05T20:00:00Z",
};

export const RANKED_EVENT_CANDIDATES_FIXTURE = [
    { id: 1, name: "Coffee Meetup" },
    { id: 2, name: "Outdoor Yoga" },
    { id: 3, name: "Networking Night" },
];

export const NATURAL_LANGUAGE_SEARCH_CANDIDATES_FIXTURE = [
    {
        id: 1,
        name: "Coffee Meetup",
        description: "An informal social gathering over coffee.",
        venue_name: "Community Cafe",
        venue_address: "Toronto",
        start_time: "2026-10-24T14:00:00Z",
    },
    {
        id: 2,
        name: "Outdoor Yoga",
        description: "A relaxing yoga session in a park.",
        venue_name: "Central Park",
        venue_address: "Toronto",
        start_time: "2026-10-25T14:00:00Z",
    },
];

export const ALL_VENUES_FIXTURE = [
    {
        id: 1,
        name: "Venue 1",
        address: "1 Test Street",
    },
    {
        id: 2,
        name: "Venue 2",
        address: "2 Test Street",
    },
];

export const GEMINI_EVENT_RANKING_CANDIDATES_FIXTURE = [
    {
        id: 1,
        name: "Coffee Meetup",
        description: "An informal gathering to meet people.",
        venue_name: "Central Cafe",
        venue_address: "123 Main Street",
        start_time: "2026-11-01T18:00:00Z",
    },
    {
        id: 2,
        name: "Outdoor Yoga",
        description: "A guided outdoor yoga session.",
        venue_name: "City Park",
        venue_address: "456 Park Road",
        start_time: "2026-11-02T10:00:00Z",
    },
];

export const GEMINI_EVENT_RANKING_REQUEST_FIXTURE = {
    query: "Find a relaxing outdoor activity",
    intent: "An outdoor activity that helps people relax",
};

export const GEMINI_EVENT_RANKING_MISSING_KEY_FIXTURE = {
    query: "Find an event",
    intent: "some intent",
};

export const BAHEN_CENTRE_VENUE_FIXTURE = {
    id: 1,
    name: "Bahen Centre",
    address: "40 St George St",
};

export const MAX_NATURAL_LANGUAGE_INTENT_LENGTH = 300;
export const MAX_EVENT_SEARCH_KEYWORD_LENGTH = 100;
