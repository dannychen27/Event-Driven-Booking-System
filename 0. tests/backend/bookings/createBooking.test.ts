import { BookingsService } from "../../../4. backend/src/bookings/bookings.service";
import { BOOKING_RESULT_FIXTURE } from "../fixtures/shared/sharedTestFixtures";
import {
    EVENT_NOT_FOUND_MESSAGE,
    USER_NOT_FOUND_MESSAGE,
} from "../fixtures/shared/errorMessageFixtures";
import {
    mockNoDuplicateBooking, mockDuplicateBooking,
    mockBookingCount,
    mockNoScheduleConflict, mockScheduleConflict,
    mockInsertedBooking,
    mockNoActiveHold, mockNoHoldScheduleConflict,
} from "../helpers/bookingTestHelpers";
import { mockUserExists, mockUserDoesNotExist } from "../helpers/usersTestHelpers";
import { mockEventExists, mockEventDoesNotExist } from "../helpers/eventsTestHelpers"
import { expectNthQuery, mockTransaction } from "../../utils/testHelpers";
import { createRequestHash } from "../../../4. backend/src/bookings/bookings.service.helpers";

describe("BookingsService.createBooking", () => {
    let service: BookingsService;
    let db: any;
    let client: any;

    beforeEach(() => {
        client = {
            query: jest.fn(),
        };

        db = {};
        mockTransaction(db, client);
        service = new BookingsService(db);
    });

    it("should successfully create a booking", async () => {
        mockUserExists(client, 1);
        mockEventExists(client, 1);

        // Expire stale holds for the event.
        client.query.mockResolvedValueOnce({ rows: [] });

        mockNoDuplicateBooking(client);
        mockNoActiveHold(client);
        mockBookingCount(client, 2);
        mockNoScheduleConflict(client);
        mockNoHoldScheduleConflict(client);
        mockInsertedBooking(client, 123, 1, 1);

        const result = await service.createBooking(1, 1);

        expect(result).toEqual(BOOKING_RESULT_FIXTURE);
        expect(db.transaction).toHaveBeenCalledTimes(1);
        expect(client.query).toHaveBeenCalledTimes(9);

        expectNthQuery(client, 1, "FROM users", [1]);
        expectNthQuery(client, 2, "FROM events", [1]);
        expectNthQuery(client, 3, "UPDATE booking_holds", [1]);
        expectNthQuery(client, 4, "FROM bookings", [1, 1]);
        expectNthQuery(client, 5, "FROM booking_holds", [1, 1]);
        expectNthQuery(client, 6, "COUNT(*)", [1]);
        expectNthQuery(client, 7, "JOIN events", [
            1,
            "2026-09-10T11:00:00Z",
            "2026-09-10T10:00:00Z",
        ]);
        expectNthQuery(client, 8, "FROM booking_holds h", [
            1,
            "2026-09-10T11:00:00Z",
            "2026-09-10T10:00:00Z",
        ]);
        expectNthQuery(client, 9, "INSERT INTO bookings", [1, 1]);
    });

    it("should save an idempotency record when creating a booking", async () => {
        const idempotencyKey = "create-booking-123";

        mockUserExists(client, 1);

        // No existing idempotency record.
        client.query.mockResolvedValueOnce({ rows: [] });

        mockEventExists(client, 1);

        // Expire stale holds for the event.
        client.query.mockResolvedValueOnce({ rows: [] });

        mockNoDuplicateBooking(client);
        mockNoActiveHold(client);
        mockBookingCount(client, 2);
        mockNoScheduleConflict(client);
        mockNoHoldScheduleConflict(client);
        mockInsertedBooking(client, 123, 1, 1);

        // Save the successful idempotency record.
        client.query.mockResolvedValueOnce({ rows: [] });

        const result = await service.createBooking(1, 1, idempotencyKey);

        expect(result).toEqual(BOOKING_RESULT_FIXTURE);
        expect(client.query).toHaveBeenCalledTimes(11);

        // User lock precedes idempotency lookup.
        expectNthQuery(client, 1, "FROM users", [1]);
        expectNthQuery(client, 2, "FROM idempotency_requests", [
            1,
            "create_booking",
            idempotencyKey,
        ]);

        // Booking and idempotency record are persisted.
        expectNthQuery(client, 10, "INSERT INTO bookings", [1, 1]);
        expectNthQuery(client, 11, "INSERT INTO idempotency_requests", [
            1,
            "create_booking",
            idempotencyKey,
            createRequestHash({
                operation: "create_booking",
                user_id: 1,
                resource_id: 1,
            }),
            201,
            JSON.stringify(BOOKING_RESULT_FIXTURE),
        ]);
    });

    it("should replay the original booking for an identical idempotent request", async () => {
        const idempotencyKey = "create-booking-123";

        mockUserExists(client, 1);

        client.query.mockResolvedValueOnce({
            rows: [{
                request_hash: createRequestHash({
                    operation: "create_booking",
                    user_id: 1,
                    resource_id: 1,
                }),
                response_body: BOOKING_RESULT_FIXTURE,
            }],
        });

        const result = await service.createBooking(1, 1, idempotencyKey);

        expect(result).toEqual(BOOKING_RESULT_FIXTURE);
        expect(client.query).toHaveBeenCalledTimes(2);

        expectNthQuery(client, 1, "FROM users", [1]);
        expectNthQuery(client, 2, "FROM idempotency_requests", [
            1,
            "create_booking",
            idempotencyKey,
        ]);

        // Replay must not insert another booking or idempotency record.
        expect(client.query).not.toHaveBeenCalledWith(
            expect.stringContaining("INSERT INTO bookings"),
            expect.anything(),
        );
        expect(client.query).not.toHaveBeenCalledWith(
            expect.stringContaining("INSERT INTO idempotency_requests"),
            expect.anything(),
        );
    });

    it("should reject reuse of an idempotency key for a different event", async () => {
        const idempotencyKey = "create-booking-123";

        mockUserExists(client, 1);

        client.query.mockResolvedValueOnce({
            rows: [{
                request_hash: "a".repeat(64),
                response_body: BOOKING_RESULT_FIXTURE,
            }],
        });

        await expect(
            service.createBooking(1, 2, idempotencyKey),
        ).rejects.toThrow(
            "Idempotency-Key was already used with a different request",
        );

        // The conflict is detected before locking the event.
        expect(client.query).toHaveBeenCalledTimes(2);

        expectNthQuery(client, 1, "FROM users", [1]);
        expectNthQuery(client, 2, "FROM idempotency_requests", [
            1,
            "create_booking",
            idempotencyKey,
        ]);
    });

    it("should reject the booking when the user does not exist", async () => {
        mockUserDoesNotExist(client);

        await expect(service.createBooking(999, 1))
            .rejects.toThrow(USER_NOT_FOUND_MESSAGE);

        expect(client.query).toHaveBeenCalledTimes(1);

        expectNthQuery(client, 1, "FROM users", [999]);
    });

    it("should reject the booking when the event does not exist", async () => {
        mockUserExists(client, 1);
        mockEventDoesNotExist(client);

        await expect(service.createBooking(1, 999))
            .rejects.toThrow(EVENT_NOT_FOUND_MESSAGE);

        expect(client.query).toHaveBeenCalledTimes(2);

        expectNthQuery(client, 1, "FROM users", [1]);
        expectNthQuery(client, 2, "FROM events", [999]);
    });

    it("should reject a duplicate booking", async () => {
        mockUserExists(client, 1);
        mockEventExists(client, 1);

        // Expire stale holds for the event.
        client.query.mockResolvedValueOnce({ rows: [] });

        mockDuplicateBooking(client, 123);

        await expect(service.createBooking(1, 1))
            .rejects.toThrow("User 1 has already booked event 1");

        expect(client.query).toHaveBeenCalledTimes(4);

        expectNthQuery(client, 1, "FROM users", [1]);
        expectNthQuery(client, 2, "FROM events", [1]);
        expectNthQuery(client, 3, "UPDATE booking_holds", [1]);
        expectNthQuery(client, 4, "FROM bookings", [1, 1]);
    });

    it("should reject a booking when the event is at capacity", async () => {
        mockUserExists(client, 1);
        mockEventExists(client, 1, 10);

        // Expire stale holds for the event.
        client.query.mockResolvedValueOnce({ rows: [] });

        mockNoDuplicateBooking(client);
        mockNoActiveHold(client);
        mockBookingCount(client, 10);

        await expect(service.createBooking(1, 1))
            .rejects.toThrow("Event 1 is fully booked");

        expect(client.query).toHaveBeenCalledTimes(6);

        expectNthQuery(client, 3, "UPDATE booking_holds", [1]);
        expectNthQuery(client, 4, "FROM bookings", [1, 1]);
        expectNthQuery(client, 5, "FROM booking_holds", [1, 1]);
        expectNthQuery(client, 6, "COUNT(*)", [1]);
    });

    it("should reject a booking when the user has a schedule conflict", async () => {
        mockUserExists(client, 1);
        mockEventExists(client, 1);

        // Expire stale holds for the event.
        client.query.mockResolvedValueOnce({ rows: [] });

        mockNoDuplicateBooking(client);
        mockNoActiveHold(client);
        mockBookingCount(client, 0);
        mockScheduleConflict(client, 456);

        await expect(service.createBooking(1, 1)).rejects
            .toThrow("User 1 has a conflicting booking with event 456");

        expect(client.query).toHaveBeenCalledTimes(7);

        expectNthQuery(client, 1, "FROM users", [1]);
        expectNthQuery(client, 2, "FROM events", [1]);
        expectNthQuery(client, 3, "UPDATE booking_holds", [1]);
        expectNthQuery(client, 4, "FROM bookings", [1, 1]);
        expectNthQuery(client, 5, "FROM booking_holds", [1, 1]);
        expectNthQuery(client, 6, "COUNT(*)", [1]);
        expectNthQuery(client, 7, "JOIN events", [
            1,
            "2026-09-10T11:00:00Z",
            "2026-09-10T10:00:00Z",
        ]);
    });
});
