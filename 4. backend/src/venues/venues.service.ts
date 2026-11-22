import { Injectable, NotFoundException } from '@nestjs/common';
import { Venue } from '../types/venues/venues.types';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class VenuesService {
  constructor(private readonly db: DatabaseService) {}

  async getAllVenues() {
    const venueResult = await this.db.query<Venue>(`
      SELECT
        id,
        name,
        address,
        description,
        venue_type,
        image_url,
        amenities,
        accessibility_features,
        transit_info
      FROM venues;
        `);
    return venueResult.rows;
  }

  async getVenue(venue_id: number) {
    const venueResult = await this.db.query<Venue>(
      `
          SELECT
            id,
            name,
            address,
            description,
            venue_type,
            image_url,
            amenities,
            accessibility_features,
            transit_info
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
