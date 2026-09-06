import { BookingsService } from "../../../4. backend/src/bookings/bookings.service";
import { mockBookingHistory } from "../helpers/bookingTestHelpers";
import { mockUserExists, mockUserDoesNotExist } from "../helpers/usersTestHelpers";


describe("BookingsService.getBookingHistory", () => {
    let service: BookingsService;
    let db: any;

    beforeEach(() => {
        db = {
            query: jest.fn(),
        };

        service = new BookingsService(db);
    });

    it("should return the user's booking history", async () => {
        const bookings = [
            {
                id: 2,
                user_id: 1,
                event_id: 20,
                created_at: "2026-09-05T20:00:00Z",
            },
            {
                id: 1,
                user_id: 1,
                event_id: 10,
                created_at: "2026-09-04T20:00:00Z",
            },
        ];

        mockUserExists(db, 1);
        mockBookingHistory(db, bookings);

        const result = await service.getBookingHistory(1);

        expect(result).toEqual(bookings);
        expect(db.query).toHaveBeenCalledTimes(2);

        expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining("FROM users"), [1]);
        expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining("FROM bookings"), [1]);

        expect(db.query.mock.calls[1][0]).toContain("ORDER BY created_at DESC");
    });

    it("should return an empty array when the user has no bookings", async () => {
        mockUserExists(db, 1);
        mockBookingHistory(db, []);

        const result = await service.getBookingHistory(1);

        expect(result).toEqual([]);
        expect(db.query).toHaveBeenCalledTimes(2);

        expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining("FROM users"), [1]);
        expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining("FROM bookings"), [1]);

        expect(db.query.mock.calls[1][0]).toContain("ORDER BY created_at DESC");
    });

    it("should reject the request when the user does not exist", async () => {
        mockUserDoesNotExist(db);

        await expect(service.getBookingHistory(999))
            .rejects.toThrow("User 999 does not exist");

        expect(db.query).toHaveBeenCalledTimes(1);

        expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining("FROM users"), [999]);
    });
});

