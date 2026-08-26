import {Injectable, NotFoundException} from '@nestjs/common';
import { DatabaseService } from "../database/database.service";

@Injectable()
export class VenuesService {

    constructor(private readonly db: DatabaseService) {

    }

    async getAllVenues() {
        const venueResult = await this.db.query(`
            SELECT *
            FROM venues
        `);
        return venueResult.rows;
    }

    async getVenue(venue_id: number) {
        const venueResult = await this.db.query(`
            SELECT id, name, address
            FROM venues
            WHERE id = $1
        `,
            [venue_id],
        );
        if (venueResult.rows.length === 0) {
            throw new NotFoundException(`Venue ${venue_id} does not exist`);
        }
        return venueResult.rows[0];
    }
}
