import { EventsService } from "../../../4. backend/src/events/events.service";
import { DatabaseService } from "../../../4. backend/src/database/database.service";


describe("EventsService", () => {

    describe("getAllEvents", () => {

        it("returns all events", async () => {
            const events = [
                {
                    id: 1,
                    name: "Event 1",
                },
                {
                    id: 2,
                    name: "Event 2",
                },
            ];

            const db = {
                query: jest
                    .fn()
                    .mockResolvedValueOnce({
                        rows: events,
                    }),
            } as unknown as DatabaseService;

            const service = new EventsService(db);

            const result = await service.getAllEvents();

            expect(result).toEqual(events);
            expect(db.query).toHaveBeenCalledTimes(1);
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


    describe("getEvent", () => {

        it("returns an event successfully", async () => {
            const event = {
                id: 1,
                start_time: "2026-09-10T10:00:00Z",
                end_time: "2026-09-10T11:00:00Z",
                capacity: 10,
            };

            const db = {
                query: jest
                    .fn()
                    .mockResolvedValueOnce({
                        rows: [event],
                    }),
            } as unknown as DatabaseService;

            const service = new EventsService(db);

            const result = await service.getEvent(1);

            expect(result).toEqual(event);
            expect(db.query).toHaveBeenCalledTimes(1);
        });

        it("throws an error when the event does not exist", async () => {
            const db = {
                query: jest
                    .fn()
                    .mockResolvedValueOnce({
                        rows: [],
                    }),
            } as unknown as DatabaseService;

            const service = new EventsService(db);

            await expect(
                service.getEvent(1),
            ).rejects.toThrow("Event 1 not found");
        });
    });


    describe("getAvailability", () => {

        it("returns event availability", async () => {
            const availability = {
                capacity: 10,
                booked: 3,
                available: 7,
            };

            const db = {
                query: jest
                    .fn()
                    .mockResolvedValueOnce({
                        rows: [
                            {
                                id: 1,
                                start_time: "2026-09-10T10:00:00Z",
                                end_time: "2026-09-10T11:00:00Z",
                                capacity: 10,
                            },
                        ],
                    })
                    .mockResolvedValueOnce({
                        rows: [availability],
                    }),
            } as unknown as DatabaseService;

            const service = new EventsService(db);

            const result = await service.getAvailability(1);

            expect(result).toEqual(availability);
            expect(db.query).toHaveBeenCalledTimes(2);
        });

        it("throws an error when the event does not exist", async () => {
            const db = {
                query: jest
                    .fn()
                    .mockResolvedValueOnce({
                        rows: [],
                    }),
            } as unknown as DatabaseService;

            const service = new EventsService(db);

            await expect(
                service.getAvailability(1),
            ).rejects.toThrow("Event 1 not found");
        });
    });
});

