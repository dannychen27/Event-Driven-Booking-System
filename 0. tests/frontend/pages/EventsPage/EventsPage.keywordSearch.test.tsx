import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import EventsPage from "../../../../3. frontend/src/pages/EventsPage";
import { getEvents, searchEvents } from "../../../../3. frontend/src/api/events";
import type { Event } from "../../../../3. frontend/src/types/events/Event";
import {
    coffeeMeetupAtMossParkFixture,
    meetAndGreetSearchResultFixture
} from "../../fixtures/events/eventFixtures";
import { renderEventsPageWithNoInitialEvents } from "../../helpers/EventsPageTestHelpers";

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


describe("Keyword search", () => {
    it("clears the keyword query without submitting or resetting results", async () => {
        vi.mocked(getEvents).mockResolvedValue([coffeeMeetupAtMossParkFixture]);

        render(<EventsPage />);

        expect(
            await screen.findByText("Mock Event Card: Coffee Meetup")
        ).toBeInTheDocument();

        const input = screen.getByLabelText("Search events");

        fireEvent.change(input, { target: { value: "Coffee" } });

        const keywordForm = input.closest("form");
        expect(keywordForm).not.toBeNull();

        fireEvent.click(
            within(keywordForm as HTMLFormElement).getByRole("button", {
                name: "Clear query"
            })
        );

        expect(input).toHaveValue("");
        expect(searchEvents).not.toHaveBeenCalled();
        expect(getEvents).toHaveBeenCalledTimes(2);
        expect(
            screen.getByText("Mock Event Card: Coffee Meetup")
        ).toBeInTheDocument();
    });

    it("searches events using the submitted keyword", async () => {
        vi.mocked(searchEvents).mockResolvedValue([meetAndGreetSearchResultFixture]);

        await renderEventsPageWithNoInitialEvents();

        fireEvent.change(screen.getByLabelText("Search events"), {
            target: { value: "Meet" }
        });
        fireEvent.click(screen.getByRole("button", { name: "Search" }));

        expect(
            await screen.findByText("Mock Event Card: Meet and Greet")
        ).toBeInTheDocument();
        expect(searchEvents).toHaveBeenCalledWith("Meet");
    });

    it("shows a message when search returns no matching events", async () => {
        vi.mocked(searchEvents).mockResolvedValue([]);

        await renderEventsPageWithNoInitialEvents();

        fireEvent.change(screen.getByLabelText("Search events"), {
            target: { value: "Nonexistent" }
        });
        fireEvent.click(screen.getByRole("button", { name: "Search" }));

        expect(
            await screen.findByText("No matching events found.")
        ).toBeInTheDocument();
    });

    it("shows an error when searching fails", async () => {
        vi.mocked(searchEvents).mockRejectedValue(
            new Error("Failed to search events")
        );

        await renderEventsPageWithNoInitialEvents();

        fireEvent.change(screen.getByLabelText("Search events"), {
            target: { value: "Meet" }
        });
        fireEvent.click(screen.getByRole("button", { name: "Search" }));

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "Failed to search events"
        );
        expect(screen.queryByRole("status")).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Search" })).toBeEnabled();
        expect(screen.getByRole("button", { name: "Ask AI" })).toBeEnabled();
    });

    it("does not search when the keyword is empty or whitespace", async () => {
        await renderEventsPageWithNoInitialEvents();

        fireEvent.change(screen.getByLabelText("Search events"), {
            target: { value: "   " }
        });
        fireEvent.click(screen.getByRole("button", { name: "Search" }));

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "Enter a keyword to search."
        );
        expect(searchEvents).not.toHaveBeenCalled();
    });
});
