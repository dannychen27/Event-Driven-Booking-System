import { Controller, Get, Param } from '@nestjs/common';
import { VenuesService } from "./venues.service";

@Controller('venues')
export class VenuesController {

    constructor(private readonly venuesService: VenuesService) {

    }

    @Get()
    getAllVenues() {
        return this.venuesService.getAllVenues();
    }

    @Get(':id')
    getVenue(@Param('id') venue_id: string) {
        return this.venuesService.getVenue(Number(venue_id))
    }
}
