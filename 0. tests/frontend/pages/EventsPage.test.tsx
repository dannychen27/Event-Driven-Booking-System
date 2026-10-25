import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EventsPage from "../../../3. frontend/src/pages/EventsPage";
import {
    getEvents,
    searchEvents,
    searchEventsNaturalLanguage,
} from "../../../3. frontend/src/api/events";
import type { Event } from "../../../3. frontend/src/types/Event";


vi.mock("../../../3. frontend/src/api/events", () => ({
    getEvents: vi.fn(),
    searchEvents: vi.fn(),
    searchEventsNaturalLanguage: vi.fn(),
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

    it("clears the keyword query without submitting or resetting results", async () => {
        vi.mocked(getEvents).mockResolvedValue([
            {
                id: 1,
                name: "Coffee Meetup",
                venue_id: 2,
                venue_name: "Moss Park Espresso",
                venue_address: "185 Queen St E",
                start_time: "2026-10-24T10:00:00Z",
                end_time: "2026-10-24T11:00:00Z",
                capacity: 10,
            },
        ]);

        render(<EventsPage />);

        expect(
            await screen.findByText("Mock Event Card: Coffee Meetup"),
        ).toBeInTheDocument();

        const input = screen.getByLabelText("Search events");

        fireEvent.change(input, {
            target: { value: "Coffee" },
        });

        const keywordForm = input.closest("form");
        expect(keywordForm).not.toBeNull();

        fireEvent.click(
            within(keywordForm as HTMLFormElement).getByRole(
                "button",
                { name: "Clear query" },
            ),
        );

        expect(input).toHaveValue("");
        expect(searchEvents).not.toHaveBeenCalled();
        expect(getEvents).toHaveBeenCalledTimes(1);
        expect(
            screen.getByText("Mock Event Card: Coffee Meetup"),
        ).toBeInTheDocument();
    });

    it("keeps the keyword Clear query button visible and disables it when the query is empty", async () => {
        render(<EventsPage />);

        const keywordInput = await screen.findByLabelText("Search events");
        const keywordForm = keywordInput.closest("form");

        expect(keywordForm).not.toBeNull();

        const clearButton = within(keywordForm as HTMLFormElement).getByRole(
            "button",
            { name: "Clear query" },
        );

        // Visible and disabled when the input is empty.
        expect(clearButton).toBeVisible();
        expect(clearButton).toBeDisabled();

        // Enabled after entering a query.
        fireEvent.change(keywordInput, {
            target: { value: "Meet and Greet" },
        });

        expect(clearButton).toBeEnabled();

        // Clearing removes only the keyword query and disables the button again.
        fireEvent.click(clearButton);

        expect(keywordInput).toHaveValue("");
        expect(clearButton).toBeDisabled();
    });


    it("searches events using the submitted keyword", async () => {
        vi.mocked(getEvents).mockResolvedValue([]);
        vi.mocked(searchEvents).mockResolvedValue([
            {
                id: 1,
                name: "Meet and Greet",
                venue_id: 2,
                venue_name: "Moss Park Espresso",
                venue_address: "185 Queen St E",
                start_time: "2026-08-08T22:00:00Z",
                end_time: "2026-08-09T00:00:00Z",
                capacity: 1,
            },
        ]);

        render(<EventsPage />);

        await screen.findByText("No available events right now.");

        fireEvent.change(screen.getByLabelText("Search events"), {
            target: { value: "Meet" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Search" }));

        expect(await screen.findByText("Mock Event Card: Meet and Greet"))
            .toBeInTheDocument();
        expect(searchEvents).toHaveBeenCalledWith("Meet");
    });

    it("shows a message when search returns no matching events", async () => {
        vi.mocked(getEvents).mockResolvedValue([]);
        vi.mocked(searchEvents).mockResolvedValue([]);

        render(<EventsPage />);
        await screen.findByText("No available events right now.");

        fireEvent.change(screen.getByLabelText("Search events"), {
            target: { value: "Nonexistent" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Search" }));

        expect(await screen.findByText("No matching events found."))
            .toBeInTheDocument();
    });

    it("shows an error when searching fails", async () => {
        vi.mocked(getEvents).mockResolvedValue([]);
        vi.mocked(searchEvents).mockRejectedValue(
            new Error("Failed to search events"),
        );

        render(<EventsPage />);
        await screen.findByText("No available events right now.");

        fireEvent.change(screen.getByLabelText("Search events"), {
            target: { value: "Meet" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Search" }));

        expect(await screen.findByRole("alert"))
            .toHaveTextContent("Failed to search events");

        expect(screen.queryByRole("status")).not.toBeInTheDocument();

        expect(screen.getByRole("button", { name: "Search" }))
            .toBeEnabled();
        expect(screen.getByRole("button", { name: "Ask AI" }))
            .toBeEnabled();
    });

    it("does not search when the keyword is empty or whitespace", async () => {
        vi.mocked(getEvents).mockResolvedValue([]);

        render(<EventsPage />);
        await screen.findByText("No available events right now.");

        fireEvent.change(screen.getByLabelText("Search events"), {
            target: { value: "   " },
        });
        fireEvent.click(screen.getByRole("button", { name: "Search" }));

        expect(await screen.findByRole("alert"))
            .toHaveTextContent("Enter a keyword to search.");
        expect(searchEvents).not.toHaveBeenCalled();
    });

    it("searches events using a natural-language query", async () => {
        vi.mocked(getEvents).mockResolvedValue([]);
        vi.mocked(searchEventsNaturalLanguage).mockResolvedValue([
            {
                id: 3,
                name: "Coffee Meetup",
                venue_id: 1,
                start_time: "2026-10-24T10:00:00Z",
                end_time: "2026-10-24T11:00:00Z",
                capacity: 10,
            },
        ]);

        render(<EventsPage />);
        await screen.findByText("No available events right now.");

        fireEvent.change(
            screen.getByLabelText("Search with AI"),
            { target: { value: "  Find coffee events this weekend  " } },
        );
        fireEvent.click(screen.getByRole("button", { name: "Ask AI" }));

        expect(await screen.findByText("Mock Event Card: Coffee Meetup"))
            .toBeInTheDocument();
        expect(searchEventsNaturalLanguage)
            .toHaveBeenCalledWith("Find coffee events this weekend");
    });

    it("shows the loading state while natural-language search is pending", async () => {
        vi.mocked(getEvents).mockResolvedValue([]);

        let resolveSearch!: (events: Event[]) => void;
        vi.mocked(searchEventsNaturalLanguage).mockReturnValue(
            new Promise<Event[]>((resolve) => {
                resolveSearch = resolve;
            }),
        );

        render(<EventsPage />);
        await screen.findByText("No available events right now.");

        fireEvent.change(
            screen.getByLabelText("Search with AI"),
            { target: { value: "Find coffee events" } },
        );
        fireEvent.click(screen.getByRole("button", { name: "Ask AI" }));

        // Both search buttons show "Searching..." and are disabled.
        const searchingButtons = screen.getAllByRole("button", {
            name: "Searching...",
        });
        expect(searchingButtons).toHaveLength(2);
        searchingButtons.forEach((button: HTMLElement) => {
            expect(button).toBeDisabled();
        });
        expect(searchEventsNaturalLanguage).toHaveBeenCalledTimes(1);

        // This simulates another click on the disabled AI search button
        // and verifies the request count stays at one.
        fireEvent.click(searchingButtons[1]);
        expect(searchEventsNaturalLanguage).toHaveBeenCalledTimes(1);

        expect(screen.getByRole("status"))
            .toHaveTextContent("Searching events...");

        // Resolve the pending request and verify the loading state disappears.
        resolveSearch([]);

        expect(await screen.findByText("No matching events found."))
            .toBeInTheDocument();
        expect(screen.queryByText("Searching events..."))
            .not.toBeInTheDocument();
    });

    it("shows a message when natural-language search returns no matching events", async () => {
        vi.mocked(getEvents).mockResolvedValue([]);
        vi.mocked(searchEventsNaturalLanguage).mockResolvedValue([]);

        render(<EventsPage />);
        await screen.findByText("No available events right now.");

        fireEvent.change(
            screen.getByLabelText("Search with AI"),
            { target: { value: "Find events about underwater basket weaving" } },
        );
        fireEvent.click(screen.getByRole("button", { name: "Ask AI" }));

        expect(await screen.findByText("No matching events found."))
            .toBeInTheDocument();
    });

    it("does not run natural-language search when the query is empty or whitespace", async () => {
        vi.mocked(getEvents).mockResolvedValue([]);

        render(<EventsPage />);
        await screen.findByText("No available events right now.");

        fireEvent.change(
            screen.getByLabelText("Search with AI"),
            { target: { value: "   " } },
        );
        fireEvent.click(screen.getByRole("button", { name: "Ask AI" }));

        expect(await screen.findByRole("alert"))
            .toHaveTextContent("Enter a description of the events you're looking for.");
        expect(searchEventsNaturalLanguage).not.toHaveBeenCalled();
    });

    it("shows an error when natural-language search fails", async () => {
        vi.mocked(getEvents).mockResolvedValue([]);
        vi.mocked(searchEventsNaturalLanguage).mockRejectedValue(
            new Error("Failed to search events with natural language"),
        );

        render(<EventsPage />);
        await screen.findByText("No available events right now.");

        fireEvent.change(
            screen.getByLabelText("Search with AI"),
            { target: { value: "Find coffee events" } },
        );
        fireEvent.click(screen.getByRole("button", { name: "Ask AI" }));

        expect(await screen.findByRole("alert"))
            .toHaveTextContent("Failed to search events with natural language");

        expect(screen.queryByRole("status")).not.toBeInTheDocument();

        expect(screen.getByRole("button", { name: "Search" }))
            .toBeEnabled();
        expect(screen.getByRole("button", { name: "Ask AI" }))
            .toBeEnabled();
    });

    it("recovers when natural-language search succeeds after a failure", async () => {
        vi.mocked(getEvents).mockResolvedValue([]);
        vi.mocked(searchEventsNaturalLanguage)
            .mockRejectedValueOnce(
                new Error("Failed to search events with natural language"),
            )
            .mockResolvedValueOnce([
                {
                    id: 3,
                    name: "Coffee Meetup",
                    venue_id: 1,
                    start_time: "2026-10-24T10:00:00Z",
                    end_time: "2026-10-24T11:00:00Z",
                    capacity: 10,
                },
            ]);

        render(<EventsPage />);
        await screen.findByText("No available events right now.");

        const input = screen.getByLabelText(
            "Search with AI",
        );

        fireEvent.change(input, {
            target: { value: "Find coffee events" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Ask AI" }));

        expect(await screen.findByRole("alert"))
            .toHaveTextContent("Failed to search events with natural language");

        fireEvent.change(input, {
            target: { value: "Find coffee meetups" },
        });

        expect(screen.queryByRole("alert")).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Ask AI" }));

        expect(await screen.findByText("Mock Event Card: Coffee Meetup"))
            .toBeInTheDocument();
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("fills the AI input from an example without submitting a search", async () => {
        vi.mocked(getEvents).mockResolvedValue([]);

        render(<EventsPage />);

        const input = await screen.findByLabelText(
            "Search with AI",
        );

        fireEvent.click(
            screen.getByRole("button", {
                name: "Find coffee meetups this weekend",
            }),
        );

        expect(input).toHaveValue(
            "Find coffee meetups this weekend",
        );
        expect(searchEventsNaturalLanguage).not.toHaveBeenCalled();
    });

    it("clears only the AI query without submitting or resetting results", async () => {
        const events = [
            {
                id: 1,
                name: "Coffee Meetup",
            },
        ] as Event[];

        vi.mocked(getEvents).mockResolvedValue(events);

        render(<EventsPage />);

        const input = await screen.findByLabelText(
            "Search with AI",
        );

        fireEvent.change(input, {
            target: { value: "Find coffee events" },
        });

        const aiForm = input.closest("form");
        expect(aiForm).not.toBeNull();

        fireEvent.click(
            within(aiForm as HTMLFormElement).getByRole(
                "button",
                { name: "Clear query" },
            ),
        );

        expect(input).toHaveValue("");
        expect(searchEventsNaturalLanguage).not.toHaveBeenCalled();
        expect(getEvents).toHaveBeenCalledTimes(1);
    });

    it("keeps the AI Clear query button visible and disables it when the query is empty", async () => {
        render(<EventsPage />);

        const aiInput = await screen.findByLabelText(
            "Search with AI",
        );
        const aiForm = aiInput.closest("form");

        expect(aiForm).not.toBeNull();

        const clearButton = within(aiForm as HTMLFormElement).getByRole(
            "button",
            { name: "Clear query" },
        );

        // Visible and disabled when the input is empty.
        expect(clearButton).toBeVisible();
        expect(clearButton).toBeDisabled();

        // Enabled after entering a query.
        fireEvent.change(aiInput, {
            target: { value: "Find events this weekend" },
        });

        expect(clearButton).toBeEnabled();

        // Clearing removes only the AI query and disables the button again.
        fireEvent.click(clearButton);

        expect(aiInput).toHaveValue("");
        expect(clearButton).toBeDisabled();
    });

    it("clears both search inputs and restores all events", async () => {
        vi.mocked(getEvents).mockResolvedValue([
            {
                id: 1,
                name: "Initial Event",
                venue_id: 1,
                start_time: "2026-10-24T10:00:00Z",
                end_time: "2026-10-24T11:00:00Z",
                capacity: 10,
            },
        ]);
        vi.mocked(searchEvents).mockResolvedValue([]);
        vi.mocked(searchEventsNaturalLanguage).mockResolvedValue([]);

        render(<EventsPage />);

        expect(
            await screen.findByText("Mock Event Card: Initial Event"),
        ).toBeInTheDocument();

        fireEvent.change(screen.getByLabelText("Search events"), {
            target: { value: "Coffee" },
        });
        fireEvent.change(
            screen.getByLabelText("Search with AI"),
            { target: { value: "Find coffee events this weekend" } },
        );

        fireEvent.click(screen.getByRole("button", { name: "Search" }));
        await screen.findByText("No matching events found.");

        fireEvent.click(screen.getByRole("button", { name: "Clear search" }));

        expect(
            await screen.findByText("Mock Event Card: Initial Event"),
        ).toBeInTheDocument();
        expect(screen.getByLabelText("Search events")).toHaveValue("");
        expect(
            screen.getByLabelText("Search with AI"),
        ).toHaveValue("");
    });

    it("shows an error when clearing search fails to reload events", async () => {
        vi.mocked(getEvents)
            .mockResolvedValueOnce([
                {
                    id: 1,
                    name: "Initial Event",
                    description: "An initial event",
                    date: "2026-11-01T10:00:00Z",
                    venue_id: 1,
                    capacity: 10,
                },
            ])
            .mockRejectedValueOnce(new Error("Failed to reload events"));

        vi.mocked(searchEvents).mockResolvedValue([]);

        render(<EventsPage />);

        expect(
            await screen.findByText("Mock Event Card: Initial Event"),
        ).toBeInTheDocument();

        fireEvent.change(screen.getByLabelText("Search events"), {
            target: { value: "Coffee" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Search" }));

        expect(
            await screen.findByText("No matching events found."),
        ).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Clear search" }));

        expect(await screen.findByRole("alert"))
            .toHaveTextContent("Failed to reload events");

        expect(screen.queryByText("Loading events..."))
            .not.toBeInTheDocument();
    });

    it("clears the search error when the keyword input changes", async () => {
        vi.mocked(getEvents).mockResolvedValue([]);
        vi.mocked(searchEvents).mockRejectedValue(
            new Error("Failed to search events"),
        );

        render(<EventsPage />);

        await screen.findByText("No available events right now.");

        fireEvent.change(screen.getByLabelText("Search events"), {
            target: { value: "Coffee" },
        });

        fireEvent.click(screen.getByRole("button", { name: "Search" }));

        expect(await screen.findByRole("alert"))
            .toHaveTextContent("Failed to search events");

        fireEvent.change(screen.getByLabelText("Search events"), {
            target: { value: "Music" },
        });

        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("clears the search error when the natural-language input changes", async () => {
        vi.mocked(getEvents).mockResolvedValue([]);
        vi.mocked(searchEventsNaturalLanguage).mockRejectedValue(
            new Error("Failed to search events with natural language"),
        );

        render(<EventsPage />);

        await screen.findByText("No available events right now.");

        const input = screen.getByLabelText(
            "Search with AI",
        );

        fireEvent.change(input, {
            target: { value: "Find coffee events" },
        });

        fireEvent.click(screen.getByRole("button", { name: "Ask AI" }));

        expect(await screen.findByRole("alert"))
            .toHaveTextContent("Failed to search events with natural language");

        fireEvent.change(input, {
            target: { value: "Find music events" },
        });

        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("clears the keyword search error when the natural-language input changes", async () => {
        vi.mocked(getEvents).mockResolvedValue([]);
        vi.mocked(searchEvents).mockRejectedValue(
            new Error("Failed to search events"),
        );

        render(<EventsPage />);
        await screen.findByText("No available events right now.");

        fireEvent.change(screen.getByLabelText("Search events"), {
            target: { value: "Coffee" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Search" }));

        expect(await screen.findByRole("alert"))
            .toHaveTextContent("Failed to search events");

        fireEvent.change(
            screen.getByLabelText("Search with AI"),
            { target: { value: "Find music events" } },
        );

        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("preserves previous results when a new search fails", async () => {
        vi.mocked(getEvents).mockResolvedValue([
            {
                id: 1,
                name: "Initial Event",
                venue_id: 1,
                start_time: "2026-10-24T10:00:00Z",
                end_time: "2026-10-24T11:00:00Z",
                capacity: 10,
            },
        ]);
        vi.mocked(searchEvents).mockRejectedValue(
            new Error("Failed to search events"),
        );

        render(<EventsPage />);
        expect(await screen.findByText("Mock Event Card: Initial Event"))
            .toBeInTheDocument();

        fireEvent.change(screen.getByLabelText("Search events"), {
            target: { value: "Coffee" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Search" }));

        expect(await screen.findByRole("alert"))
            .toHaveTextContent("Failed to search events");
        expect(screen.getByText("Mock Event Card: Initial Event"))
            .toBeInTheDocument();
    });

    it("does not let an older search overwrite newer results", async () => {
        // Arrange: prepare two searches whose completion order we control.
        vi.mocked(getEvents).mockResolvedValue([]);

        let resolveOlderSearch!: (events: Event[]) => void;
        let resolveNewerSearch!: (events: Event[]) => void;

        vi.mocked(searchEvents)
            .mockReturnValueOnce(
                new Promise<Event[]>((resolve) => {
                    resolveOlderSearch = resolve;
                }),
            )
            .mockReturnValueOnce(
                new Promise<Event[]>((resolve) => {
                    resolveNewerSearch = resolve;
                }),
            );

        render(<EventsPage />);
        await screen.findByText("No available events right now.");

        const keywordInput = screen.getByLabelText("Search events");

        // Act 1: start the older search.
        fireEvent.change(keywordInput, {
            target: { value: "Older query" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Search" }));

        // Act 2: start a newer search while the older request is pending.
        // Bypass the disabled button to simulate overlapping requests.
        fireEvent.change(keywordInput, {
            target: { value: "Newer query" },
        });

        const keywordForm = keywordInput.closest("form");
        if (!keywordForm) {
            throw new Error("Keyword search form was not found");
        }

        const searchButton = within(keywordForm).getByRole("button", {
            name: "Searching...",
        });
        searchButton.removeAttribute("disabled");
        fireEvent.click(searchButton);

        // Act 3: resolve the newer request first.
        resolveNewerSearch([
            {
                id: 2,
                name: "Newer Result",
                venue_id: 1,
                venue_name: "Test Venue",
                venue_address: "123 Test Street",
                start_time: "2026-10-25T10:00:00Z",
                end_time: "2026-10-25T11:00:00Z",
                capacity: 10,
            },
        ]);

        // Assert: the newer results are published.
        expect(await screen.findByText("Mock Event Card: Newer Result"))
            .toBeInTheDocument();

        // Act 4: resolve the older request after the newer one.
        resolveOlderSearch([
            {
                id: 1,
                name: "Older Result",
                venue_id: 1,
                venue_name: "Test Venue",
                venue_address: "123 Test Street",
                start_time: "2026-10-24T10:00:00Z",
                end_time: "2026-10-24T11:00:00Z",
                capacity: 10,
            },
        ]);

        // Assert: the older results must not overwrite the newer results.
        expect(await screen.findByText("Mock Event Card: Newer Result"))
            .toBeInTheDocument();
        expect(screen.queryByText("Mock Event Card: Older Result"))
            .not.toBeInTheDocument();
    });
});
