import { EventsService } from "../../../4. backend/src/events/events.service";
import {
    mockEventLookupExists,
} from "../helpers/eventsTestHelpers";
import { expectNthQuery } from "../../utils/testHelpers";


describe("EventsService.getEvent", () => {
    let service: EventsService;
    let db: any;

    beforeEach(() => {
        db = {
            query: jest.fn(),
        };

        service = new EventsService(db);
    });

    it("should return the requested event", async () => {
        mockEventLookupExists(db, 1);

        const result = await service.getEvent(1);

        expect(result).toEqual({
            id: 1,
            start_time: "2026-09-10T10:00:00Z",
            end_time: "2026-09-10T11:00:00Z",
            capacity: 10,
        });

        expect(db.query).toHaveBeenCalledTimes(1);

        expectNthQuery(
            db,
            1,
            "FROM events",
            [1],
        );
    });

    it("should reject the request when the event does not exist", async () => {
        db.query.mockResolvedValueOnce({
            rows: [],
        });

        await expect(
            service.getEvent(999),
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

