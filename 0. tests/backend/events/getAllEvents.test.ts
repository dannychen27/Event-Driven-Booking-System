import { EventsService } from "../../../4. backend/src/events/events.service";
import { expectNthQuery } from "../../utils/testHelpers";


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
                start_time: "2026-09-10T10:00:00Z",
                end_time: "2026-09-10T11:00:00Z",
                capacity: 10,
            },
            {
                id: 2,
                start_time: "2026-09-11T14:00:00Z",
                end_time: "2026-09-11T15:00:00Z",
                capacity: 20,
            },
        ];

        db.query.mockResolvedValueOnce({
            rows: events,
        });

        const result = await service.getAllEvents();

        expect(result).toEqual(events);
        expect(db.query).toHaveBeenCalledTimes(1);

        expectNthQuery(db, 1, "SELECT *");
    });
});

