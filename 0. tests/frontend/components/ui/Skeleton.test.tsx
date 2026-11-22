import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Skeleton from "../../../../3. frontend/src/components/ui/Skeleton";

describe("Skeleton", () => {
    describe("Rendering", () => {
        it("renders a rectangular skeleton by default", () => {
            const { container } = render(<Skeleton />);

            expect(container.firstChild).toHaveClass(
                "skeleton",
                "skeleton--rectangular",
            );
        });

        it("supports the text variant", () => {
            const { container } = render(
                <Skeleton variant="text" />,
            );

            expect(container.firstChild).toHaveClass("skeleton--text");
        });

        it("supports the circular variant", () => {
            const { container } = render(
                <Skeleton variant="circular" />,
            );

            expect(container.firstChild).toHaveClass(
                "skeleton--circular",
            );
        });
    });

    describe("Dimensions and customization", () => {
        it("applies configurable dimensions", () => {
            const { container } = render(
                <Skeleton width="75%" height="2rem" />,
            );

            expect(container.firstChild).toHaveStyle({
                width: "75%",
                height: "32px",
            });
        });

        it("applies an additional class name", () => {
            const { container } = render(
                <Skeleton className="event-skeleton__title" />,
            );

            expect(container.firstChild).toHaveClass(
                "event-skeleton__title",
            );
        });
    });

    describe("Accessibility", () => {
        it("hides the decorative placeholder from assistive technology", () => {
            const { container } = render(<Skeleton />);

            expect(container.firstChild).toHaveAttribute(
                "aria-hidden",
                "true",
            );
        });
    });
});
