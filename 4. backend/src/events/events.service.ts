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
