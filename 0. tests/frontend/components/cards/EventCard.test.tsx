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

        expect(
            screen.getByText("A practical event for testing the booking experience."),
        ).toBeInTheDocument();

        expect(screen.getByText("Venue: E2E Test Venue")).toBeInTheDocument();
        expect(screen.getByText("Location: 123 Test Street")).toBeInTheDocument();
        expect(screen.getByText("Capacity: 10 attendees")).toBeInTheDocument();
        expect(screen.queryByText(/Event Id:/)).not.toBeInTheDocument();

        expect(
            screen.getByRole("button", { name: "Create Booking" }),
        ).toBeEnabled();
    });

    it("omits an empty event description and uses fallbacks for missing venue details", () => {
        render(
            <EventCard
                {...defaultProps}
                event={{
                    ...eventCardFixture,
                    description: "   ",
                    venue_name: "",
                    venue_address: "",
                }}
            />,
        );

        expect(
            screen.queryByText("A practical event for testing the booking experience."),
        ).not.toBeInTheDocument();

        expect(
            screen.getByText("Venue: Venue details unavailable"),
        ).toBeInTheDocument();

        expect(
            screen.getByText("Location: Location to be announced"),
        ).toBeInTheDocument();
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

        expect(screen.getByText("Already booked")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Already booked" }) ).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Create Booking" }) ).not.toBeInTheDocument();
        expect(screen.getByText("You've already booked this event.")).toBeInTheDocument();
    });

    it("shows a clock status message instead of a booking button while booking history is loading", () => {
        render(
            <EventCard
                {...defaultProps}
                bookingHistoryStatus="loading"
            />,
        );

        const loadingStatus = screen.getByRole("status");

        expect(loadingStatus).toHaveTextContent(
            "Checking booking status...",
        );

        // The clock icon should be present.
        expect(loadingStatus.querySelector("svg")).not.toBeNull();

        // No booking button should be displayed while loading.
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("transitions from loading to ready when booking history finishes loading", async () => {
        const user = userEvent.setup();
        const { rerender } = render(
            <EventCard
                {...defaultProps}
                bookingHistoryStatus="loading"
            />,
        );

        // Initially, show the loading status.
        const loadingStatus = screen.getByRole("status");

        expect(loadingStatus).toHaveTextContent("Checking booking status...");
        expect(loadingStatus.querySelector("svg")).not.toBeNull();

        expect(screen.queryByRole("button", { name: "Create Booking" })).not.toBeInTheDocument();

        // Simulate booking history finishing successfully.
        rerender(
            <EventCard
                {...defaultProps}
                bookingHistoryStatus="ready"
            />,
        );

        // Loading indicator disappears.
        expect(screen.queryByText("Checking booking status...")).not.toBeInTheDocument();

        // Booking button becomes available.
        const bookingButton = screen.getByRole("button", { name: "Create Booking"} );

        expect(bookingButton).toBeEnabled();

        // User can open the booking form.
        await user.click(bookingButton);

        expect(screen.getByRole("button", { name: "Mock Booking Form" }) ).toBeInTheDocument();
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

