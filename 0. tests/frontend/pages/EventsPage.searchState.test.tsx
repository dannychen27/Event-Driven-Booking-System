import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import EventsPage from "../../../3. frontend/src/pages/EventsPage";
import {
    getEvents,
    searchEvents,
    searchEventsNaturalLanguage
} from "../../../3. frontend/src/api/events";
import { renderEventsPageWithNoInitialEvents } from "../helpers/EventsPageTestHelpers";
import type { Event } from "../../../3. frontend/src/types/events/Event";
import {
    initialEventFixture,
    newerSearchResultFixture,
    olderSearchResultFixture
} from "../fixtures/events/eventFixtures";

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


describe("Search error handling and result consistency", () => {
    it("clears the search error when the keyword input changes", async () => {
        vi.mocked(searchEvents).mockRejectedValue(
            new Error("Failed to search events")
        );

        await renderEventsPageWithNoInitialEvents();

        fireEvent.change(screen.getByLabelText("Search events"), {
            target: { value: "Coffee" }
        });
        fireEvent.click(screen.getByRole("button", { name: "Search" }));

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "Failed to search events"
        );

        fireEvent.change(screen.getByLabelText("Search events"), {
            target: { value: "Music" }
        });

        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("clears the search error when the natural-language input changes", async () => {
        vi.mocked(searchEventsNaturalLanguage).mockRejectedValue(
            new Error("Failed to search events with natural language")
        );

        await renderEventsPageWithNoInitialEvents();

        const input = screen.getByLabelText("Search with AI");

        fireEvent.change(input, {
            target: { value: "Find coffee events" }
        });
        fireEvent.click(screen.getByRole("button", { name: "Ask AI" }));

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "Failed to search events with natural language"
        );

        fireEvent.change(input, {
            target: { value: "Find music events" }
        });

        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("clears the keyword search error when the natural-language input changes", async () => {
        vi.mocked(searchEvents).mockRejectedValue(
            new Error("Failed to search events")
        );

        await renderEventsPageWithNoInitialEvents();

        fireEvent.change(screen.getByLabelText("Search events"), {
            target: { value: "Coffee" }
        });
        fireEvent.click(screen.getByRole("button", { name: "Search" }));

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "Failed to search events"
        );

        fireEvent.change(screen.getByLabelText("Search with AI"), {
            target: { value: "Find music events" }
        });

        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("preserves previous results when a new search fails", async () => {
        vi.mocked(getEvents).mockResolvedValue([initialEventFixture]);
        vi.mocked(searchEvents).mockRejectedValue(
            new Error("Failed to search events")
        );

        render(<EventsPage />);

        expect(await screen.findByText("Mock Event Card: Initial Event"))
            .toBeInTheDocument();

        fireEvent.change(screen.getByLabelText("Search events"), {
            target: { value: "Coffee" }
        });
        fireEvent.click(screen.getByRole("button", { name: "Search" }));

        expect(await screen.findByRole("alert")).toHaveTextContent("Failed to search events");
        expect(screen.getByText("Mock Event Card: Initial Event"))
            .toBeInTheDocument();
    });

    it("does not let an older search overwrite newer results", async () => {
        // Arrange: prepare two searches whose completion order we control.
        let resolveOlderSearch!: (events: Event[]) => void;
        let resolveNewerSearch!: (events: Event[]) => void;

        vi.mocked(searchEvents)
            .mockReturnValueOnce(
                new Promise<Event[]>((resolve) => {
                    resolveOlderSearch = resolve;
                })
            )
            .mockReturnValueOnce(
                new Promise<Event[]>((resolve) => {
                    resolveNewerSearch = resolve;
                })
            );

        await renderEventsPageWithNoInitialEvents();

        const keywordInput = screen.getByLabelText("Search events");

        // Act 1: start the older search.
        fireEvent.change(keywordInput, {
            target: { value: "Older query" }
        });
        fireEvent.click(screen.getByRole("button", { name: "Search" }));

        // Act 2: start a newer search while the older request is pending.
        // Bypass the disabled button to simulate overlapping requests.
        fireEvent.change(keywordInput, {
            target: { value: "Newer query" }
        });

        const keywordForm = keywordInput.closest("form");
        if (!keywordForm) {
            throw new Error("Keyword search form was not found");
        }

        const searchButton = within(keywordForm).getByRole("button", {
            name: "Searching..."
        });
        searchButton.removeAttribute("disabled");
        fireEvent.click(searchButton);

        // Act 3: resolve the newer request first.
        resolveNewerSearch([newerSearchResultFixture]);

        // Assert: the newer results are published.
        expect(await screen.findByText("Mock Event Card: Newer Result"))
            .toBeInTheDocument();

        // Act 4: resolve the older request after the newer one.
        resolveOlderSearch([olderSearchResultFixture]);

        // Assert: the older results must not overwrite the newer results.
        expect(await screen.findByText("Mock Event Card: Newer Result"))
            .toBeInTheDocument();
        expect(screen.queryByText("Mock Event Card: Older Result"))
            .not.toBeInTheDocument();
    });
});
