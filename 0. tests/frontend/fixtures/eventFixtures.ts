const SEARCH_RESULT_EVENT_BASE_FIXTURE = {
    venue_id: 1,
    venue_name: "Test Venue",
    venue_address: "123 Test Street",
    capacity: 10,
};

const INITIAL_EVENT_BASE_FIXTURE = {
    id: 1,
    name: "Initial Event",
    venue_id: 1,
};

export const newerSearchResultFixture = {
    ...SEARCH_RESULT_EVENT_BASE_FIXTURE,
    id: 2,
    name: "Newer Result",
    start_time: "2026-10-25T10:00:00Z",
    end_time: "2026-10-25T11:00:00Z",
};

export const olderSearchResultFixture = {
    ...SEARCH_RESULT_EVENT_BASE_FIXTURE,
    id: 1,
    name: "Older Result",
    start_time: "2026-10-24T10:00:00Z",
    end_time: "2026-10-24T11:00:00Z",
};

export const coffeeMeetupEventFixture = {
    name: "Coffee Meetup",
    start_time: "2026-10-24T10:00:00Z",
    end_time: "2026-10-24T11:00:00Z",
    capacity: 10,
};

export const firstInitialRenderEventFixture = {
    id: 1,
    name: "Test Event 1",
    venue_id: 1,
    start_time: "2026-09-10T10:00:00Z",
    end_time: "2026-09-10T11:00:00Z",
    capacity: 10,
};

export const secondInitialRenderEventFixture = {
    id: 2,
    name: "Test Event 2",
    venue_id: 2,
    start_time: "2026-09-11T10:00:00Z",
    end_time: "2026-09-11T11:00:00Z",
    capacity: 20,
};

export const initialEventFixture = {
    ...INITIAL_EVENT_BASE_FIXTURE,
    start_time: "2026-10-24T10:00:00Z",
    end_time: "2026-10-24T11:00:00Z",
    capacity: 10,
};

export const naturalLanguageSearchResultFixture = {
    id: 3,
    ...coffeeMeetupEventFixture,
    venue_id: 1,
};

export const meetAndGreetSearchResultFixture = {
    id: 1,
    name: "Meet and Greet",
    venue_id: 2,
    venue_name: "Moss Park Espresso",
    venue_address: "185 Queen St E",
    start_time: "2026-08-08T22:00:00Z",
    end_time: "2026-08-09T00:00:00Z",
    capacity: 1,
};

export const coffeeMeetupAtMossParkFixture = {
    id: 1,
    ...coffeeMeetupEventFixture,
    venue_id: 2,
    venue_name: "Moss Park Espresso",
    venue_address: "185 Queen St E",
};

export const minimalCoffeeMeetupEventFixture = {
    id: 1,
    name: "Coffee Meetup",
};

export const reloadFailureInitialEventFixture = {
    ...INITIAL_EVENT_BASE_FIXTURE,
    description: "An initial event",
    date: "2026-11-01T10:00:00Z",
    capacity: 10,
};

export const eventCardFixture = {
    id: 1,
    name: "E2E Test Event",
    venue_id: 1,
    start_time: "2026-09-10T10:00:00Z",
    end_time: "2026-09-10T11:00:00Z",
    capacity: 10,
};
