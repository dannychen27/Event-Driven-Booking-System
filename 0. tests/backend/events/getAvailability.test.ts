import { EventsService } from "../../../4. backend/src/events/events.service";
import { EVENT_NOT_FOUND_MESSAGE } from "../fixtures/shared/errorMessageFixtures";
import {
    mockEventExists, mockEventDoesNotExist,
    mockAvailability
} from "../helpers/eventsTestHelpers"
import { expectNthQuery } from "../../utils/testHelpers";


describe("EventsService.getAvailability", () => {
    let service: EventsService;
    let db: any;

    beforeEach(() => {
        db = {
            query: jest.fn(),
        };

        service = new EventsService(db);
    });

    it("should return availability for an event", async () => {
        mockEventExists(db, 1);
        mockAvailability(db, 10, 3, 7);

        const result = await service.getAvailability(1);

        expect(result).toEqual({
            capacity: 10,
            booked: 3,
            available: 7,
        });

        expect(db.query).toHaveBeenCalledTimes(2);

        expectNthQuery(db, 1, "FROM events", [1]);
        expectNthQuery(db, 2, "FROM bookings", [1]);

        const availabilityQuery = db.query.mock.calls[1][0] as string;

        // Bookings and holds must be aggregated independently.
        expect(availabilityQuery).toMatch(
            /SELECT event_id, COUNT\(\*\)::int AS booking_count\s+FROM bookings\s+GROUP BY event_id/i,
        );

        expect(availabilityQuery).toMatch(
            /SELECT event_id, COUNT\(\*\)::int AS hold_count\s+FROM booking_holds\s+WHERE status = 'active'\s+AND expires_at > statement_timestamp\(\)\s+GROUP BY event_id/i,
        );

        // Availability subtracts both confirmed bookings and active holds.
        expect(availabilityQuery).toMatch(
            /e\.capacity\s*-\s*COALESCE\(b\.booking_count,\s*0\)\s*-\s*COALESCE\(h\.hold_count,\s*0\)/i,
        );
    });

    it("should return all spots as available when the event has no bookings", async () => {
        mockEventExists(db, 1);
        mockAvailability(db, 10, 0, 10);

        const result = await service.getAvailability(1);

        expect(result).toEqual({
            capacity: 10,
            booked: 0,
            available: 10,
        });

        expect(db.query).toHaveBeenCalledTimes(2);

        expectNthQuery(db, 1, "FROM events", [1]);
        expectNthQuery(db, 2, "FROM bookings", [1]);
    });

    it("should reject the request when the event does not exist", async () => {
        mockEventDoesNotExist(db);

        await expect(service.getAvailability(999))
            .rejects.toThrow(EVENT_NOT_FOUND_MESSAGE);

        expect(db.query).toHaveBeenCalledTimes(1);
        expectNthQuery(db, 1, "FROM events", [999]);
    });
});

