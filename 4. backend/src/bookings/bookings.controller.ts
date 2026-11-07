import { Body, Controller, Delete, Get, Headers, Param, Post } from '@nestjs/common';
import { BookingsService } from './bookings.service';

@Controller()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post('events/:id/book')
  createBooking(
    @Param('id') event_id: string,
    @Body() body: { user_id: number },
    @Headers('Idempotency-Key') idempotency_key?: string,
  ) {
    return this.bookingsService.createBooking(body.user_id, Number(event_id), idempotency_key);
  }

  @Post('booking-holds/:id/confirm')
  confirmHold(
    @Param('id') hold_id: string,
    @Body() body: { user_id: number },
    @Headers('Idempotency-Key') idempotency_key?: string,
  ) {
    return this.bookingsService.confirmHold(body.user_id, Number(hold_id), idempotency_key);
  }

  @Delete('booking-holds/:id')
  cancelHold(
    @Param('id') hold_id: string,
    @Body() body: { user_id: number },
  ) {
    return this.bookingsService.cancelHold(body.user_id, Number(hold_id));
  }

  @Delete('bookings/:id')
  cancelBooking(
    @Param('id') booking_id: string,
    @Body() body: { user_id: number },
  ) {
    return this.bookingsService.cancelBooking(body.user_id, Number(booking_id));
  }

  @Get('/users/:id/bookings')
  getBookingHistory(@Param('id') user_id: string) {
    return this.bookingsService.getBookingHistory(Number(user_id));
  }
}
