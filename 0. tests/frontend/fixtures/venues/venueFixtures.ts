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
};

export const venueListFixture: Venue[] = [
    firstVenueFixture,
    secondVenueFixture,
];
