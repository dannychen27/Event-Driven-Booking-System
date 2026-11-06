import { Logger } from "@nestjs/common";
import { BookingHoldExpirationService } from "../../../4. backend/src/bookings/booking-hold-expiration.service";
import { BOOKING_HOLD_EXPIRATION_BATCH_SIZE } from "../../../4. backend/src/constants/bookings.constants";


describe("BookingHoldExpirationService", () => {
    let service: BookingHoldExpirationService;
    let db: any;
    let logSpy: jest.SpyInstance;
    let errorSpy: jest.SpyInstance;

    beforeEach(() => {
        db = {
            query: jest.fn().mockResolvedValue({ rows: [] }),
        };

        service = new BookingHoldExpirationService(db);

        logSpy = jest.spyOn(Logger.prototype, "log")
            .mockImplementation(() => undefined);

        errorSpy = jest.spyOn(Logger.prototype, "error")
            .mockImplementation(() => undefined);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should expire eligible holds using a bounded, concurrency-safe query", async () => {
        db.query.mockResolvedValueOnce({
            rows: [{ id: 1 }, { id: 2 }],
        });

        await service.expireExpiredHolds();

        expect(db.query).toHaveBeenCalledTimes(1);

        expect(db.query).toHaveBeenCalledWith(
            expect.any(String),
            [BOOKING_HOLD_EXPIRATION_BATCH_SIZE],
        );

        const query = db.query.mock.calls[0][0] as string;

        expect(query).toMatch(/WHERE status = 'active'\s+AND expires_at <= clock_timestamp\(\)/i);
        expect(query).toMatch(/ORDER BY expires_at ASC, id ASC/i);
        expect(query).toMatch(/LIMIT \$1\s+FOR UPDATE SKIP LOCKED/i);
        expect(query).toMatch(/UPDATE booking_holds AS bh\s+SET status = 'expired'/i);
        expect(query).toMatch(/RETURNING bh\.id/i);
        expect(logSpy).toHaveBeenCalledWith("Expired 2 booking hold(s).",);
    });

    it("should not log when no expired holds are found", async () => {
        await service.expireExpiredHolds();

        expect(db.query).toHaveBeenCalledTimes(1);
        expect(logSpy).not.toHaveBeenCalled();
    });

    it("should log database errors without crashing the scheduled task", async () => {
        db.query.mockRejectedValueOnce(new Error("Database unavailable"));

        await expect(service.expireExpiredHolds()).resolves.toBeUndefined();

        expect(errorSpy).toHaveBeenCalledWith(
            "Failed to expire booking holds",
            expect.stringContaining("Database unavailable")
        );
    });
});
