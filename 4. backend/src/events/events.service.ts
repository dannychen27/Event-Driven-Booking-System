import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class EventsService {

    constructor(private readonly db: DatabaseService) {

    }

    async getAllEvents() {
        const result = await this.db.query(`
            SELECT *
            FROM events;
        `);
        return result.rows;
    }

    async getAvailability(event_id: number) {
        const eventResult = await this.db.query(`
            SELECT id, start_time, end_time, capacity
            FROM events
            WHERE id = $1;
        `,
            [event_id],
        );
        if (eventResult.rows.length === 0) {
            throw new NotFoundException(`Event ${event_id} not found`);
        }

        const availabilityResult = await this.db.query(`
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
        // if event has no bookings, all spots are available
        return availabilityResult.rows[0];
    }

    async getEvent(event_id: number) {
        const eventResult = await this.db.query(`
            SELECT id, start_time, end_time, capacity
            FROM events
            WHERE id = $1;
        `,
            [event_id],
        );
        if (eventResult.rows.length === 0) {
            throw new NotFoundException(`Event ${event_id} not found`);
        }
        return eventResult.rows[0];
    }
}
