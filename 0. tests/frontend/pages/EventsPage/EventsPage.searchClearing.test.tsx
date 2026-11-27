import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import EventsPage from "../../../../3. frontend/src/pages/EventsPage";
import {
    getEvents,
    searchEvents,
    searchEventsNaturalLanguage
} from "../../../../3. frontend/src/api/events";
import { getBookingHistory } from "../../../../3. frontend/src/api/bookings";
import type { Event } from "../../../../3. frontend/src/types/events/Event";
import {
    initialEventFixture,
    minimalCoffeeMeetupEventFixture,
    reloadFailureInitialEventFixture
} from "../../fixtures/events/eventFixtures";

vi.mock("../../../../3. frontend/src/api/events", () => ({
    getEvents: vi.fn(),
    searchEvents: vi.fn(),
    searchEventsNaturalLanguage: vi.fn(),
}));

vi.mock("../../../../3. frontend/src/api/bookings", () => ({
    getBookingHistory: vi.fn(),
}));

vi.mock("../../../../3. frontend/src/components/cards/EventCard.tsx", () => ({
    default: ({ event }: { event: Event }) => (
        <div>Mock Event Card: {event.name}</div>
    ),
}));

beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getBookingHistory).mockResolvedValue([]);
});

describe("Clearing search", () => {
    it("clears only the AI query without submitting or resetting results", async () => {
        const events = [minimalCoffeeMeetupEventFixture] as Event[];
        vi.mocked(getEvents).mockResolvedValue(events);

        render(<EventsPage />);

        const input = await screen.findByLabelText("Describe events to search for");
        const keywordInput = screen.getByLabelText("Search events");

        fireEvent.change(input, {
            target: { value: "machine learning meetup" }
        });
        fireEvent.change(keywordInput, {
            target: { value: "Toronto AI Builders Meetup" }
        });

        const aiForm = input.closest("form");
        expect(aiForm).not.toBeNull();

        fireEvent.click(
            within(aiForm as HTMLFormElement).getByRole("button", {
                name: "Clear query"
            })
        );

        expect(input).toHaveValue("");
        expect(keywordInput).toHaveValue("Toronto AI Builders Meetup");
        expect(searchEventsNaturalLanguage).not.toHaveBeenCalled();
        expect(searchEvents).not.toHaveBeenCalled();
        expect(getEvents).toHaveBeenCalledTimes(1);
        expect(
            screen.getByText("Mock Event Card: Coffee Meetup")
        ).toBeInTheDocument();
    });

    it("clears both search inputs and restores all events", async () => {
        vi.mocked(getEvents).mockResolvedValue([initialEventFixture]);
        vi.mocked(searchEvents).mockResolvedValue([]);
        vi.mocked(searchEventsNaturalLanguage).mockResolvedValue({
            status: "success",
            events: [],
            appliedFilters: {},
        });

        render(<EventsPage />);

        expect(
            await screen.findByText("Mock Event Card: Initial Event")
        ).toBeInTheDocument();

        fireEvent.change(screen.getByLabelText("Search events"), {
            target: { value: "Coffee" }
        });
        fireEvent.change(screen.getByLabelText("Describe events to search for"), {
            target: { value: "Find coffee events this weekend" }
        });

        fireEvent.click(screen.getByRole("button", { name: "Search" }));
        await screen.findByText("No matching events found.");

        fireEvent.click(screen.getByRole("button", { name: "Clear all" }));

        expect(
            await screen.findByText("Mock Event Card: Initial Event")
        ).toBeInTheDocument();
        expect(screen.getByLabelText("Search events")).toHaveValue("");
        expect(screen.getByLabelText("Describe events to search for")).toHaveValue("");
    });

    it("keeps the loading state visible until cleared events finish reloading", async () => {
        let resolveReload!: (events: Event[]) => void;
        const reloadPromise = new Promise<Event[]>((resolve) => {
            resolveReload = resolve;
        });

        vi.mocked(getEvents)
            .mockResolvedValueOnce([initialEventFixture])
            .mockReturnValueOnce(reloadPromise);
        vi.mocked(searchEvents).mockResolvedValue([]);

        render(<EventsPage />);

        expect(
            await screen.findByText("Mock Event Card: Initial Event")
        ).toBeInTheDocument();

        fireEvent.change(screen.getByLabelText("Search events"), {
            target: { value: "Coffee" }
        });
        fireEvent.click(screen.getByRole("button", { name: "Search" }));

        expect(
            await screen.findByText("No matching events found.")
        ).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Clear all" }));

        expect(await screen.findByText("Searching events...")).toBeInTheDocument();
        expect(screen.queryByText("No matching events found.")).not.toBeInTheDocument();

        resolveReload([initialEventFixture]);

        expect(
            await screen.findByText("Mock Event Card: Initial Event")
        ).toBeInTheDocument();
        expect(screen.queryByText("Searching events...")).not.toBeInTheDocument();
    });

    it("shows an error when clearing search fails to reload events", async () => {
        vi.mocked(getEvents)
            .mockResolvedValueOnce([reloadFailureInitialEventFixture])
            .mockRejectedValueOnce(new Error("Failed to reload events"));

        vi.mocked(searchEvents).mockResolvedValue([]);

        render(<EventsPage />);

        expect(
            await screen.findByText("Mock Event Card: Initial Event")
        ).toBeInTheDocument();

        fireEvent.change(screen.getByLabelText("Search events"), {
            target: { value: "Coffee" }
        });
        fireEvent.click(screen.getByRole("button", { name: "Search" }));

        expect(
            await screen.findByText("No matching events found.")
        ).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Clear all" }));

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "Failed to reload events"
        );
        expect(screen.queryByText("Loading events...")).not.toBeInTheDocument();
    });
});
