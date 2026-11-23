import { EventsService } from "../../../4. backend/src/events/events.service";
import { expectNthQuery } from "../../utils/testHelpers";
import { mockGetAllEvents } from "../helpers/eventsTestHelpers";
import {DatabaseService} from "../../../4. backend/src/database/database.service";
import { allEventsFixture } from "../fixtures/events/eventFixtures";


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
        mockGetAllEvents(db, allEventsFixture);

        const result = await service.getAllEvents();

        expect(result).toEqual(allEventsFixture);
        expect(db.query).toHaveBeenCalledTimes(1);

        expectNthQuery(db, 1, "e.*");
        expectNthQuery(db, 1, "JOIN venues");
        expectNthQuery(db, 1, "v.name AS venue_name");
        expectNthQuery(db, 1, "v.address AS venue_address");
        expectNthQuery(db, 1, "COALESCE(booking_counts.attendee_count, 0)::int AS attendee_count");
        expectNthQuery(db, 1, "FROM bookings");
        expectNthQuery(db, 1, "GROUP BY event_id");
        expect(db.query.mock.calls[0][0]).not.toContain("booking_holds");
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

