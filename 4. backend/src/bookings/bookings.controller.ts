import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { BookingsService } from './bookings.service';

@Controller()
export class BookingsController {
    constructor(private readonly bookingsService: BookingsService) {}

    @Post('events/:id/book')
    createBooking(
        @Param('id') event_id: string,
        @Body() body: { user_id: number },
    ) {
        return this.bookingsService.createBooking(
            body.user_id,
            Number(event_id),
        );
    }

    @Delete('bookings/:id')
    cancelBooking(
        @Param('id') booking_id: string,
        @Body() body: { user_id: number },
    ) {
        return this.bookingsService.cancelBooking(
            body.user_id,
            Number(booking_id)
        );
    }

    @Get('/users/:id/bookings')
    getBookingHistory(
        @Param('id') user_id: string
    ) {
        return this.bookingsService.getBookingHistory(Number(user_id));
    }
}
