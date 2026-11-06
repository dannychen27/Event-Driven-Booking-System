import { BOOKING_HOLD_EXPIRATION_BATCH_SIZE } from "../../../4. backend/src/constants/bookings.constants";
import { createBookingHoldExpirationTestHelpers } from "../helpers/bookingHoldExpirationIntegrationTestHelpers";
import type {
    BookingHoldExpirationTestHelpers,
    HoldExpirationTestCase,
    HoldStatusCount,
    HoldStatusRecord,
    IndexNameRecord,
} from "../types/bookings/bookingHoldExpiration.types";

import { DatabaseService } from "../../../4. backend/src/database/database.service";
import { BookingHoldExpirationService } from "../../../4. backend/src/bookings/booking-hold-expiration.service";


describe("booking hold expiration cleanup", () => {
    let db: DatabaseService;
    let service: BookingHoldExpirationService;
    let testHelpers: BookingHoldExpirationTestHelpers;

    beforeAll(() => {
        db = new DatabaseService();
        service = new BookingHoldExpirationService(db);
        testHelpers = createBookingHoldExpirationTestHelpers(db);
    });

    afterEach(async () => {
        await testHelpers.cleanup();
    });

    afterAll(async () => {
        await db.onModuleDestroy();
    });

    it("expires only expired active holds and is safe to repeat", async () => {
        const cases: HoldExpirationTestCase[] = [
            { status: "active", expired: true, expected: "expired" },
            { status: "active", expired: false, expected: "active" },
            { status: "confirmed", expired: true, expected: "confirmed" },
            { status: "cancelled", expired: true, expected: "cancelled" },
            { status: "expired", expired: true, expected: "expired" },
        ];

        const holdIds: number[] = [];
        for (const testCase of cases) {
            const eventId = await testHelpers.createEvent();
            holdIds.push(await testHelpers.createHold(eventId, testCase.status, testCase.expired));
        }

        await service.expireExpiredHolds();
        await service.expireExpiredHolds();

        const result = await db.query<HoldStatusCount>(
        `
                SELECT id, status
                FROM booking_holds
                WHERE id = ANY($1::int[])
                ORDER BY id;
            `,
            [holdIds],
        );

        expect(result.rows.map(row => row.status)).toEqual(
            cases.map(testCase => testCase.expected),
        );
    });

    it("processes no more than the configured batch size per execution", async () => {
        const batchEventIds = await testHelpers.createEvents(BOOKING_HOLD_EXPIRATION_BATCH_SIZE + 1);

        await db.query(
        `
                INSERT INTO booking_holds (
                    user_id,
                    event_id,
                    created_at,
                    expires_at,
                    status
                )
                SELECT
                    1,
                    event_id,
                    statement_timestamp() - INTERVAL '2 minutes',
                    statement_timestamp() - INTERVAL '1 minute',
                    'active'
                FROM unnest($1::int[]) AS event_ids(event_id);
            `,
            [batchEventIds],
        );

        await service.expireExpiredHolds();

        const result = await db.query<HoldStatusCount>(
        `
                SELECT status, COUNT(*)::int AS count
                FROM booking_holds
                WHERE event_id = ANY($1::int[])
                GROUP BY status;
            `,
            [batchEventIds],
        );

        const counts = Object.fromEntries(
            result.rows.map(row => [row.status, row.count])
        );

        expect(counts).toEqual({
            expired: BOOKING_HOLD_EXPIRATION_BATCH_SIZE,
            active: 1,
        });
    });

    it("skips a hold locked by another transaction", async () => {
        const eventId = await testHelpers.createEvent();
        const holdId = await testHelpers.createHold(eventId, "active", true);

        await db.transaction(async client => {
            await client.query(
`
                    SELECT id
                    FROM booking_holds
                    WHERE id = $1
                        FOR UPDATE;
                `,
                [holdId],
            );

            await service.expireExpiredHolds();

            const result = await client.query<HoldStatusRecord>(
`
                    SELECT status
                    FROM booking_holds
                    WHERE id = $1;
                `,
                [holdId],
            );

            expect(result.rows[0].status).toBe("active");
        });

        await service.expireExpiredHolds();

        const result = await db.query<HoldStatusRecord>(
            `
                SELECT status
                FROM booking_holds
                WHERE id = $1;
            `,
            [holdId],
        );

        expect(result.rows[0].status).toBe("expired");
    });

    it("creates the global expiration index", async () => {
        const result = await db.query<IndexNameRecord>(
            `
                SELECT indexname
                FROM pg_indexes
                WHERE schemaname = current_schema()
                  AND indexname = 'idx_booking_holds_expiration';
            `,
        );

        expect(result.rows).toHaveLength(1);
    });
});
