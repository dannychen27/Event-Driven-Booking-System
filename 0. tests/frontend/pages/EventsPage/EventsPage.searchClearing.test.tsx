import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import EventsPage from "../../../../3. frontend/src/pages/EventsPage";
import {
    getEvents,
    searchEvents,
    searchEventsNaturalLanguage
} from "../../../../3. frontend/src/api/events";
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

vi.mock("../../../../3. frontend/src/components/cards/EventCard.tsx", () => ({
    default: ({ event }: { event: Event }) => (
        <div>Mock Event Card: {event.name}</div>
    ),
}));

beforeEach(() => {
    vi.clearAllMocks();
});

describe("Clearing search", () => {
    it("clears only the AI query without submitting or resetting results", async () => {
        const events = [minimalCoffeeMeetupEventFixture] as Event[];
        vi.mocked(getEvents).mockResolvedValue(events);

        render(<EventsPage />);

        const input = await screen.findByLabelText("Search with AI");

        fireEvent.change(input, {
            target: { value: "Find coffee events" }
        });

        const aiForm = input.closest("form");
        expect(aiForm).not.toBeNull();

        fireEvent.click(
            within(aiForm as HTMLFormElement).getByRole("button", {
                name: "Clear query"
            })
        );

        expect(input).toHaveValue("");
        expect(searchEventsNaturalLanguage).not.toHaveBeenCalled();
        expect(getEvents).toHaveBeenCalledTimes(2);
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
        fireEvent.change(screen.getByLabelText("Search with AI"), {
            target: { value: "Find coffee events this weekend" }
        });

        fireEvent.click(screen.getByRole("button", { name: "Search" }));
        await screen.findByText("No matching events found.");

        fireEvent.click(
            within(
                screen.getByLabelText("Search events").closest("form") as HTMLFormElement
            ).getByRole("button", { name: "Clear query" })
        );

        expect(
            await screen.findByText("Mock Event Card: Initial Event")
        ).toBeInTheDocument();
        expect(screen.getByLabelText("Search events")).toHaveValue("");
        expect(screen.getByLabelText("Search with AI")).toHaveValue("");
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

        fireEvent.click(
            within(
                screen.getByLabelText("Search events").closest("form") as HTMLFormElement
            ).getByRole("button", { name: "Clear query" })
        );

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "Failed to reload events"
        );
        expect(screen.queryByText("Loading events...")).not.toBeInTheDocument();
    });
});
