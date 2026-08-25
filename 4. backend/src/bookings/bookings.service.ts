import {
    ConflictException, NotFoundException,
    Injectable,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class BookingsService {

    constructor(private readonly db: DatabaseService) {

    }

    async createBooking(user_id: number, event_id: number) {
        return this.db.transaction(async (client) => {
            // check user
            const userResult = await client.query(`
                SELECT id
                FROM users
                WHERE id = $1;
            `,
                [user_id],
            );
            if (userResult.rows.length === 0) {
                throw new NotFoundException(`User ${user_id} not found`);
            }

            // lock event
            const eventResult = await client.query(`
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

            // check duplicate booking
            const bookingResult = await client.query(`
                SELECT id
                FROM bookings
                WHERE user_id = $1
                  AND event_id = $2;
            `,
                [user_id, event_id],
            );
            if (bookingResult.rows.length > 0) {
                throw new ConflictException(`User ${user_id} has already booked event ${event_id}`);
            }

            // check capacity
            const event = eventResult.rows[0];
            const numBookingsResult = await client.query(`
                SELECT COUNT(*) AS booking_count
                FROM bookings
                WHERE event_id = $1;
            `,
                [event_id],
            );
            const bookingCount = Number(numBookingsResult.rows[0].booking_count);
            if (bookingCount >= event.capacity) {
                throw new ConflictException(`Event ${event_id} is fully booked`);
            }

            // check schedule conflict
            const conflictResult = await client.query(`
                SELECT b.id
                FROM bookings b
                JOIN events e ON e.id = b.event_id
                WHERE b.user_id = $1
                  AND e.start_time < $2
                  AND e.end_time > $3;
            `,
                [user_id, event.end_time, event.start_time],
            );
            if (conflictResult.rows.length > 0) {
                throw new ConflictException(`User ${user_id} has a conflicting booking with event ${conflictResult.rows[0].id}`);
            }

            // insert booking
            const result = await client.query(`
                INSERT INTO bookings (user_id, event_id)
                VALUES ($1, $2)
                RETURNING id, user_id, event_id, created_at;
            `,
                [user_id, event_id],
            );
            return result.rows[0];
        });
    }
}
