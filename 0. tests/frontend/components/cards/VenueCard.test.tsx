import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";


import VenueCard from "../../../../3. frontend/src/components/cards/VenueCard";
import { venueCardFixture } from "../../fixtures/venues/venueFixtures";


describe("VenueCard", () => {
    describe("venue information", () => {
        it("renders the venue name and address", () => {
            render(<VenueCard venue={venueCardFixture} />);

            expect(
                screen.getByRole("heading", {
                    name: "E2E Test Venue",
                }),
            ).toBeInTheDocument();

            expect(screen.getByText("Location")).toBeInTheDocument();
            expect(screen.getByText("123 Test Street")).toBeInTheDocument();
        });

        it("shows readable fallbacks when venue details are blank", () => {
            render(
                <VenueCard
                    venue={{
                        ...venueCardFixture,
                        name: "   ",
                        address: "   ",
                    }}
                />,
            );

            expect(
                screen.getByRole("heading", {
                    name: "Venue details unavailable",
                }),
            ).toBeInTheDocument();

            expect(screen.getByText("Address to be announced")).toBeInTheDocument();
        });
    });
});
