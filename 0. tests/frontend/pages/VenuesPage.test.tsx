import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";


import VenuesPage from "../../../3. frontend/src/pages/VenuesPage";
import { getVenues } from "../../../3. frontend/src/api/venues";
import type { Venue } from "../../../3. frontend/src/types/Venue.ts";


vi.mock("../../../3. frontend/src/api/venues.ts", () => ({
    getVenues: vi.fn(),
}));


vi.mock("../../../3. frontend/src/components/VenueCard.tsx", () => ({
    default: ({ venue }: { venue: Venue }) => (
        <div>Mock Venue Card: {venue.name}</div>
    ),
}));


describe("VenuesPage", () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("shows the loading state while venues are being fetched", () => {
        vi.mocked(getVenues).mockReturnValue(new Promise(() => {}));

        render(<VenuesPage />);

        expect(screen.getByText("Loading venues...")).toBeInTheDocument();
    });

    it("renders venues after they are successfully fetched", async () => {
        vi.mocked(getVenues).mockResolvedValue([
            {
                id: 1,
                name: "Test Venue 1",
                address: "123 Test Street",
            },
            {
                id: 2,
                name: "Test Venue 2",
                address: "456 Test Avenue",
            },
        ]);

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

    it("shows an error when fetching venues fails", async () => {
        vi.mocked(getVenues).mockRejectedValue(
            new Error("Failed to load venues")
        );

        render(<VenuesPage />);

        expect(await screen.findByText("Failed to load venues"))
            .toBeInTheDocument();

        expect(screen.queryByText("Loading venues..."))
            .not.toBeInTheDocument();
    });
});

