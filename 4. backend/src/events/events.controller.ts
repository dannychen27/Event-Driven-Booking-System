import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

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

    if (keyword !== undefined && keyword.trim().length > 100) {
      throw new BadRequestException(
          'keyword must be at most 100 characters',
      );
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

  @Get(':id/availability')
  getAvailability(@Param('id') event_id: string) {
    return this.eventsService.getAvailability(Number(event_id));
  }

  @Get(':id')
  getEvent(@Param('id') event_id: string) {
    return this.eventsService.getEvent(Number(event_id));
  }
}
