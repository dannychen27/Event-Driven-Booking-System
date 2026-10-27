import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";


import { existingBookingFixture } from "../fixtures/bookingFixtures";


import EventCard from "../../../3. frontend/src/components/EventCard";
import { createBooking, getBookingHistory } from "../../../3. frontend/src/api/bookings";
import { mockEvent } from "../../mocks/eventMocks";


vi.mock("../../../3. frontend/src/api/bookings", () => ({
    createBooking: vi.fn(),
    getBookingHistory: vi.fn(),
}));


vi.mock("../../../3. frontend/src/components/BookingForm.tsx", () => ({
    default: ({
        onBookingCreated,
    }: {
        onBookingCreated: () => void;
    }) => (
        <button onClick={onBookingCreated}>
            Mock Booking Form
        </button>
    ),
}));


describe("EventCard", () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders the event information", () => {
        render(<EventCard event={mockEvent} />);

        expect(
            screen.getByRole("heading", {
                name: "E2E Test Event",
            }),
        ).toBeInTheDocument();

        expect(
            screen.getByText("Capacity: 10"),
        ).toBeInTheDocument();

        expect(
            screen.getByRole("button", {
                name: "Create Booking",
            }),
        ).toBeInTheDocument();
    });

    it(
        "opens the booking form when the user has not already booked the event",
        async () => {
            vi.mocked(getBookingHistory).mockResolvedValue([]);

            const user = userEvent.setup();

            render(<EventCard event={mockEvent} />);

            await user.click(
                screen.getByRole("button", {
                    name: "Create Booking",
                }),
            );

            expect(
                await screen.findByRole("button", {
                    name: "Mock Booking Form",
                }),
            ).toBeInTheDocument();

            expect(
                getBookingHistory,
            ).toHaveBeenCalledWith(1);
        },
    );

    it("shows an error when the user has already booked the event", async () => {
        vi.mocked(getBookingHistory).mockResolvedValue([existingBookingFixture,]);

        const user = userEvent.setup();

        render(<EventCard event={mockEvent} />);

        await user.click(
            screen.getByRole("button", {
                name: "Create Booking",
            }),
        );

        expect(
            await screen.findByText(
                "You already booked this event.",
            ),
        ).toBeInTheDocument();

        expect(
            screen.queryByRole("button", {
                name: "Mock Booking Form",
            }),
        ).not.toBeInTheDocument();
    });

    it("shows an error when booking history fails to load", async () => {
        vi.mocked(getBookingHistory).mockRejectedValue(
            new Error("Failed to fetch booking history."),
        );

        const user = userEvent.setup();

        render(<EventCard event={mockEvent} />);

        await user.click(
            screen.getByRole("button", {
                name: "Create Booking",
            }),
        );

        expect(
            await screen.findByText("Failed to fetch booking history."),
        ).toBeInTheDocument();

        expect(
            screen.queryByRole("button", {
                name: "Mock Booking Form",
            }),
        ).not.toBeInTheDocument();
    });

    it("successfully submits a booking", async () => {
        vi.mocked(getBookingHistory).mockResolvedValue([]);
        vi.mocked(createBooking).mockResolvedValue(undefined);

        const user = userEvent.setup();

        render(<EventCard event={mockEvent} />);

        await user.click(
            screen.getByRole("button", {
                name: "Create Booking",
            }),
        );

        await user.click(
            screen.getByRole("button", {
                name: "Mock Booking Form",
            }),
        );

        expect(
            createBooking,
        ).toHaveBeenCalledWith(1, 1);

        expect(
            await screen.findByText(
                "Booking created successfully.",
            ),
        ).toBeInTheDocument();

        expect(
            screen.queryByRole("button", {
                name: "Mock Booking Form",
            }),
        ).not.toBeInTheDocument();
    });

    it("shows an error when booking creation fails", async () => {
        vi.mocked(getBookingHistory).mockResolvedValue([]);
        vi.mocked(createBooking).mockRejectedValue(
            new Error("Failed to create booking."),
        );

        const user = userEvent.setup();

        render(<EventCard event={mockEvent} />);

        await user.click(
            screen.getByRole("button", {
                name: "Create Booking",
            }),
        );

        await user.click(
            screen.getByRole("button", {
                name: "Mock Booking Form",
            }),
        );

        expect(
            await screen.findByText(
                "Failed to create booking.",
            ),
        ).toBeInTheDocument();

        expect(
            screen.queryByText("You already booked this event."),
        ).not.toBeInTheDocument();

        expect(
            screen.getByRole("button", {
                name: "Mock Booking Form",
            }),
        ).toBeInTheDocument();
    });

    it("allows the user to retry after booking creation fails", async () => {
        vi.mocked(getBookingHistory).mockResolvedValue([]);
        vi.mocked(createBooking)
            .mockRejectedValueOnce(new Error("Temporary booking failure."))
            .mockResolvedValueOnce(undefined);

        const user = userEvent.setup();

        render(<EventCard event={mockEvent} />);

        await user.click(
            screen.getByRole("button", {
                name: "Create Booking",
            }),
        );

        const bookingForm = await screen.findByRole("button", {
            name: "Mock Booking Form",
        });

        await user.click(bookingForm);

        expect(
            await screen.findByText("Temporary booking failure."),
        ).toBeInTheDocument();

        expect(
            screen.getByRole("button", {
                name: "Mock Booking Form",
            }),
        ).toBeInTheDocument();

        await user.click(
            screen.getByRole("button", {
                name: "Mock Booking Form",
            }),
        );

        expect(createBooking).toHaveBeenCalledTimes(2);

        expect(
            await screen.findByText("Booking created successfully."),
        ).toBeInTheDocument();

        expect(
            screen.queryByRole("button", {
                name: "Mock Booking Form",
            }),
        ).not.toBeInTheDocument();
    });
});

