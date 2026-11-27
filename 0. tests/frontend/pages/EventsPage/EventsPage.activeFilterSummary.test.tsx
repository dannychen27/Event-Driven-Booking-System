import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";

import EventsPage from "../../../../3. frontend/src/pages/EventsPage";
import {
    getEvents,
    searchEvents,
    searchEventsNaturalLanguage,
} from "../../../../3. frontend/src/api/events";
import { getBookingHistory } from "../../../../3. frontend/src/api/bookings";
import type { Event } from "../../../../3. frontend/src/types/events/Event";
import { renderEventsPageWithNoInitialEvents } from "../../helpers/EventsPageTestHelpers";

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
    window.history.replaceState({}, "", "/events");
    vi.mocked(getBookingHistory).mockResolvedValue([]);
});

afterEach(() => {
    window.history.replaceState({}, "", "/events");
});

describe("Events active-filter summary", () => {
    it("shows a keyword chip only after a successful search", async () => {
        vi.mocked(searchEvents).mockResolvedValue([]);

        await renderEventsPageWithNoInitialEvents();

        fireEvent.change(screen.getByLabelText("Search events"), {
            target: { value: "Meet" },
        });

        expect(
            screen.queryByRole("region", { name: "Active filters" }),
        ).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Search" }));

        expect(
            await screen.findByRole("button", {
                name: "Remove Keyword filter: Meet",
            }),
        ).toBeInTheDocument();
    });

    it("keeps applied calendar chips unchanged while edits remain drafts", async () => {
        vi.mocked(searchEventsNaturalLanguage).mockResolvedValue({
            status: "success",
            events: [],
            appliedFilters: {},
        });

        await renderEventsPageWithNoInitialEvents();

        fireEvent.change(screen.getByLabelText("From"), {
            target: { value: "2026-11-10" },
        });

        fireEvent.click(
            screen.getByRole("button", { name: "Morning (8 AM–12 PM)" }),
        );

        expect(
            screen.queryByRole("region", { name: "Active filters" }),
        ).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));

        expect(
            await screen.findByRole("button", {
                name: /^Remove Date filter:/,
            }),
        ).toBeInTheDocument();

        expect(
            screen.getByRole("button", {
                name: "Remove Time filter: Morning",
            }),
        ).toBeInTheDocument();

        fireEvent.change(screen.getByLabelText("From"), {
            target: { value: "2026-11-11" },
        });

        expect(
            screen.getByRole("button", {
                name: /Remove Date filter: Nov 10, 2026/,
            }),
        ).toBeInTheDocument();

        expect(
            screen.queryByRole("button", {
                name: /Remove Date filter: Nov 11, 2026/,
            }),
        ).not.toBeInTheDocument();
    });

    it("removes a date chip without applying an unsubmitted date edit or losing applied time", async () => {
        vi.mocked(searchEventsNaturalLanguage).mockResolvedValue({
            status: "success",
            events: [],
            appliedFilters: {},
        });

        await renderEventsPageWithNoInitialEvents();

        fireEvent.change(screen.getByLabelText("From"), {
            target: { value: "2026-11-10" },
        });

        fireEvent.click(
            screen.getByRole("button", { name: "Morning (8 AM–12 PM)" }),
        );

        fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));

        await screen.findByRole("button", {
            name: /^Remove Date filter:/,
        });

        fireEvent.change(screen.getByLabelText("From"), {
            target: { value: "2026-11-11" },
        });

        fireEvent.click(
            screen.getByRole("button", { name: /^Remove Date filter:/ }),
        );

        await waitFor(() => {
            expect(searchEventsNaturalLanguage).toHaveBeenCalledTimes(2);
        });

        expect(searchEventsNaturalLanguage).toHaveBeenNthCalledWith(2, {
            filters: {
                date: { state: "cleared" },
                time: {
                    state: "selected",
                    value: { timeOfDay: ["MORNING"] },
                },
            },
        });

        expect(
            screen.queryByRole("button", { name: /^Remove Date filter:/ }),
        ).not.toBeInTheDocument();

        expect(
            screen.getByRole("button", {
                name: "Remove Time filter: Morning",
            }),
        ).toBeInTheDocument();
    });

    it("clears all active filters and reloads the unfiltered events", async () => {
        vi.mocked(searchEvents).mockResolvedValue([]);

        await renderEventsPageWithNoInitialEvents();

        fireEvent.change(screen.getByLabelText("Search events"), {
            target: { value: "Meet" },
        });

        fireEvent.click(screen.getByRole("button", { name: "Search" }));

        await screen.findByRole("button", {
            name: "Remove Keyword filter: Meet",
        });

        fireEvent.click(screen.getByRole("button", { name: "Clear all" }));

        await waitFor(() => {
            expect(
                screen.queryByRole("region", { name: "Active filters" }),
            ).not.toBeInTheDocument();

            expect(getEvents).toHaveBeenCalledTimes(2);
        });

        expect(screen.getByLabelText("Search events")).toHaveValue("");
    });

    it("removes the final keyword chip and reloads unfiltered events", async () => {
        vi.mocked(searchEvents).mockResolvedValue([]);

        await renderEventsPageWithNoInitialEvents();

        fireEvent.change(screen.getByLabelText("Search events"), {
            target: { value: "Meet" },
        });

        fireEvent.click(screen.getByRole("button", { name: "Search" }));

        fireEvent.click(
            await screen.findByRole("button", {
                name: "Remove Keyword filter: Meet",
            }),
        );

        await waitFor(() => {
            expect(getEvents).toHaveBeenCalledTimes(2);
            expect(
                screen.queryByRole("region", { name: "Active filters" }),
            ).not.toBeInTheDocument();
        });

        expect(screen.getByLabelText("Search events")).toHaveValue("");
    });

});
