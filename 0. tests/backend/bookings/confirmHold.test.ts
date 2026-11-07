import { ConflictException } from "@nestjs/common";

import { BOOKING_RESULT_FIXTURE } from "../fixtures/shared/sharedTestFixtures";
import { createRequestHash } from "../../../4. backend/src/bookings/bookings.service.helpers";
import { mockInsertedBooking } from "../helpers/bookingTestHelpers";
import { mockEventExists } from "../helpers/eventsTestHelpers";
import { mockUserExists } from "../helpers/usersTestHelpers";
import { mockTransaction } from "../../utils/testHelpers";

import { BookingsService } from "../../../4. backend/src/bookings/bookings.service";

describe("BookingsService.confirmHold", () => {
    let service: BookingsService;
    let db: any;
    let client: any;

    const userId = 1;
    const holdId = 10;
    const eventId = 1;
    const idempotencyKey = "confirm-hold-123";

    const holdReference = (status = "active") => ({
        id: holdId,
        user_id: userId,
        event_id: eventId,
        created_at: "2026-09-05T19:00:00Z",
        expires_at: "2030-09-05T20:00:00Z",
        status,
    });

    const requestHash = createRequestHash({
        operation: "confirm_hold",
        user_id: userId,
        resource_id: holdId,
    });

    beforeEach(() => {
        client = { query: jest.fn() };
        db = {};
        mockTransaction(db, client);
        service = new BookingsService(db);
    });

    it("should save an idempotency record when confirming a hold", async () => {
        // 1. Initial hold lookup.
        client.query.mockResolvedValueOnce({
            rows: [holdReference()],
        });

        // 2. Lock user.
        mockUserExists(client, userId);

        // 3. No existing idempotency record.
        client.query.mockResolvedValueOnce({ rows: [] });

        // 4. Lock event.
        mockEventExists(client, eventId);

        // 5. Lock hold.
        client.query.mockResolvedValueOnce({
            rows: [holdReference()],
        });

        // 6. Confirm hold.
        client.query.mockResolvedValueOnce({
            rows: [{ ...holdReference("confirmed"), status: "confirmed" }],
        });

        // 7. Insert booking.
        mockInsertedBooking(client, 123, userId, eventId);

        // 8. Save idempotency record.
        client.query.mockResolvedValueOnce({ rows: [] });

        const result = await service.confirmHold(
            userId,
            holdId,
            idempotencyKey,
        );

        expect(result).toEqual(BOOKING_RESULT_FIXTURE);
        expect(client.query).toHaveBeenCalledTimes(8);

        const [saveQuery, saveParams] = client.query.mock.calls[7];

        expect(saveQuery).toContain("INSERT INTO idempotency_requests");
        expect(saveParams).toEqual([
            userId,
            "confirm_hold",
            idempotencyKey,
            requestHash,
            201,
            JSON.stringify(BOOKING_RESULT_FIXTURE),
        ]);
    });

    it("should replay the original booking for an identical idempotent request", async () => {
        // The hold is already confirmed, but the initial lookup still
        // provides the owner and event needed to check idempotency.
        client.query.mockResolvedValueOnce({
            rows: [holdReference("confirmed")],
        });

        mockUserExists(client, userId);

        client.query.mockResolvedValueOnce({
            rows: [
                {
                    request_hash: requestHash,
                    response_body: BOOKING_RESULT_FIXTURE,
                },
            ],
        });

        const result = await service.confirmHold(
            userId,
            holdId,
            idempotencyKey,
        );

        expect(result).toEqual(BOOKING_RESULT_FIXTURE);
        expect(client.query).toHaveBeenCalledTimes(3);
    });

    it("should reject reuse of an idempotency key for a different request", async () => {
        client.query.mockResolvedValueOnce({
            rows: [holdReference()],
        });

        mockUserExists(client, userId);

        client.query.mockResolvedValueOnce({
            rows: [
                {
                    request_hash: "a".repeat(64),
                    response_body: BOOKING_RESULT_FIXTURE,
                },
            ],
        });

        await expect(service.confirmHold(userId, holdId, idempotencyKey))
            .rejects.toThrow(ConflictException);

        expect(client.query).toHaveBeenCalledTimes(3);
    });

    it("should commit an expired hold without creating a booking or idempotency record", async () => {
        client.query.mockResolvedValueOnce({
            rows: [holdReference()],
        });

        mockUserExists(client, userId);

        client.query.mockResolvedValueOnce({ rows: [] });

        mockEventExists(client, eventId);

        client.query.mockResolvedValueOnce({
            rows: [holdReference()],
        });

        // The database determines that the hold has expired.
        client.query.mockResolvedValueOnce({
            rows: [{ ...holdReference("expired"), status: "expired" }],
        });

        await expect(service.confirmHold(userId, holdId, idempotencyKey))
            .rejects.toThrow(ConflictException);

        expect(client.query).toHaveBeenCalledTimes(6);
    });
});
