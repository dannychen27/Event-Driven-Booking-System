import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";
import {
    fireEvent,
    render,
    screen,
    within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import EventCard from "../../../../3. frontend/src/components/cards/EventCard";
import VenueCard from "../../../../3. frontend/src/components/cards/VenueCard";
import { eventCardFixture } from "../../fixtures/events/eventFixtures";
import { venueCardFixture } from "../../fixtures/venues/venueFixtures";

const originalShowModal = Object.getOwnPropertyDescriptor(
    HTMLDialogElement.prototype,
    "showModal",
);
const originalClose = Object.getOwnPropertyDescriptor(
    HTMLDialogElement.prototype,
    "close",
);

beforeEach(() => {
    Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
        configurable: true,
        value: function (this: HTMLDialogElement) {
            this.setAttribute("open", "");
        },
    });

    Object.defineProperty(HTMLDialogElement.prototype, "close", {
        configurable: true,
        value: function (this: HTMLDialogElement) {
            this.removeAttribute("open");
        },
    });
});

afterEach(() => {
    if (originalShowModal) {
        Object.defineProperty(
            HTMLDialogElement.prototype,
            "showModal",
            originalShowModal,
        );
    } else {
        Reflect.deleteProperty(HTMLDialogElement.prototype, "showModal");
    }

    if (originalClose) {
        Object.defineProperty(
            HTMLDialogElement.prototype,
            "close",
            originalClose,
        );
    } else {
        Reflect.deleteProperty(HTMLDialogElement.prototype, "close");
    }
});

describe("Card image lightboxes", () => {
    describe("EventCard", () => {
        it("opens the enlarged event image and closes it with the close button", async () => {
            const user = userEvent.setup();

            render(
                <EventCard
                    event={{
                        ...eventCardFixture,
                        image_url: "https://example.com/event.jpg",
                    }}
                    isBooked={false}
                    bookingHistoryStatus="ready"
                    onBookingCreated={vi.fn()}
                />,
            );

            await user.click(
                screen.getByRole("button", {
                    name: "Enlarge E2E Test Event image",
                }),
            );

            const dialog = screen.getByRole("dialog", {
                name: "E2E Test Event — enlarged image",
            });

            expect(dialog).toHaveAttribute("open");
            expect(
                within(dialog).getByRole("img", { name: "E2E Test Event" }),
            ).toHaveAttribute("src", "https://example.com/event.jpg");

            await user.click(
                within(dialog).getByRole("button", {
                    name: "Close image viewer",
                }),
            );

            expect(dialog).not.toHaveAttribute("open");
        });

        it("closes the event image viewer when Escape triggers the dialog cancel event", async () => {
            const user = userEvent.setup();

            render(
                <EventCard
                    event={{
                        ...eventCardFixture,
                        image_url: "https://example.com/event.jpg",
                    }}
                    isBooked={false}
                    bookingHistoryStatus="ready"
                    onBookingCreated={vi.fn()}
                />,
            );

            await user.click(
                screen.getByRole("button", {
                    name: "Enlarge E2E Test Event image",
                }),
            );

            const dialog = screen.getByRole("dialog", {
                name: "E2E Test Event — enlarged image",
            });

            fireEvent(dialog, new Event("cancel", { cancelable: true }));

            expect(dialog).not.toHaveAttribute("open");
        });

        it("closes the event image viewer when the backdrop is clicked", async () => {
            const user = userEvent.setup();

            render(
                <EventCard
                    event={{
                        ...eventCardFixture,
                        image_url: "https://example.com/event.jpg",
                    }}
                    isBooked={false}
                    bookingHistoryStatus="ready"
                    onBookingCreated={vi.fn()}
                />,
            );

            await user.click(
                screen.getByRole("button", {
                    name: "Enlarge E2E Test Event image",
                }),
            );

            const dialog = screen.getByRole("dialog", {
                name: "E2E Test Event — enlarged image",
            });

            fireEvent.click(dialog);

            expect(dialog).not.toHaveAttribute("open");
        });

        it("does not make the fallback image interactive when the event image is missing", () => {
            render(
                <EventCard
                    event={{ ...eventCardFixture, image_url: null }}
                    isBooked={false}
                    bookingHistoryStatus="ready"
                    onBookingCreated={vi.fn()}
                />,
            );

            expect(
                screen.getByRole("img", {
                    name: "E2E Test Event image unavailable",
                }),
            ).toBeInTheDocument();

            expect(
                screen.queryByRole("button", {
                    name: "Enlarge E2E Test Event image",
                }),
            ).not.toBeInTheDocument();

            expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        });
    });

    describe("VenueCard", () => {
        it("opens the enlarged venue image", async () => {
            const user = userEvent.setup();
            render(<VenueCard venue={venueCardFixture} />);

            await user.click(
                screen.getByRole("button", {
                    name: "Enlarge E2E Test Venue image",
                }),
            );

            const dialog = screen.getByRole("dialog", {
                name: "E2E Test Venue — enlarged image",
            });

            expect(dialog).toHaveAttribute("open");
            expect(
                within(dialog).getByRole("img", { name: "E2E Test Venue" }),
            ).toHaveAttribute("src", venueCardFixture.image_url);
        });

        it("does not make the fallback image interactive when the venue image is missing", () => {
            render(
                <VenueCard
                    venue={{ ...venueCardFixture, image_url: null }}
                />,
            );

            expect(
                screen.getByRole("img", {
                    name: "E2E Test Venue image unavailable",
                }),
            ).toBeInTheDocument();

            expect(
                screen.queryByRole("button", {
                    name: "Enlarge E2E Test Venue image",
                }),
            ).not.toBeInTheDocument();

            expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        });
    });
});
