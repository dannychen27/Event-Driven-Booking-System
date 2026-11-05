import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { searchEventsNaturalLanguage } from "../../../3. frontend/src/api/events";
import type { Event } from "../../../3. frontend/src/types/events/Event";
import { naturalLanguageSearchResultFixture } from "../fixtures/events/eventFixtures";
import { renderEventsPageWithNoInitialEvents } from "../helpers/EventsPageTestHelpers";

vi.mock("../../../3. frontend/src/api/events", () => ({
    getEvents: vi.fn(),
    searchEvents: vi.fn(),
    searchEventsNaturalLanguage: vi.fn(),
}));

vi.mock("../../../3. frontend/src/components/cards/EventCard.tsx", () => ({
    default: ({ event }: { event: Event }) => (
        <div>Mock Event Card: {event.name}</div>
    ),
}));

beforeEach(() => {
    vi.clearAllMocks();
});

describe("Natural-language search", () => {
    it("searches events using a natural-language query", async () => {
        vi.mocked(searchEventsNaturalLanguage).mockResolvedValue([
            naturalLanguageSearchResultFixture
        ]);

        await renderEventsPageWithNoInitialEvents();

        fireEvent.change(screen.getByLabelText("Search with AI"), {
            target: { value: "  Find coffee events this weekend  " }
        });
        fireEvent.click(screen.getByRole("button", { name: "Ask AI" }));

        expect(
            await screen.findByText("Mock Event Card: Coffee Meetup")
        ).toBeInTheDocument();
        expect(searchEventsNaturalLanguage).toHaveBeenCalledWith(
            "Find coffee events this weekend"
        );
    });

    it("shows the loading state while natural-language search is pending", async () => {
        let resolveSearch!: (events: Event[]) => void;

        vi.mocked(searchEventsNaturalLanguage).mockReturnValue(
            new Promise<Event[]>((resolve) => {
                resolveSearch = resolve;
            })
        );

        await renderEventsPageWithNoInitialEvents();

        fireEvent.change(screen.getByLabelText("Search with AI"), {
            target: { value: "Find coffee events" }
        });
        fireEvent.click(screen.getByRole("button", { name: "Ask AI" }));

        // Both search buttons show "Searching..." and are disabled.
        const searchingButtons = screen.getAllByRole("button", {
            name: "Searching..."
        });

        expect(searchingButtons).toHaveLength(2);
        searchingButtons.forEach((button) => {
            expect(button).toBeDisabled();
        });
        expect(searchEventsNaturalLanguage).toHaveBeenCalledTimes(1);

        // Simulate another click on the disabled AI search button.
        fireEvent.click(searchingButtons[1]);
        expect(searchEventsNaturalLanguage).toHaveBeenCalledTimes(1);

        expect(screen.getByRole("status")).toHaveTextContent(
            "Searching events..."
        );

        // Resolve the pending request and verify the loading state disappears.
        resolveSearch([]);

        expect(
            await screen.findByText("No matching events found.")
        ).toBeInTheDocument();
        expect(
            screen.queryByText("Searching events...")
        ).not.toBeInTheDocument();
    });

    it("shows a message when natural-language search returns no matching events", async () => {
        vi.mocked(searchEventsNaturalLanguage).mockResolvedValue([]);

        await renderEventsPageWithNoInitialEvents();

        fireEvent.change(screen.getByLabelText("Search with AI"), {
            target: {
                value: "Find events about underwater basket weaving"
            }
        });
        fireEvent.click(screen.getByRole("button", { name: "Ask AI" }));

        expect(
            await screen.findByText("No matching events found.")
        ).toBeInTheDocument();
    });

    it("does not run natural-language search when the query is empty or whitespace", async () => {
        await renderEventsPageWithNoInitialEvents();

        fireEvent.change(screen.getByLabelText("Search with AI"), {
            target: { value: "   " }
        });
        fireEvent.click(screen.getByRole("button", { name: "Ask AI" }));

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "Enter a description of the events you're looking for."
        );
        expect(searchEventsNaturalLanguage).not.toHaveBeenCalled();
    });

    it("shows an error when natural-language search fails", async () => {
        vi.mocked(searchEventsNaturalLanguage).mockRejectedValue(
            new Error("Failed to search events with natural language")
        );

        await renderEventsPageWithNoInitialEvents();

        fireEvent.change(screen.getByLabelText("Search with AI"), {
            target: { value: "Find coffee events" }
        });
        fireEvent.click(screen.getByRole("button", { name: "Ask AI" }));

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "Failed to search events with natural language"
        );
        expect(screen.queryByRole("status")).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Search" })).toBeEnabled();
        expect(screen.getByRole("button", { name: "Ask AI" })).toBeEnabled();
    });

    it("recovers when natural-language search succeeds after a failure", async () => {
        vi.mocked(searchEventsNaturalLanguage)
            .mockRejectedValueOnce(
                new Error("Failed to search events with natural language")
            )
            .mockResolvedValueOnce([naturalLanguageSearchResultFixture]);

        await renderEventsPageWithNoInitialEvents();

        fireEvent.change(screen.getByLabelText("Search with AI"), {
            target: { value: "Find coffee events" }
        });
        fireEvent.click(screen.getByRole("button", { name: "Ask AI" }));

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "Failed to search events with natural language"
        );

        fireEvent.change(screen.getByLabelText("Search with AI"), {
            target: { value: "Find coffee meetups" }
        });

        expect(screen.queryByRole("alert")).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Ask AI" }));

        expect(
            await screen.findByText("Mock Event Card: Coffee Meetup")
        ).toBeInTheDocument();
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("fills the AI input from an example without submitting a search", async () => {
        await renderEventsPageWithNoInitialEvents();

        const input = screen.getByLabelText("Search with AI");

        fireEvent.click(
            screen.getByRole("button", {
                name: "Find coffee meetups this weekend"
            })
        );

        expect(input).toHaveValue("Find coffee meetups this weekend");
        expect(searchEventsNaturalLanguage).not.toHaveBeenCalled();
    });
});
