import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import VenueCardSkeleton from "../../../../3. frontend/src/components/ui/skeletons/VenueCardSkeleton";

describe("VenueCardSkeleton", () => {
    describe("Rendering", () => {
        it("renders placeholders matching the primary venue card layout", () => {
            const { container } = render(<VenueCardSkeleton />);

            expect(
                container.querySelector(".venue-card-skeleton"),
            ).toBeInTheDocument();

            expect(
                container.querySelector(".venue-card__image"),
            ).toBeInTheDocument();

            expect(
                container.querySelector(".venue-card-skeleton__content"),
            ).toBeInTheDocument();

            expect(
                container.querySelector(".venue-card-skeleton__address"),
            ).toBeInTheDocument();

            expect(
                container.querySelector(".venue-card-skeleton__amenities"),
            ).not.toBeInTheDocument();

            expect(container.querySelectorAll(".skeleton")).toHaveLength(7);
        });
    });

    describe("Accessibility", () => {
        it("hides decorative placeholders from assistive technology", () => {
            const { container } = render(<VenueCardSkeleton />);

            container.querySelectorAll(".skeleton").forEach((element) => {
                expect(element).toHaveAttribute("aria-hidden", "true");
            });
        });
    });
});
