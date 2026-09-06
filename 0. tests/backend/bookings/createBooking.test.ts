import { BookingsService } from "../../../4. backend/src/bookings/bookings.service";
import {
    mockUserExists, mockEventExists, mockNoDuplicateBooking, mockDuplicateBooking,
    mockBookingCount, mockNoScheduleConflict, mockScheduleConflict,
    mockInsertedBooking,
} from "../helpers/bookingTestHelpers";
import { expectNthQuery } from "../../utils/testHelpers";


describe("BookingsService.createBooking", () => {
    let service: BookingsService;
    let db: any;
    let client: any;

    beforeEach(() => {
        client = {
            query: jest.fn(),
        };

        db = {
            transaction: jest.fn(async (
                callback: (client: any) => Promise<any>,
            ) => {
                return callback(client);
            }),
        };

        service = new BookingsService(db);
    });

    it("should successfully create a booking", async () => {
        mockUserExists(client, 1);
        mockEventExists(client, 1);
        mockNoDuplicateBooking(client);
        mockBookingCount(client, 2);
        mockNoScheduleConflict(client);
        mockInsertedBooking(client, 123, 1, 1);

        const result = await service.createBooking(1, 1);

        expect(result).toEqual({
            id: 123,
            user_id: 1,
            event_id: 1,
            created_at: "2026-09-05T20:00:00Z",
        });

        expect(db.transaction).toHaveBeenCalledTimes(1);
        expect(client.query).toHaveBeenCalledTimes(6);

        expectNthQuery(client, 1, "FROM users", [1]);
        expectNthQuery(client, 2, "FROM events", [1]);
        expectNthQuery(client, 3, "FROM bookings", [1, 1]);
        expectNthQuery(client, 4, "COUNT(*)", [1]);
        expectNthQuery(client, 5, "JOIN events", [
            1,
            "2026-09-10T11:00:00Z",
            "2026-09-10T10:00:00Z",
        ]);
        expectNthQuery(client, 6, "INSERT INTO bookings", [1, 1]);
    });

    it("should reject the booking when the user does not exist", async () => {
        client.query.mockResolvedValueOnce({
            rows: [],
        });

        await expect(service.createBooking(999, 1))
            .rejects.toThrow("User 999 not found");

        expect(client.query).toHaveBeenCalledTimes(1);

        expectNthQuery(client, 1, "FROM users", [999]);
    });

    it("should reject the booking when the event does not exist", async () => {
        mockUserExists(client, 1);

        client.query.mockResolvedValueOnce({
            rows: [],
        });

        await expect(service.createBooking(1, 999))
            .rejects.toThrow("Event 999 not found");

        expect(client.query).toHaveBeenCalledTimes(2);

        expectNthQuery(client, 1, "FROM users", [1]);
        expectNthQuery(client, 2, "FROM events", [999]);
    });

    it("should reject a duplicate booking", async () => {
        mockUserExists(client, 1);
        mockEventExists(client, 1);
        mockDuplicateBooking(client, 123);

        await expect(service.createBooking(1, 1))
            .rejects.toThrow("User 1 has already booked event 1");

        expect(client.query).toHaveBeenCalledTimes(3);

        expectNthQuery(client, 1, "FROM users", [1]);
        expectNthQuery(client, 2, "FROM events", [1]);
        expectNthQuery(client, 3, "WHERE user_id = $1", [1, 1]);
    });

    it("should reject a booking when the event is at capacity", async () => {
        mockUserExists(client, 1);
        mockEventExists(client, 1, 10);
        mockNoDuplicateBooking(client);
        mockBookingCount(client, 10);

        await expect(service.createBooking(1, 1))
            .rejects.toThrow("Event 1 is fully booked");

        expect(client.query).toHaveBeenCalledTimes(4);

        expectNthQuery(client, 1, "FROM users", [1]);
        expectNthQuery(client, 2, "FROM events", [1]);
        expectNthQuery(client, 3, "FROM bookings", [1, 1]);
        expectNthQuery(client, 4, "COUNT(*)", [1]);
    });

    it("should reject a booking when the user has a schedule conflict", async () => {
        mockUserExists(client, 1);
        mockEventExists(
            client,
            1,
            10,
            "2026-09-10T10:00:00Z",
            "2026-09-10T11:00:00Z",
        );
        mockNoDuplicateBooking(client);
        mockBookingCount(client, 2);
        mockScheduleConflict(client, 456);

        await expect(service.createBooking(1, 1))
            .rejects.toThrow("User 1 has a conflicting booking with event 456");

        expect(client.query).toHaveBeenCalledTimes(5);

        expectNthQuery(client, 1, "FROM users", [1]);
        expectNthQuery(client, 2, "FROM events", [1]);
        expectNthQuery(client, 3, "WHERE user_id = $1", [1, 1]);
        expectNthQuery(client, 4, "COUNT(*)", [1]);
        expectNthQuery(client, 5, "JOIN events", [
            1,
            "2026-09-10T11:00:00Z",
            "2026-09-10T10:00:00Z",
        ]);
    });
});
