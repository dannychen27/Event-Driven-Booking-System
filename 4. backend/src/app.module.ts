import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { EventsModule } from './events/events.module';
import { BookingsModule } from './bookings/bookings.module';
import { VenuesModule } from './venues/venues.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),
    ScheduleModule.forRoot(),
    EventsModule,
    BookingsModule,
    VenuesModule,
  ],
})
export class AppModule {}
