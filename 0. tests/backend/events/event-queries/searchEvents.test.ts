import { EventsService } from "../../../../4. backend/src/events/events.service";
import { expectNthQuery } from "../../../utils/testHelpers";
import {
    SEARCH_START_BOUNDARY,
    SEARCH_END_BOUNDARY,
    SEARCH_LATER_BOUNDARY,
} from "../../fixtures/eventSearchFixtures";

describe("EventsService.searchEvents", () => {
    let service: EventsService;
    let db: any;

    beforeEach(() => {
        db = {
            query: jest.fn().mockResolvedValue({ rows: [] }),
        };

        service = new EventsService(db);
    });

    it("should search event and venue names by keyword", async () => {
        const events = [{ id: 1, name: "Coffee Meetup" }];
        db.query.mockResolvedValueOnce({ rows: events });

        const result = await service.searchEvents({
            keyword: "coffee",
        });

        expect(result).toEqual(events);
        expectNthQuery(
            db,
            1,
            "e.name ILIKE $1 OR v.name ILIKE $1",
            ["%coffee%"],
        );
        expectNthQuery(db, 1, "JOIN venues", ["%coffee%"]);
        expectNthQuery(db, 1, "ORDER BY e.start_time ASC", ["%coffee%"]);
    });

    it("should filter by start and end times", async () => {
        await service.searchEvents({
            startAfter: SEARCH_START_BOUNDARY,
            startBefore: SEARCH_END_BOUNDARY,
        });

        expectNthQuery(
            db,
            1,
            "e.start_time >= $1",
            [SEARCH_START_BOUNDARY, SEARCH_END_BOUNDARY],
        );
        expectNthQuery(
            db,
            1,
            "e.start_time < $2",
            [SEARCH_START_BOUNDARY, SEARCH_END_BOUNDARY],
        );
    });

    it("should combine keyword and time filters with AND", async () => {
        await service.searchEvents({
            keyword: "coffee",
            startAfter: SEARCH_START_BOUNDARY,
        });

        expectNthQuery(
            db,
            1,
            "WHERE (e.name ILIKE $1 OR v.name ILIKE $1) AND e.start_time >= $2",
            ["%coffee%", SEARCH_START_BOUNDARY],
        );
    });

    it("should return all events when no filters are provided", async () => {
        const events = [{ id: 1 }, { id: 2 }];
        db.query.mockResolvedValueOnce({ rows: events });

        const result = await service.searchEvents({});

        expect(result).toEqual(events);
        expectNthQuery(db, 1, "JOIN venues", []);
        expectNthQuery(db, 1, "ORDER BY e.start_time ASC", []);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    it('should retrieve candidates using date bounds without keyword matching', async () => {
        const events = [
            {
                id: 1,
                name: 'Outdoor Yoga',
                description: 'A relaxing session in a park.',
                venue_name: 'Central Park',
            },
        ];
        db.query.mockResolvedValueOnce({ rows: events });

        const result = await service.searchEventCandidates({
            startAfter: SEARCH_START_BOUNDARY,
            startBefore: SEARCH_LATER_BOUNDARY,
        });

        expect(result).toEqual(events);
        expectNthQuery(
            db,
            1,
            'e.start_time >= $1',
            [SEARCH_START_BOUNDARY, SEARCH_LATER_BOUNDARY],
        );
        expectNthQuery(
            db,
            1,
            'e.start_time < $2',
            [SEARCH_START_BOUNDARY, SEARCH_LATER_BOUNDARY],
        );

        const sql = db.query.mock.calls[0][0] as string;
        expect(sql).not.toContain('ILIKE');
        expect(sql).toContain('e.*');
        expect(sql).toContain('ORDER BY e.start_time ASC');
    });

    it('should retrieve all candidates when no date bounds are provided', async () => {
        const events = [{ id: 1 }, { id: 2 }];
        db.query.mockResolvedValueOnce({ rows: events });

        const result = await service.searchEventCandidates({});

        expect(result).toEqual(events);
        expect(db.query).toHaveBeenCalledTimes(1);

        const sql = db.query.mock.calls[0][0] as string;
        expect(sql).not.toContain('WHERE');
        expect(sql).not.toContain('ILIKE');
    });

    it('should apply only the supplied candidate date bound', async () => {
        await service.searchEventCandidates({
            startAfter: SEARCH_START_BOUNDARY,
        });

        expectNthQuery(
            db,
            1,
            'e.start_time >= $1',
            [SEARCH_START_BOUNDARY],
        );

        const sql = db.query.mock.calls[0][0] as string;
        expect(sql).not.toContain('e.start_time <');
        expect(sql).not.toContain('ILIKE');
    });
});
