import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";


import BookingCard from "../../../../3. frontend/src/components/cards/BookingCard";
import { cancelBooking } from "../../../../3. frontend/src/api/bookings";
import { bookingCardFixture } from "../../fixtures/bookingFixtures";


vi.mock("../../../../3. frontend/src/api/bookings", () => ({
    cancelBooking: vi.fn(),
}));


describe("BookingCard", () => {

    it("renders the booking information", () => {
        render(
            <BookingCard
                booking={bookingCardFixture}
                onBookingCancelled={() => {}}
            />,
        );

        expect(
            screen.getByRole("heading", {
                name: "Toronto Tech Meetup",
            }),
        ).toBeInTheDocument();

        expect(screen.getByText("Booking Id: 1")).toBeInTheDocument();

        expect(
            screen.getByText("Event Id: 1"),
        ).toBeInTheDocument();

        expect(
            screen.getByText("User Id: 1"),
        ).toBeInTheDocument();

        expect(screen.getByText(/^Booked at:/)).toBeInTheDocument();

        expect(
            screen.getByRole("button", {
                name: "Cancel Booking",
            }),
        ).toBeInTheDocument();
    });

    it("renders event and venue details in booking history", () => {
        render(
            <BookingCard
                booking={bookingCardFixture}
                onBookingCancelled={() => {}}
            />,
        );

        expect(
            screen.getByRole("heading", {
                name: "Toronto Tech Meetup",
            }),
        ).toBeInTheDocument();

        expect(screen.getByText("Venue: Innovation Hub")).toBeInTheDocument();
        expect(screen.getByText("Address: 100 King Street West")).toBeInTheDocument();

        expect(screen.getByText("Booking Id: 1")).toBeInTheDocument();
        expect(screen.getByText(/^Starts at:/)).toBeInTheDocument();
        expect(screen.getByText(/^Ends at:/)).toBeInTheDocument();
        expect(screen.getByText(/^Booked at:/)).toBeInTheDocument();
    });

    it("opens the cancellation modal", async () => {
        const user = userEvent.setup();

        render(
            <BookingCard
                booking={bookingCardFixture}
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
                booking={bookingCardFixture}
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

    it("prevents duplicate cancellation requests while one is pending", async () => {
        let resolveCancellation!: (value: undefined) => void;

        vi.mocked(cancelBooking).mockReturnValue(
            new Promise<undefined>((resolve) => {
                resolveCancellation = resolve;
            }),
        );

        const user = userEvent.setup();

        render(
            <BookingCard
                booking={bookingCardFixture}
                onBookingCancelled={() => {}}
            />,
        );

        await user.click(
            screen.getByRole("button", { name: "Cancel Booking" }),
        );

        await user.click(
            screen.getAllByRole("button", { name: "Cancel Booking" })[1],
        );

        expect(
            screen.getByRole("button", { name: "Cancelling..." }),
        ).toBeDisabled();

        expect(
            screen.getByRole("button", { name: "Keep Booking" }),
        ).toBeDisabled();

        expect(cancelBooking).toHaveBeenCalledTimes(1);

        resolveCancellation(undefined);

        expect(
            await screen.findByRole("button", { name: "Cancel Booking" }),
        ).toBeInTheDocument();

        expect(cancelBooking).toHaveBeenCalledTimes(1);
    });

    it("successfully cancels the booking", async () => {
        vi.mocked(cancelBooking).mockResolvedValue(undefined);

        const onBookingCancelled = vi.fn();
        const user = userEvent.setup();

        render(
            <BookingCard
                booking={bookingCardFixture}
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
            bookingCardFixture.user_id,
            bookingCardFixture.id,
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
                booking={bookingCardFixture}
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

