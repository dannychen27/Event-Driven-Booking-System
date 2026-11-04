import {
    ConflictException,
    ForbiddenException,
    NotFoundException,
} from "@nestjs/common";
import type { PoolClient } from "pg";

import { BookingsService } from "../../4. backend/src/bookings/bookings.service";
import { DatabaseService } from "../../4. backend/src/database/database.service";
import type { BookingHoldStatusRecord } from "../../4. backend/src/types/bookings/bookings.types";
import {
    BOOKING_SERVICE_INTEGRATION_EVENT_IDS,
    BOOKING_SERVICE_INTEGRATION_EVENT_LIST,
    BOOKING_SERVICE_INTEGRATION_EVENTS,
    BOOKING_SERVICE_INTEGRATION_USERS,
} from "./fixtures/bookings/bookingServiceFixtures";
import {
    HOLD_DURATION_MS,
    HOLD_EXPIRATION_TOLERANCE_MS,
} from "./constants/bookingServiceIntegrationTestConstants";
import {
    expectOneFulfilledAndOneRejected,
    expireHold,
} from "./helpers/bookingServiceIntegrationTestHelpers";
import {
    createConflictCheckBarrier,
    createSynchronizedClient,
} from "./helpers/bookingConcurrencyTestHelpers";


describe("BookingsService integration", () => {
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


    it("creates a 10-minute hold", async () => {
        const userId = BOOKING_SERVICE_INTEGRATION_USERS.primary;
        const eventId = BOOKING_SERVICE_INTEGRATION_EVENTS.standard.id;

        const hold = await service.createHold(userId, eventId);

        expect(hold).toMatchObject({
            user_id: userId,
            event_id: eventId,
            status: "active",
        });

        const createdAt = new Date(hold.created_at).getTime();
        const expiresAt = new Date(hold.expires_at).getTime();

        // The expiration should be approximately 10 minutes after creation.
        expect(expiresAt - createdAt).toBeGreaterThanOrEqual(HOLD_DURATION_MS);
        expect(expiresAt - createdAt).toBeLessThan(
            HOLD_DURATION_MS + HOLD_EXPIRATION_TOLERANCE_MS,
        );

        const result = await db.query(
            `
                SELECT id, user_id, event_id, status
                FROM booking_holds
                WHERE id = $1;
            `,
            [hold.id],
        );

        expect(result.rows).toEqual([
            expect.objectContaining({
                id: hold.id,
                user_id: userId,
                event_id: eventId,
                status: "active",
            }),
        ]);
    });


    it("rejects a hold when the user has already booked the same event", async () => {
        const userId = BOOKING_SERVICE_INTEGRATION_USERS.primary;
        const eventId = BOOKING_SERVICE_INTEGRATION_EVENTS.standard.id;

        await service.createBooking(userId, eventId);

        await expect(
            service.createHold(userId, eventId),
        ).rejects.toThrow(
            `User ${userId} has already booked event ${eventId}`,
        );

        const result = await db.query(
            `
                SELECT id
                FROM booking_holds
                WHERE user_id = $1
                  AND event_id = $2;
            `,
            [userId, eventId],
        );

        expect(result.rows).toHaveLength(0);
    });


    it("rejects a hold that overlaps the user's existing booking", async () => {
        const userId = BOOKING_SERVICE_INTEGRATION_USERS.primary;
        const eventA = BOOKING_SERVICE_INTEGRATION_EVENTS.overlappingA;
        const eventB = BOOKING_SERVICE_INTEGRATION_EVENTS.overlappingB;

        await service.createBooking(userId, eventA.id);

        await expect(
            service.createHold(userId, eventB.id),
        ).rejects.toThrow(
            `User ${userId} has a conflicting booking`,
        );

        const result = await db.query(
            `
                SELECT id
                FROM booking_holds
                WHERE user_id = $1
                  AND event_id = $2;
            `,
            [userId, eventB.id],
        );

        expect(result.rows).toHaveLength(0);
    });


    it("rejects duplicate active holds for the same user and event", async () => {
        const userId = BOOKING_SERVICE_INTEGRATION_USERS.primary;
        const eventId = BOOKING_SERVICE_INTEGRATION_EVENTS.standard.id;

        await service.createHold(userId, eventId);

        await expect(
            service.createHold(userId, eventId),
        ).rejects.toBeInstanceOf(ConflictException);

        const result = await db.query(
            `
                SELECT id
                FROM booking_holds
                WHERE user_id = $1
                  AND event_id = $2
                  AND status = 'active';
            `,
            [userId, eventId],
        );

        expect(result.rows).toHaveLength(1);
    });


    it("rejects holds when event capacity is already full", async () => {
        const userId = BOOKING_SERVICE_INTEGRATION_USERS.primary;
        const eventId = BOOKING_SERVICE_INTEGRATION_EVENTS.capacityOne.id;

        await service.createBooking(userId, eventId);

        await expect(
            service.createHold(
                BOOKING_SERVICE_INTEGRATION_USERS.secondary,
                eventId,
            ),
        ).rejects.toThrow(`Event ${eventId} is fully booked`);

        const result = await db.query(
            `
                SELECT id
                FROM booking_holds
                WHERE event_id = $1;
            `,
            [eventId],
        );

        expect(result.rows).toHaveLength(0);
    });


    it("allows only one concurrent hold when capacity is one", async () => {
        const eventId = BOOKING_SERVICE_INTEGRATION_EVENTS.capacityOne.id;
        const [primaryUser, secondaryUser] = Object.values(
            BOOKING_SERVICE_INTEGRATION_USERS,
        );

        const results = await Promise.allSettled([
            service.createHold(primaryUser, eventId),
            service.createHold(secondaryUser, eventId),
        ]);

        expectOneFulfilledAndOneRejected(results);

        expect(results.find(result => result.status === "rejected")).toEqual(
            expect.objectContaining({
                reason: expect.objectContaining({
                    message: `Event ${eventId} is fully booked`,
                }),
            }),
        );

        const result = await db.query(
            `
                SELECT id
                FROM booking_holds
                WHERE event_id = $1
                  AND status = 'active'
                  AND expires_at > statement_timestamp();
            `,
            [eventId],
        );

        expect(result.rows).toHaveLength(1);
    });


    it.each([
        {
            description: "A then B",
            firstEvent: BOOKING_SERVICE_INTEGRATION_EVENTS.overlappingA,
            secondEvent: BOOKING_SERVICE_INTEGRATION_EVENTS.overlappingB,
        },
        {
            description: "B then A",
            firstEvent: BOOKING_SERVICE_INTEGRATION_EVENTS.overlappingB,
            secondEvent: BOOKING_SERVICE_INTEGRATION_EVENTS.overlappingA,
        },
    ])(
        "rejects overlapping active holds ($description)",
        async ({ firstEvent, secondEvent }) => {
            const userId = BOOKING_SERVICE_INTEGRATION_USERS.primary;

            await service.createHold(userId, firstEvent.id);

            await expect(
                service.createHold(userId, secondEvent.id),
            ).rejects.toBeInstanceOf(ConflictException);

            const result = await db.query(
                `
                    SELECT id
                    FROM booking_holds
                    WHERE user_id = $1
                      AND status = 'active'
                      AND expires_at > statement_timestamp();
                `,
                [userId],
            );

            expect(result.rows).toHaveLength(1);
        },
    );


    it("rejects a direct booking when an active hold consumes the last spot", async () => {
        const eventId = BOOKING_SERVICE_INTEGRATION_EVENTS.capacityOne.id;

        await service.createHold(
            BOOKING_SERVICE_INTEGRATION_USERS.primary,
            eventId,
        );

        await expect(
            service.createBooking(
                BOOKING_SERVICE_INTEGRATION_USERS.secondary,
                eventId,
            ),
        ).rejects.toThrow(`Event ${eventId} is fully booked`);

        const result = await db.query(
            `
                SELECT id
                FROM bookings
                WHERE event_id = $1;
            `,
            [eventId],
        );

        expect(result.rows).toHaveLength(0);
    });


    it("rejects a direct booking overlapping another active hold", async () => {
        const userId = BOOKING_SERVICE_INTEGRATION_USERS.primary;
        const eventA = BOOKING_SERVICE_INTEGRATION_EVENTS.overlappingA;
        const eventB = BOOKING_SERVICE_INTEGRATION_EVENTS.overlappingB;

        await service.createHold(userId, eventA.id);

        await expect(
            service.createBooking(userId, eventB.id),
        ).rejects.toBeInstanceOf(ConflictException);

        const result = await db.query(
            `
                SELECT id
                FROM bookings
                WHERE user_id = $1
                  AND event_id = $2;
            `,
            [userId, eventB.id],
        );

        expect(result.rows).toHaveLength(0);
    });


    it("replaces an expired hold for the same user and event", async () => {
        const userId = BOOKING_SERVICE_INTEGRATION_USERS.primary;
        const eventId = BOOKING_SERVICE_INTEGRATION_EVENTS.standard.id;

        const originalHold = await service.createHold(userId, eventId);

        // Simulate expiration without waiting 10 minutes.
        await expireHold(db, originalHold.id);

        const replacementHold = await service.createHold(userId, eventId);

        expect(replacementHold.id).not.toBe(originalHold.id);
        expect(replacementHold.status).toBe("active");

        const result = await db.query(
            `
                SELECT id, status
                FROM booking_holds
                WHERE user_id = $1
                  AND event_id = $2
                ORDER BY id;
            `,
            [userId, eventId],
        );

        expect(result.rows).toEqual([
            {
                id: originalHold.id,
                status: "expired",
            },
            {
                id: replacementHold.id,
                status: "active",
            },
        ]);
    });


    it("does not count an expired hold toward event capacity", async () => {
        const originalHold = await service.createHold(
            BOOKING_SERVICE_INTEGRATION_USERS.primary,
            BOOKING_SERVICE_INTEGRATION_EVENTS.capacityOne.id,
        );

        // Simulate expiration while preserving the schema constraint.
        await expireHold(db, originalHold.id);

        // The expired hold must no longer consume the event's only spot.
        const booking = await service.createBooking(
            BOOKING_SERVICE_INTEGRATION_USERS.secondary,
            BOOKING_SERVICE_INTEGRATION_EVENTS.capacityOne.id,
        );

        expect(booking.event_id).toBe(BOOKING_SERVICE_INTEGRATION_EVENTS.capacityOne.id);

        const result = await db.query<BookingHoldStatusRecord>(
            `
                SELECT status, expires_at
                FROM booking_holds
                WHERE id = $1;
            `,
            [originalHold.id],
        );

        // Lazy expiration: the timestamp releases capacity even before
        // the stored status is changed from 'active' to 'expired'.
        expect(result.rows[0].status).toBe("active");
        expect(new Date(result.rows[0].expires_at).getTime()).toBeLessThan(Date.now());
    });


    it("rejects a direct booking when the user already holds the same event", async () => {
        const userId = BOOKING_SERVICE_INTEGRATION_USERS.primary;
        const eventId = BOOKING_SERVICE_INTEGRATION_EVENTS.standard.id;

        await service.createHold(userId, eventId);

        await expect(
            service.createBooking(userId, eventId),
        ).rejects.toThrow(
            `User ${userId} has an active hold for event ${eventId}`,
        );

        const result = await db.query(
            `
            SELECT id
            FROM bookings
            WHERE user_id = $1
              AND event_id = $2;
        `,
            [userId, eventId],
        );

        expect(result.rows).toHaveLength(0);
    });


    it("confirms an active hold and creates a booking", async () => {
        const userId = BOOKING_SERVICE_INTEGRATION_USERS.primary;
        const eventId = BOOKING_SERVICE_INTEGRATION_EVENTS.standard.id;

        const hold = await service.createHold(userId, eventId);
        const booking = await service.confirmHold(userId, hold.id);

        expect(booking).toMatchObject({
            user_id: userId,
            event_id: eventId,
        });

        const result = await db.query(
            `
                SELECT status
                FROM booking_holds
                WHERE id = $1;
            `,
            [hold.id],
        );

        expect(result.rows).toEqual([{ status: "confirmed" }]);

        const bookingResult = await db.query(
            `
                SELECT id, user_id, event_id
                FROM bookings
                WHERE id = $1;
            `,
            [booking.id],
        );

        expect(bookingResult.rows).toEqual([
            expect.objectContaining({
                id: booking.id,
                user_id: userId,
                event_id: eventId,
            }),
        ]);
    });


    it("rolls back hold confirmation when booking insertion fails", async () => {
        const userId = BOOKING_SERVICE_INTEGRATION_USERS.primary;
        const eventId = BOOKING_SERVICE_INTEGRATION_EVENTS.standard.id;

        const hold = await service.createHold(userId, eventId);

        // Insert a booking directly to trigger the unique user-event constraint.
        await db.query(
            `
                INSERT INTO bookings (user_id, event_id)
                VALUES ($1, $2);
            `,
            [userId, eventId],
        );

        // Confirmation updates the hold before attempting the conflicting insert.
        await expect(
            service.confirmHold(userId, hold.id),
        ).rejects.toMatchObject({
            code: "23505",
        });

        // The failed transaction must roll back the hold status update.
        const holdResult = await db.query<BookingHoldStatusRecord>(
            `
                SELECT status, expires_at
                FROM booking_holds
                WHERE id = $1;
            `,
            [hold.id],
        );

        expect(holdResult.rows).toHaveLength(1);
        expect(holdResult.rows[0].status).toBe("active");

        // The manually inserted booking remains the only booking.
        const bookingResult = await db.query<{ count: number }>(
            `
            SELECT COUNT(*)::int AS count
            FROM bookings
            WHERE user_id = $1
              AND event_id = $2;
        `,
            [userId, eventId],
        );

        expect(bookingResult.rows[0].count).toBe(1);
    });


    it("rejects confirmation of an expired hold", async () => {
        const userId = BOOKING_SERVICE_INTEGRATION_USERS.primary;
        const eventId = BOOKING_SERVICE_INTEGRATION_EVENTS.standard.id;

        const hold = await service.createHold(userId, eventId);

        await expireHold(db, hold.id);

        await expect(
            service.confirmHold(userId, hold.id),
        ).rejects.toThrow(
            `Booking hold ${hold.id} has expired`,
        );

        const result = await db.query(
            `
                SELECT status
                FROM booking_holds
                WHERE id = $1;
            `,
            [hold.id],
        );

        expect(result.rows).toEqual([{ status: "active" }]);

        const bookingResult = await db.query(
            `SELECT id FROM bookings WHERE user_id = $1 AND event_id = $2`,
            [userId, eventId],
        );

        expect(bookingResult.rows).toHaveLength(0);
    });


    it.each(["confirmed", "cancelled"])(
        "rejects confirmation of a %s hold",
        async status => {
            const userId = BOOKING_SERVICE_INTEGRATION_USERS.primary;
            const eventId = BOOKING_SERVICE_INTEGRATION_EVENTS.standard.id;

            const hold = await service.createHold(userId, eventId);

            await db.query(
                `
                    UPDATE booking_holds
                    SET status = $1
                    WHERE id = $2;
                `,
                [status, hold.id],
            );

            await expect(
                service.confirmHold(userId, hold.id),
            ).rejects.toThrow(
                `Booking hold ${hold.id} is no longer active`,
            );

            const bookingResult = await db.query(
                `SELECT id FROM bookings WHERE user_id = $1 AND event_id = $2`,
                [userId, eventId],
            );

            expect(bookingResult.rows).toHaveLength(0);
        },
    );


    it("rejects confirmation by a user who does not own the hold", async () => {
        const ownerId = BOOKING_SERVICE_INTEGRATION_USERS.primary;
        const otherUserId = BOOKING_SERVICE_INTEGRATION_USERS.secondary;
        const eventId = BOOKING_SERVICE_INTEGRATION_EVENTS.standard.id;

        const hold = await service.createHold(ownerId, eventId);

        await expect(
            service.confirmHold(otherUserId, hold.id),
        ).rejects.toBeInstanceOf(ForbiddenException);

        const result = await db.query(
            `
                SELECT status
                FROM booking_holds
                WHERE id = $1;
            `,
            [hold.id],
        );

        expect(result.rows).toEqual([{ status: "active" }]);

        const bookingResult = await db.query(
            `SELECT id FROM bookings WHERE event_id = $1`,
            [eventId],
        );

        expect(bookingResult.rows).toHaveLength(0);
    });


    it("rejects confirmation when the hold does not exist", async () => {
        await expect(
            service.confirmHold(
                BOOKING_SERVICE_INTEGRATION_USERS.primary,
                -1,
            ),
        ).rejects.toBeInstanceOf(NotFoundException);
    });


    it("allows only one concurrent confirmation of the same hold", async () => {
        const userId = BOOKING_SERVICE_INTEGRATION_USERS.primary;
        const eventId = BOOKING_SERVICE_INTEGRATION_EVENTS.standard.id;

        const hold = await service.createHold(userId, eventId);

        const results = await Promise.allSettled([
            service.confirmHold(userId, hold.id),
            service.confirmHold(userId, hold.id),
        ]);

        expectOneFulfilledAndOneRejected(results);

        expect(results.find(result => result.status === "rejected")).toEqual(
            expect.objectContaining({
                reason: expect.any(ConflictException),
            }),
        );

        const bookingResult = await db.query(
            `
                SELECT id
                FROM bookings
                WHERE user_id = $1
                  AND event_id = $2;
            `,
            [userId, eventId],
        );

        expect(bookingResult.rows).toHaveLength(1);

        const holdResult = await db.query<BookingHoldStatusRecord>(
            `
                SELECT status, expires_at
                FROM booking_holds
                WHERE id = $1;
            `,
            [hold.id],
        );

        expect(holdResult.rows).toHaveLength(1);
        expect(holdResult.rows[0].status).toBe("confirmed");
    });


    it("preserves event capacity when a hold is confirmed", async () => {
        const eventId = BOOKING_SERVICE_INTEGRATION_EVENTS.capacityOne.id;
        const userId = BOOKING_SERVICE_INTEGRATION_USERS.primary;
        const otherUserId = BOOKING_SERVICE_INTEGRATION_USERS.secondary;

        const hold = await service.createHold(userId, eventId);

        const booking = await service.confirmHold(userId, hold.id);

        expect(booking.event_id).toBe(eventId);

        // The confirmed hold is no longer counted separately.
        // Its booking continues to consume the event's only spot.
        await expect(
            service.createHold(otherUserId, eventId),
        ).rejects.toThrow(`Event ${eventId} is fully booked`);

        const bookingResult = await db.query(
            `SELECT id FROM bookings WHERE event_id = $1`,
            [eventId],
        );

        expect(bookingResult.rows).toHaveLength(1);

        const holdResult = await db.query<BookingHoldStatusRecord>(
            `
                SELECT status, expires_at
                FROM booking_holds
                WHERE id = $1;
            `,
            [hold.id],
        );

        expect(holdResult.rows).toHaveLength(1);
        expect(holdResult.rows[0].status).toBe("confirmed");
    });


    it("rejects confirmation when the hold expires while waiting for the event lock", async () => {
        const userId = BOOKING_SERVICE_INTEGRATION_USERS.primary;
        const eventId = BOOKING_SERVICE_INTEGRATION_EVENTS.standard.id;

        const hold = await service.createHold(userId, eventId);

        let signalLockAcquired!: () => void;
        let releaseLock!: () => void;

        const lockAcquired = new Promise<void>(resolve => {
            signalLockAcquired = resolve;
        });

        const lockRelease = new Promise<void>(resolve => {
            releaseLock = resolve;
        });

        // Hold the event row lock until the confirmation request is blocked.
        const lockTransaction = db.transaction(async client => {
            await client.query(
                `
                    SELECT id
                    FROM events
                    WHERE id = $1
                    FOR UPDATE;
                `,
                [eventId],
            );

            signalLockAcquired();

            await lockRelease;

            // Expire the hold while confirmation is waiting for the event lock.
            await client.query(
                `
                    UPDATE booking_holds
                    SET
                        created_at = statement_timestamp() - INTERVAL '2 minutes',
                        expires_at = statement_timestamp() - INTERVAL '1 minute'
                    WHERE id = $1;
                `,
                [hold.id],
            );
        });

        await lockAcquired;

        const confirmation = service.confirmHold(userId, hold.id);

        let confirmationIsWaiting = false;

        try {
            // Wait until PostgreSQL confirms that confirmation is blocked.
            const deadline = Date.now() + 3000;

            while (Date.now() < deadline) {
                const result = await db.query<{ count: number }>(
                    `
                        SELECT COUNT(*)::int AS count
                        FROM pg_stat_activity
                        WHERE datname = current_database()
                          AND pid <> pg_backend_pid()
                          AND state = 'active'
                          AND wait_event_type = 'Lock'
                          AND query ILIKE '%FROM events%'
                          AND query ILIKE '%FOR UPDATE%';
                    `,
                );

                if (result.rows[0].count > 0) {
                    confirmationIsWaiting = true;
                    break;
                }

                await new Promise(resolve => setTimeout(resolve, 10));
            }
        } finally {
            // Always release the lock, even if the polling assertion fails.
            releaseLock();
        }

        await lockTransaction;

        expect(confirmationIsWaiting).toBe(true);

        await expect(confirmation).rejects.toThrow(
            `Booking hold ${hold.id} has expired`,
        );

        const holdResult = await db.query<BookingHoldStatusRecord>(
            `
                SELECT status, expires_at
                FROM booking_holds
                WHERE id = $1;
            `,
            [hold.id],
        );

        expect(holdResult.rows[0].status).toBe("active");
        expect(new Date(holdResult.rows[0].expires_at).getTime())
            .toBeLessThan(Date.now());

        const bookingResult = await db.query(
            `
                SELECT id
                FROM bookings
                WHERE user_id = $1
                  AND event_id = $2;
            `,
            [userId, eventId],
        );

        expect(bookingResult.rows).toHaveLength(0);
    });
});