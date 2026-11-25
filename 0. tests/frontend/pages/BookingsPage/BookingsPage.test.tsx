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
                onBookingCancelled: (result: { id: number; status: "cancelled" }) => void;
            }
        ) => (
            <div>
                <p>Mock Booking Card: {booking.id}</p>
                <p>Mock Booking Status: {booking.status}</p>
                <Button onClick={() => onBookingCancelled({ id: booking.id, status: "cancelled" })}>
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
            expect(screen.getByText("Loading bookings..."))
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
            expect(screen.queryByText("Loading bookings..."))
                .not.toBeInTheDocument();

            expect(getBookingHistory).toHaveBeenCalledWith(1);
        });

        it("shows the empty state when there are no bookings", async () => {
            vi.mocked(getBookingHistory).mockResolvedValue([]);

            render(<BookingsPage />);

            expect(await screen.findByText("No bookings right now."))
                .toBeInTheDocument();
            expect(screen.queryByText("Loading bookings..."))
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
            expect(screen.queryByText("Loading bookings..."))
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

            expect(screen.getByText("Loading bookings..."))
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

    describe("Booking filters", () => {
        it("renders all five filters with All selected initially", async () => {
            vi.mocked(getBookingHistory).mockResolvedValue(bookingHistoryFixture);

            render(<BookingsPage />);

            await screen.findByText("Mock Booking Card: 1");

            const filterNames = [
                "All",
                "Upcoming",
                "Happening Now",
                "Past",
                "Cancelled",
            ];

            for (const name of filterNames) {
                expect(screen.getByRole("button", { name })).toBeInTheDocument();
            }

            expect(screen.getByRole("button", { name: "All" }))
                .toHaveAttribute("aria-pressed", "true");

            for (const name of filterNames.slice(1)) {
                expect(screen.getByRole("button", { name }))
                    .toHaveAttribute("aria-pressed", "false");
            }
        });

        it("renders booking results inside the responsive grid container", async () => {
            vi.mocked(getBookingHistory).mockResolvedValue(bookingHistoryFixture);

            const { container } = render(<BookingsPage />);

            await screen.findByText("Mock Booking Card: 1");

            const results = container.querySelector(".bookings-list");

            expect(results).toBeInTheDocument();
            expect(results?.children).toHaveLength(2);
        });

        it("shows confirmed bookings with future end times under Upcoming", async () => {
            const futureBooking = {
                ...bookingHistoryFixture[0],
                start_time: "2099-09-10T18:00:00Z",
                end_time: "2099-09-10T20:00:00Z",
            };
            vi.mocked(getBookingHistory).mockResolvedValue([futureBooking]);

            const user = userEvent.setup();
            render(<BookingsPage />);

            expect(await screen.findByText("Mock Booking Card: 2"))
                .toBeInTheDocument();

            await user.click(screen.getByRole("button", { name: "Upcoming" }));

            expect(screen.getByText("Mock Booking Card: 2"))
                .toBeInTheDocument();
        });

        it("shows the filter-specific empty state", async () => {
            vi.mocked(getBookingHistory).mockResolvedValue(bookingHistoryFixture);

            const user = userEvent.setup();
            render(<BookingsPage />);

            await screen.findByText("Mock Booking Card: 1");
            await user.click(screen.getByRole("button", { name: "Upcoming" }));

            expect(screen.getByText("No upcoming bookings."))
                .toBeInTheDocument();
        });
    });

    describe("Booking cancellation", () => {
        it("retains a booking and updates its status when it is cancelled", async () => {
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

            expect(screen.getByText("Mock Booking Card: 1"))
                .toBeInTheDocument();
            expect(screen.getByText("Mock Booking Status: cancelled"))
                .toBeInTheDocument();
            expect(screen.getByText("Mock Booking Card: 2"))
                .toBeInTheDocument();

            await user.click(screen.getByRole("button", { name: "Cancelled" }));

            expect(screen.getByText("Mock Booking Card: 1"))
                .toBeInTheDocument();
            expect(screen.queryByText("Mock Booking Card: 2"))
                .not.toBeInTheDocument();
        });
    });
});
