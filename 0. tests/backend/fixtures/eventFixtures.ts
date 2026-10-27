import { mossParkEspressoFixture } from "./venueFixtures";

export const allEventsFixture = [
    {
        id: 1,
        name: "Meet and Greet",
        venue_id: 2,
        ...mossParkEspressoFixture,
        start_time: "2026-09-10T10:00:00Z",
        end_time: "2026-09-10T11:00:00Z",
        capacity: 10,
    },
    {
        id: 2,
        name: "Concert",
        venue_id: 3,
        venue_name: "Example Venue",
        venue_address: "123 Example St",
        start_time: "2026-09-11T14:00:00Z",
        end_time: "2026-09-11T15:00:00Z",
        capacity: 20,
    },
];
