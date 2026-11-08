import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { EventsModule } from './events/events.module';
import { BookingsModule } from './bookings/bookings.module';
import { VenuesModule } from './venues/venues.module';

import { RequestContextService } from './observability/request-context.service';
import { RequestIdMiddleware } from './observability/request-id.middleware';
import { StructuredLogger } from './observability/structured-logger';

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
  providers: [
    StructuredLogger,
    RequestContextService,
    RequestIdMiddleware,
  ],
})

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(RequestIdMiddleware)
      .forRoutes({ path: '{*path}', method: RequestMethod.ALL });
  }
}
