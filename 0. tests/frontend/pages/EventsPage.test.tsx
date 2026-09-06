import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";


import EventsPage from "../../../3. frontend/src/pages/EventsPage";
import { getEvents } from "../../../3. frontend/src/api/events";
import type { Event } from "../../../3. frontend/src/types/Event";


vi.mock("../../../3. frontend/src/api/events", () => ({
    getEvents: vi.fn(),
}));


vi.mock("../../../3. frontend/src/components/EventCard", () => ({
    default: ({ event }: { event: Event }) => (
        <div>Mock Event Card: {event.name}</div>
    ),
}));


describe("EventsPage", () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("shows the loading state while events are being fetched", () => {
        vi.mocked(getEvents).mockReturnValue(
            new Promise(() => {}),
        );

        render(<EventsPage />);

        expect(screen.getByText("Loading events..."))
            .toBeInTheDocument();
    });

    it("renders events after they are successfully fetched", async () => {
        vi.mocked(getEvents).mockResolvedValue([
            {
                id: 1,
                name: "Test Event 1",
                venue_id: 1,
                start_time: "2026-09-10T10:00:00Z",
                end_time: "2026-09-10T11:00:00Z",
                capacity: 10,
            },
            {
                id: 2,
                name: "Test Event 2",
                venue_id: 2,
                start_time: "2026-09-11T10:00:00Z",
                end_time: "2026-09-11T11:00:00Z",
                capacity: 20,
            },
        ]);

        render(<EventsPage />);

        expect(await screen.findByText("Mock Event Card: Test Event 1"))
            .toBeInTheDocument();

        expect(screen.getByText("Mock Event Card: Test Event 2"))
            .toBeInTheDocument();

        expect(screen.queryByText("Loading events..."))
            .not.toBeInTheDocument();
    });

    it("shows the empty state when there are no events", async () => {
        vi.mocked(getEvents).mockResolvedValue([]);

        render(<EventsPage />);

        expect(await screen.findByText("No available events right now."))
            .toBeInTheDocument();

        expect(screen.queryByText("Loading events..."))
            .not.toBeInTheDocument();
    });

    it("shows an error when fetching events fails", async () => {
        vi.mocked(getEvents).mockRejectedValue(new Error("Failed to load events"));

        render(<EventsPage />);

        expect(await screen.findByText("Failed to load events"))
            .toBeInTheDocument();

        expect(screen.queryByText("Loading events..."))
            .not.toBeInTheDocument();
    });
});

