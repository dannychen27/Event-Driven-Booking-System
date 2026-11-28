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
        onCancel,
        onBookingCreated,
    }: {
        onCancel: () => void;
        onBookingCreated: () => void;
    }) => (
        <>
            <Button onClick={onCancel}>
                Cancel
            </Button>
            <Button onClick={onBookingCreated}>
                Mock Booking Form
            </Button>
        </>
    ),
}));

const defaultProps = {
    event: eventCardFixture,
    isBooked: false,
    bookingHistoryStatus: "ready" as const,
    onBookingCreated: vi.fn(),
};

const expectEventMetadata = (label: string, value: string) => {
    const labelElement = screen.getByText(label, {
        selector: ".card-metadata-label__label",
    });

    const valueElement = screen.getByText(value, {
        selector: ".card-metadata-label__value",
    });

    expect(labelElement.parentElement).toBe(valueElement.parentElement);
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

        expectEventMetadata("Venue", "E2E Test Venue");
        expectEventMetadata("Location", "123 Test Street");
        expectEventMetadata("Attendance", "1 / 10 attendees");
        expect(screen.queryByText(/Event Id:/)).not.toBeInTheDocument();

        expect(
            screen.getByRole("button", { name: "Create Booking" }),
        ).toBeEnabled();
    });

    it("uses singular attendee wording when event capacity is one", () => {
        render(
            <EventCard
                {...defaultProps}
                event={{
                    ...eventCardFixture,
                    capacity: 1,
                    attendee_count: 1,
                }}
            />,
        );

        expectEventMetadata("Attendance", "1 / 1 attendee");
    });

    it("displays zero confirmed attendees for an event with no bookings", () => {
        render(
            <EventCard
                {...defaultProps}
                event={{
                    ...eventCardFixture,
                    attendee_count: 0,
                }}
            />,
        );

        expectEventMetadata("Attendance", "0 / 10 attendees");
    });

    describe("attendance fallback values", () => {
        it("shows Unknown when attendee count is missing", () => {
            render(
                <EventCard
                    {...defaultProps}
                    event={{
                        ...eventCardFixture,
                        attendee_count: undefined as unknown as number,
                    }}
                />,
            );

            expectEventMetadata("Attendance", "Unknown / 10 attendees");
        });

        it("shows Unknown when event capacity is missing", () => {
            render(
                <EventCard
                    {...defaultProps}
                    event={{
                        ...eventCardFixture,
                        capacity: undefined as unknown as number,
                    }}
                />,
            );

            expectEventMetadata("Attendance", "1 / Unknown attendees");
        });

        it("shows Unknown when attendance values are not finite numbers", () => {
            render(
                <EventCard
                    {...defaultProps}
                    event={{
                        ...eventCardFixture,
                        attendee_count: Number.NaN,
                        capacity: Number.POSITIVE_INFINITY,
                    }}
                />,
            );

            expectEventMetadata("Attendance", "Unknown / Unknown attendees");
        });

        it("shows Unknown when both attendance values are missing", () => {
            render(
                <EventCard
                    {...defaultProps}
                    event={{
                        ...eventCardFixture,
                        attendee_count: undefined as unknown as number,
                        capacity: undefined as unknown as number,
                    }}
                />,
            );

            expectEventMetadata("Attendance", "Unknown / Unknown attendees");
        });
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

        expectEventMetadata("Venue", "Venue details unavailable");

        expectEventMetadata("Location", "Location to be announced");
    });

    it("uses venue fallbacks when venue details contain only whitespace", () => {
        render(
            <EventCard
                {...defaultProps}
                event={{
                    ...eventCardFixture,
                    venue_name: "   ",
                    venue_address: "  \t  ",
                }}
            />,
        );

        expectEventMetadata("Venue", "Venue details unavailable");
        expectEventMetadata("Location", "Location to be announced");
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

    it("closes the booking form when cancelled without creating a booking", async () => {
        const user = userEvent.setup();

        render(<EventCard {...defaultProps} />);

        await user.click(
            screen.getByRole("button", { name: "Create Booking" }),
        );

        expect(
            screen.getByRole("button", { name: "Mock Booking Form" }),
        ).toBeInTheDocument();

        await user.click(
            screen.getByRole("button", { name: "Cancel" }),
        );

        expect(
            screen.queryByRole("button", { name: "Mock Booking Form" }),
        ).not.toBeInTheDocument();

        expect(createBooking).not.toHaveBeenCalled();
    });

    it("immediately displays the booked state when the event is already booked", () => {
        render(
            <EventCard
                {...defaultProps}
                isBooked={true}
            />,
        );

        const bookedBadge = screen.getByText("Already booked");
        expect(bookedBadge).toBeInTheDocument();
        expect(
            bookedBadge.closest(".event-card__image-wrapper"),
        ).not.toBeNull();
        expect(
            bookedBadge.closest(".event-card-header"),
        ).toBeNull();
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

    it("renders Date & Time in the same inline metadata layout as other event details", () => {
        render(<EventCard {...defaultProps} />);

        const dateLabel = screen.getByText("Date & Time", {
            selector: ".card-metadata-label__label",
        });
        const dateValue = dateLabel.parentElement?.querySelector(
            ".card-metadata-label__value",
        );

        expect(dateLabel.parentElement).toHaveClass("card-metadata-label");
        expect(dateValue).not.toBeNull();
        expect(dateValue).not.toBeEmptyDOMElement();
    });

    it("renders event metadata labels and values in separate elements", () => {
        render(<EventCard {...defaultProps} />);

        const venueLabel = screen.getByText("Venue", {
            selector: ".card-metadata-label__label",
        });

        const venueValue = screen.getByText("E2E Test Venue", {
            selector: ".card-metadata-label__value",
        });

        const locationLabel = screen.getByText("Location", {
            selector: ".card-metadata-label__label",
        });

        const locationValue = screen.getByText("123 Test Street", {
            selector: ".card-metadata-label__value",
        });

        expect(venueLabel.parentElement).toBe(venueValue.parentElement);
        expect(locationLabel.parentElement).toBe(locationValue.parentElement);
    });
});

