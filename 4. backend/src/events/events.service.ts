import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class EventsService {

    constructor(private readonly db: DatabaseService) {

    }

    async getAllEvents() {
        const result = await this.db.query(`
          SELECT *
          FROM events;
        `
        );

        return result.rows;
    }

    async getAvailability(event_id: number) {
        const result = await this.db.query(
            `
            SELECT
                e.capacity,
                COUNT(b.id)::int AS booked,
                (e.capacity - COUNT(b.id))::int AS available
            FROM events e
            LEFT JOIN bookings b
                ON b.event_id = e.id
            WHERE e.id = $1
            GROUP BY e.id, e.capacity;
        `,
            [event_id],
        );

        // TODO: What if this event does not exist?
        return result.rows[0];
    }

    async getEvent(id: number) {
        const result = await this.db.query(
            `
                SELECT *
                FROM events
                WHERE id = $1;
            `,
            [id],
        );

        // TODO: What if there is no matching event_id?
        return result.rows[0];
    }
}
