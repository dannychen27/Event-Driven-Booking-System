import { Module } from '@nestjs/common';
import { EventsModule } from './events/events.module';
import { BookingsModule } from './bookings/bookings.module';

@Module({
  imports: [EventsModule, BookingsModule],
})

export class AppModule {}
