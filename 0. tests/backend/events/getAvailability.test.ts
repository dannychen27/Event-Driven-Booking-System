import { EventsService } from "../../../4. backend/src/events/events.service";
import {
    mockEventLookupExists,
    mockAvailability,
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
        mockEventLookupExists(db, 1);
        mockAvailability(db, 10, 3, 7);

        const result = await service.getAvailability(1);

        expect(result).toEqual({
            capacity: 10,
            booked: 3,
            available: 7,
        });

        expect(db.query).toHaveBeenCalledTimes(2);

        expectNthQuery(
            db,
            1,
            "FROM events",
            [1],
        );

        expectNthQuery(
            db,
            2,
            "LEFT JOIN bookings",
            [1],
        );
    });

    it("should return all spots as available when the event has no bookings", async () => {
        mockEventLookupExists(db, 1);
        mockAvailability(db, 10, 0, 10);

        const result = await service.getAvailability(1);

        expect(result).toEqual({
            capacity: 10,
            booked: 0,
            available: 10,
        });

        expect(db.query).toHaveBeenCalledTimes(2);

        expectNthQuery(
            db,
            1,
            "FROM events",
            [1],
        );

        expectNthQuery(
            db,
            2,
            "LEFT JOIN bookings",
            [1],
        );
    });

    it("should reject the request when the event does not exist", async () => {
        db.query.mockResolvedValueOnce({
            rows: [],
        });

        await expect(
            service.getAvailability(999),
        ).rejects.toThrow("Event 999 not found");

        expect(db.query).toHaveBeenCalledTimes(1);

        expectNthQuery(
            db,
            1,
            "FROM events",
            [999],
        );
    });
});

