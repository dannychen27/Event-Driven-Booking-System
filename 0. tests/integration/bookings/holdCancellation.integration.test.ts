import {
    ConflictException,
    ForbiddenException,
    NotFoundException,
} from "@nestjs/common";

import { BookingsService } from "../../../4. backend/src/bookings/bookings.service";
import { DatabaseService } from "../../../4. backend/src/database/database.service";
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
import {
    CONCURRENT_RACE_WINNERS,
    HOLD_STATUS_UPDATE_MATCHER,
    USER_ROW_LOCK_WAIT_QUERY,
    LOCK_WAIT_TIMEOUT_MS,
    LOCK_WAIT_POLL_INTERVAL_MS,
} from "./helpers/bookingHoldRaceTestHelpers";

import type {
    RaceOperation,
    LockWaitQueryResult,
} from "../types/bookingHoldRace.types";


describe("hold cancellation", () => {
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

    it("cancels an active hold and preserves the record", async () => {
        const userId = BOOKING_SERVICE_INTEGRATION_USERS.primary;
        const eventId = BOOKING_SERVICE_INTEGRATION_EVENTS.standard.id;

        const hold = await service.createHold(userId, eventId);

        const cancelledHold = await service.cancelHold(userId, hold.id);

        expect(cancelledHold).toMatchObject({
            id: hold.id,
            user_id: userId,
            event_id: eventId,
            status: "cancelled",
        });

        const result = await db.query<BookingHoldStatusRecord>(
            `
                SELECT status, expires_at
                FROM booking_holds
                WHERE id = $1;
            `,
            [hold.id],
        );

        expect(result.rows).toHaveLength(1);
        expect(result.rows[0].status).toBe("cancelled");

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


    it("rejects cancellation by a user who does not own the hold", async () => {
        const ownerId = BOOKING_SERVICE_INTEGRATION_USERS.primary;
        const otherUserId = BOOKING_SERVICE_INTEGRATION_USERS.secondary;
        const eventId = BOOKING_SERVICE_INTEGRATION_EVENTS.standard.id;

        const hold = await service.createHold(ownerId, eventId);

        await expect(
            service.cancelHold(otherUserId, hold.id),
        ).rejects.toBeInstanceOf(ForbiddenException);

        const result = await db.query<BookingHoldStatusRecord>(
            `
                SELECT status, expires_at
                FROM booking_holds
                WHERE id = $1;
            `,
            [hold.id],
        );

        expect(result.rows).toHaveLength(1);
        expect(result.rows[0].status).toBe("active");
    });


    it.each(["confirmed", "cancelled", "expired"])(
        "rejects cancellation when the hold status is %s",
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
                service.cancelHold(userId, hold.id),
            ).rejects.toThrow(
                `Booking hold ${hold.id} is no longer active`,
            );

            const result = await db.query<BookingHoldStatusRecord>(
                `
                    SELECT status, expires_at
                    FROM booking_holds
                    WHERE id = $1;
                `,
                [hold.id],
            );

            expect(result.rows).toHaveLength(1);
            expect(result.rows[0].status).toBe(status);
        },
    );


    it("rejects cancellation of an expired hold and persists expiration", async () => {
        const userId = BOOKING_SERVICE_INTEGRATION_USERS.primary;
        const eventId = BOOKING_SERVICE_INTEGRATION_EVENTS.standard.id;

        const hold = await service.createHold(userId, eventId);

        await expireHold(db, hold.id);

        await expect(
            service.cancelHold(userId, hold.id),
        ).rejects.toThrow(
            `Booking hold ${hold.id} has expired`,
        );

        const result = await db.query<BookingHoldStatusRecord>(
            `
                SELECT status, expires_at
                FROM booking_holds
                WHERE id = $1;
            `,
            [hold.id],
        );

        expect(result.rows).toHaveLength(1);
        expect(result.rows[0].status).toBe("expired");

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


    it("rejects cancellation when the hold does not exist", async () => {
        await expect(
            service.cancelHold(
                BOOKING_SERVICE_INTEGRATION_USERS.primary,
                -1,
            ),
        ).rejects.toBeInstanceOf(NotFoundException);
    });


    it("allows only one concurrent cancellation of the same hold", async () => {
        const userId = BOOKING_SERVICE_INTEGRATION_USERS.primary;
        const eventId = BOOKING_SERVICE_INTEGRATION_EVENTS.standard.id;

        const hold = await service.createHold(userId, eventId);

        const results = await Promise.allSettled([
            service.cancelHold(userId, hold.id),
            service.cancelHold(userId, hold.id),
        ]);

        expectOneFulfilledAndOneRejected(results);

        expect(results.find(result => result.status === "rejected")).toEqual(
            expect.objectContaining({
                reason: expect.any(ConflictException),
            }),
        );

        const result = await db.query<BookingHoldStatusRecord>(
            `
                SELECT status, expires_at
                FROM booking_holds
                WHERE id = $1;
            `,
            [hold.id],
        );

        expect(result.rows).toHaveLength(1);
        expect(result.rows[0].status).toBe("cancelled");

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


    it.each(CONCURRENT_RACE_WINNERS)(
        "allows %s to win a concurrent cancellation-confirmation race",
        async firstWinner => {
            const userId = BOOKING_SERVICE_INTEGRATION_USERS.primary;
            const eventId = BOOKING_SERVICE_INTEGRATION_EVENTS.standard.id;

            const hold = await service.createHold(userId, eventId);

            const transactionGate = pauseTransactionAfterQuery(db, {
                matches: HOLD_STATUS_UPDATE_MATCHER
            });

            let firstOperation: RaceOperation | undefined;
            let competingOperation: RaceOperation | undefined;
            let competingIsWaiting = false;

            try {
                // Start and pause the operation that should win.
                firstOperation = firstWinner === "cancellation"
                    ? service.cancelHold(userId, hold.id)
                    : service.confirmHold(userId, hold.id);

                await transactionGate.matched;

                // Start the competing operation while the first transaction
                // still holds the user, event, and hold locks.
                competingOperation = firstWinner === "cancellation"
                    ? service.confirmHold(userId, hold.id)
                    : service.cancelHold(userId, hold.id);

                // Wait for PostgreSQL to confirm the competing operation
                // is blocked while acquiring the user-row lock.
                const deadline = Date.now() + LOCK_WAIT_TIMEOUT_MS;
                while (Date.now() < deadline) {
                    const result = await db.query<LockWaitQueryResult>(
                        USER_ROW_LOCK_WAIT_QUERY
                    );

                    if (result.rows[0].count > 0) {
                        competingIsWaiting = true;
                        break;
                    }

                    await new Promise(resolve => setTimeout(
                        resolve,
                        LOCK_WAIT_POLL_INTERVAL_MS
                    ));
                }
            } finally {
                // Always release the first transaction, even if polling fails.
                transactionGate.release();
                transactionGate.restore();

                // Drain both operations before making assertions.
                if (firstOperation) {
                    await firstOperation.catch(() => undefined);
                }

                if (competingOperation) {
                    await competingOperation.catch(() => undefined);
                }
            }

            expect(competingIsWaiting).toBe(true);

            const [firstResult, competingResult] = await Promise.allSettled([
                firstOperation!,
                competingOperation!,
            ]);

            expect(firstResult.status).toBe("fulfilled");
            expect(competingResult).toEqual(
                expect.objectContaining({
                    status: "rejected",
                    reason: expect.any(ConflictException),
                }),
            );

            const holdResult = await db.query<BookingHoldStatusRecord>(
                `
                    SELECT status, expires_at
                    FROM booking_holds
                    WHERE id = $1;
                `,
                [hold.id],
            );

            expect(holdResult.rows).toHaveLength(1);

            const bookingResult = await db.query<{ id: number }>(
                `
                    SELECT id
                    FROM bookings
                    WHERE user_id = $1
                      AND event_id = $2;
                `,
                [userId, eventId],
            );

            if (firstWinner === "cancellation") {
                expect(holdResult.rows[0].status).toBe("cancelled");
                expect(bookingResult.rows).toHaveLength(0);
            } else {
                expect(holdResult.rows[0].status).toBe("confirmed");
                expect(bookingResult.rows).toHaveLength(1);
            }
        },
    );
});
