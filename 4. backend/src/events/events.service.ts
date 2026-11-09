import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  EventAvailability,
  EventCandidate,
} from '../types/events/events.types';
import { buildEventDateRangeFilters } from './events.helpers';
import { TimeOfDay, TimeRange } from '../types/search/time-range.types';


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

    const availabilityResult = await this.db.query<EventAvailability>(
      `
          SELECT
            e.capacity,
            COALESCE(b.booking_count, 0)::int AS booked,
            (
              e.capacity
                - COALESCE(b.booking_count, 0)
                - COALESCE(h.hold_count, 0)
              )::int AS available
          FROM events e
                 LEFT JOIN (
            SELECT event_id, COUNT(*)::int AS booking_count
            FROM bookings
            GROUP BY event_id
          ) b ON b.event_id = e.id
                 LEFT JOIN (
            SELECT event_id, COUNT(*)::int AS hold_count
            FROM booking_holds
            WHERE status = 'active'
              AND expires_at > statement_timestamp()
            GROUP BY event_id
          ) h ON h.event_id = e.id
          WHERE e.id = $1;
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
    includePastEvents?: boolean;
    includeFutureEvents?: boolean;
    timeOfDay?: TimeOfDay;
    timeRange?: TimeRange;
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
      includePastEvents: filters.includePastEvents,
      includeFutureEvents: filters.includeFutureEvents,
      timeOfDay: filters.timeOfDay,
      timeRange: filters.timeRange,
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
    includePastEvents?: boolean;
    includeFutureEvents?: boolean;
    timeOfDay?: TimeOfDay;
    timeRange?: TimeRange;
  }) {
    const { conditions, params } = buildEventDateRangeFilters({
      startAfter: filters.startAfter,
      startBefore: filters.startBefore,
      includePastEvents: filters.includePastEvents,
      includeFutureEvents: filters.includeFutureEvents,
      timeOfDay: filters.timeOfDay,
      timeRange: filters.timeRange,
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
