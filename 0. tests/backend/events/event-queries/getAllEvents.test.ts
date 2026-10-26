import { EventsService } from "../../../../4. backend/src/events/events.service";
import { expectNthQuery } from "../../../utils/testHelpers";
import { mockGetAllEvents } from "../../helpers/eventsTestHelpers";
import {DatabaseService} from "../../../../4. backend/src/database/database.service";


describe("EventsService.getAllEvents", () => {
    let service: EventsService;
    let db: any;

    beforeEach(() => {
        db = {
            query: jest.fn(),
        };

        service = new EventsService(db);
    });

    it("should return all events", async () => {
        const events = [
            {
                id: 1,
                name: "Meet and Greet",
                venue_id: 2,
                venue_name: "Moss Park Espresso",
                venue_address: "185 Queen St E",
                start_time: "2026-09-10T10:00:00Z",
                end_time: "2026-09-10T11:00:00Z",
                capacity: 10,
            },
            {
                id: 2,
                name: "Concert",
                venue_id: 3,
                venue_name: "Example Venue",
                venue_address: "123 Example St",
                start_time: "2026-09-11T14:00:00Z",
                end_time: "2026-09-11T15:00:00Z",
                capacity: 20,
            },
        ];

        mockGetAllEvents(db, events);

        const result = await service.getAllEvents();

        expect(result).toEqual(events);
        expect(db.query).toHaveBeenCalledTimes(1);

        expectNthQuery(db, 1, "e.*");
        expectNthQuery(db, 1, "JOIN venues");
        expectNthQuery(db, 1, "v.name AS venue_name");
        expectNthQuery(db, 1, "v.address AS venue_address");

        // expectNthQuery(db, 1, "SELECT *");
    });

    it("returns an empty array when there are no events", async () => {
        const db = {
            query: jest
                .fn()
                .mockResolvedValueOnce({
                    rows: [],
                }),
        } as unknown as DatabaseService;

        const service = new EventsService(db);

        const result = await service.getAllEvents();

        expect(result).toEqual([]);
        expect(db.query).toHaveBeenCalledTimes(1);
    });
});

