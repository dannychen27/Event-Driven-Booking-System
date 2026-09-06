import { BookingsService } from "../../4. backend/src/bookings/bookings.service";
import { DatabaseService } from "../../4. backend/src/database/database.service";


describe("BookingsService integration", () => {
    let db: DatabaseService;
    let service: BookingsService;

    beforeAll(async () => {
        db = new DatabaseService();
        service = new BookingsService(db);

        await db.query(`
        INSERT INTO events
            (id, name, venue_id, start_time, end_time, capacity)
        VALUES
            (
                100,
                'Integration Test Event',
                1,
                '2026-09-20T10:00:00Z',
                '2026-09-20T11:00:00Z',
                10
            ),
            (
                101,
                'Concurrent Booking Test',
                1,
                '2026-09-21T10:00:00Z',
                '2026-09-21T11:00:00Z',
                1
            ),
            (
                102,
                'Transaction Rollback Test',
                1,
                '2026-09-22T10:00:00Z',
                '2026-09-22T11:00:00Z',
                10
            );
        `);
    });

    afterAll(async () => {
        await db.query(`
        DELETE FROM bookings
        WHERE event_id IN (100, 101, 102);
    `);

        await db.query(`
            DELETE FROM events
            WHERE id IN (100, 101, 102);
        `);

        await db.onModuleDestroy();
    });

    it("creates a booking using the real database", async () => {
        const booking = await service.createBooking(1, 100);

        expect(booking).toMatchObject({
            user_id: 1,
            event_id: 100,
        });

        await db.query(
            `DELETE FROM bookings WHERE id = $1`,
            [booking.id],
        );
    });

    it("rolls back changes when a transaction fails", async () => {
        await expect(
            db.transaction(async (client: any) => {
                await client.query(`
                    INSERT INTO bookings (user_id, event_id)
                    VALUES (1, 102);
                `);

                throw new Error("forced transaction failure");
            }),
        ).rejects.toThrow("forced transaction failure");

        const result = await db.query(
            `
        SELECT *
        FROM bookings
        WHERE user_id = $1
          AND event_id = $2;
        `,
            [1, 102],
        );

        expect(result.rows).toEqual([]);
    });

    it("allows only one concurrent booking when capacity is one", async () => {
        const results = await Promise.allSettled([
            service.createBooking(1, 101),
            service.createBooking(2, 101),
        ]);

        const fulfilled = results.filter(
            result => result.status === "fulfilled",
        );

        const rejected = results.filter(
            result => result.status === "rejected",
        );

        expect(fulfilled).toHaveLength(1);
        expect(rejected).toHaveLength(1);

        expect(
            (rejected[0] as PromiseRejectedResult).reason.message,
        ).toBe("Event 101 is fully booked");

        await db.query(
            `DELETE FROM bookings WHERE event_id = $1`,
            [101],
        );
    });
});