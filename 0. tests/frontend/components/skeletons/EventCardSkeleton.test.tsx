import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import EventCardSkeleton from "../../../../3. frontend/src/components/ui/skeletons/EventCardSkeleton";

describe("EventCardSkeleton", () => {
    describe("Rendering", () => {
        it("renders the event card placeholder layout", () => {
            const { container } = render(<EventCardSkeleton />);

            expect(container.querySelector(".event-card-skeleton"))
                .toBeInTheDocument();
            expect(
                container.querySelector(".event-card-skeleton__image"),
            ).toBeInTheDocument();
            expect(
                container.querySelector(".event-card-skeleton__header"),
            ).toBeInTheDocument();
            expect(
                container.querySelectorAll(".event-card-skeleton__row"),
            ).toHaveLength(5);
            expect(
                container.querySelector(".event-card-skeleton__action"),
            ).toBeInTheDocument();
        });
    });

    describe("Accessibility", () => {
        it("hides all decorative placeholders from assistive technology", () => {
            const { container } = render(<EventCardSkeleton />);

            container.querySelectorAll(".skeleton").forEach((element) => {
                expect(element).toHaveAttribute("aria-hidden", "true");
            });
        });
    });
});
