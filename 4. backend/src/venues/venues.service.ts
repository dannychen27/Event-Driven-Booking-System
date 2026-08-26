import { Injectable } from '@nestjs/common';
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
}
