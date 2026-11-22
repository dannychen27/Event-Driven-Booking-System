import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ErrorState from "../../../../3. frontend/src/components/ui/ErrorState";

describe("ErrorState", () => {
    describe("Rendering", () => {
        it("renders its title, description, and default illustration", () => {
            render(
                <ErrorState
                    title="Couldn't load events"
                    description="Please try again in a moment."
                />
            );

            expect(
                screen.getByRole("heading", {
                    name: "Couldn't load events",
                })
            ).toBeInTheDocument();

            expect(
                screen.getByText("Please try again in a moment.")
            ).toBeInTheDocument();

            expect(screen.getByRole("alert")).toBeInTheDocument();

            expect(
                document.querySelector(".error-state__svg")
            ).toBeInTheDocument();
        });

        it("renders a supplied illustration instead of the default", () => {
            render(
                <ErrorState
                    title="Something went wrong"
                    description="Please try again."
                    illustration={<span>Custom illustration</span>}
                />
            );

            expect(
                screen.getByText("Custom illustration")
            ).toBeInTheDocument();

            expect(
                document.querySelector(".error-state__svg")
            ).not.toBeInTheDocument();
        });

        it("does not render a retry button when no retry handler is supplied", () => {
            render(
                <ErrorState
                    title="Couldn't load events"
                    description="Please try again later."
                />
            );

            expect(
                screen.queryByRole("button")
            ).not.toBeInTheDocument();
        });
    });

    describe("Retry behavior", () => {
        it("calls the retry handler when the retry button is clicked", async () => {
            const onRetry = vi.fn();
            const user = userEvent.setup();

            render(
                <ErrorState
                    title="Couldn't load events"
                    description="Please try again."
                    onRetry={onRetry}
                />
            );

            await user.click(
                screen.getByRole("button", {
                    name: "Try again",
                })
            );

            expect(onRetry).toHaveBeenCalledOnce();
        });

        it("supports a custom retry label", () => {
            render(
                <ErrorState
                    title="Couldn't load events"
                    description="Please try again."
                    onRetry={vi.fn()}
                    retryLabel="Retry loading events"
                />
            );

            expect(
                screen.getByRole("button", {
                    name: "Retry loading events",
                })
            ).toBeInTheDocument();
        });
    });

    describe("Variants", () => {
        it("supports the professional variant", () => {
            render(
                <ErrorState
                    title="Service unavailable"
                    description="Please try again later."
                    variant="professional"
                />
            );

            expect(
                document.querySelector(".error-state--professional")
            ).toBeInTheDocument();
        });
    });

    describe("Accessibility", () => {
        it("associates the alert with its title and description", () => {
            render(
                <ErrorState
                    title="Couldn't load events"
                    description="Please try again."
                />
            );

            const alert = screen.getByRole("alert");
            const titleId = alert.getAttribute("aria-labelledby");
            const descriptionId = alert.getAttribute("aria-describedby");

            expect(titleId).toBeTruthy();
            expect(descriptionId).toBeTruthy();

            expect(
                alert.querySelector(`#${titleId}`)
            ).toHaveTextContent("Couldn't load events");

            expect(
                alert.querySelector(`#${descriptionId}`)
            ).toHaveTextContent("Please try again.");
        });

        it("uses unique accessible references when multiple error states are rendered", () => {
            render(
                <>
                    <ErrorState
                        title="First error"
                        description="First description."
                    />
                    <ErrorState
                        title="Second error"
                        description="Second description."
                    />
                </>
            );

            const alerts = screen.getAllByRole("alert");

            expect(alerts).toHaveLength(2);

            const titleIds = alerts.map((alert) =>
                alert.getAttribute("aria-labelledby")
            );

            const descriptionIds = alerts.map((alert) =>
                alert.getAttribute("aria-describedby")
            );

            expect(new Set(titleIds).size).toBe(2);
            expect(new Set(descriptionIds).size).toBe(2);

            alerts.forEach((alert) => {
                const titleId = alert.getAttribute("aria-labelledby");
                const descriptionId = alert.getAttribute("aria-describedby");

                expect(
                    alert.querySelector(`#${titleId}`)
                ).toBeInTheDocument();

                expect(
                    alert.querySelector(`#${descriptionId}`)
                ).toBeInTheDocument();
            });
        });
    });
});
