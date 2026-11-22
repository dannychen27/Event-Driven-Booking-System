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

            render(<VenuesPage />);

            expect(screen.getByText("Loading venues...")).toBeInTheDocument();
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

