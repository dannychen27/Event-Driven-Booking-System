import { ConflictException } from "@nestjs/common";

import { BookingsService } from "../../../4. backend/src/bookings/bookings.service";
import { DatabaseService } from "../../../4. backend/src/database/database.service";
import { EventsService } from "../../../4. backend/src/events/events.service";

import {
    BOOKING_SERVICE_INTEGRATION_EVENT_IDS,
    BOOKING_SERVICE_INTEGRATION_EVENT_LIST,
    BOOKING_SERVICE_INTEGRATION_EVENTS,
    BOOKING_SERVICE_INTEGRATION_USERS,
} from "../fixtures/bookings/bookingServiceFixtures";


describe("event availability integration", () => {
    let db: DatabaseService;
    let eventsService: EventsService;
    let bookingsService: BookingsService;

    beforeAll(async () => {
        db = new DatabaseService();
        eventsService = new EventsService(db);
        bookingsService = new BookingsService(db);

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

    it("reports full availability when an event has no bookings or holds", async () => {
        const eventId = BOOKING_SERVICE_INTEGRATION_EVENTS.standard.id;

        const result = await eventsService.getAvailability(eventId);

        expect(result).toEqual({
            capacity: 10,
            booked: 0,
            available: 10,
        });
    });

    it("subtracts an active hold from available capacity without counting it as booked", async () => {
        const userId = BOOKING_SERVICE_INTEGRATION_USERS.primary;
        const eventId = BOOKING_SERVICE_INTEGRATION_EVENTS.standard.id;

        await bookingsService.createHold(userId, eventId);

        const result = await eventsService.getAvailability(eventId);

        expect(result).toEqual({
            capacity: 10,
            booked: 0,
            available: 9,
        });
    });

    it("preserves availability when an active hold is confirmed into a booking", async () => {
        const userId = BOOKING_SERVICE_INTEGRATION_USERS.primary;
        const eventId = BOOKING_SERVICE_INTEGRATION_EVENTS.standard.id;

        const hold = await bookingsService.createHold(userId, eventId);

        const availabilityBefore = await eventsService.getAvailability(eventId);

        const booking = await bookingsService.confirmHold(userId, hold.id);

        const availabilityAfter = await eventsService.getAvailability(eventId);

        expect(availabilityBefore).toEqual({
            capacity: 10,
            booked: 0,
            available: 9,
        });

        expect(booking).toMatchObject({
            user_id: userId,
            event_id: eventId,
        });

        expect(availabilityAfter).toEqual({
            capacity: 10,
            booked: 1,
            available: 9,
        });
    });

    it("restores available capacity when an active hold is cancelled", async () => {
        const userId = BOOKING_SERVICE_INTEGRATION_USERS.primary;
        const eventId = BOOKING_SERVICE_INTEGRATION_EVENTS.standard.id;

        const hold = await bookingsService.createHold(userId, eventId);

        const availabilityBefore = await eventsService.getAvailability(eventId);

        const cancelledHold = await bookingsService.cancelHold(userId, hold.id);

        const availabilityAfter = await eventsService.getAvailability(eventId);

        expect(availabilityBefore.available).toBe(9);
        expect(cancelledHold.status).toBe("cancelled");

        expect(availabilityAfter).toEqual({
            capacity: 10,
            booked: 0,
            available: 10,
        });
    });

    it("does not count an expired hold even before the expiration worker processes it", async () => {
        const userId = BOOKING_SERVICE_INTEGRATION_USERS.primary;
        const eventId = BOOKING_SERVICE_INTEGRATION_EVENTS.standard.id;

        const hold = await bookingsService.createHold(userId, eventId);

        await db.query(
            `
                UPDATE booking_holds
                SET created_at = statement_timestamp() - INTERVAL '2 minutes',
                    expires_at = statement_timestamp() - INTERVAL '1 minute'
                WHERE id = $1;
            `,
            [hold.id],
        );

        const holdResult = await db.query(
            `
                SELECT status
                FROM booking_holds
                WHERE id = $1;
            `,
            [hold.id],
        );

        const availability = await eventsService.getAvailability(eventId);

        // The hold remains active in storage, but its expiry makes it non-countable.
        expect(holdResult.rows).toEqual([{ status: "active" }]);

        expect(availability).toEqual({
            capacity: 10,
            booked: 0,
            available: 10,
        });
    });

    it("restores available capacity when a confirmed booking is cancelled", async () => {
        const userId = BOOKING_SERVICE_INTEGRATION_USERS.primary;
        const eventId = BOOKING_SERVICE_INTEGRATION_EVENTS.standard.id;

        const booking = await bookingsService.createBooking(userId, eventId);

        const availabilityBefore = await eventsService.getAvailability(eventId);

        await bookingsService.cancelBooking(userId, booking.id);

        const availabilityAfter = await eventsService.getAvailability(eventId);

        expect(availabilityBefore).toEqual({
            capacity: 10,
            booked: 1,
            available: 9,
        });

        expect(availabilityAfter).toEqual({
            capacity: 10,
            booked: 0,
            available: 10,
        });
    });

    it("reports zero availability and rejects another booking when an active hold fills capacity", async () => {
        const eventId = BOOKING_SERVICE_INTEGRATION_EVENTS.capacityOne.id;
        const holdOwnerId = BOOKING_SERVICE_INTEGRATION_USERS.primary;
        const otherUserId = BOOKING_SERVICE_INTEGRATION_USERS.secondary;

        await bookingsService.createHold(holdOwnerId, eventId);

        const availability = await eventsService.getAvailability(eventId);

        expect(availability).toEqual({
            capacity: 1,
            booked: 0,
            available: 0,
        });

        await expect(
            bookingsService.createBooking(otherUserId, eventId),
        ).rejects.toBeInstanceOf(ConflictException);

        const availabilityAfterRejection =
            await eventsService.getAvailability(eventId);

        expect(availabilityAfterRejection).toEqual({
            capacity: 1,
            booked: 0,
            available: 0,
        });
    });
});
