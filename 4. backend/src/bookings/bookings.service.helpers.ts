import { ConflictException, NotFoundException } from '@nestjs/common';
import type { PoolClient } from 'pg';

import {
    BookingEventId,
    EventCapacityCount,
    BookingHoldId,
} from '../types/bookings/bookings.types';
import { EventLock } from '../types/events/events.types';
import { UserId } from '../types/users/users.types';


export async function lockUser(
    client: PoolClient,
    user_id: number,
) {
    const userResult = await client.query<UserId>(
`
        SELECT id
        FROM users
        WHERE id = $1
        FOR UPDATE;
    `,
        [user_id],
    );

    if (userResult.rows.length === 0) {
        throw new NotFoundException(`User ${user_id} not found`);
    }
}

export async function lockEvent(
    client: PoolClient,
    event_id: number,
): Promise<EventLock> {
    const eventResult = await client.query<EventLock>(
        `
        SELECT id, start_time, end_time, capacity
        FROM events
        WHERE id = $1
        FOR UPDATE;
    `,
        [event_id],
    );

    if (eventResult.rows.length === 0) {
        throw new NotFoundException(`Event ${event_id} not found`);
    }

    return eventResult.rows[0];
}

export async function expireStaleHold(
    client: PoolClient,
    event_id: number,
): Promise<void> {
    await client.query(
        `
            UPDATE booking_holds
            SET status = 'expired'
            WHERE event_id = $1
              AND status = 'active'
              AND expires_at <= clock_timestamp();
        `,
        [event_id],
    );
}

export async function assertEventHasCapacity(
    client: PoolClient,
    event_id: number,
    capacity: number,
) {
    const capacityResult = await client.query<EventCapacityCount>(
        `
        SELECT
            (
                SELECT COUNT(*)
                FROM bookings
                WHERE event_id = $1
            ) AS booking_count,
            (
                SELECT COUNT(*)
                FROM booking_holds
                WHERE event_id = $1
                  AND status = 'active'
                  AND expires_at > statement_timestamp()
            ) AS hold_count;
    `,
        [event_id],
    );

    const bookingCount = Number(capacityResult.rows[0].booking_count);
    const holdCount = Number(capacityResult.rows[0].hold_count);

    if (bookingCount + holdCount >= capacity) {
        throw new ConflictException(`Event ${event_id} is fully booked`);
    }
}

export async function assertNoBookingConflict(
    client: PoolClient,
    user_id: number,
    event: EventLock,
    includeConflictingEventId: boolean,
) {
    const bookingConflictResult = await client.query<BookingEventId>(
        `
        SELECT b.event_id
        FROM bookings b
        JOIN events e ON e.id = b.event_id
        WHERE b.user_id = $1
          AND e.start_time < $2
          AND e.end_time > $3
        LIMIT 1;
    `,
        [user_id, event.end_time, event.start_time],
    );

    if (bookingConflictResult.rows.length > 0) {
        const conflictingEventId = bookingConflictResult.rows[0].event_id;

        if (includeConflictingEventId) {
            throw new ConflictException(
                `User ${user_id} has a conflicting booking with event ${conflictingEventId}`
            );
        } else {
            throw new ConflictException(`User ${user_id} has a conflicting booking`);
        }
    }
}

export async function assertNoActiveHoldConflict(
    client: PoolClient,
    user_id: number,
    event: EventLock,
) {
    const holdConflictResult = await client.query<BookingHoldId>(
`
        SELECT h.id
        FROM booking_holds h
        JOIN events e ON e.id = h.event_id
        WHERE h.user_id = $1
          AND h.status = 'active'
          AND h.expires_at > statement_timestamp()
          AND e.start_time < $2
          AND e.end_time > $3
        LIMIT 1;
    `,
        [user_id, event.end_time, event.start_time],
    );

    if (holdConflictResult.rows.length > 0) {
        throw new ConflictException(
            `User ${user_id} has a conflicting active hold`,
        );
    }
}
