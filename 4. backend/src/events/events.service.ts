import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { EventCandidate } from '../types/events.types';
import { buildEventDateRangeFilters } from './events.helpers';

@Injectable()
export class EventsService {
  constructor(private readonly db: DatabaseService) {}

  async getAllEvents() {
    const result = await this.db.query(`
      SELECT
        e.*,
        v.name AS venue_name,
        v.address AS venue_address
      FROM events e
      JOIN venues v ON e.venue_id = v.id;
    `);
    return result.rows;
  }

  async getAvailability(event_id: number) {
    const eventResult = await this.db.query(
      `
            SELECT id, start_time, end_time, capacity
            FROM events
            WHERE id = $1;
        `,
      [event_id],
    );
    if (eventResult.rows.length === 0) {
      throw new NotFoundException(`Event ${event_id} not found`);
    }

    const availabilityResult = await this.db.query<{
      capacity: number;
      booking_count: number;
      available: number;
    }>(
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
    // if event has no bookings, all spots are available
    return availabilityResult.rows[0];
  }

  async searchEvents(filters: {
    keyword?: string;
    startAfter?: string;
    startBefore?: string;
  }) {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters.keyword) {
      params.push(`%${filters.keyword}%`);
      conditions.push(
        `(e.name ILIKE $${params.length} OR v.name ILIKE $${params.length})`,
      );
    }

    const dateRangeFilters = buildEventDateRangeFilters({
      startAfter: filters.startAfter,
      startBefore: filters.startBefore,
      initialParamCount: params.length,
    });

    conditions.push(...dateRangeFilters.conditions);
    params.push(...dateRangeFilters.params);

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const result = await this.db.query(
      `
            SELECT
                e.*,
                v.name AS venue_name,
                v.address AS venue_address
            FROM events e
            JOIN venues v ON e.venue_id = v.id
                ${whereClause}
            ORDER BY e.start_time ASC;
        `,
      params,
    );

    return result.rows;
  }

  async searchEventCandidates(filters: {
    startAfter?: string;
    startBefore?: string;
  }) {
    const { conditions, params } = buildEventDateRangeFilters({
      startAfter: filters.startAfter,
      startBefore: filters.startBefore,
    });

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const result = await this.db.query<EventCandidate>(
      `
        SELECT
          e.*,
          v.name AS venue_name,
          v.address AS venue_address
        FROM events e
        JOIN venues v ON e.venue_id = v.id
        ${whereClause}
        ORDER BY e.start_time ASC;
      `,
      params,
    );

    return result.rows;
  }

  async getEvent(event_id: number) {
    const eventResult = await this.db.query(
      `
        SELECT
            e.*,
            v.name AS venue_name,
            v.address AS venue_address
        FROM events e
        JOIN venues v ON e.venue_id = v.id
        WHERE e.id = $1;
        `,
      [event_id],
    );
    if (eventResult.rows.length === 0) {
      throw new NotFoundException(`Event ${event_id} not found`);
    }
    return eventResult.rows[0];
  }
}
