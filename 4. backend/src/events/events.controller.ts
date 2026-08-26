import { Controller, Get, Param } from '@nestjs/common';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
    constructor(private readonly eventsService: EventsService) {}

    @Get()
    getAllEvents() {
        return this.eventsService.getAllEvents();
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
