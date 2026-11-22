import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";

import { bookingHistoryFixture } from "../../fixtures/bookings/bookingFixtures";

import Button from "../../../../3. frontend/src/components/ui/buttons/Button";
import BookingsPage from "../../../../3. frontend/src/pages/BookingsPage";
import { getBookingHistory } from "../../../../3. frontend/src/api/bookings";
import type { Booking } from "../../../../3. frontend/src/types/bookings/Booking.ts";


vi.mock("../../../../3. frontend/src/api/bookings.ts", () => ({
    getBookingHistory: vi.fn(),
}));


vi.mock("../../../../3. frontend/src/components/cards/BookingCard.tsx", () => (
    {
        default: (
            {
                booking,
                onBookingCancelled,
            }: {
                booking: Booking;
                onBookingCancelled: () => void;
            }
        ) => (
            <div>
                <p>Mock Booking Card: {booking.id}</p>
                <Button onClick={onBookingCancelled}>
                    Cancel Booking {booking.id}
                </Button>
            </div>
        ),
    }
));


describe("BookingsPage", () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("Loading state", () => {
        it("shows the loading state while bookings are being fetched", () => {
            vi.mocked(getBookingHistory).mockReturnValue(new Promise(() => {}));

            const { container } = render(<BookingsPage />);

            expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
            expect(screen.getByText("Loading your bookings..."))
                .toBeInTheDocument();
            expect(container.querySelectorAll(".booking-card-skeleton"))
                .toHaveLength(3);
        });
    });

    describe("Successful booking retrieval", () => {
        it("renders bookings after they are successfully fetched", async () => {
            vi.mocked(getBookingHistory).mockResolvedValue(bookingHistoryFixture);

            render(<BookingsPage />);

            expect(await screen.findByText("Mock Booking Card: 1"))
                .toBeInTheDocument();
            expect(screen.getByText("Mock Booking Card: 2"))
                .toBeInTheDocument();
            expect(screen.queryByText("Loading your bookings..."))
                .not.toBeInTheDocument();

            expect(getBookingHistory).toHaveBeenCalledWith(1);
        });

        it("shows the empty state when there are no bookings", async () => {
            vi.mocked(getBookingHistory).mockResolvedValue([]);

            render(<BookingsPage />);

            expect(await screen.findByText("No bookings right now."))
                .toBeInTheDocument();
            expect(screen.queryByText("Loading your bookings..."))
                .not.toBeInTheDocument();
        });
    });

    describe("Error handling and retry", () => {
        it("shows the reusable error state when fetching bookings fails", async () => {
            vi.mocked(getBookingHistory).mockRejectedValue(
                new Error("Failed to load bookings")
            );

            render(<BookingsPage />);

            expect(await screen.findByRole("alert")).toBeInTheDocument();
            expect(screen.getByRole("heading", {
                name: "We couldn't load your bookings.",
            })).toBeInTheDocument();

            expect(screen.getByText("We couldn't retrieve your booking history."))
                .toBeInTheDocument();
            expect(screen.getByRole("button", { name: "Try again" }))
                .toBeInTheDocument();

            expect(screen.queryByText("Failed to load bookings"))
                .not.toBeInTheDocument();
            expect(screen.queryByText("Loading your bookings..."))
                .not.toBeInTheDocument();
        });

        it("retries a failed request and renders bookings after recovery", async () => {
            let resolveRetry!: (bookings: Booking[]) => void;

            vi.mocked(getBookingHistory)
                .mockRejectedValueOnce(new Error("Network unavailable"))
                .mockReturnValueOnce(
                    new Promise<Booking[]>((resolve) => {
                        resolveRetry = resolve;
                    })
                );

            const user = userEvent.setup();

            render(<BookingsPage />);

            expect(await screen.findByRole("alert")).toBeInTheDocument();

            await user.click(
                screen.getByRole("button", { name: "Try again" })
            );

            expect(screen.getByText("Loading your bookings..."))
                .toBeInTheDocument();

            resolveRetry(bookingHistoryFixture);

            expect(await screen.findByText("Mock Booking Card: 1"))
                .toBeInTheDocument();
            expect(screen.getByText("Mock Booking Card: 2"))
                .toBeInTheDocument();

            expect(screen.queryByRole("alert")).not.toBeInTheDocument();
            expect(getBookingHistory).toHaveBeenCalledTimes(2);
        });

        it("keeps the error state available when retrying also fails", async () => {
            vi.mocked(getBookingHistory)
                .mockRejectedValueOnce(new Error("Network unavailable"))
                .mockRejectedValueOnce(new Error("Still unavailable"));

            const user = userEvent.setup();

            render(<BookingsPage />);

            expect(await screen.findByRole("alert")).toBeInTheDocument();

            await user.click(
                screen.getByRole("button", { name: "Try again" })
            );

            expect(await screen.findByRole("alert")).toBeInTheDocument();
            expect(screen.getByRole("button", { name: "Try again" }))
                .toBeInTheDocument();

            expect(getBookingHistory).toHaveBeenCalledTimes(2);
        });
    });

    describe("Booking cancellation", () => {
        it("removes a booking when it is cancelled", async () => {
            vi.mocked(getBookingHistory).mockResolvedValue(bookingHistoryFixture);

            const user = userEvent.setup();

            render(<BookingsPage />);

            expect(await screen.findByText("Mock Booking Card: 1"))
                .toBeInTheDocument();
            expect(screen.getByText("Mock Booking Card: 2"))
                .toBeInTheDocument();

            await user.click(
                screen.getByRole("button", {
                    name: "Cancel Booking 1",
                }),
            );

            expect(screen.queryByText("Mock Booking Card: 1"))
                .not.toBeInTheDocument();
            expect(screen.getByText("Mock Booking Card: 2"))
                .toBeInTheDocument();
        });
    });
});
