export const E2E_TEST_EVENT_FIXTURE = {
    id: 1,
    name: "E2E Test Event",
    venue_id: 1,
    venue_name: "E2E Test Venue",
    venue_address: "1 Test Street",
    start_time: "2026-09-10T10:00:00.000Z",
    end_time: "2026-09-10T11:00:00.000Z",
    capacity: 10,
};

export const E2E_CONFLICTING_EVENT_FIXTURE = {
    id: 2,
    name: "E2E Conflicting Event",
    venue_id: 1,
    venue_name: "E2E Test Venue",
    venue_address: "1 Test Street",
    start_time: "2026-09-10T10:30:00.000Z",
    end_time: "2026-09-10T11:30:00.000Z",
    capacity: 10,
};

export const E2E_FULL_EVENT_FIXTURE = {
    id: 3,
    name: "E2E Full Event",
    venue_id: 1,
    venue_name: "E2E Test Venue",
    venue_address: "1 Test Street",
    start_time: "2026-09-10T12:00:00.000Z",
    end_time: "2026-09-10T13:00:00.000Z",
    capacity: 1,
};

export const E2E_NONEXISTENT_EVENT_ID = 999;
