import { Body, Controller, Param, Post } from '@nestjs/common';
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
}
