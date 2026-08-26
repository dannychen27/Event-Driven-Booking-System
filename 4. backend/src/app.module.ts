import { Module } from '@nestjs/common';
import { EventsModule } from './events/events.module';
import { BookingsModule } from './bookings/bookings.module';
import { VenuesModule } from './src/venues/venues.module';

@Module({
  imports: [EventsModule, BookingsModule, VenuesModule],
})

export class AppModule {}
