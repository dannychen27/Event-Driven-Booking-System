import { BookingsService } from "../../../4. backend/src/bookings/bookings.service";
import { mockBookingHistory } from "../helpers/bookingTestHelpers";
import { mockUserExists, mockUserDoesNotExist } from "../helpers/usersTestHelpers";

import { bookingHistoryFixture } from "../fixtures/bookings/bookingHistoryFixtures";

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
        mockUserExists(db, 1);
        mockBookingHistory(db, bookingHistoryFixture);

        const result = await service.getBookingHistory(1);

        expect(result).toEqual(bookingHistoryFixture);
        expect(db.query).toHaveBeenCalledTimes(2);

        expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining("FROM users"), [1]);
        expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining("FROM bookings"), [1]);

        const historyQuery = db.query.mock.calls[1][0];

        expect(historyQuery).toContain("LEFT JOIN events");
        expect(historyQuery).toContain("LEFT JOIN venues");
        expect(historyQuery).toContain("ORDER BY b.created_at DESC");

        expect(result[0].event_name).toBe("Toronto Tech Meetup");
        expect(result[0].venue_name).toBe("Innovation Hub");
    });

    it("should return an empty array when the user has no bookings", async () => {
        mockUserExists(db, 1);
        mockBookingHistory(db, []);

        const result = await service.getBookingHistory(1);

        expect(result).toEqual([]);
        expect(db.query).toHaveBeenCalledTimes(2);

        expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining("FROM users"), [1]);
        expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining("FROM bookings"), [1]);

        const historyQuery = db.query.mock.calls[1][0];

        expect(historyQuery).toContain("LEFT JOIN events");
        expect(historyQuery).toContain("LEFT JOIN venues");
        expect(historyQuery).toContain("ORDER BY b.created_at DESC");
    });

    it("should reject the request when the user does not exist", async () => {
        mockUserDoesNotExist(db);

        await expect(service.getBookingHistory(999))
            .rejects.toThrow("User 999 does not exist");

        expect(db.query).toHaveBeenCalledTimes(1);

        expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining("FROM users"), [999]);
    });
});

