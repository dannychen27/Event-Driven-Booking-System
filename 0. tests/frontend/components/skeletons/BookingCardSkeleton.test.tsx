import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import BookingCardSkeleton from "../../../../3. frontend/src/components/ui/skeletons/BookingCardSkeleton";

describe("BookingCardSkeleton", () => {
    describe("Rendering", () => {
        it("renders the booking details, image, and action placeholders", () => {
            const { container } = render(<BookingCardSkeleton />);

            expect(container.querySelector(".booking-card-skeleton"))
                .toBeInTheDocument();
            expect(
                container.querySelector(".booking-card__layout"),
            ).toBeInTheDocument();
            expect(
                container.querySelector(".booking-card-skeleton__image"),
            ).toBeInTheDocument();
            expect(
                container.querySelectorAll(".booking-card-skeleton__row"),
            ).toHaveLength(4);
            expect(
                container.querySelector(".booking-card__actions .skeleton"),
            ).toBeInTheDocument();
        });
    });

    describe("Accessibility", () => {
        it("hides decorative placeholders from assistive technology", () => {
            const { container } = render(<BookingCardSkeleton />);

            container.querySelectorAll(".skeleton").forEach((element) => {
                expect(element).toHaveAttribute("aria-hidden", "true");
            });
        });
    });
});
