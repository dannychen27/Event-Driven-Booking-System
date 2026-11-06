import { BookingsController } from "../../../4. backend/src/bookings/bookings.controller";
import { BookingsService } from "../../../4. backend/src/bookings/bookings.service";

describe("BookingsController", () => {
    let controller: BookingsController;
    let bookingsService: {
        createBooking: jest.Mock;
        confirmHold: jest.Mock;
        cancelHold: jest.Mock;
        cancelBooking: jest.Mock;
        getBookingHistory: jest.Mock;
    };

    beforeEach(() => {
        bookingsService = {
            createBooking: jest.fn(),
            confirmHold: jest.fn(),
            cancelHold: jest.fn(),
            cancelBooking: jest.fn(),
            getBookingHistory: jest.fn(),
        };

        controller = new BookingsController(
            bookingsService as unknown as BookingsService,
        );
    });

    describe("createBooking", () => {
        it("should forward the idempotency key to the service", () => {
            controller.createBooking("42", { user_id: 7 }, "booking-key-123");

            expect(bookingsService.createBooking).toHaveBeenCalledWith(
                7,
                42,
                "booking-key-123",
            );
        });

        it("should support requests without an idempotency key", () => {
            controller.createBooking("42", { user_id: 7 });

            expect(bookingsService.createBooking).toHaveBeenCalledWith(
                7,
                42,
                undefined,
            );
        });
    });

    describe("confirmHold", () => {
        it("should forward the idempotency key to the service", () => {
            controller.confirmHold("10", { user_id: 7 }, "hold-key-123");

            expect(bookingsService.confirmHold).toHaveBeenCalledWith(
                7,
                10,
                "hold-key-123",
            );
        });

        it("should support requests without an idempotency key", () => {
            controller.confirmHold("10", { user_id: 7 });

            expect(bookingsService.confirmHold).toHaveBeenCalledWith(
                7,
                10,
                undefined,
            );
        });
    });
});
