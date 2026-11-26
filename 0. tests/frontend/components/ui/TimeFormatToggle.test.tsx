import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import TimeFormatToggle from "../../../../3. frontend/src/components/ui/TimeFormatToggle";
import { TimeFormatProvider } from "../../../../3. frontend/src/contexts/TimeFormatContext";


describe("TimeFormatToggle", () => {
    it("synchronizes the selected format across shared consumers", () => {
        render(
            <TimeFormatProvider>
                <div aria-label="Events">
                    <TimeFormatToggle />
                </div>
                <div aria-label="Bookings">
                    <TimeFormatToggle />
                </div>
            </TimeFormatProvider>,
        );

        const eventsToggle = within(screen.getByLabelText("Events"));
        const bookingsToggle = within(screen.getByLabelText("Bookings"));

        expect(eventsToggle.getByRole("button", { name: "12h" }))
            .toHaveAttribute("aria-pressed", "true");
        expect(bookingsToggle.getByRole("button", { name: "12h" }))
            .toHaveAttribute("aria-pressed", "true");

        fireEvent.click(eventsToggle.getByRole("button", { name: "24h" }));

        expect(eventsToggle.getByRole("button", { name: "24h" }))
            .toHaveAttribute("aria-pressed", "true");
        expect(bookingsToggle.getByRole("button", { name: "24h" }))
            .toHaveAttribute("aria-pressed", "true");
        expect(eventsToggle.getByRole("button", { name: "12h" }))
            .toHaveAttribute("aria-pressed", "false");
        expect(bookingsToggle.getByRole("button", { name: "12h" }))
            .toHaveAttribute("aria-pressed", "false");
    });
});
