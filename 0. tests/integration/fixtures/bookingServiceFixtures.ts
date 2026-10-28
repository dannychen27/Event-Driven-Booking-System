export const STANDARD_INTEGRATION_EVENT = {
    id: 100,
    name: "Integration Test Event",
    venue_id: 1,
    start_time: "2026-09-20T10:00:00Z",
    end_time: "2026-09-20T11:00:00Z",
    capacity: 10,
};

export const CAPACITY_ONE_INTEGRATION_EVENT = {
    id: 101,
    name: "Concurrent Booking Test",
    venue_id: 1,
    start_time: "2026-09-21T10:00:00Z",
    end_time: "2026-09-21T11:00:00Z",
    capacity: 1,
};

export const ROLLBACK_INTEGRATION_EVENT = {
    id: 102,
    name: "Transaction Rollback Test",
    venue_id: 1,
    start_time: "2026-09-22T10:00:00Z",
    end_time: "2026-09-22T11:00:00Z",
    capacity: 10,
};

export const BOOKING_SERVICE_INTEGRATION_EVENTS = {
    standard: STANDARD_INTEGRATION_EVENT,
    capacityOne: CAPACITY_ONE_INTEGRATION_EVENT,
    rollback: ROLLBACK_INTEGRATION_EVENT,
};

export const BOOKING_SERVICE_INTEGRATION_EVENT_LIST = Object.values(
    BOOKING_SERVICE_INTEGRATION_EVENTS,
);

export const BOOKING_SERVICE_INTEGRATION_EVENT_IDS =
    BOOKING_SERVICE_INTEGRATION_EVENT_LIST.map(event => event.id);

export const BOOKING_SERVICE_INTEGRATION_USERS = {
    primary: 1,
    secondary: 2,
};
