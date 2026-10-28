import { EventsService } from "../../../../4. backend/src/events/events.service";
import { EVENT_NOT_FOUND_MESSAGE } from "../../fixtures/errorMessageFixtures";
import {
    mockEventDoesNotExist,
    mockGetEvent
} from "../../helpers/eventsTestHelpers";
import { expectNthQuery } from "../../../utils/testHelpers";


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
        mockGetEvent(db, 1);

        const result = await service.getEvent(1);

        expect(result).toEqual({
            id: 1,
            start_time: "2026-09-10T10:00:00Z",
            end_time: "2026-09-10T11:00:00Z",
            capacity: 10,
            venue_name: "Moss Park Espresso",
            venue_address: "185 Queen St E",
        });

        expect(db.query).toHaveBeenCalledTimes(1);
        expectNthQuery(db, 1, "JOIN venues", [1]);
        expectNthQuery(db, 1, "v.name AS venue_name", [1]);
        expectNthQuery(db, 1, "v.address AS venue_address", [1]);
    });

    it("should reject the request when the event does not exist", async () => {
        mockEventDoesNotExist(db);

        await expect(service.getEvent(999))
            .rejects.toThrow(EVENT_NOT_FOUND_MESSAGE);

        expect(db.query).toHaveBeenCalledTimes(1);
        expectNthQuery(db, 1, "FROM events", [999]);
    });
});

