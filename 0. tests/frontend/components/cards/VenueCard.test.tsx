import { render as rtlRender, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";


import VenueCard from "../../../../3. frontend/src/components/cards/VenueCard";
import { TimeFormatProvider, useTimeFormat } from "../../../../3. frontend/src/contexts/TimeFormatContext";
import TimeFormatToggle from "../../../../3. frontend/src/components/ui/TimeFormatToggle";

function render(ui: React.ReactNode) {
    return rtlRender(<MemoryRouter>{ui}</MemoryRouter>);
}

function CurrentTimeFormat() {
    const { timeFormat } = useTimeFormat();
    return <output>{timeFormat}</output>;
}
import { venueCardFixture } from "../../fixtures/venues/venueFixtures";
import { getVenueTypeColorClass } from "../../../../3. frontend/src/helpers/venues/venueTypeColor";


describe("VenueCard", () => {
    describe("venue information", () => {
        it("renders the venue name, image, description, and location in the intended order", () => {
            const { container } = render(
                <VenueCard venue={venueCardFixture} />,
            );

            expect(
                screen.getByRole("heading", { name: "E2E Test Venue" }),
            ).toBeInTheDocument();

            expect(
                screen.getByRole("img", { name: "E2E Test Venue" }),
            ).toHaveAttribute("src", "https://example.com/venue.jpg");

            expect(
                screen.getByText(
                    "A welcoming space for community events and workshops.",
                ),
            ).toBeInTheDocument();

            expect(screen.getByText("Community space")).toBeInTheDocument();
            expect(screen.getByText("Location")).toBeInTheDocument();
            expect(screen.getByText("123 Test Street")).toBeInTheDocument();

            const content = container.querySelector(
                ".venue-card__content",
            );
            expect(content).not.toBeNull();

            expect(
                Array.from(content!.children).map(
                    (element) =>
                        element.classList.contains("venue-card__type")
                            ? "venue-card__type"
                            : element.className || element.tagName.toLowerCase(),
                ),
            ).toEqual([
                "h2",
                "venue-card__type",
                "venue-card__description",
                "venue-card__address",
                "venue-card__events-link",
            ]);
        });

        it("trims optional venue type and description before rendering", () => {
            render(
                <VenueCard
                    venue={{
                        ...venueCardFixture,
                        venue_type: "  Community space  ",
                        description: "  A welcoming venue.  ",
                    }}
                />,
            );

            const categoryLabel = screen.getByText("Community space");
            expect(categoryLabel).toBeInTheDocument();
            expect(categoryLabel).toHaveClass(
                getVenueTypeColorClass("Community space"),
            );
            expect(screen.getByText("A welcoming venue.")).toBeInTheDocument();
        });

        it("does not include secondary amenities, accessibility, or transit metadata in the primary card", () => {
            render(<VenueCard venue={venueCardFixture} />);

            expect(screen.queryByText("Wi-Fi")).not.toBeInTheDocument();
            expect(
                screen.queryByText("Step-free entrance"),
            ).not.toBeInTheDocument();
            expect(
                screen.queryByText(/A short walk from the test station/),
            ).not.toBeInTheDocument();
        });

        it("shows an accessible fallback when the venue image is missing", () => {
            render(
                <VenueCard
                    venue={{
                        ...venueCardFixture,
                        image_url: null,
                    }}
                />,
            );

            expect(
                screen.getByRole("img", {
                    name: "E2E Test Venue image unavailable",
                }),
            ).toBeInTheDocument();

            expect(screen.getByText("No image available")).toBeInTheDocument();
        });

        it("omits optional type and description when venue details are unavailable", () => {
            render(
                <VenueCard
                    venue={{
                        ...venueCardFixture,
                        description: null,
                        venue_type: null,
                        amenities: [],
                        accessibility_features: [],
                        transit_info: null,
                    }}
                />,
            );

            expect(
                screen.queryByText(
                    "A welcoming space for community events and workshops.",
                ),
            ).not.toBeInTheDocument();

            expect(screen.queryByText("Community space")).not.toBeInTheDocument();
            expect(screen.getByText("Location")).toBeInTheDocument();
        });

        it("shows readable fallbacks when the venue name and address are blank", () => {
            render(
                <VenueCard
                    venue={{
                        ...venueCardFixture,
                        name: "   ",
                        address: "   ",
                    }}
                />,
            );

            expect(
                screen.getByRole("heading", {
                    name: "Venue details unavailable",
                }),
            ).toBeInTheDocument();

            expect(screen.getByText("Address to be announced")).toBeInTheDocument();
        });
    });

    describe("venue navigation", () => {
        it("renders an accessible link to view events at the venue", () => {
            render(<VenueCard venue={venueCardFixture} />);

            expect(
                screen.getByRole("link", {
                    name: "View events at this venue",
                }),
            ).toBeInTheDocument();
        });

        it("links to the Events page with the venue ID in the query string", () => {
            render(<VenueCard venue={venueCardFixture} />);

            expect(
                screen.getByRole("link", {
                    name: "View events at this venue",
                }),
            ).toHaveAttribute("href", `/events?venueId=${venueCardFixture.id}`);
        });

        it("uses client-side navigation to preserve app-wide time format state", () => {
            rtlRender(
                <TimeFormatProvider>
                    <MemoryRouter initialEntries={["/venues"]}>
                        <Routes>
                            <Route
                                path="/venues"
                                element={
                                    <>
                                        <VenueCard venue={venueCardFixture} />
                                        <TimeFormatToggle />
                                    </>
                                }
                            />
                            <Route
                                path="/events"
                                element={<CurrentTimeFormat />}
                            />
                        </Routes>
                    </MemoryRouter>
                </TimeFormatProvider>,
            );

            fireEvent.click(screen.getByRole("button", { name: "24h" }));

            expect(
                screen.getByRole("button", { name: "24h" }),
            ).toHaveAttribute("aria-pressed", "true");

            fireEvent.click(
                screen.getByRole("link", {
                    name: "View events at this venue",
                }),
            );

            expect(screen.getByText("24h")).toBeInTheDocument();
        });
    });
});
