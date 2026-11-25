import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";


import { venueListFixture } from "../../fixtures/venues/venueFixtures";


import VenuesPage from "../../../../3. frontend/src/pages/VenuesPage";
import { getVenues } from "../../../../3. frontend/src/api/venues";
import type { Venue } from "../../../../3. frontend/src/types/venues/Venue.ts";


vi.mock("../../../../3. frontend/src/api/venues.ts", () => ({
    getVenues: vi.fn(),
}));


vi.mock("../../../../3. frontend/src/components/cards/VenueCard.tsx", () => ({
    default: ({ venue }: { venue: Venue }) => (
        <div>Mock Venue Card: {venue.name}</div>
    ),
}));


describe("VenuesPage", () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("Initial loading and rendering", () => {
        it("shows the loading state while venues are being fetched", () => {
            vi.mocked(getVenues).mockReturnValue(new Promise(() => {}));

            const { container } = render(<VenuesPage />);

            expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
            expect(screen.getByText("Loading venues...")).toBeInTheDocument();
            expect(container.querySelectorAll(".venue-card-skeleton")).toHaveLength(3);
        });

        it("renders venues after they are successfully fetched", async () => {
            vi.mocked(getVenues).mockResolvedValue(venueListFixture);

            render(<VenuesPage />);

            expect(await screen.findByText("Mock Venue Card: Test Venue 1"))
                .toBeInTheDocument();
            expect(screen.getByText("Mock Venue Card: Test Venue 2"))
                .toBeInTheDocument();
            expect(screen.queryByText("Loading venues..."))
                .not.toBeInTheDocument();
        });

        it("shows the empty state when there are no venues", async () => {
            vi.mocked(getVenues).mockResolvedValue([]);

            render(<VenuesPage />);

            expect(await screen.findByText("No available venues right now."))
                .toBeInTheDocument();
            expect(screen.queryByText("Loading venues..."))
                .not.toBeInTheDocument();
        });
    });

    describe("Venue filtering", () => {
        it("applies keyword search when submitted", async () => {
            vi.mocked(getVenues).mockResolvedValue(venueListFixture);

            render(<VenuesPage />);

            expect(await screen.findByText("Mock Venue Card: Test Venue 1"))
                .toBeInTheDocument();

            const searchInput = screen.getByRole("textbox", {
                name: "Search venues",
            });

            fireEvent.change(searchInput, {
                target: { value: "venue 2" },
            });

            // Typing alone does not apply the search.
            expect(screen.getByText("Mock Venue Card: Test Venue 1"))
                .toBeInTheDocument();

            fireEvent.click(screen.getByRole("button", { name: "Search" }));

            expect(screen.getByText("Mock Venue Card: Test Venue 2"))
                .toBeInTheDocument();
            expect(screen.queryByText("Mock Venue Card: Test Venue 1"))
                .not.toBeInTheDocument();
        });

        it("filters by venue type and location", async () => {
            const typedVenues: Venue[] = [
                { ...venueListFixture[0], venue_type: "Library" },
                { ...venueListFixture[1], venue_type: "Community Centre" },
            ];
            vi.mocked(getVenues).mockResolvedValue(typedVenues);

            render(<VenuesPage />);

            expect(await screen.findByText("Mock Venue Card: Test Venue 1"))
                .toBeInTheDocument();

            fireEvent.change(screen.getByLabelText("Venue type"), {
                target: { value: "Library" },
            });

            expect(screen.getByText("Mock Venue Card: Test Venue 1"))
                .toBeInTheDocument();
            expect(screen.queryByText("Mock Venue Card: Test Venue 2"))
                .not.toBeInTheDocument();

            fireEvent.change(screen.getByRole("searchbox", { name: "Location" }), {
                target: { value: "456 Test Avenue" },
            });

            expect(screen.getByText("No venues match your filters."))
                .toBeInTheDocument();
        });

        it("clears all active filters", async () => {
            const typedVenues: Venue[] = [
                { ...venueListFixture[0], venue_type: "Library" },
                { ...venueListFixture[1], venue_type: "Community Centre" },
            ];
            vi.mocked(getVenues).mockResolvedValue(typedVenues);

            render(<VenuesPage />);

            expect(await screen.findByText("Mock Venue Card: Test Venue 1"))
                .toBeInTheDocument();

            fireEvent.change(screen.getByRole("textbox", {
                name: "Search venues",
            }), {
                target: { value: "venue 1" },
            });
            fireEvent.click(screen.getByRole("button", { name: "Search" }));

            fireEvent.change(screen.getByLabelText("Venue type"), {
                target: { value: "Library" },
            });
            fireEvent.change(screen.getByRole("searchbox", { name: "Location" }), {
                target: { value: "123 Test Street" },
            });

            fireEvent.click(screen.getByRole("button", { name: "Clear query" }));

            expect(screen.getByRole("textbox", { name: "Search venues" }))
                .toHaveValue("");
            expect(screen.getByLabelText("Venue type")).toHaveValue("Library");
            expect(screen.getByRole("searchbox", { name: "Location" }))
                .toHaveValue("123 Test Street");

            fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));

            expect(screen.getByLabelText("Venue type")).toHaveValue("");
            expect(screen.getByRole("searchbox", { name: "Location" }))
                .toHaveValue("");
            expect(screen.getByText("Mock Venue Card: Test Venue 2"))
                .toBeInTheDocument();
        });

        it("shows a filtered empty state when no venues match", async () => {
            vi.mocked(getVenues).mockResolvedValue(venueListFixture);

            render(<VenuesPage />);

            expect(await screen.findByText("Mock Venue Card: Test Venue 1"))
                .toBeInTheDocument();

            fireEvent.change(screen.getByRole("textbox", {
                name: "Search venues",
            }), {
                target: { value: "no such venue" },
            });
            fireEvent.click(screen.getByRole("button", { name: "Search" }));

            expect(screen.getByText("No venues match your filters."))
                .toBeInTheDocument();
            expect(screen.getByRole("button", { name: "Clear query" }))
                .toBeEnabled();
        });
    });

    describe("Venues API failure and recovery", () => {
        it("shows a full-page error state when fetching venues fails", async () => {
            vi.mocked(getVenues).mockRejectedValue(
                new Error("Internal server error"),
            );

            render(<VenuesPage />);

            expect(await screen.findByRole("alert")).toBeInTheDocument();

            expect(
                screen.getByRole("heading", {
                    name: "We couldn't load the venues.",
                }),
            ).toBeInTheDocument();

            expect(
                screen.getByText("We couldn't retrieve the venues."),
            ).toBeInTheDocument();

            expect(
                screen.getByText("You can try the following:"),
            ).toBeInTheDocument();

            expect(screen.getAllByRole("listitem")).toHaveLength(3);

            expect(
                screen.getByText("Check your internet connection and try again."),
            ).toBeInTheDocument();

            expect(screen.getByText("Refresh the page.")).toBeInTheDocument();

            expect(
                screen.getByText("Wait a moment and try again."),
            ).toBeInTheDocument();

            expect(
                screen.getByRole("button", { name: "Try again" }),
            ).toBeInTheDocument();

            expect(screen.queryByText("Internal server error")).not.toBeInTheDocument();
            expect(screen.queryByText("Loading venues...")).not.toBeInTheDocument();
        });

        it("retries the venues request and restores venues after success", async () => {
            vi.mocked(getVenues)
                .mockRejectedValueOnce(new Error("Network unavailable"))
                .mockResolvedValueOnce(venueListFixture);

            render(<VenuesPage />);

            expect(await screen.findByText("We couldn't load the venues."))
                .toBeInTheDocument();

            fireEvent.click(screen.getByRole("button", {
                name: "Try again",
            }));

            expect(await screen.findByText("Mock Venue Card: Test Venue 1"))
                .toBeInTheDocument();
            expect(screen.getByText("Mock Venue Card: Test Venue 2"))
                .toBeInTheDocument();
            expect(screen.queryByRole("alert")).not.toBeInTheDocument();
            expect(getVenues).toHaveBeenCalledTimes(2);
        });

        it("keeps the error state visible when retrying also fails", async () => {
            vi.mocked(getVenues)
                .mockRejectedValueOnce(new Error("First failure"))
                .mockRejectedValueOnce(new Error("Second failure"));

            render(<VenuesPage />);

            expect(await screen.findByText("We couldn't load the venues."))
                .toBeInTheDocument();

            fireEvent.click(screen.getByRole("button", {
                name: "Try again",
            }));

            expect(await screen.findByText("We couldn't load the venues."))
                .toBeInTheDocument();
            expect(screen.getByRole("button", {
                name: "Try again",
            })).toBeInTheDocument();
            expect(getVenues).toHaveBeenCalledTimes(2);
        });
    });
});

