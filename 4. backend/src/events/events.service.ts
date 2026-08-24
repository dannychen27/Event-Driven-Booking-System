import { Injectable } from '@nestjs/common';

@Injectable()
export class EventsService {
    getAllEvents() {
        return [
            {
                id: 1,
                name: 'Taylor Swift Concert',
                venue: 'Scotiabank Arena',
                capacity: 500,
            },
            {
                id: 2,
                name: 'Raptors Game',
                venue: 'Scotiabank Arena',
                capacity: 100,
            },
        ];
    }
}
