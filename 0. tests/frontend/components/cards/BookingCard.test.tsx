import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";


import BookingCard from "../../../../3. frontend/src/components/cards/BookingCard";
import { cancelBooking } from "../../../../3. frontend/src/api/bookings";
import { bookingCardFixture } from "../../fixtures/bookings/bookingFixtures";


vi.mock("../../../../3. frontend/src/api/bookings", () => ({
    cancelBooking: vi.fn(),
}));


describe("BookingCard", () => {
    describe("booking information", () => {
        it("renders the event name, venue, location, and booking dates", () => {
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

            expect(screen.getByText("Confirmed", { exact: true }))
                .toBeInTheDocument();

            expect(screen.getByText("Venue:", { exact: true })).toBeInTheDocument();
            expect(screen.getByText("Innovation Hub", { exact: true })).toBeInTheDocument();
            expect(screen.getByText("Location:", { exact: true })).toBeInTheDocument();
            expect(
                screen.getByText("100 King Street West", { exact: true }),
            ).toBeInTheDocument();

            expect(screen.getByText(/^Date & Time/)).toBeInTheDocument();
            expect(screen.getByText("Booked at:", { exact: true })).toBeInTheDocument();

            expect(
                screen.getByRole("button", { name: "Cancel Booking" }),
            ).toBeInTheDocument();
        });

        it("shows cancelled status without offering another cancellation", () => {
            render(
                <BookingCard
                    booking={{ ...bookingCardFixture, status: "cancelled" }}
                    onBookingCancelled={() => {}}
                />,
            );

            expect(screen.getByText("Cancelled", { exact: true }))
                .toBeInTheDocument();
            expect(screen.queryByRole("button", { name: "Cancel Booking" }))
                .not.toBeInTheDocument();
        });

        it("does not expose internal booking, event, or user identifiers", () => {
            render(
                <BookingCard
                    booking={bookingCardFixture}
                    onBookingCancelled={() => {}}
                />,
            );

            expect(screen.queryByText(/Booking Id:/)).not.toBeInTheDocument();
            expect(screen.queryByText(/Event Id:/)).not.toBeInTheDocument();
            expect(screen.queryByText(/User Id:/)).not.toBeInTheDocument();
        });

        it("uses readable fallbacks when event and venue details are unavailable", () => {
            render(
                <BookingCard
                    booking={{
                        ...bookingCardFixture,
                        event_name: null,
                        venue_name: null,
                        venue_address: null,
                        start_time: null,
                        end_time: null,
                        image_url: null,
                    }}
                    onBookingCancelled={() => {}}
                />,
            );

            expect(
                screen.getByRole("heading", {
                    name: "Event details unavailable",
                }),
            ).toBeInTheDocument();

            expect(
                screen.getByText("Venue details unavailable", { exact: true }),
            ).toBeInTheDocument();

            expect(
                screen.getByText("Location to be announced", { exact: true }),
            ).toBeInTheDocument();

            expect(screen.getByText("Date to be announced")).toBeInTheDocument();
        });

        it("trims whitespace from optional event and venue details", () => {
            render(
                <BookingCard
                    booking={{
                        ...bookingCardFixture,
                        event_name: "  Toronto Tech Meetup  ",
                        venue_name: "  Innovation Hub  ",
                        venue_address: "  100 King Street West  ",
                    }}
                    onBookingCancelled={() => {}}
                />,
            );

            expect(
                screen.getByRole("heading", {
                    name: "Toronto Tech Meetup",
                }),
            ).toBeInTheDocument();

            expect(screen.getByText("Innovation Hub", { exact: true })).toBeInTheDocument();
            expect(
                screen.getByText("100 King Street West", { exact: true }),
            ).toBeInTheDocument();
        });
    });

    describe("cancellation", () => {
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

            await user.click(
                screen.getByRole("button", {
                    name: "Keep Booking",
                }),
            );

            expect(
                screen.queryByRole("heading", {
                    name: "Cancel Booking?",
                }),
            ).not.toBeInTheDocument();
        });

        it("prevents duplicate cancellation requests while one is pending", async () => {
            let resolveCancellation!: (value: { id: number; status: "cancelled" }) => void;

            vi.mocked(cancelBooking).mockReturnValue(
                new Promise<{ id: number; status: "cancelled" }>((resolve) => {
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

            resolveCancellation({ id: bookingCardFixture.id, status: "cancelled" });

            expect(
                await screen.findByRole("button", { name: "Cancel Booking" }),
            ).toBeInTheDocument();

            expect(cancelBooking).toHaveBeenCalledTimes(1);
        });

        it("successfully cancels the booking", async () => {
            vi.mocked(cancelBooking).mockResolvedValue({
                id: bookingCardFixture.id,
                status: "cancelled",
            });

            const onBookingCancelled = vi.fn();
            const user = userEvent.setup();

            render(
                <BookingCard
                    booking={bookingCardFixture}
                    onBookingCancelled={onBookingCancelled}
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

            const cancelButtons = screen.getAllByRole("button", {
                name: "Cancel Booking",
            });

            await user.click(cancelButtons[1]);

            expect(
                await screen.findByText("Failed to cancel booking."),
            ).toBeInTheDocument();

            expect(
                screen.getByRole("heading", {
                    name: "Cancel Booking?",
                }),
            ).toBeInTheDocument();
        });
    });
});
