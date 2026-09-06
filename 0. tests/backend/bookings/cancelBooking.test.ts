import { BookingsService } from "../../../4. backend/src/bookings/bookings.service";
import {
    mockUserExists, mockEventExists, mockBookingExists, mockBookingDoesNotExist,
    mockDeletedBooking,
} from "../helpers/bookingTestHelpers";
import { expectNthQuery, mockTransaction } from "../../utils/testHelpers";


describe("BookingsService.cancelBooking", () => {
    let service: BookingsService;
    let db: any;
    let client: any;

    beforeEach(() => {
        client = {
            query: jest.fn(),
        };

        db = {};
        mockTransaction(db, client);
        service = new BookingsService(db);
    });

    it("should successfully cancel a booking", async () => {
        mockBookingExists(client, 123, 1, 1);
        mockUserExists(client, 1);
        mockEventExists(client, 1);
        mockDeletedBooking(client, 123, 1, 1);

        const result = await service.cancelBooking(1, 123);

        expect(result).toEqual({
            id: 123,
            user_id: 1,
            event_id: 1,
            created_at: "2026-09-05T20:00:00Z",
        });

        expect(db.transaction).toHaveBeenCalledTimes(1);
        expect(client.query).toHaveBeenCalledTimes(4);

        // Check booking lookup
        expectNthQuery(client, 1, "FROM bookings", [123]);

        // Check user lookup
        expectNthQuery(client, 2, "FROM users", [1]);

        // Check event lookup / lock
        expectNthQuery(client, 3, "FROM events", [1]);
        expectNthQuery(client, 3, "FOR UPDATE", [1]);

        // Check booking deletion
        expectNthQuery(client, 4, "DELETE FROM bookings", [123]);
    });

    it("should reject the cancellation when the booking does not exist", async () => {
        mockBookingDoesNotExist(client);

        await expect(service.cancelBooking(1, 999))
            .rejects.toThrow("Booking 999 not found");

        expect(client.query).toHaveBeenCalledTimes(1);

        expectNthQuery(client, 1, "FROM bookings", [999]);
    });

    it("should reject the cancellation when the user does not exist", async () => {
        mockBookingExists(client, 123, 1, 1);

        client.query.mockResolvedValueOnce({
            rows: [],
        });

        await expect(service.cancelBooking(999, 123))
            .rejects.toThrow("User 999 not found");

        expect(client.query).toHaveBeenCalledTimes(2);

        expectNthQuery(client, 1, "FROM bookings", [123]);
        expectNthQuery(client, 2, "FROM users", [999]);
    });

    it("should reject the cancellation when the event does not exist", async () => {
        mockBookingExists(client, 123, 1, 999);
        mockUserExists(client, 1);

        client.query.mockResolvedValueOnce({
            rows: [],
        });

        await expect(service.cancelBooking(1, 123))
            .rejects.toThrow("Event 999 not found");

        expect(client.query).toHaveBeenCalledTimes(3);

        expectNthQuery(client, 1, "FROM bookings", [123]);
        expectNthQuery(client, 2, "FROM users", [1]);
        expectNthQuery(client, 3, "FROM events", [999]);
    });

    it("TODO: should reject cancellation by a non-booking owner", async () => {
        mockBookingExists(client, 123, 1, 1);
        mockUserExists(client, 2);
        mockEventExists(client, 1);

        // TODO: Current implementation does not perform authorization,
        // TODO: so the DELETE query still executes.
        mockDeletedBooking(client, 123, 1, 1);

        await expect(service.cancelBooking(2, 123))
            .rejects.toThrow("User 2 is not authorized to cancel booking 123");
    });
});

