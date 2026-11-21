import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import EventsPage from "../../../../3. frontend/src/pages/EventsPage";
import { getEvents } from "../../../../3. frontend/src/api/events";
import {
    createBooking,
    getBookingHistory,
} from "../../../../3. frontend/src/api/bookings";
import { initialRenderEventFixture } from "../../fixtures/events/eventFixtures";

vi.mock("../../../../3. frontend/src/api/events", () => ({
    getEvents: vi.fn(),
    searchEvents: vi.fn(),
    searchEventsNaturalLanguage: vi.fn(),
}));

vi.mock("../../../../3. frontend/src/api/bookings", () => ({
    createBooking: vi.fn(),
    getBookingHistory: vi.fn(),
}));

vi.mock("../../../../3. frontend/src/components/forms/BookingForm.tsx", () => ({
    default: ({
        onBookingCreated,
    }: {
        onBookingCreated: () => Promise<void>;
    }) => (
        <button
            type="button"
            onClick={() => void onBookingCreated()}
        >
            Mock Confirm Booking
        </button>
    ),
}));

beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(getEvents).mockResolvedValue([
        initialRenderEventFixture[0]!,
    ]);

    vi.mocked(getBookingHistory).mockResolvedValue([]);

    vi.mocked(createBooking).mockResolvedValue({} as never);
});

describe("EventsPage immediate booking status", () => {
    it("immediately marks an event as booked after a successful booking", async () => {
        const user = userEvent.setup();
        const event = initialRenderEventFixture[0]!;

        render(<EventsPage />);

        // The event initially appears as available.
        expect(await screen.findByRole("button", { name: "Create Booking" }) ).toBeEnabled();

        expect(screen.getByRole("heading", { name: event.name }) ).toBeInTheDocument();

        // Open the booking form and confirm the booking.
        await user.click(screen.getByRole("button", { name: "Create Booking" }) );
        await user.click(screen.getByRole("button", { name: "Mock Confirm Booking" }) );

        // The real EventCard notifies EventsPage, which updates its Set
        // and passes the new booked state back to the card.
        expect(await screen.findByRole("button", { name: "Already booked" }) ).toBeDisabled();

        expect(screen.getByText("You already booked this event."),).toBeInTheDocument();
        expect(screen.getByText("Booking created successfully."),).toBeInTheDocument();

        // Verify the booking API was called and history was not refetched.
        expect(createBooking).toHaveBeenCalledOnce();
        expect(createBooking).toHaveBeenCalledWith(1, event.id);
        expect(getBookingHistory).toHaveBeenCalledOnce();
    });
});
