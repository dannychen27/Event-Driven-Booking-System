import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";


import BookingsPage from "../../../3. frontend/src/pages/BookingsPage";
import { getBookingHistory } from "../../../3. frontend/src/api/bookings";
import type { Booking } from "../../../3. frontend/src/types/Booking.ts";


vi.mock("../../../3. frontend/src/api/bookings.ts", () => ({
    getBookingHistory: vi.fn(),
}));


vi.mock("../../../3. frontend/src/components/BookingCard.tsx", () => ({
    default: ({
                  booking,
                  onBookingCancelled,
              }: {
        booking: Booking;
        onBookingCancelled: () => void;
    }) => (
        <div>
            <p>Mock Booking Card: {booking.id}</p>
            <button onClick={onBookingCancelled}>
                Cancel Booking {booking.id}
            </button>
        </div>
    ),
}));


describe("BookingsPage", () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("shows the loading state while bookings are being fetched", () => {
        vi.mocked(getBookingHistory).mockReturnValue(new Promise(() => {}));

        render(<BookingsPage />);

        expect(screen.getByText("Loading bookings for user 1")).toBeInTheDocument();
    });

    it("renders bookings after they are successfully fetched", async () => {
        vi.mocked(getBookingHistory).mockResolvedValue([
            {
                id: 1,
                user_id: 1,
                event_id: 1,
                created_at: "2026-09-06T12:00:00Z",
            },
            {
                id: 2,
                user_id: 1,
                event_id: 2,
                created_at: "2026-09-06T13:00:00Z",
            },
        ]);

        render(<BookingsPage />);

        expect(await screen.findByText("Mock Booking Card: 1")).toBeInTheDocument();
        expect(screen.getByText("Mock Booking Card: 2")).toBeInTheDocument();
        expect(screen.queryByText("Loading bookings for user 1"))
            .not.toBeInTheDocument();

        expect(getBookingHistory).toHaveBeenCalledWith(1);
    });

    it("shows the empty state when there are no bookings", async () => {
        vi.mocked(getBookingHistory).mockResolvedValue([]);

        render(<BookingsPage />);

        expect(await screen.findByText("No bookings right now.")).toBeInTheDocument();
        expect(screen.queryByText("Loading bookings for user 1")).not.toBeInTheDocument();
    });

    it("shows an error when fetching bookings fails", async () => {
        vi.mocked(getBookingHistory).mockRejectedValue(
            new Error("Failed to load bookings")
        );

        render(<BookingsPage />);

        expect(await screen.findByText("Failed to load bookings for user 1"))
            .toBeInTheDocument();

        expect(screen.queryByText("Loading bookings for user 1"))
            .not.toBeInTheDocument();
    });

    it("removes a booking when it is cancelled", async () => {
        vi.mocked(getBookingHistory).mockResolvedValue([
            {
                id: 1,
                user_id: 1,
                event_id: 1,
                created_at: "2026-09-06T12:00:00Z",
            },
            {
                id: 2,
                user_id: 1,
                event_id: 2,
                created_at: "2026-09-06T13:00:00Z",
            },
        ]);

        const user = userEvent.setup();

        render(<BookingsPage />);

        expect(await screen.findByText("Mock Booking Card: 1")).toBeInTheDocument();

        expect(screen.getByText("Mock Booking Card: 2")).toBeInTheDocument();

        await user.click(
            screen.getByRole("button", {
                name: "Cancel Booking 1",
            }),
        );

        expect(screen.queryByText("Mock Booking Card: 1")).not.toBeInTheDocument();
        expect(screen.getByText("Mock Booking Card: 2")).toBeInTheDocument();
    });
});

