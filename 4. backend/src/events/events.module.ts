import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

import { ConfigService } from '@nestjs/config';
import { NaturalLanguageSearchService } from '../search/natural-language-search.service';
import { GeminiEventSearchInterpreter } from './search/gemini-event-search-interpreter';
import { GeminiEventRanker } from './search/gemini-event-ranker';

@Module({
  imports: [DatabaseModule],
  controllers: [EventsController],
  providers: [
    EventsService,
    NaturalLanguageSearchService,
    {
      provide: GeminiEventSearchInterpreter,
      useFactory: (configService: ConfigService) =>
        new GeminiEventSearchInterpreter(
          configService.get<string>('GEMINI_API_KEY') ?? '',
        ),
      inject: [ConfigService],
    },
    {
      provide: GeminiEventRanker,
      useFactory: (configService: ConfigService) =>
        new GeminiEventRanker(
          configService.get<string>('GEMINI_API_KEY') ?? '',
        ),
      inject: [ConfigService],
    },
  ],
})
export class EventsModule {}
