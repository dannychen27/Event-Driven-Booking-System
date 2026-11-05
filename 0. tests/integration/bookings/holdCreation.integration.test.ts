import {
    ConflictException,
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
    HOLD_DURATION_MS,
    HOLD_EXPIRATION_TOLERANCE_MS,
} from "../constants/bookingServiceIntegrationTestConstants";
import {
    expectOneFulfilledAndOneRejected,
    expireHold,
} from "../helpers/bookingServiceIntegrationTestHelpers";


describe("hold creation and capacity", () => {
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

        // Expired holds are transitioned to 'expired' before capacity checks.
        expect(result.rows[0].status).toBe("expired");
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
});
