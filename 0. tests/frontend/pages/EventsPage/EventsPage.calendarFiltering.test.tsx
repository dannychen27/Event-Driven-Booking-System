import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
    searchEvents,
    searchEventsNaturalLanguage,
} from "../../../../3. frontend/src/api/events";
import type { Event } from "../../../../3. frontend/src/types/events/Event";
import type { NaturalLanguageSearchResponse } from "../../../../3. frontend/src/types/search/NaturalLanguageSearch.types";
import { renderEventsPageWithNoInitialEvents } from "../../helpers/EventsPageTestHelpers";

import { getBookingHistory } from "../../../../3. frontend/src/api/bookings";

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

const successfulResponse = (
    events: Event[],
): NaturalLanguageSearchResponse => ({
    status: "success",
    events,
    appliedFilters: {},
});

beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getBookingHistory).mockResolvedValue([]);
});

describe("Calendar filtering", () => {
    describe("Standalone calendar filtering", () => {
        it("applies date filters through the standalone calendar controls", async () => {
            vi.mocked(searchEventsNaturalLanguage).mockResolvedValue(
                successfulResponse([]),
            );

            await renderEventsPageWithNoInitialEvents();

            fireEvent.change(screen.getByLabelText("From"), {
                target: { value: "2026-11-10" },
            });

            fireEvent.click(
                screen.getByRole("button", { name: "Apply filters" }),
            );

            expect(
                await screen.findByText("No matching events found."),
            ).toBeInTheDocument();

            expect(searchEventsNaturalLanguage).toHaveBeenCalledWith({
                filters: {
                    date: {
                        state: "selected",
                        value: {
                            startDate: "2026-11-10",
                            endDate: "2026-11-10",
                        },
                    },
                },
            });

            expect(searchEvents).not.toHaveBeenCalled();
        });

        it("applies time filters through the standalone calendar controls", async () => {
            vi.mocked(searchEventsNaturalLanguage).mockResolvedValue(
                successfulResponse([]),
            );

            await renderEventsPageWithNoInitialEvents();

            fireEvent.click(
                screen.getByRole("button", {
                    name: "Morning (8 AM–12 PM)",
                }),
            );

            fireEvent.click(
                screen.getByRole("button", { name: "Apply filters" }),
            );

            expect(
                await screen.findByText("No matching events found."),
            ).toBeInTheDocument();

            expect(searchEventsNaturalLanguage).toHaveBeenCalledWith({
                filters: {
                    time: {
                        state: "selected",
                        value: {
                            timeOfDay: ["MORNING"],
                        },
                    },
                },
            });

            expect(searchEvents).not.toHaveBeenCalled();
        });

        it("applies date and time filters through the standalone calendar controls", async () => {
            vi.mocked(searchEventsNaturalLanguage).mockResolvedValue(
                successfulResponse([]),
            );

            await renderEventsPageWithNoInitialEvents();

            fireEvent.change(screen.getByLabelText("From"), {
                target: { value: "2026-11-10" },
            });

            fireEvent.click(
                screen.getByRole("button", {
                    name: "Morning (8 AM–12 PM)",
                }),
            );

            fireEvent.click(
                screen.getByRole("button", { name: "Apply filters" }),
            );

            expect(
                await screen.findByText("No matching events found."),
            ).toBeInTheDocument();

            expect(searchEventsNaturalLanguage).toHaveBeenCalledWith({
                filters: {
                    date: {
                        state: "selected",
                        value: {
                            startDate: "2026-11-10",
                            endDate: "2026-11-10",
                        },
                    },
                    time: {
                        state: "selected",
                        value: {
                            timeOfDay: ["MORNING"],
                        },
                    },
                },
            });

            expect(searchEvents).not.toHaveBeenCalled();
        });
    });

    it("applies explicitly cleared date and time filters to restore unfiltered results", async () => {
        vi.mocked(searchEventsNaturalLanguage).mockResolvedValue(
            successfulResponse([]),
        );

        await renderEventsPageWithNoInitialEvents();

        fireEvent.change(screen.getByLabelText("From"), {
            target: { value: "2026-11-10" },
        });

        fireEvent.click(
            screen.getByRole("button", {
                name: "Morning (8 AM–12 PM)",
            }),
        );

        fireEvent.click(
            screen.getByRole("button", { name: "Apply filters" }),
        );

        expect(
            await screen.findByText("No matching events found."),
        ).toBeInTheDocument();

        fireEvent.click(
            screen.getByRole("button", { name: "Clear date" }),
        );

        fireEvent.click(
            screen.getByRole("button", { name: "Clear time" }),
        );

        const applyButton = screen.getByRole("button", {
            name: "Apply filters",
        });

        expect(applyButton).toBeEnabled();

        fireEvent.click(applyButton);

        await vi.waitFor(() => {
            expect(searchEventsNaturalLanguage).toHaveBeenCalledTimes(2);
        });

        expect(searchEventsNaturalLanguage).toHaveBeenNthCalledWith(2, {
            filters: {
                date: { state: "cleared" },
                time: { state: "cleared" },
            },
        });

        expect(searchEvents).not.toHaveBeenCalled();

        await vi.waitFor(() => {
            expect(applyButton).toBeDisabled();
        });
    });

    describe("Calendar filtering through Ask AI", () => {
        it("applies date filters through Ask AI without a search query", async () => {
            vi.mocked(searchEventsNaturalLanguage).mockResolvedValue(
                successfulResponse([]),
            );

            await renderEventsPageWithNoInitialEvents();

            fireEvent.change(screen.getByLabelText("From"), {
                target: { value: "2026-11-10" },
            });

            fireEvent.click(
                screen.getByRole("button", { name: "Ask AI" }),
            );

            expect(
                await screen.findByText("No matching events found."),
            ).toBeInTheDocument();

            expect(searchEventsNaturalLanguage).toHaveBeenCalledWith({
                filters: {
                    date: {
                        state: "selected",
                        value: {
                            startDate: "2026-11-10",
                            endDate: "2026-11-10",
                        },
                    },
                },
            });

            expect(searchEvents).not.toHaveBeenCalled();
        });

        it("applies time filters through Ask AI without a search query", async () => {
            vi.mocked(searchEventsNaturalLanguage).mockResolvedValue(
                successfulResponse([]),
            );

            await renderEventsPageWithNoInitialEvents();

            fireEvent.click(
                screen.getByRole("button", {
                    name: "Morning (8 AM–12 PM)",
                }),
            );

            fireEvent.click(
                screen.getByRole("button", { name: "Ask AI" }),
            );

            expect(
                await screen.findByText("No matching events found."),
            ).toBeInTheDocument();

            expect(searchEventsNaturalLanguage).toHaveBeenCalledWith({
                filters: {
                    time: {
                        state: "selected",
                        value: {
                            timeOfDay: ["MORNING"],
                        },
                    },
                },
            });

            expect(searchEvents).not.toHaveBeenCalled();
        });

        it("applies date and time filters through Ask AI without a search query", async () => {
            vi.mocked(searchEventsNaturalLanguage).mockResolvedValue(
                successfulResponse([]),
            );

            await renderEventsPageWithNoInitialEvents();

            fireEvent.change(screen.getByLabelText("From"), {
                target: { value: "2026-11-10" },
            });

            fireEvent.click(
                screen.getByRole("button", {
                    name: "Morning (8 AM–12 PM)",
                }),
            );

            fireEvent.click(
                screen.getByRole("button", { name: "Ask AI" }),
            );

            expect(
                await screen.findByText("No matching events found."),
            ).toBeInTheDocument();

            expect(searchEventsNaturalLanguage).toHaveBeenCalledWith({
                filters: {
                    date: {
                        state: "selected",
                        value: {
                            startDate: "2026-11-10",
                            endDate: "2026-11-10",
                        },
                    },
                    time: {
                        state: "selected",
                        value: {
                            timeOfDay: ["MORNING"],
                        },
                    },
                },
            });

            expect(searchEvents).not.toHaveBeenCalled();
        });
    });
});
