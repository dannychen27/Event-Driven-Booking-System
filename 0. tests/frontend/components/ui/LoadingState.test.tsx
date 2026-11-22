import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import LoadingState from "../../../../3. frontend/src/components/ui/LoadingState";

describe("LoadingState", () => {
    describe("Rendering", () => {
        it("renders the loading message", () => {
            render(<LoadingState message="Loading events..." />);

            expect(screen.getByRole("status")).toBeInTheDocument();
            expect(screen.getByText("Loading events..."))
                .toBeInTheDocument();
        });

        it("renders an optional description", () => {
            render(
                <LoadingState
                    message="Loading events..."
                    description="Please wait while we retrieve the latest events."
                />,
            );

            expect(
                screen.getByText(
                    "Please wait while we retrieve the latest events.",
                ),
            ).toBeInTheDocument();
        });

        it("does not render a description when one is omitted", () => {
            const { container } = render(
                <LoadingState message="Loading venues..." />,
            );

            expect(
                container.querySelector(".loading-state__description"),
            ).not.toBeInTheDocument();
        });
    });

    describe("Accessibility", () => {
        it("exposes the loading status to assistive technology", () => {
            render(<LoadingState message="Loading venues..." />);

            expect(screen.getByRole("status"))
                .toHaveAttribute("aria-live", "polite");
            expect(screen.getByRole("status"))
                .toHaveAttribute("aria-busy", "true");
        });

        it("hides the decorative spinner from assistive technology", () => {
            const { container } = render(
                <LoadingState message="Loading bookings..." />,
            );

            expect(
                container.querySelector(".loading-state__spinner"),
            ).toHaveAttribute("aria-hidden", "true");
        });
    });

    describe("Styling", () => {
        it("applies the supplied class name", () => {
            const { container } = render(
                <LoadingState
                    message="Loading events..."
                    className="loading-state--page"
                />,
            );

            expect(container.querySelector(".loading-state"))
                .toHaveClass("loading-state--page");
        });
    });
});
