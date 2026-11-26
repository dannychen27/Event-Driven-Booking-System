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

        const { container } = render(<EventsPage />);

        expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
        expect(screen.getByText("Loading events...")).toBeInTheDocument();
        const skeletonGrid = container.querySelector(
            ".events-page__grid.skeleton-loading__cards",
        );

        expect(skeletonGrid).not.toBeNull();
        expect(skeletonGrid?.querySelectorAll(".event-card-skeleton")).toHaveLength(3);

        const calendarSkeleton = container.querySelector(
            ".event-calendar-skeleton",
        );

        expect(calendarSkeleton).not.toBeNull();
        expect(
            calendarSkeleton?.querySelectorAll(
                ".event-calendar-skeleton__time-picker",
            ),
        ).toHaveLength(2);
        expect(
            calendarSkeleton?.querySelectorAll(
                ".event-calendar-skeleton__time-heading",
            ),
        ).toHaveLength(2);
        expect(
            calendarSkeleton?.querySelectorAll(
                ".event-calendar-skeleton__time-input",
            ),
        ).toHaveLength(4);
        expect(
            calendarSkeleton?.querySelectorAll(
                ".event-calendar-skeleton__time-separator",
            ),
        ).toHaveLength(2);
    });

    it("renders events after they are successfully fetched", async () => {
        vi.mocked(getEvents).mockResolvedValue(initialRenderEventFixture);

        const { container } = render(<EventsPage />);

        expect(
            await screen.findByText("Mock Event Card: Test Event 1"),
        ).toBeInTheDocument();

        expect(
            screen.getByText("Mock Event Card: Test Event 2"),
        ).toBeInTheDocument();

        const eventGrid = container.querySelector(".events-page__grid");

        expect(eventGrid).not.toBeNull();
        expect(eventGrid?.children).toHaveLength(2);

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
            { event_id: 1, status: "confirmed" } as Booking,
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

    it("does not mark events as booked when their booking history is cancelled", async () => {
        vi.mocked(getEvents).mockResolvedValue(initialRenderEventFixture);

        vi.mocked(getBookingHistory).mockResolvedValue([
            { event_id: 1, status: "cancelled" } as Booking,
        ]);

        render(<EventsPage />);

        expect(
            await screen.findByText("Mock Event Card: Test Event 1"),
        ).toBeInTheDocument();

        expect(screen.getByTestId("booking-state-1")).toHaveTextContent(
            "not-booked:ready",
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
});

describe("Events API failure and recovery", () => {
    it("shows a full-page error state when fetching events fails", async () => {
        vi.mocked(getEvents).mockRejectedValue(
            new Error("Internal network error"),
        );

        render(<EventsPage />);

        expect(
            await screen.findByRole("heading", {
                name: "We couldn't load the events.",
            }),
        ).toBeInTheDocument();

        expect(
            screen.getByText("We couldn't retrieve the events."),
        ).toBeInTheDocument();

        expect(
            screen.getByText("You can try the following:"),
        ).toBeInTheDocument();

        expect(screen.getAllByRole("listitem")).toHaveLength(3);

        expect(
            screen.getByText("Check your internet connection and try again."),
        ).toBeInTheDocument();

        expect(screen.getByText("Refresh the page.")).toBeInTheDocument();

        expect(
            screen.getByText("Wait a moment and try again."),
        ).toBeInTheDocument();

        expect(
            screen.getByRole("button", { name: "Try again" }),
        ).toBeInTheDocument();

        expect(screen.queryByText("Internal network error")).not.toBeInTheDocument();
        expect(screen.queryByText("Loading events...")).not.toBeInTheDocument();
    });

    it("retries the events request and restores the events after success", async () => {
        vi.mocked(getEvents)
            .mockRejectedValueOnce(new Error("Network unavailable"))
            .mockResolvedValueOnce(initialRenderEventFixture);

        const user = userEvent.setup();

        render(<EventsPage />);

        expect(await screen.findByRole("heading", { name: "We couldn't load the events." }) ).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Try again" }) );

        expect(await screen.findByText("Mock Event Card: Test Event 1")).toBeInTheDocument();
        expect(screen.getByText("Mock Event Card: Test Event 2")).toBeInTheDocument();

        expect(screen.queryByRole("heading", { name: "We couldn't load the events." }) ).not.toBeInTheDocument();

        expect(getEvents).toHaveBeenCalledTimes(2);
    });

    it("keeps the error state visible when retrying the events request also fails", async () => {
        vi.mocked(getEvents)
            .mockRejectedValueOnce(new Error("First failure"))
            .mockRejectedValueOnce(new Error("Second failure"));

        const user = userEvent.setup();

        render(<EventsPage />);

        expect(await screen.findByRole("heading", { name: "We couldn't load the events." })).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Try again" }) );

        expect(await screen.findByRole("heading", { name: "We couldn't load the events." }) ).toBeInTheDocument();

        expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();

        expect(getEvents).toHaveBeenCalledTimes(2);
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

    it("shows a compact error state without hiding successfully loaded events", async () => {
        vi.mocked(getEvents).mockResolvedValue(initialRenderEventFixture);

        vi.mocked(getBookingHistory).mockRejectedValue(new Error("Booking history unavailable"));

        render(<EventsPage />);

        expect(await screen.findByRole("heading", { name: "Couldn't check booking status" }))
            .toBeInTheDocument();

        expect(screen.getByText("Mock Event Card: Test Event 1")).toBeInTheDocument();
        expect(screen.getByText("Mock Event Card: Test Event 2")).toBeInTheDocument();

        expect(screen.getByRole("button", { name: "Retry booking status" }) ).toBeInTheDocument();

        expect(document.querySelector(".error-state--compact")).toBeInTheDocument();

        expect(screen.getByTestId("booking-state-1")).toHaveTextContent("not-booked:error");
    });

    it("retries booking history independently and restores booking status", async () => {
        vi.mocked(getEvents).mockResolvedValue(initialRenderEventFixture);

        vi.mocked(getBookingHistory)
            .mockRejectedValueOnce(new Error("Booking history unavailable"))
            .mockResolvedValueOnce([{ event_id: 1 } as Booking]);

        const user = userEvent.setup();

        render(<EventsPage />);

        expect(await screen.findByRole("heading", { name: "Couldn't check booking status" }) )
            .toBeInTheDocument();

        expect(screen.getByText("Mock Event Card: Test Event 1")).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Retry booking status" }));

        expect(await screen.findByTestId("booking-state-1")).toHaveTextContent("booked:ready");

        expect(screen.queryByRole("heading", { name: "Couldn't check booking status" }))
            .not.toBeInTheDocument();

        expect(getBookingHistory).toHaveBeenCalledTimes(2);
        expect(getEvents).toHaveBeenCalledOnce();
    });
});

describe("Independent search disclosures", () => {
    it("allows keyword and AI search to collapse independently", async () => {
        vi.mocked(getEvents).mockResolvedValue(initialRenderEventFixture);

        const user = userEvent.setup();
        const { container } = render(<EventsPage />);

        expect(
            await screen.findByText("Mock Event Card: Test Event 1"),
        ).toBeInTheDocument();

        const disclosures = container.querySelectorAll(
            ".events-search-disclosure",
        );

        expect(disclosures).toHaveLength(2);
        expect(disclosures[0]).toHaveAttribute("open");
        expect(disclosures[1]).toHaveAttribute("open");

        const calendarDisclosure = container.querySelector(
            ".calendar-search-disclosure",
        );

        expect(calendarDisclosure).not.toHaveAttribute("open");

        await user.click(screen.getByText("Keyword search"));

        expect(disclosures[0]).not.toHaveAttribute("open");
        expect(disclosures[1]).toHaveAttribute("open");
        expect(calendarDisclosure).not.toHaveAttribute("open");

        await user.click(screen.getByText("Search with AI", { selector: "summary" }));

        expect(disclosures[0]).not.toHaveAttribute("open");
        expect(disclosures[1]).not.toHaveAttribute("open");
        expect(calendarDisclosure).not.toHaveAttribute("open");
    });

    it("preserves keyword and AI queries when their disclosures collapse", async () => {
        vi.mocked(getEvents).mockResolvedValue(initialRenderEventFixture);

        const user = userEvent.setup();
        const { container } = render(<EventsPage />);

        expect(
            await screen.findByText("Mock Event Card: Test Event 1"),
        ).toBeInTheDocument();

        const keywordInput = screen.getByRole("textbox", {
            name: "Search events",
        });

        const aiInput = screen.getByRole("textbox", {
            name: "Describe events to search for",
        });

        await user.type(keywordInput, "Meet and Greet");
        await user.type(aiInput, "Events this weekend");

        const disclosures = container.querySelectorAll(
            ".events-search-disclosure",
        );

        await user.click(screen.getByText("Keyword search"));
        await user.click(screen.getByText("Search with AI", { selector: "summary" }));

        expect(keywordInput).toHaveValue("Meet and Greet");
        expect(aiInput).toHaveValue("Events this weekend");

        await user.click(screen.getByText("Keyword search"));
        await user.click(screen.getByText("Search with AI", { selector: "summary" }));

        expect(disclosures[0]).toHaveAttribute("open");
        expect(disclosures[1]).toHaveAttribute("open");
        expect(keywordInput).toHaveValue("Meet and Greet");
        expect(aiInput).toHaveValue("Events this weekend");
    });
});
