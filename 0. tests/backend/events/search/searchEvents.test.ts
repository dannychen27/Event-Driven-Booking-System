import { EventsService } from "../../../../4. backend/src/events/events.service";
import { expectNthQuery } from "../../../utils/testHelpers";
import {
    SEARCH_START_BOUNDARY,
    SEARCH_END_BOUNDARY,
    SEARCH_LATER_BOUNDARY,
    NO_FILTER_EVENTS_FIXTURE,
    COFFEE_MEETUP_SEARCH_RESULT_FIXTURE,
    eventCandidateFixture,
} from "../../fixtures/events/eventSearchFixtures";

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
        db.query.mockResolvedValueOnce({ rows: COFFEE_MEETUP_SEARCH_RESULT_FIXTURE });

        const result = await service.searchEvents({ keyword: "coffee", });

        expect(result).toEqual(COFFEE_MEETUP_SEARCH_RESULT_FIXTURE);
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
        db.query.mockResolvedValueOnce({ rows: NO_FILTER_EVENTS_FIXTURE, });

        const result = await service.searchEvents({});

        expect(result).toEqual(NO_FILTER_EVENTS_FIXTURE);
        expectNthQuery(db, 1, "JOIN venues", []);
        expectNthQuery(db, 1, "ORDER BY e.start_time ASC", []);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    it('should retrieve candidates using date bounds without keyword matching', async () => {
        db.query.mockResolvedValueOnce({ rows: eventCandidateFixture, });

        const result = await service.searchEventCandidates({
            startAfter: SEARCH_START_BOUNDARY,
            startBefore: SEARCH_LATER_BOUNDARY,
        });

        expect(result).toEqual(eventCandidateFixture);
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
        db.query.mockResolvedValueOnce({ rows: NO_FILTER_EVENTS_FIXTURE });

        const result = await service.searchEventCandidates({});

        expect(result).toEqual(NO_FILTER_EVENTS_FIXTURE);
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

    it("should exclude past events when includePastEvents is false", async () => {
        await service.searchEvents({ includePastEvents: false });

        expectNthQuery(
            db,
            1,
            "e.start_time >= statement_timestamp()",
            [],
        );
    });

    it("should exclude future events when includeFutureEvents is false", async () => {
        await service.searchEvents({ includeFutureEvents: false });

        expectNthQuery(
            db,
            1,
            "e.start_time < statement_timestamp()",
            [],
        );
    });

    it("should exclude both past and future events when both flags are false", async () => {
        await service.searchEvents({
            includePastEvents: false,
            includeFutureEvents: false,
        });

        expectNthQuery(
            db,
            1,
            "e.start_time >= statement_timestamp()",
            [],
        );
        expectNthQuery(
            db,
            1,
            "e.start_time < statement_timestamp()",
            [],
        );
    });

    it("should preserve all events when both inclusion flags are true", async () => {
        await service.searchEvents({
            includePastEvents: true,
            includeFutureEvents: true,
        });

        const sql = db.query.mock.calls[0][0] as string;
        expect(sql).not.toContain("statement_timestamp()");
        expect(sql).not.toContain("WHERE");
    });

    it("should filter by time of day using Toronto local time", async () => {
        await service.searchEvents({ timeOfDay: ["EVENING"] });

        expectNthQuery(
            db,
            1,
            "(e.start_time AT TIME ZONE 'America/Toronto')::time >= $1::time",
            ["17:00", "21:00"],
        );
        expectNthQuery(
            db,
            1,
            "(e.start_time AT TIME ZONE 'America/Toronto')::time < $2::time",
            ["17:00", "21:00"],
        );
    });

    it("should filter by an explicit time range and parameterize its values", async () => {
        await service.searchEvents({
            timeRange: { startTime: "18:00", endTime: "21:00" },
        });

        expectNthQuery(
            db,
            1,
            "(e.start_time AT TIME ZONE 'America/Toronto')::time >= $1::time",
            ["18:00", "21:00"],
        );
        expectNthQuery(
            db,
            1,
            "(e.start_time AT TIME ZONE 'America/Toronto')::time < $2::time",
            ["18:00", "21:00"],
        );
    });

    it("should preserve parameter ordering when keyword, date, and time filters are combined", async () => {
        await service.searchEvents({
            keyword: "coffee",
            startAfter: SEARCH_START_BOUNDARY,
            timeRange: { startTime: "18:00", endTime: "21:00" },
        });

        expectNthQuery(
            db,
            1,
            "WHERE (e.name ILIKE $1 OR v.name ILIKE $1) AND e.start_time >= $2",
            ["%coffee%", SEARCH_START_BOUNDARY, "18:00", "21:00"],
        );

        expectNthQuery(
            db,
            1,
            "(e.start_time AT TIME ZONE 'America/Toronto')::time >= $3::time",
            ["%coffee%", SEARCH_START_BOUNDARY, "18:00", "21:00"],
        );

        expectNthQuery(
            db,
            1,
            "(e.start_time AT TIME ZONE 'America/Toronto')::time < $4::time",
            ["%coffee%", SEARCH_START_BOUNDARY, "18:00", "21:00"],
        );
    });
});

describe("EventsService.searchEventCandidates", () => {
    let service: EventsService;
    let db: any;

    beforeEach(() => {
        db = {
            query: jest.fn().mockResolvedValue({ rows: [] }),
        };

        service = new EventsService(db);
    });

    it("should apply past and future inclusion filters to candidates", async () => {
        await service.searchEventCandidates({
            includePastEvents: false,
            includeFutureEvents: false,
        });

        expectNthQuery(
            db,
            1,
            "e.start_time >= statement_timestamp()",
            [],
        );
        expectNthQuery(
            db,
            1,
            "e.start_time < statement_timestamp()",
            [],
        );
    });

    it("should apply time filters to candidate retrieval", async () => {
        await service.searchEventCandidates({
            timeOfDay: ["NIGHT"],
            timeRange: { startTime: "22:00", endTime: "02:00" },
        });

        const sql = db.query.mock.calls[0][0] as string;

        expect(sql).toContain("$1::time");
        expect(sql).toContain("$2::time");
        expect(sql).toContain("$3::time");
        expect(sql).toContain("$4::time");
        expect(sql).toContain(" OR ");

        expect(db.query.mock.calls[0][1]).toEqual([
            "22:00",
            "02:00",
            "05:00",
            "21:00",
        ]);
    });

    it("should prioritize reconciled time intervals over time-of-day filters", async () => {
        await service.searchEventCandidates({
            timeOfDay: ["NIGHT"],
            timeIntervals: [
                { startMinute: 480, endMinute: 720 },
            ],
        });

        const sql = db.query.mock.calls[0][0] as string;

        expect(sql).toContain("$1::time");
        expect(sql).toContain("$2::time");
        expect(sql).not.toContain("$3::time");

        expect(db.query.mock.calls[0][1]).toEqual(["08:00", "12:00"]);
    });

    it("should preserve empty reconciled intervals as an empty result", async () => {
        await service.searchEventCandidates({
            timeOfDay: ["MORNING"],
            timeIntervals: [],
        });

        const sql = db.query.mock.calls[0][0] as string;

        expect(sql).toContain("FALSE");
        expect(sql).not.toContain("TIME '08:00'");
        expect(sql).not.toContain("TIME '12:00'");
    });
});
