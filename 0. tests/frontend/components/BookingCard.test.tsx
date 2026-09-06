import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";


import BookingCard from "../../../3. frontend/src/components/BookingCard";
import { cancelBooking } from "../../../3. frontend/src/api/bookings";
import { mockBooking } from "../../mocks/bookingMocks";


vi.mock("../../../3. frontend/src/api/bookings", () => ({
    cancelBooking: vi.fn(),
}));


describe("BookingCard", () => {

    it("renders the booking information", () => {
        render(
            <BookingCard
                booking={mockBooking}
                onBookingCancelled={() => {}}
            />,
        );

        expect(
            screen.getByRole("heading", {
                name: "Booking Id: 1",
            }),
        ).toBeInTheDocument();

        expect(
            screen.getByText("Event Id: 1"),
        ).toBeInTheDocument();

        expect(
            screen.getByText("User Id: 1"),
        ).toBeInTheDocument();

        expect(
            screen.getByText(/^Created at:/),
        ).toBeInTheDocument();

        expect(
            screen.getByRole("button", {
                name: "Cancel Booking",
            }),
        ).toBeInTheDocument();
    });

    it("opens the cancellation modal", async () => {
        const user = userEvent.setup();

        render(
            <BookingCard
                booking={mockBooking}
                onBookingCancelled={() => {}}
            />,
        );

        await user.click(
            screen.getByRole("button", {
                name: "Cancel Booking",
            }),
        );

        expect(
            await screen.findByRole("heading", {
                name: "Cancel Booking?",
            }),
        ).toBeInTheDocument();

        expect(
            screen.getByText("This action cannot be undone."),
        ).toBeInTheDocument();

        expect(
            screen.getByRole("button", {
                name: "Keep Booking",
            }),
        ).toBeInTheDocument();
    });

    it("closes the cancellation modal when the user keeps the booking", async () => {
        const user = userEvent.setup();

        render(
            <BookingCard
                booking={mockBooking}
                onBookingCancelled={() => {}}
            />,
        );

        // Open the cancellation modal.
        await user.click(
            screen.getByRole("button", {
                name: "Cancel Booking",
            }),
        );

        expect(
            await screen.findByRole("heading", {
                name: "Cancel Booking?",
            }),
        ).toBeInTheDocument();

        // Keep the booking.
        await user.click(
            screen.getByRole("button", {
                name: "Keep Booking",
            }),
        );

        // The modal should now be gone.
        expect(
            screen.queryByRole("heading", {
                name: "Cancel Booking?",
            }),
        ).not.toBeInTheDocument();
    });

    it("successfully cancels the booking", async () => {
        vi.mocked(cancelBooking).mockResolvedValue(undefined);

        const onBookingCancelled = vi.fn();
        const user = userEvent.setup();

        render(
            <BookingCard
                booking={mockBooking}
                onBookingCancelled={onBookingCancelled}
            />,
        );

        // Open the cancellation modal.
        await user.click(
            screen.getByRole("button", {
                name: "Cancel Booking",
            }),
        );

        expect(
            await screen.findByRole("heading", {
                name: "Cancel Booking?",
            }),
        ).toBeInTheDocument();

        // Click the Cancel Booking button inside the modal.
        const cancelButtons = screen.getAllByRole("button", {
            name: "Cancel Booking",
        });

        await user.click(cancelButtons[1]);

        expect(cancelBooking).toHaveBeenCalledWith(
            mockBooking.user_id,
            mockBooking.id,
        );

        expect(
            screen.queryByRole("heading", {
                name: "Cancel Booking?",
            }),
        ).not.toBeInTheDocument();

        expect(onBookingCancelled).toHaveBeenCalled();
    });

    it("shows an error when booking cancellation fails", async () => {
        vi.mocked(cancelBooking).mockRejectedValue(
            new Error("Failed to cancel booking."),
        );

        const user = userEvent.setup();

        render(
            <BookingCard
                booking={mockBooking}
                onBookingCancelled={() => {}}
            />,
        );

        // Open the cancellation modal.
        await user.click(
            screen.getByRole("button", {
                name: "Cancel Booking",
            }),
        );

        expect(
            await screen.findByRole("heading", {
                name: "Cancel Booking?",
            }),
        ).toBeInTheDocument();

        // Click the Cancel Booking button inside the modal.
        const cancelButtons = screen.getAllByRole("button", {
            name: "Cancel Booking",
        });

        await user.click(cancelButtons[1]);

        // The cancellation error should be displayed.
        expect(
            await screen.findByText("Failed to cancel booking."),
        ).toBeInTheDocument();

        // The modal should remain open.
        expect(
            screen.getByRole("heading", {
                name: "Cancel Booking?",
            }),
        ).toBeInTheDocument();
    });
});

