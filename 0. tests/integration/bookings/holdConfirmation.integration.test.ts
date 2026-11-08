import {
    ConflictException,
    ForbiddenException,
    NotFoundException,
} from "@nestjs/common";

import { BookingsService } from "../../../4. backend/src/bookings/bookings.service";
import { DatabaseService } from "../../../4. backend/src/database/database.service";
import { BookingHoldExpirationService } from "../../../4. backend/src/bookings/booking-hold-expiration.service";
import type { BookingHoldStatusRecord } from "../../../4. backend/src/types/bookings/bookings.types";
import {
    BOOKING_SERVICE_INTEGRATION_EVENT_IDS,
    BOOKING_SERVICE_INTEGRATION_EVENT_LIST,
    BOOKING_SERVICE_INTEGRATION_EVENTS,
    BOOKING_SERVICE_INTEGRATION_USERS,
} from "../fixtures/bookings/bookingServiceFixtures";
import {
    expectOneFulfilledAndOneRejected,
    expireHold,
} from "../helpers/bookingServiceIntegrationTestHelpers";
import { pauseTransactionAfterQuery } from "./helpers/databaseTestHelpers";


describe("hold confirmation", () => {
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
                  AND operation = 'confirm_hold'
                  AND idempotency_key LIKE 'hold-confirmation-%';
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


    it("replays the original booking when the same confirmation key is reused", async () => {
        const userId = BOOKING_SERVICE_INTEGRATION_USERS.primary;
        const eventId = BOOKING_SERVICE_INTEGRATION_EVENTS.standard.id;
        const idempotencyKey = "hold-confirmation-replay-001";

        const hold = await service.createHold(userId, eventId);
        const firstBooking = await service.confirmHold(userId, hold.id, idempotencyKey);
        const replayedBooking = await service.confirmHold(userId, hold.id, idempotencyKey);

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
        expect(bookingResult.rows[0]).toMatchObject({
            id: firstBooking.id,
            user_id: userId,
            event_id: eventId,
        });

        const holdResult = await db.query(
            `
                SELECT status
                FROM booking_holds
                WHERE id = $1;
            `,
            [hold.id],
        );

        expect(holdResult.rows).toEqual([{ status: "confirmed" }]);

        const idempotencyResult = await db.query(
            `
            SELECT response_status, response_body
            FROM idempotency_requests
            WHERE user_id = $1
              AND operation = 'confirm_hold'
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


    it("replays the original booking for concurrent confirmation requests with the same key", async () => {
        const userId = BOOKING_SERVICE_INTEGRATION_USERS.primary;
        const eventId = BOOKING_SERVICE_INTEGRATION_EVENTS.standard.id;
        const idempotencyKey = "hold-confirmation-concurrent-001";

        const hold = await service.createHold(userId, eventId);

        const [firstBooking, secondBooking] = await Promise.all([
            service.confirmHold(userId, hold.id, idempotencyKey),
            service.confirmHold(userId, hold.id, idempotencyKey),
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

        const holdResult = await db.query(
            `
                SELECT status
                FROM booking_holds
                WHERE id = $1;
            `,
            [hold.id],
        );

        expect(holdResult.rows).toEqual([{ status: "confirmed" }]);

        const idempotencyResult = await db.query(
            `
            SELECT response_status, response_body
            FROM idempotency_requests
            WHERE user_id = $1
              AND operation = 'confirm_hold'
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


    it("rejects reuse of a confirmation key for a different hold", async () => {
        const userId = BOOKING_SERVICE_INTEGRATION_USERS.primary;
        const standardEventId = BOOKING_SERVICE_INTEGRATION_EVENTS.standard.id;
        const capacityOneEventId = BOOKING_SERVICE_INTEGRATION_EVENTS.capacityOne.id;
        const idempotencyKey = "hold-confirmation-mismatch-001";

        const firstHold = await service.createHold(userId, standardEventId);
        const secondHold = await service.createHold(userId, capacityOneEventId);
        const firstBooking = await service.confirmHold(userId, firstHold.id, idempotencyKey);

        await expect(service.confirmHold(userId, secondHold.id, idempotencyKey))
            .rejects.toBeInstanceOf(ConflictException);

        const bookingResult = await db.query(
            `
                SELECT id, user_id, event_id
                FROM bookings
                WHERE user_id = $1
                  AND event_id = ANY($2::int[]);
            `,
            [userId, [standardEventId, capacityOneEventId]],
        );

        expect(bookingResult.rows).toHaveLength(1);
        expect(bookingResult.rows[0]).toMatchObject({
            id: firstBooking.id,
            user_id: userId,
            event_id: standardEventId,
        });

        const holdResult = await db.query(
            `
                SELECT id, status
                FROM booking_holds
                WHERE id = ANY($1::int[])
                ORDER BY id;
            `,
            [[firstHold.id, secondHold.id]],
        );

        expect(holdResult.rows).toEqual([
            { id: firstHold.id, status: "confirmed" },
            { id: secondHold.id, status: "active" },
        ]);

        const idempotencyResult = await db.query(
            `
            SELECT response_status, response_body
            FROM idempotency_requests
            WHERE user_id = $1
              AND operation = 'confirm_hold'
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


    it("rejects confirmation of an expired hold without saving an idempotency record", async () => {
        const userId = BOOKING_SERVICE_INTEGRATION_USERS.primary;
        const eventId = BOOKING_SERVICE_INTEGRATION_EVENTS.standard.id;
        const idempotencyKey = "hold-confirmation-expired-001";

        const hold = await service.createHold(userId, eventId);

        await expireHold(db, hold.id);

        await expect(service.confirmHold(userId, hold.id, idempotencyKey))
            .rejects.toThrow(`Booking hold ${hold.id} has expired`);

        const holdResult = await db.query(
            `
                SELECT status
                FROM booking_holds
                WHERE id = $1;
            `,
            [hold.id],
        );

        expect(holdResult.rows).toEqual([{ status: "expired" }]);

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

        const idempotencyResult = await db.query(
            `
            SELECT id
            FROM idempotency_requests
            WHERE user_id = $1
              AND operation = 'confirm_hold'
              AND idempotency_key = $2;
        `,
            [userId, idempotencyKey],
        );

        expect(idempotencyResult.rows).toHaveLength(0);
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

        expect(holdResult.rows[0].status).toBe("expired");
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


    it("allows confirmation to win while the expiration worker skips the locked hold", async () => {
        const userId = BOOKING_SERVICE_INTEGRATION_USERS.primary;
        const eventId = BOOKING_SERVICE_INTEGRATION_EVENTS.standard.id;

        const hold = await service.createHold(userId, eventId);
        const expirationService = new BookingHoldExpirationService(db);

        // Give confirmation enough time to reach its status transition.
        await db.query(
            `
            UPDATE booking_holds
            SET expires_at = statement_timestamp() + INTERVAL '3 seconds'
            WHERE id = $1;
        `,
            [hold.id],
        );

        const transactionGate = pauseTransactionAfterQuery(db, {
            matches: query =>
                query.includes("UPDATE booking_holds")
                && query.includes("SET status = CASE"),
        });

        let confirmation: ReturnType<BookingsService["confirmHold"]> | undefined;
        let worker: ReturnType<BookingHoldExpirationService["expireExpiredHolds"]> | undefined;
        try {
            // Start confirmation and wait until its status update has succeeded.
            confirmation = service.confirmHold(userId, hold.id);

            await transactionGate.matched;

            // Wait until PostgreSQL considers the hold expired.
            let holdHasExpired = false;
            const deadline = Date.now() + 5000;

            while (Date.now() < deadline) {
                const result = await db.query<{ expired: boolean }>(
                    `
                    SELECT expires_at <= clock_timestamp() AS expired
                    FROM booking_holds
                    WHERE id = $1;
                `,
                    [hold.id],
                );

                if (result.rows[0].expired) {
                    holdHasExpired = true;
                    break;
                }

                await new Promise(resolve => setTimeout(resolve, 10));
            }

            expect(holdHasExpired).toBe(true);

            // Confirmation still owns the hold-row lock.
            // The expiration worker should skip the locked row.
            worker = expirationService.expireExpiredHolds();

            let timeout: ReturnType<typeof setTimeout> | undefined;

            const workerCompleted = await Promise.race([
                worker.then(() => true),
                new Promise<boolean>(resolve => {
                    timeout = setTimeout(() => resolve(false), 3000);
                }),
            ]);

            if (timeout) {
                clearTimeout(timeout);
            }

            expect(workerCompleted).toBe(true);
        } finally {
            // Always release confirmation, even if an assertion fails.
            transactionGate.release();
            transactionGate.restore();

            // Drain outstanding operations.
            if (confirmation) {
                await confirmation.catch(() => undefined);
            }

            if (worker) {
                await worker.catch(() => undefined);
            }
        }

        const booking = await confirmation!;

        expect(booking).toMatchObject({
            user_id: userId,
            event_id: eventId,
        });

        const holdResult = await db.query(
            `
            SELECT status
            FROM booking_holds
            WHERE id = $1;
        `,
            [hold.id],
        );

        expect(holdResult.rows).toEqual([{ status: "confirmed" }]);

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

        // A subsequent worker execution must leave the confirmed hold alone.
        await expirationService.expireExpiredHolds();

        const finalHoldResult = await db.query(
            `
            SELECT status
            FROM booking_holds
            WHERE id = $1;
        `,
            [hold.id],
        );

        expect(finalHoldResult.rows).toEqual([{ status: "confirmed" }]);
    });
});
