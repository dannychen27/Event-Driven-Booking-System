import { BookingsService } from "../../4. backend/src/bookings/bookings.service";
import { DatabaseService } from "../../4. backend/src/database/database.service";
import {
    BOOKING_SERVICE_INTEGRATION_EVENT_IDS,
    BOOKING_SERVICE_INTEGRATION_EVENT_LIST,
    BOOKING_SERVICE_INTEGRATION_EVENTS,
    BOOKING_SERVICE_INTEGRATION_USERS,
} from "./fixtures/bookings/bookingServiceFixtures";


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
            `DELETE FROM bookings WHERE event_id = ANY($1::int[])`,
            [BOOKING_SERVICE_INTEGRATION_EVENT_IDS],
        );
    });

    afterAll(async () => {
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

        const fulfilled = results.filter(
            result => result.status === "fulfilled",
        );

        const rejected = results.filter(
            result => result.status === "rejected",
        );

        expect(fulfilled).toHaveLength(1);
        expect(rejected).toHaveLength(1);

        const rejection = rejected[0];

        if (rejection.status !== "rejected") {
            throw new Error("Expected one concurrent booking to be rejected");
        }

        expect(rejection.reason.message).toBe(
            `Event ${eventId} is fully booked`,
        );

        const result = await db.query(
            `SELECT id FROM bookings WHERE event_id = $1`,
            [eventId],
        );

        expect(result.rows).toHaveLength(1);
    });
});
