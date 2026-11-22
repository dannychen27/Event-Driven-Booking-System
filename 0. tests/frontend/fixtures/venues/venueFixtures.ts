import type { Venue } from "../../../../3. frontend/src/types/venues/Venue";

export const firstVenueFixture: Venue = {
    id: 1,
    name: "Test Venue 1",
    address: "123 Test Street",
};

export const secondVenueFixture: Venue = {
    id: 2,
    name: "Test Venue 2",
    address: "456 Test Avenue",
};

export const venueCardFixture: Venue = {
    id: 1,
    name: "E2E Test Venue",
    address: "123 Test Street",
    description: "A welcoming space for community events and workshops.",
    venue_type: "Community space",
    image_url: "https://example.com/venue.jpg",
    amenities: ["Wi-Fi", "Projector"],
    accessibility_features: ["Step-free entrance"],
    transit_info: "A short walk from the test station.",
};

export const venueListFixture: Venue[] = [
    firstVenueFixture,
    secondVenueFixture,
];
