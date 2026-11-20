import { BadRequestException, Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { EventsService } from './events.service';
import {
  validateEventSearchKeyword,
} from '../helpers/search/event-search-validation.helpers';
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
    @Query('filters') filters?: string,
  ) {
    validateEventSearchKeyword(keyword);

    let parsedFilters: unknown;

    if (filters !== undefined) {
      try {
        parsedFilters = JSON.parse(filters);
      } catch {
        throw new BadRequestException(
            'filters must contain valid JSON',
        );
      }
    }

    return this.naturalLanguageSearchService.searchWithKeyword({
      ...(keyword !== undefined ? { query: keyword.trim() } : {}),
      ...(parsedFilters !== undefined
          ? { filters: parsedFilters }
          : {}),
    });
  }

  @Post('natural-language-search')
  searchEventsInNaturalLanguage(@Body() body: unknown) {
    return this.naturalLanguageSearchService.searchNaturalLanguage(body);
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
