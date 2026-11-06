import type { BookingHoldExpirationTestHelpers, HoldStatus } from "../types/bookings/bookingHoldExpiration.types";
import type { DatabaseService } from "../../../4. backend/src/database/database.service";

export function createBookingHoldExpirationTestHelpers(db: DatabaseService): BookingHoldExpirationTestHelpers {
    const eventIds: number[] = [];
    let nextEventId = 10_000;

    async function createEvents(count: number): Promise<number[]> {
        const ids = Array.from(
            { length: count },
            (_, index) => nextEventId + index,
        );

        nextEventId += count;

        const result = await db.query<{ id: number }>(
        `
                INSERT INTO events (
                    id,
                    name,
                    venue_id,
                    start_time,
                    end_time,
                    capacity
                )
                SELECT
                    event_id,
                    'Hold expiration test ' || event_id,
                    1,
                    statement_timestamp() + INTERVAL '1 day',
                    statement_timestamp() + INTERVAL '1 day 1 hour',
                    10
                FROM unnest($1::int[]) AS event_ids(event_id)
                RETURNING id;
            `,
            [ids],
        );

        const createdIds = result.rows.map(row => row.id);
        eventIds.push(...createdIds);

        return createdIds;
    }

    async function createEvent(): Promise<number> {
        const [eventId] = await createEvents(1);
        return eventId;
    }

    async function createHold(eventId: number, status: HoldStatus, expired: boolean): Promise<number> {
        const createdAt = new Date(Date.now() - 120_000);
        const expiresAt = new Date(Date.now() + (expired ? -60_000 : 600_000));

        const result = await db.query<{ id: number }>(
        `
                INSERT INTO booking_holds (user_id, event_id, created_at, expires_at, status)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id;
            `,
            [1, eventId, createdAt, expiresAt, status],
        );

        return result.rows[0].id;
    }

    async function cleanup(): Promise<void> {
        if (eventIds.length === 0) {
            return;
        }

        await db.query(
        `DELETE FROM booking_holds WHERE event_id = ANY($1::int[])`,
            [eventIds],
        );

        await db.query(
        `DELETE FROM events WHERE id = ANY($1::int[])`,
            [eventIds],
        );

        eventIds.length = 0;
    }

    return {
        createEvents,
        createEvent,
        createHold,
        cleanup,
    };
}
