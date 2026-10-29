import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { EventsService } from './events.service';

import { MAX_EVENT_SEARCH_KEYWORD_LENGTH } from '../search/search.constants';

import { NaturalLanguageSearchService } from '../search/natural-language-search.service';

@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly naturalLanguageSearchService: NaturalLanguageSearchService,
  ) {}

  @Get()
  getAllEvents() {
    return this.eventsService.getAllEvents();
  }

  @Get('search')
  searchEvents(
    @Query('keyword') keyword?: string,
    @Query('startAfter') startAfter?: string,
    @Query('startBefore') startBefore?: string,
  ) {
    if (keyword !== undefined && keyword.trim().length === 0) {
      throw new BadRequestException('keyword must not be empty');
    }

    if (keyword !== undefined && keyword.trim().length > MAX_EVENT_SEARCH_KEYWORD_LENGTH) {
      throw new BadRequestException('keyword must be at most 100 characters');
    }

    for (const [name, value] of [
      ['startAfter', startAfter],
      ['startBefore', startBefore],
    ]) {
      if (value !== undefined && Number.isNaN(Date.parse(value))) {
        throw new BadRequestException(`${name} must be a valid date`);
      }
    }

    if (
      startAfter !== undefined &&
      startBefore !== undefined &&
      Date.parse(startAfter) >= Date.parse(startBefore)
    ) {
      throw new BadRequestException(
        'startAfter must be earlier than startBefore',
      );
    }

    return this.eventsService.searchEvents({
      keyword: keyword?.trim(),
      startAfter,
      startBefore,
    });
  }

  @Post('natural-language-search')
  searchEventsInNaturalLanguage(@Body() body: { query?: string }) {
    if (typeof body?.query !== 'string' || !body.query.trim()) {
      throw new BadRequestException('query must be a non-empty string');
    }

    if (body.query.trim().length > 500) {
      throw new BadRequestException('query must be at most 500 characters');
    }

    return this.naturalLanguageSearchService.searchNaturalLanguage(
      body.query.trim(),
    );
  }

  @Get(':id/availability')
  getAvailability(@Param('id') event_id: string) {
    return this.eventsService.getAvailability(Number(event_id));
  }

  @Get(':id')
  getEvent(@Param('id') event_id: string) {
    return this.eventsService.getEvent(Number(event_id));
  }
}
