import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';


import { ConfigService } from '@nestjs/config';
import { NaturalLanguageSearchService } from './natural-language-search.service';
import { GeminiSearchInterpreter } from './gemini-search-interpreter';


@Module({
  imports: [DatabaseModule],
  controllers: [EventsController],
  providers: [
    EventsService,
    NaturalLanguageSearchService,
    {
      provide: GeminiSearchInterpreter,
      useFactory: (configService: ConfigService) =>
          new GeminiSearchInterpreter(
              configService.get<string>('GEMINI_API_KEY') ?? '',
          ),
      inject: [ConfigService],
    },
  ],
})

export class EventsModule {}
