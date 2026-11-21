import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { eventCardFixture } from "../../fixtures/events/eventFixtures";
import EventCard from "../../../../3. frontend/src/components/cards/EventCard";
import Button from "../../../../3. frontend/src/components/ui/buttons/Button";
import { createBooking } from "../../../../3. frontend/src/api/bookings";

vi.mock("../../../../3. frontend/src/api/bookings", () => ({
    createBooking: vi.fn(),
}));


vi.mock("../../../../3. frontend/src/components/forms/BookingForm.tsx", () => ({
    default: ({
        onBookingCreated,
    }: {
        onBookingCreated: () => void;
    }) => (
        <Button onClick={onBookingCreated}>
            Mock Booking Form
        </Button>
    ),
}));

const defaultProps = {
    event: eventCardFixture,
    isBooked: false,
    bookingHistoryStatus: "ready" as const,
    onBookingCreated: vi.fn(),
};

describe("EventCard", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders the event information and booking button", () => {
        render(<EventCard {...defaultProps} />);

        expect(
            screen.getByRole("heading", { name: "E2E Test Event" }),
        ).toBeInTheDocument();

        expect(screen.getByText("Capacity: 10")).toBeInTheDocument();

        expect(
            screen.getByRole("button", { name: "Create Booking" }),
        ).toBeEnabled();
    });

    it("opens the booking form when booking status is ready and the event is unbooked", async () => {
        const user = userEvent.setup();

        render(<EventCard {...defaultProps} />);

        await user.click(
            screen.getByRole("button", { name: "Create Booking" }),
        );

        expect(
            screen.getByRole("button", { name: "Mock Booking Form" }),
        ).toBeInTheDocument();
    });

    it("immediately displays the booked state when the event is already booked", () => {
        render(
            <EventCard
                {...defaultProps}
                isBooked={true}
            />,
        );

        expect(
            screen.getByRole("button", { name: "Already booked" }),
        ).toBeDisabled();

        expect(
            screen.getByText("You already booked this event."),
        ).toBeInTheDocument();
    });

    it("disables booking while booking history is loading", () => {
        render(
            <EventCard
                {...defaultProps}
                bookingHistoryStatus="loading"
            />,
        );

        expect(
            screen.getByRole("button", {
                name: "Checking booking status...",
            }),
        ).toBeDisabled();
    });

    it("disables booking when booking history cannot be loaded", () => {
        render(
            <EventCard
                {...defaultProps}
                bookingHistoryStatus="error"
            />,
        );

        expect(
            screen.getByRole("button", {
                name: "Booking status unavailable",
            }),
        ).toBeDisabled();
    });

    it("successfully submits a booking and notifies the parent", async () => {
        vi.mocked(createBooking).mockResolvedValue({} as never);

        const onBookingCreated = vi.fn();
        const user = userEvent.setup();

        render(
            <EventCard
                {...defaultProps}
                onBookingCreated={onBookingCreated}
            />,
        );

        await user.click(
            screen.getByRole("button", { name: "Create Booking" }),
        );

        await user.click(
            screen.getByRole("button", { name: "Mock Booking Form" }),
        );

        expect(createBooking).toHaveBeenCalledWith(1, 1);
        expect(onBookingCreated).toHaveBeenCalledWith(1);

        expect(
            await screen.findByText("Booking created successfully."),
        ).toBeInTheDocument();

        expect(
            screen.queryByRole("button", { name: "Mock Booking Form" }),
        ).not.toBeInTheDocument();
    });

    it("shows an error and allows retry when booking creation fails", async () => {
        vi.mocked(createBooking)
            .mockRejectedValueOnce(new Error("Temporary booking failure."))
            .mockResolvedValueOnce({} as never);

        const onBookingCreated = vi.fn();
        const user = userEvent.setup();

        render(
            <EventCard
                {...defaultProps}
                onBookingCreated={onBookingCreated}
            />,
        );

        await user.click(
            screen.getByRole("button", { name: "Create Booking" }),
        );

        const bookingForm = screen.getByRole("button", {
            name: "Mock Booking Form",
        });

        await user.click(bookingForm);

        expect(
            await screen.findByText("Temporary booking failure."),
        ).toBeInTheDocument();

        expect(bookingForm).toBeInTheDocument();

        await user.click(bookingForm);

        expect(createBooking).toHaveBeenCalledTimes(2);
        expect(onBookingCreated).toHaveBeenCalledOnce();

        expect(
            await screen.findByText("Booking created successfully."),
        ).toBeInTheDocument();
    });
});

