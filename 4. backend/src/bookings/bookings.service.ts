import {
  ConflictException,
  NotFoundException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import {
  Booking,
  BookingHistoryEntry,
  BookingId,
  BookingHold,
  BookingHoldId,
} from '../types/bookings/bookings.types';
import { UserId } from '../types/users/users.types';
import { DatabaseService } from '../database/database.service';
import {
    assertEventHasCapacity,
    assertNoActiveHoldConflict,
    assertNoBookingConflict,
    expireStaleHold,
    lockEvent,
    lockUser,
} from './bookings.service.helpers';

@Injectable()
export class BookingsService {
  constructor(private readonly db: DatabaseService) {}

  async createBooking(user_id: number, event_id: number) {
    return this.db.transaction(async client => {
        // Lock user first to serialize booking operations for this user.
        await lockUser(client, user_id);

        // Lock event after user.
        const event = await lockEvent(client, event_id);

        await expireStaleHold(client, event_id);

        // Check duplicate booking.
        const bookingResult = await client.query<BookingId>(
            `
            SELECT id
            FROM bookings
            WHERE user_id = $1
              AND event_id = $2;
        `,
            [user_id, event_id],
        );

        if (bookingResult.rows.length > 0) {
            throw new ConflictException(
                `User ${user_id} has already booked event ${event_id}`,
            );
        }

        // Prevent direct booking while holding the same event.
        const sameEventHoldResult = await client.query<BookingHoldId>(
            `
            SELECT id
            FROM booking_holds
            WHERE user_id = $1
              AND event_id = $2
              AND status = 'active'
              AND expires_at > statement_timestamp();
        `,
            [user_id, event_id],
        );

        if (sameEventHoldResult.rows.length > 0) {
            throw new ConflictException(
                `User ${user_id} has an active hold for event ${event_id}`,
            );
        }

        // Check capacity against bookings and unexpired active holds.
        await assertEventHasCapacity(client, event_id, event.capacity);

        // Check overlapping bookings.
        await assertNoBookingConflict(client, user_id, event, true);

        // Check overlapping active holds.
        await assertNoActiveHoldConflict(client, user_id, event);

        // Insert booking.
        const result = await client.query<Booking>(
            `
            INSERT INTO bookings (user_id, event_id)
            VALUES ($1, $2)
            RETURNING id, user_id, event_id, created_at;
        `,
            [user_id, event_id],
        );

        return result.rows[0];
    });
  }

  async createHold(user_id: number, event_id: number) {
        return this.db.transaction(async client => {
            // Lock user first to serialize booking operations for this user.
            await lockUser(client, user_id);

            // Lock event after user.
            const event = await lockEvent(client, event_id);

            // Expire stale holds for this event before checking capacity.
            await expireStaleHold(client, event_id);

            // Reject an existing booking for this event.
            const bookingResult = await client.query<BookingId>(
                `
                SELECT id
                FROM bookings
                WHERE user_id = $1
                  AND event_id = $2;
              `,
                [user_id, event_id],
            );

            if (bookingResult.rows.length > 0) {
                throw new ConflictException(
                    `User ${user_id} has already booked event ${event_id}`,
                );
            }

            // Reject a duplicate active hold.
            const existingHoldResult = await client.query<BookingHoldId>(
                `
                SELECT id
                FROM booking_holds
                WHERE user_id = $1
                  AND event_id = $2
                  AND status = 'active'
                  AND expires_at > statement_timestamp();
              `,
                [user_id, event_id],
            );

            if (existingHoldResult.rows.length > 0) {
                throw new ConflictException(
                    `User ${user_id} already has an active hold for event ${event_id}`,
                );
            }

            // Check capacity against bookings and unexpired active holds.
            await assertEventHasCapacity(client, event_id, event.capacity);

            // Check overlapping bookings.
            await assertNoBookingConflict(client, user_id, event, false);

            // Check overlapping active holds.
            await assertNoActiveHoldConflict(client, user_id, event);

            // Create a hold that expires 10 minutes after insertion.
            const result = await client.query<BookingHold>(
                `
                    INSERT INTO booking_holds (
                        user_id,
                        event_id,
                        created_at,
                        expires_at
                    )
                    VALUES (
                           $1,
                           $2,
                           statement_timestamp(),
                           statement_timestamp() + INTERVAL '10 minutes'
                       )
                    RETURNING id, user_id, event_id, created_at, expires_at, status;
                `,
                [user_id, event_id],
            );
            return result.rows[0];
        });
    }

  async confirmHold(user_id: number, hold_id: number) {
    const result = await this.db.transaction(async client => {
        // Look up the hold to discover its owner and event.
        // This is intentionally non-locking; locks follow user -> event -> hold.
        const holdReferenceResult = await client.query<BookingHold>(
            `
          SELECT id, user_id, event_id, created_at, expires_at, status
          FROM booking_holds
          WHERE id = $1;
        `,
            [hold_id],
        );

        if (holdReferenceResult.rows.length === 0) {
            throw new NotFoundException(`Booking hold ${hold_id} not found`);
        }

        const holdReference = holdReferenceResult.rows[0];

        if (holdReference.user_id !== user_id) {
            throw new ForbiddenException(
                `User ${user_id} is not authorized to confirm booking hold ${hold_id}`,
            );
        }

        await lockUser(client, user_id);
        await lockEvent(client, holdReference.event_id);

        const holdResult = await client.query<BookingHold>(
            `
          SELECT id, user_id, event_id, created_at, expires_at, status
          FROM booking_holds
          WHERE id = $1
          FOR UPDATE;
        `,
            [hold_id],
        );

        if (holdResult.rows.length === 0) {
            throw new NotFoundException(`Booking hold ${hold_id} not found`);
        }

        const hold = holdResult.rows[0];

        if (hold.user_id !== user_id) {
            throw new ForbiddenException(
                `User ${user_id} is not authorized to confirm booking hold ${hold_id}`,
            );
        }

        if (hold.status !== 'active') {
            throw new ConflictException(
                `Booking hold ${hold_id} is no longer active`,
            );
        }

        // Determine the lifecycle transition using PostgreSQL's current clock.
        const updateResult = await client.query<BookingHold>(
            `
            UPDATE booking_holds
            SET status = CASE
                WHEN expires_at > clock_timestamp() THEN 'confirmed'
                ELSE 'expired'
            END
            WHERE id = $1
              AND status = 'active'
            RETURNING id, user_id, event_id, created_at, expires_at, status;
        `,
            [hold_id],
        );

        if (updateResult.rows[0].status === 'expired') {
            // Return instead of throwing so the expiration update commits.
            return { expired: true as const };
        }

        const bookingResult = await client.query<Booking>(
            `
          INSERT INTO bookings (user_id, event_id)
          VALUES ($1, $2)
          RETURNING id, user_id, event_id, created_at;
        `,
            [user_id, hold.event_id],
        );

        return { booking: bookingResult.rows[0] };
    });

    if ('expired' in result) {
        throw new ConflictException(
            `Booking hold ${hold_id} has expired`,
        );
    }

    return result.booking;
  }

  async cancelHold(user_id: number, hold_id: number) {
    const result = await this.db.transaction(async client => {
        // Look up the hold to discover its owner and event.
        const holdReferenceResult = await client.query<BookingHold>(
            `
            SELECT id, user_id, event_id, created_at, expires_at, status
            FROM booking_holds
            WHERE id = $1;
        `,
            [hold_id],
        );

        if (holdReferenceResult.rows.length === 0) {
            throw new NotFoundException(`Booking hold ${hold_id} not found`);
        }

        const holdReference = holdReferenceResult.rows[0];

        if (holdReference.user_id !== user_id) {
            throw new ForbiddenException(
                `User ${user_id} is not authorized to cancel booking hold ${hold_id}`,
            );
        }

        // Preserve the established user -> event -> hold lock order.
        await lockUser(client, user_id);
        await lockEvent(client, holdReference.event_id);

        const holdResult = await client.query<BookingHold>(
            `
            SELECT id, user_id, event_id, created_at, expires_at, status
            FROM booking_holds
            WHERE id = $1
            FOR UPDATE;
        `,
            [hold_id],
        );

        if (holdResult.rows.length === 0) {
            throw new NotFoundException(`Booking hold ${hold_id} not found`);
        }

        const hold = holdResult.rows[0];

        if (hold.user_id !== user_id) {
            throw new ForbiddenException(
                `User ${user_id} is not authorized to cancel booking hold ${hold_id}`,
            );
        }

        if (hold.status !== 'active') {
            throw new ConflictException(
                `Booking hold ${hold_id} is no longer active`,
            );
        }

        const updateResult = await client.query<BookingHold>(
            `
            UPDATE booking_holds
            SET status = CASE
                WHEN expires_at > clock_timestamp() THEN 'cancelled'
                ELSE 'expired'
            END
            WHERE id = $1
              AND status = 'active'
            RETURNING id, user_id, event_id, created_at, expires_at, status;
        `,
            [hold_id],
        );

        if (updateResult.rows[0].status === 'expired') {
            return { expired: true as const };
        }

        return { hold: updateResult.rows[0] };
    });

    if ('expired' in result) {
        throw new ConflictException(
            `Booking hold ${hold_id} has expired`,
        );
    }

    return result.hold;
}

  async cancelBooking(user_id: number, booking_id: number) {
    return this.db.transaction(async client => {
      // Lock user first to serialize booking operations for this user.
      await lockUser(client, user_id);

      // Check if booking exists.
      const bookingResult = await client.query<Booking>(
        `
                SELECT id, user_id, event_id, created_at
                FROM bookings
                WHERE id = $1;
            `,
        [booking_id],
      );

      if (bookingResult.rows.length === 0) {
        throw new NotFoundException(`Booking ${booking_id} not found`);
      }

      // Check booking ownership.
      if (bookingResult.rows[0].user_id !== user_id) {
        throw new ForbiddenException(
          `User ${user_id} is not authorized to cancel booking ${booking_id}`,
        );
      }

      // Lock event after user.
      const event_id = bookingResult.rows[0].event_id;
      await lockEvent(client, event_id);

      // Delete booking.
      const oldBookingResult = await client.query<Booking>(
        `
                DELETE FROM bookings
                WHERE id = $1
                RETURNING *;
            `,
        [booking_id],
      );

      if (oldBookingResult.rows.length === 0) {
        throw new NotFoundException(`Booking ${booking_id} not found`);
      }
      return oldBookingResult.rows[0];
    });
  }

  async getBookingHistory(user_id: number) {
    const userResult = await this.db.query<UserId>(
      `
            SELECT id
            FROM users
            WHERE id = $1;
        `,
      [user_id],
    );
    if (userResult.rows.length === 0) {
      throw new NotFoundException(`User ${user_id} does not exist`);
    }

    // display user bookings in reverse chronological order
    // (most recent at the top -> least recent at the bottom)

    // Include event and venue details for booking history.
    const userBookingResult = await this.db.query<BookingHistoryEntry>(
      `
          SELECT
            b.id,
            b.user_id,
            b.event_id,
            b.created_at,
            e.name AS event_name,
            e.start_time,
            e.end_time,
            v.name AS venue_name,
            v.address AS venue_address
          FROM bookings b
            LEFT JOIN events e ON b.event_id = e.id
            LEFT JOIN venues v ON e.venue_id = v.id
          WHERE b.user_id = $1
          ORDER BY b.created_at DESC;
        `,
      [user_id],
    );
    return userBookingResult.rows;
    // if user has no bookings, the booking history should be [].
  }
}
