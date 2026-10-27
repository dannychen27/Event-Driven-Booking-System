import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";


import VenueCard from "../../../3. frontend/src/components/VenueCard";
import { venueCardFixture } from "../fixtures/venueFixtures";


describe("VenueCard", () => {
    it("renders the venue information", () => {
        render(<VenueCard venue={venueCardFixture} />);

        expect(
            screen.getByRole("heading", {
                name: "E2E Test Venue",
            }),
        ).toBeInTheDocument();

        expect(
            screen.getByText("Address: 123 Test Street"),
        ).toBeInTheDocument();
    });
});

