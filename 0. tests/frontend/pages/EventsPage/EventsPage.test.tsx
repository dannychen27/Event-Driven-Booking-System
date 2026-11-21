import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import EventsPage from "../../../../3. frontend/src/pages/EventsPage";
import { getEvents } from "../../../../3. frontend/src/api/events";
import { getBookingHistory } from "../../../../3. frontend/src/api/bookings";
import type { Event } from "../../../../3. frontend/src/types/events/Event";
import type { BookingHistoryStatus } from "../../../../3. frontend/src/types/events/EventCard.types";
import type { Booking } from "../../../../3. frontend/src/types/bookings/Booking";
import { initialRenderEventFixture } from "../../fixtures/events/eventFixtures";

vi.mock("../../../../3. frontend/src/api/events", () => ({
    getEvents: vi.fn(),
    searchEvents: vi.fn(),
    searchEventsNaturalLanguage: vi.fn(),
}));

vi.mock("../../../../3. frontend/src/api/bookings", () => ({
    getBookingHistory: vi.fn(),
}));

vi.mock("../../../../3. frontend/src/components/cards/EventCard.tsx", () => ({
    default: ({
        event,
        isBooked,
        bookingHistoryStatus,
    }: {
        event: Event;
        isBooked: boolean;
        bookingHistoryStatus: BookingHistoryStatus;
    }) => (
        <div>
            <div>Mock Event Card: {event.name}</div>
            <span data-testid={`booking-state-${event.id}`}>
                {isBooked ? "booked" : "not-booked"}:{bookingHistoryStatus}
            </span>
        </div>
    ),
}));

beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getBookingHistory).mockResolvedValue([]);
});

describe("Initial loading and rendering", () => {
    it("shows the loading state while events are being fetched", () => {
        vi.mocked(getEvents).mockReturnValue(new Promise(() => {}));

        render(<EventsPage />);

        expect(screen.getByText("Loading events...")).toBeInTheDocument();
    });

    it("renders events after they are successfully fetched", async () => {
        vi.mocked(getEvents).mockResolvedValue(initialRenderEventFixture);

        render(<EventsPage />);

        expect(
            await screen.findByText("Mock Event Card: Test Event 1"),
        ).toBeInTheDocument();

        expect(
            screen.getByText("Mock Event Card: Test Event 2"),
        ).toBeInTheDocument();

        expect(screen.queryByText("Loading events...")).not.toBeInTheDocument();
    });

    it("fetches booking history once when the page loads", async () => {
        vi.mocked(getEvents).mockResolvedValue(initialRenderEventFixture);

        render(<EventsPage />);

        expect(
            await screen.findByText("Mock Event Card: Test Event 1"),
        ).toBeInTheDocument();

        expect(getBookingHistory).toHaveBeenCalledOnce();
        expect(getBookingHistory).toHaveBeenCalledWith(1);
    });

    it("marks previously booked events immediately", async () => {
        vi.mocked(getEvents).mockResolvedValue(initialRenderEventFixture);

        vi.mocked(getBookingHistory).mockResolvedValue([
            { event_id: 1 } as Booking,
        ]);

        render(<EventsPage />);

        expect(
            await screen.findByText("Mock Event Card: Test Event 1"),
        ).toBeInTheDocument();

        expect(screen.getByTestId("booking-state-1")).toHaveTextContent(
            "booked:ready",
        );

        expect(screen.getByTestId("booking-state-2")).toHaveTextContent(
            "not-booked:ready",
        );
    });

    it("shows the empty state when there are no events", async () => {
        vi.mocked(getEvents).mockResolvedValue([]);

        render(<EventsPage />);

        expect(
            await screen.findByText("No available events right now."),
        ).toBeInTheDocument();

        expect(screen.queryByText("Loading events...")).not.toBeInTheDocument();
    });

    it("shows an error when fetching events fails", async () => {
        vi.mocked(getEvents).mockRejectedValue(
            new Error("Failed to load events"),
        );

        render(<EventsPage />);

        expect(
            await screen.findByText("Failed to load events"),
        ).toBeInTheDocument();

        expect(screen.queryByText("Loading events...")).not.toBeInTheDocument();
    });
});

describe("Booking history loading and recovery", () => {
    it("disables booking while booking history is loading", async () => {
        vi.mocked(getEvents).mockResolvedValue(initialRenderEventFixture);

        vi.mocked(getBookingHistory).mockReturnValue(
            new Promise<Booking[]>(() => {}),
        );

        render(<EventsPage />);

        expect(
            await screen.findByText("Mock Event Card: Test Event 1"),
        ).toBeInTheDocument();

        expect(screen.getByTestId("booking-state-1")).toHaveTextContent(
            "not-booked:loading",
        );
    });

    it("shows a retry option when booking history fails", async () => {
        vi.mocked(getEvents).mockResolvedValue(initialRenderEventFixture);

        vi.mocked(getBookingHistory)
            .mockRejectedValueOnce(new Error("Booking history unavailable"))
            .mockResolvedValueOnce([]);

        const user = userEvent.setup();

        render(<EventsPage />);

        expect(
            await screen.findByText(
                "Unable to determine your booking status: Booking history unavailable",
            ),
        ).toBeInTheDocument();

        expect(screen.getByTestId("booking-state-1")).toHaveTextContent(
            "not-booked:error",
        );

        await user.click(
            screen.getByRole("button", { name: "Retry booking status" }),
        );

        expect(
            await screen.findByTestId("booking-state-1"),
        ).toHaveTextContent("not-booked:ready");

        expect(getBookingHistory).toHaveBeenCalledTimes(2);
    });
});
