import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import EventsPage from "../../../../3. frontend/src/pages/EventsPage";
import { getEvents } from "../../../../3. frontend/src/api/events";
import { getVenues } from "../../../../3. frontend/src/api/venues";
import { getBookingHistory } from "../../../../3. frontend/src/api/bookings";
import type { Event } from "../../../../3. frontend/src/types/events/Event";
import type { Venue } from "../../../../3. frontend/src/types/venues/Venue";

vi.mock("../../../../3. frontend/src/api/events", () => ({
    getEvents: vi.fn(),
    searchEvents: vi.fn(),
    searchEventsNaturalLanguage: vi.fn(),
}));

vi.mock("../../../../3. frontend/src/api/venues", () => ({
    getVenues: vi.fn(),
}));

vi.mock("../../../../3. frontend/src/api/bookings", () => ({
    getBookingHistory: vi.fn(),
}));

vi.mock("../../../../3. frontend/src/components/cards/EventCard.tsx", () => ({
    default: ({ event }: { event: Event }) => (
        <div>Mock Event Card: {event.name}</div>
    ),
}));

const eventsFixture: Event[] = [
    {
        id: 1,
        name: "Moss Park Meetup",
        venue_id: 1,
        venue_name: "Moss Park Espresso",
        venue_address: "185 Queen St E",
        start_time: "2026-11-25T18:00:00Z",
        end_time: "2026-11-25T19:00:00Z",
        capacity: 10,
        image_url: null,
    },
    {
        id: 2,
        name: "Bahen Workshop",
        venue_id: 2,
        venue_name: "Bahen Center",
        venue_address: "40 St George St",
        start_time: "2026-11-26T18:00:00Z",
        end_time: "2026-11-26T19:00:00Z",
        capacity: 20,
        image_url: null,
    },
];

const venuesFixture: Venue[] = [
    {
        id: 1,
        name: "Moss Park Espresso",
        address: "185 Queen St E",
    },
    {
        id: 2,
        name: "Bahen Center",
        address: "40 St George St",
    },
];

function setPageUrl(search: string) {
    window.history.replaceState({}, "", `/events${search}`);
}

beforeEach(() => {
    vi.clearAllMocks();

    setPageUrl("?venueId=1");

    vi.mocked(getEvents).mockResolvedValue(eventsFixture);
    vi.mocked(getVenues).mockResolvedValue(venuesFixture);
    vi.mocked(getBookingHistory).mockResolvedValue([]);
});

afterEach(() => {
    setPageUrl("");
});

describe("Venue filtering", () => {
    it("filters events using the venue ID from the URL", async () => {
        render(<EventsPage />);

        expect(
            await screen.findByText("Showing events at Moss Park Espresso"),
        ).toBeInTheDocument();

        expect(
            screen.getByText("Mock Event Card: Moss Park Meetup"),
        ).toBeInTheDocument();

        expect(
            screen.queryByText("Mock Event Card: Bahen Workshop"),
        ).not.toBeInTheDocument();

        expect(getEvents).toHaveBeenCalledOnce();
        expect(getVenues).toHaveBeenCalledOnce();
    });

    it("shows a venue-specific empty state when no events match", async () => {
        vi.mocked(getEvents).mockResolvedValue([]);

        render(<EventsPage />);

        expect(
            await screen.findByText(
                "No upcoming events are currently listed for Moss Park Espresso.",
            ),
        ).toBeInTheDocument();

        expect(
            screen.getByRole("button", { name: "Clear venue filter" }),
        ).toBeInTheDocument();
    });

    it("clears the venue filter while preserving other URL parameters", async () => {
        setPageUrl("?source=venues&venueId=1");

        render(<EventsPage />);

        expect(
            await screen.findByText("Mock Event Card: Moss Park Meetup"),
        ).toBeInTheDocument();

        fireEvent.click(
            screen.getByRole("button", { name: "Clear venue filter" }),
        );

        expect(window.location.search).toBe("?source=venues");

        expect(
            screen.getByText("Mock Event Card: Moss Park Meetup"),
        ).toBeInTheDocument();

        expect(
            screen.getByText("Mock Event Card: Bahen Workshop"),
        ).toBeInTheDocument();

        expect(
            screen.queryByRole("button", { name: "Clear venue filter" }),
        ).not.toBeInTheDocument();
    });

    it("shows a readable fallback if venue details cannot be retrieved", async () => {
        vi.mocked(getVenues).mockRejectedValue(
            new Error("Venue lookup unavailable"),
        );

        render(<EventsPage />);

        expect(
            await screen.findByText("Showing events at Venue #1"),
        ).toBeInTheDocument();

        expect(
            screen.getByText("Mock Event Card: Moss Park Meetup"),
        ).toBeInTheDocument();
    });

    it("ignores an invalid venue ID in the URL", async () => {
        setPageUrl("?venueId=invalid");

        render(<EventsPage />);

        expect(
            await screen.findByText("Mock Event Card: Moss Park Meetup"),
        ).toBeInTheDocument();

        expect(
            screen.getByText("Mock Event Card: Bahen Workshop"),
        ).toBeInTheDocument();

        expect(getVenues).not.toHaveBeenCalled();
    });
});
