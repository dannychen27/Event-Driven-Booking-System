import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { EventsService } from './events.service';
import {
  validateEventSearchDateRange,
  validateEventSearchKeyword,
  validateNaturalLanguageSearchQuery,
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
    @Query('startAfter') startAfter?: string,
    @Query('startBefore') startBefore?: string,
  ) {
    validateEventSearchKeyword(keyword);

    validateEventSearchDateRange({ startAfter, startBefore });

    return this.eventsService.searchEvents({
      keyword: keyword?.trim(),
      startAfter,
      startBefore,
    });
  }

  @Post('natural-language-search')
  searchEventsInNaturalLanguage(@Body() body: { query?: string } | undefined ) {
    const query = validateNaturalLanguageSearchQuery(body?.query);
    return this.naturalLanguageSearchService.searchNaturalLanguage(query);
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
