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
  BookingEventId,
  EventCapacityCount,
} from '../types/bookings/bookings.types';
import { EventLock } from '../types/events/events.types';
import { UserId } from '../types/users/users.types';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class BookingsService {
  constructor(private readonly db: DatabaseService) {}

  async createBooking(user_id: number, event_id: number) {
    return this.db.transaction(async client => {
        // Lock user first to serialize booking operations for this user.
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

        // Lock event after user.
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

        const event = eventResult.rows[0];

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

        if (bookingCount + holdCount >= event.capacity) {
            throw new ConflictException(`Event ${event_id} is fully booked`);
        }

        // Check overlapping bookings.
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
            throw new ConflictException(
                `User ${user_id} has a conflicting booking with event ${bookingConflictResult.rows[0].event_id}`,
            );
        }

        // Check overlapping active holds.
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

            // Lock event after user.
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

            const event = eventResult.rows[0];

            // Expire this user's stale hold for this event.
            // This also prevents the partial unique index from blocking a replacement.
            await client.query(
                `
                UPDATE booking_holds
                SET status = 'expired'
                WHERE user_id = $1
                  AND event_id = $2
                  AND status = 'active'
                  AND expires_at <= statement_timestamp();
              `,
                [user_id, event_id],
            );

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

            if (bookingCount + holdCount >= event.capacity) {
                throw new ConflictException(`Event ${event_id} is fully booked`);
            }

            // Check overlapping bookings.
            const bookingConflictResult = await client.query<BookingId>(
                `
                SELECT b.id
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
                throw new ConflictException(
                    `User ${user_id} has a conflicting booking`,
                );
            }

            // Check overlapping active holds.
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

  async cancelBooking(user_id: number, booking_id: number) {
    return this.db.transaction(async client => {
      // Lock user first to serialize booking operations for this user.
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
