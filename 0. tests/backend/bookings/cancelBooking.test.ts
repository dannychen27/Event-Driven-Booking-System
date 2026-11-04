import { BookingsService } from "../../../4. backend/src/bookings/bookings.service";
import {
    EVENT_NOT_FOUND_MESSAGE,
    USER_NOT_FOUND_MESSAGE,
} from "../fixtures/shared/errorMessageFixtures";
import { BOOKING_RESULT_FIXTURE } from "../fixtures/shared/sharedTestFixtures"
import {
    mockBookingExists, mockBookingDoesNotExist,
    mockDeletedBooking
} from "../helpers/bookingTestHelpers";
import { mockUserDoesNotExist, mockUserExists } from "../helpers/usersTestHelpers";
import { mockEventExists, mockEventDoesNotExist } from "../helpers/eventsTestHelpers";
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
        mockUserExists(client, 1);
        mockBookingExists(client, 123, 1, 1);
        mockEventExists(client, 1);
        mockDeletedBooking(client, 123, 1, 1);

        const result = await service.cancelBooking(1, 123);

        expect(result).toEqual(BOOKING_RESULT_FIXTURE);

        expect(db.transaction).toHaveBeenCalledTimes(1);
        expect(client.query).toHaveBeenCalledTimes(4);

        // Check user lookup / lock
        expectNthQuery(client, 1, "FROM users", [1]);
        expectNthQuery(client, 1, "FOR UPDATE", [1]);

        // Check booking lookup
        expectNthQuery(client, 2, "FROM bookings", [123]);

        // Check event lookup / lock
        expectNthQuery(client, 3, "FROM events", [1]);
        expectNthQuery(client, 3, "FOR UPDATE", [1]);

        // Check booking deletion
        expectNthQuery(client, 4, "DELETE FROM bookings", [123]);
    });

    it("should reject the cancellation when the booking does not exist", async () => {
        mockUserExists(client, 1);
        mockBookingDoesNotExist(client);

        await expect(service.cancelBooking(1, 999))
            .rejects.toThrow("Booking 999 not found");

        expect(client.query).toHaveBeenCalledTimes(2);

        expectNthQuery(client, 1, "FROM users", [1]);
        expectNthQuery(client, 2, "FROM bookings", [999]);
    });

    it("should reject the cancellation when the user does not exist", async () => {
        mockUserDoesNotExist(client);

        await expect(service.cancelBooking(999, 123))
            .rejects.toThrow(USER_NOT_FOUND_MESSAGE);

        expect(client.query).toHaveBeenCalledTimes(1);
        expectNthQuery(client, 1, "FROM users", [999]);
    });

    it("should reject the cancellation when the event does not exist", async () => {
        mockUserExists(client, 1);
        mockBookingExists(client, 123, 1, 999);
        mockEventDoesNotExist(client);

        await expect(service.cancelBooking(1, 123))
            .rejects.toThrow(EVENT_NOT_FOUND_MESSAGE);

        expect(client.query).toHaveBeenCalledTimes(3);

        expectNthQuery(client, 1, "FROM users", [1]);
        expectNthQuery(client, 1, "FOR UPDATE", [1]);
        expectNthQuery(client, 2, "FROM bookings", [123]);
        expectNthQuery(client, 3, "FROM events", [999]);
    });


    it("should reject cancellation by a non-booking owner without deleting the booking", async () => {
        mockUserExists(client, 2);
        mockBookingExists(client, 123, 1, 1);

        await expect(service.cancelBooking(2, 123))
            .rejects.toThrow(
                "User 2 is not authorized to cancel booking 123",
            );

        expect(client.query).toHaveBeenCalledTimes(2);

        expectNthQuery(client, 1, "FROM users", [2]);
        expectNthQuery(client, 1, "FOR UPDATE", [2]);
        expectNthQuery(client, 2, "FROM bookings", [123]);

        expect(
            client.query.mock.calls.some(([query]: [string]) =>
                query.includes("DELETE FROM bookings"),
            ),
        ).toBe(false);
    });

    it("should reject when the booking disappears before deletion", async () => {
        mockUserExists(client, 1);
        mockBookingExists(client, 123, 1, 1);
        mockEventExists(client, 1);

        // Simulate DELETE ... RETURNING affecting zero rows.
        client.query.mockResolvedValueOnce({ rows: [] });

        await expect(service.cancelBooking(1, 123))
            .rejects.toThrow("Booking 123 not found");

        expect(client.query).toHaveBeenCalledTimes(4);
        expectNthQuery(client, 4, "DELETE FROM bookings", [123]);
    });
});

