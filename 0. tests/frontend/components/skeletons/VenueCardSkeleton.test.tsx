import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import VenueCardSkeleton from "../../../../3. frontend/src/components/ui/skeletons/VenueCardSkeleton";

describe("VenueCardSkeleton", () => {
    describe("Rendering", () => {
        it("renders the compact venue card placeholder layout", () => {
            const { container } = render(<VenueCardSkeleton />);

            expect(container.querySelector(".venue-card-skeleton"))
                .toBeInTheDocument();
            expect(
                container.querySelector(".venue-card-skeleton__address"),
            ).toBeInTheDocument();
            expect(container.querySelectorAll(".skeleton"))
                .toHaveLength(3);
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
