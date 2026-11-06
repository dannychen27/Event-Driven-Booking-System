import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BOOKING_HOLD_EXPIRATION_BATCH_SIZE } from '../constants/bookings.constants';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class BookingHoldExpirationService {
  private readonly logger = new Logger(BookingHoldExpirationService.name);

  constructor(private readonly db: DatabaseService) {}

  @Cron(CronExpression.EVERY_MINUTE, {
    name: 'booking-hold-expiration',
    waitForCompletion: true,
  })
  async expireExpiredHolds(): Promise<void> {
    try {
      const result = await this.db.query<{ id: number }>(
        `
          WITH expired_holds AS (
            SELECT id
            FROM booking_holds
            WHERE status = 'active'
              AND expires_at <= clock_timestamp()
            ORDER BY expires_at ASC, id ASC
            LIMIT $1
            FOR UPDATE SKIP LOCKED
          )
          UPDATE booking_holds AS bh
          SET status = 'expired'
          FROM expired_holds
          WHERE bh.id = expired_holds.id
          RETURNING bh.id;
        `,
        [BOOKING_HOLD_EXPIRATION_BATCH_SIZE],
      );

      if (result.rows.length > 0) {
        this.logger.log(`Expired ${result.rows.length} booking hold(s).`);
      }
    } catch (error) {
      this.logger.error(
        'Failed to expire booking holds',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
