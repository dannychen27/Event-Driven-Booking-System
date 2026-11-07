import {
    ConflictException,
    NotFoundException,
} from "@nestjs/common";
import type { PoolClient } from "pg";

import { BookingsService } from "../../../4. backend/src/bookings/bookings.service";
import { DatabaseService } from "../../../4. backend/src/database/database.service";
import {
    BOOKING_SERVICE_INTEGRATION_EVENT_IDS,
    BOOKING_SERVICE_INTEGRATION_EVENT_LIST,
    BOOKING_SERVICE_INTEGRATION_EVENTS,
    BOOKING_SERVICE_INTEGRATION_USERS,
} from "../fixtures/bookings/bookingServiceFixtures";
import {
    expectOneFulfilledAndOneRejected,
} from "../helpers/bookingServiceIntegrationTestHelpers";
import {
    createConflictCheckBarrier,
    createSynchronizedClient,
} from "../helpers/bookingConcurrencyTestHelpers";


describe("booking operations", () => {
    let db: DatabaseService;
    let service: BookingsService;

    beforeAll(async () => {
        db = new DatabaseService();
        service = new BookingsService(db);

        for (const event of BOOKING_SERVICE_INTEGRATION_EVENT_LIST) {
            await db.query(
                `
                    INSERT INTO events
                        (id, name, venue_id, start_time, end_time, capacity)
                    VALUES ($1, $2, $3, $4, $5, $6);
                `,
                [
                    event.id,
                    event.name,
                    event.venue_id,
                    event.start_time,
                    event.end_time,
                    event.capacity,
                ],
            );
        }
    });

    afterEach(async () => {
        await db.query(
            `
                DELETE FROM idempotency_requests
                WHERE user_id = $1
                  AND operation = 'create_booking'
                  AND idempotency_key LIKE 'booking-operations-%';
            `,
            [BOOKING_SERVICE_INTEGRATION_USERS.primary],
        );

        await db.query(
            `DELETE FROM booking_holds WHERE event_id = ANY($1::int[])`,
            [BOOKING_SERVICE_INTEGRATION_EVENT_IDS],
        );

        await db.query(
            `DELETE FROM bookings WHERE event_id = ANY($1::int[])`,
            [BOOKING_SERVICE_INTEGRATION_EVENT_IDS],
        );
    });

    afterAll(async () => {
        await db.query(
            `DELETE FROM booking_holds WHERE event_id = ANY($1::int[])`,
            [BOOKING_SERVICE_INTEGRATION_EVENT_IDS],
        );

        await db.query(
            `DELETE FROM bookings WHERE event_id = ANY($1::int[])`,
            [BOOKING_SERVICE_INTEGRATION_EVENT_IDS],
        );

        await db.query(
            `DELETE FROM events WHERE id = ANY($1::int[])`,
            [BOOKING_SERVICE_INTEGRATION_EVENT_IDS],
        );

        await db.onModuleDestroy();
    });

    it("creates a booking using the real database", async () => {
        const userId = BOOKING_SERVICE_INTEGRATION_USERS.primary;
        const eventId = BOOKING_SERVICE_INTEGRATION_EVENTS.standard.id;

        const booking = await service.createBooking(userId, eventId);

        expect(booking).toMatchObject({
            user_id: userId,
            event_id: eventId,
        });

        const result = await db.query(
            `SELECT id, user_id, event_id FROM bookings WHERE id = $1`,
            [booking.id],
        );

        expect(result.rows).toEqual([
            expect.objectContaining({
                id: booking.id,
                user_id: userId,
                event_id: eventId,
            }),
        ]);
    });

    it("replays the original booking when the same idempotency key is reused", async () => {
        const userId = BOOKING_SERVICE_INTEGRATION_USERS.primary;
        const eventId = BOOKING_SERVICE_INTEGRATION_EVENTS.standard.id;
        const idempotencyKey = "booking-operations-replay-001";

        const firstBooking = await service.createBooking(
            userId,
            eventId,
            idempotencyKey,
        );

        const replayedBooking = await service.createBooking(
            userId,
            eventId,
            idempotencyKey,
        );

        const expectedBooking = JSON.parse(JSON.stringify(firstBooking));
        expect(replayedBooking).toEqual(expectedBooking);

        const bookingResult = await db.query(
            `
            SELECT id, user_id, event_id
            FROM bookings
            WHERE user_id = $1
              AND event_id = $2;
        `,
            [userId, eventId],
        );

        expect(bookingResult.rows).toHaveLength(1);
        expect(bookingResult.rows[0].id).toBe(firstBooking.id);

        const idempotencyResult = await db.query(
            `
            SELECT request_hash, response_status, response_body
            FROM idempotency_requests
            WHERE user_id = $1
              AND operation = 'create_booking'
              AND idempotency_key = $2;
        `,
            [userId, idempotencyKey],
        );

        expect(idempotencyResult.rows).toHaveLength(1);
        expect(idempotencyResult.rows[0]).toMatchObject({
            response_status: 201,
            response_body: expectedBooking,
        });
    });

    it("rejects reuse of an idempotency key for a different event", async () => {
        const userId = BOOKING_SERVICE_INTEGRATION_USERS.primary;
        const firstEventId = BOOKING_SERVICE_INTEGRATION_EVENTS.standard.id;
        const secondEventId = BOOKING_SERVICE_INTEGRATION_EVENTS.capacityOne.id;
        const idempotencyKey = "booking-operations-mismatch-001";

        const firstBooking = await service.createBooking(userId, firstEventId, idempotencyKey);

        await expect(service.createBooking(userId, secondEventId, idempotencyKey))
            .rejects.toBeInstanceOf(ConflictException);

        const bookingResult = await db.query(
            `
            SELECT id, user_id, event_id
            FROM bookings
            WHERE user_id = $1
              AND event_id = ANY($2::int[]);
        `,
            [userId, [firstEventId, secondEventId]],
        );

        expect(bookingResult.rows).toHaveLength(1);
        expect(bookingResult.rows[0]).toMatchObject({
            id: firstBooking.id,
            user_id: userId,
            event_id: firstEventId,
        });

        const idempotencyResult = await db.query(
            `
            SELECT request_hash, response_status, response_body
            FROM idempotency_requests
            WHERE user_id = $1
              AND operation = 'create_booking'
              AND idempotency_key = $2;
        `,
            [userId, idempotencyKey],
        );

        expect(idempotencyResult.rows).toHaveLength(1);
        expect(idempotencyResult.rows[0]).toMatchObject({
            response_status: 201,
            response_body: JSON.parse(JSON.stringify(firstBooking)),
        });
    });

    it("allows retrying the same idempotency key after a failed booking request", async () => {
        const userId = BOOKING_SERVICE_INTEGRATION_USERS.primary;
        const blockerUserId = BOOKING_SERVICE_INTEGRATION_USERS.secondary;
        const eventId = BOOKING_SERVICE_INTEGRATION_EVENTS.capacityOne.id;
        const idempotencyKey = "booking-operations-retry-001";

        // Fill the event's only available booking slot.
        const blockerBooking = await service.createBooking(blockerUserId, eventId);

        // The failed request must not consume the idempotency key.
        await expect(service.createBooking(userId, eventId, idempotencyKey))
            .rejects.toBeInstanceOf(ConflictException);

        const failedRequestResult = await db.query(
            `
                SELECT id
                FROM idempotency_requests
                WHERE user_id = $1
                  AND operation = 'create_booking'
                  AND idempotency_key = $2;
            `,
            [userId, idempotencyKey],
        );

        expect(failedRequestResult.rows).toHaveLength(0);

        // Free the capacity and retry with the exact same key.
        await db.query(
            `DELETE FROM bookings WHERE id = $1;`,
            [blockerBooking.id],
        );

        const booking = await service.createBooking(userId, eventId, idempotencyKey);

        expect(booking).toMatchObject({
            user_id: userId,
            event_id: eventId,
        });

        const bookingResult = await db.query(
            `
            SELECT id, user_id, event_id
            FROM bookings
            WHERE user_id = $1
              AND event_id = $2;
        `,
            [userId, eventId],
        );

        expect(bookingResult.rows).toHaveLength(1);
        expect(bookingResult.rows[0].id).toBe(booking.id);

        const idempotencyResult = await db.query(
            `
            SELECT response_status, response_body
            FROM idempotency_requests
            WHERE user_id = $1
              AND operation = 'create_booking'
              AND idempotency_key = $2;
        `,
            [userId, idempotencyKey],
        );

        expect(idempotencyResult.rows).toHaveLength(1);
        expect(idempotencyResult.rows[0]).toMatchObject({
            response_status: 201,
            response_body: JSON.parse(JSON.stringify(booking)),
        });
    });

    it("replays the original booking for concurrent requests with the same idempotency key", async () => {
        const userId = BOOKING_SERVICE_INTEGRATION_USERS.primary;
        const eventId = BOOKING_SERVICE_INTEGRATION_EVENTS.standard.id;
        const idempotencyKey = "booking-operations-concurrent-001";

        const [firstBooking, secondBooking] = await Promise.all([
            service.createBooking(userId, eventId, idempotencyKey),
            service.createBooking(userId, eventId, idempotencyKey),
        ]);

        const expectedBooking = JSON.parse(JSON.stringify(firstBooking));

        expect(secondBooking).toEqual(expectedBooking);

        const bookingResult = await db.query(
            `
            SELECT id, user_id, event_id
            FROM bookings
            WHERE user_id = $1
              AND event_id = $2;
        `,
            [userId, eventId],
        );

        expect(bookingResult.rows).toHaveLength(1);
        expect(bookingResult.rows[0]).toMatchObject({
            id: firstBooking.id,
            user_id: userId,
            event_id: eventId,
        });

        const idempotencyResult = await db.query(
            `
            SELECT response_status, response_body
            FROM idempotency_requests
            WHERE user_id = $1
              AND operation = 'create_booking'
              AND idempotency_key = $2;
        `,
            [userId, idempotencyKey],
        );

        expect(idempotencyResult.rows).toHaveLength(1);
        expect(idempotencyResult.rows[0]).toMatchObject({
            response_status: 201,
            response_body: expectedBooking,
        });
    });

    it("rejects duplicate user-event pairs at the database level", async () => {
        const userId = BOOKING_SERVICE_INTEGRATION_USERS.primary;
        const eventId = BOOKING_SERVICE_INTEGRATION_EVENTS.standard.id;

        await db.query(
            `
            INSERT INTO bookings (user_id, event_id)
            VALUES ($1, $2);
        `,
            [userId, eventId],
        );

        await expect(
            db.query(
                `
                INSERT INTO bookings (user_id, event_id)
                VALUES ($1, $2);
            `,
                [userId, eventId],
            ),
        ).rejects.toMatchObject({
            code: "23505",
        });

        const result = await db.query(
            `
                SELECT id
                FROM bookings
                WHERE user_id = $1
                  AND event_id = $2;
            `,
            [userId, eventId],
        );

        expect(result.rows).toHaveLength(1);
    });

    it("rolls back changes when a transaction fails", async () => {
        const userId = BOOKING_SERVICE_INTEGRATION_USERS.primary;
        const eventId = BOOKING_SERVICE_INTEGRATION_EVENTS.rollback.id;

        await expect(
            db.transaction(async client => {
                await client.query(
                    `
                        INSERT INTO bookings (user_id, event_id)
                        VALUES ($1, $2);
                    `,
                    [userId, eventId],
                );

                throw new Error("forced transaction failure");
            }),
        ).rejects.toThrow("forced transaction failure");

        const result = await db.query(
            `
                SELECT id
                FROM bookings
                WHERE user_id = $1 AND event_id = $2;
            `,
            [userId, eventId],
        );

        expect(result.rows).toEqual([]);
    });

    it("allows only one concurrent booking when capacity is one", async () => {
        const eventId = BOOKING_SERVICE_INTEGRATION_EVENTS.capacityOne.id;
        const [primaryUser, secondaryUser] = Object.values(
            BOOKING_SERVICE_INTEGRATION_USERS,
        );

        const results = await Promise.allSettled([
            service.createBooking(primaryUser, eventId),
            service.createBooking(secondaryUser, eventId),
        ]);

        expectOneFulfilledAndOneRejected(results);

        expect(results.find(result => result.status === "rejected")).toMatchObject({
            reason: {
                message: `Event ${eventId} is fully booked`,
            },
        });

        const result = await db.query(
            `SELECT id FROM bookings WHERE event_id = $1`,
            [eventId],
        );

        expect(result.rows).toHaveLength(1);
    });

    it("allows only one concurrent cancellation of the same booking", async () => {
        const userId = BOOKING_SERVICE_INTEGRATION_USERS.primary;
        const eventId = BOOKING_SERVICE_INTEGRATION_EVENTS.standard.id;

        const booking = await service.createBooking(userId, eventId);

        const results = await Promise.allSettled([
            service.cancelBooking(userId, booking.id),
            service.cancelBooking(userId, booking.id),
        ]);

        expectOneFulfilledAndOneRejected(results);

        expect(results.find(result => result.status === "rejected"))
            .toEqual(
                expect.objectContaining({
                    reason: expect.any(NotFoundException),
                }),
            );

        const result = await db.query(
            `SELECT id FROM bookings WHERE id = $1`,
            [booking.id],
        );

        expect(result.rows).toHaveLength(0);
    });


    it("prevents concurrent overlapping bookings for the same user", async () => {
        const userId = BOOKING_SERVICE_INTEGRATION_USERS.primary;
        const eventA = BOOKING_SERVICE_INTEGRATION_EVENTS.overlappingA;
        const eventB = BOOKING_SERVICE_INTEGRATION_EVENTS.overlappingB;

        const originalTransaction = db.transaction.bind(db);
        const transactionSpy = jest.spyOn(db, "transaction");

        const waitAtBarrier = createConflictCheckBarrier();

        transactionSpy.mockImplementation(
            async <T>(
                callback: (client: PoolClient) => Promise<T>,
            ): Promise<T> => {
                return originalTransaction(client =>
                    callback(createSynchronizedClient(client, waitAtBarrier)),
                );
            },
        );

        let results: PromiseSettledResult<Awaited<ReturnType<typeof service.createBooking>>>[];
        try {
            results = await Promise.allSettled([
                service.createBooking(userId, eventA.id),
                service.createBooking(userId, eventB.id),
            ]);
        } finally {
            transactionSpy.mockRestore();
        }

        expectOneFulfilledAndOneRejected(results);

        expect(results.find(result => result.status === "rejected")).toEqual(
            expect.objectContaining({
                reason: expect.any(ConflictException),
            }),
        );

        const result = await db.query(
            `
            SELECT id, user_id, event_id
            FROM bookings
            WHERE user_id = $1
              AND event_id = ANY($2::int[]);
        `,
            [userId, [eventA.id, eventB.id]],
        );

        expect(result.rows).toHaveLength(1);
    });
});
