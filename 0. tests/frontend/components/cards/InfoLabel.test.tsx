import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InfoLabel } from "../../../../3. frontend/src/components/cards/InfoLabel";

describe("InfoLabel", () => {
    it("renders the label and string value", () => {
        render(<InfoLabel label="Venue" value="Main Hall" />);

        expect(screen.getByText("Venue: Main Hall")).toBeInTheDocument();
    });

    it("renders a numeric value", () => {
        render(<InfoLabel label="Capacity" value={250} />);

        expect(screen.getByText("Capacity: 250")).toBeInTheDocument();
    });

    it("renders a React element as its value", () => {
        render(
            <InfoLabel
                label="Status"
                value={<strong>Confirmed</strong>}
            />
        );

        expect(screen.getByText("Status:")).toBeInTheDocument();
        expect(screen.getByText("Confirmed").tagName).toBe("STRONG");
    });
});
