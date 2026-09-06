import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";


import { renderBookingForm } from "../../mocks/bookingFormMocks";


describe("BookingForm", () => {

    it("renders the booking form", () => {
        renderBookingForm();

        expect(
            screen.getByRole("heading", {
                name: "Book This Event",
            }),
        ).toBeInTheDocument();

        expect(screen.getByLabelText("Name")).toBeInTheDocument();
        expect(screen.getByLabelText("Number of Guests")).toBeInTheDocument();

        expect(
            screen.getByRole("button", {
                name: "Cancel",
            }),
        ).toBeInTheDocument();

        expect(
            screen.getByRole("button", {
                name: "Book Event",
            }),
        ).toBeInTheDocument();
    });

    it("shows an error when the name is empty", async () => {
        const onBookingCreated = vi.fn();
        const user = userEvent.setup();

        renderBookingForm({ onBookingCreated });

        await user.click(
            screen.getByRole("button", {
                name: "Book Event",
            }),
        );

        expect(screen.getByText("Name is required")).toBeInTheDocument();

        expect(onBookingCreated).not.toHaveBeenCalled();
    });

    it("shows an error when the number of guests is less than 1", async () => {
        const onBookingCreated = vi.fn();
        const user = userEvent.setup();

        renderBookingForm({ onBookingCreated });

        const guestsInput = screen.getByLabelText("Number of Guests");

        await user.clear(guestsInput);
        await user.type(guestsInput, "0");

        await user.click(
            screen.getByRole("button", {
                name: "Book Event",
            }),
        );

        expect(screen.getByText("Number of guests must be at least 1"))
            .toBeInTheDocument();

        expect(onBookingCreated).not.toHaveBeenCalled();
    });

    it("submits the booking when the form is valid", async () => {
        const onBookingCreated = vi.fn();
        const user = userEvent.setup();

        renderBookingForm({
            onBookingCreated,
        });

        await user.type(
            screen.getByLabelText("Name"),
            "Test User",
        );

        await user.click(
            screen.getByRole("button", {
                name: "Book Event",
            }),
        );

        expect(onBookingCreated).toHaveBeenCalled();

        expect(screen.getByText("Booking submitted successfully!"))
            .toBeInTheDocument();
    });

    it("calls onCancel when the user cancels the form", async () => {
        const onCancel = vi.fn();
        const user = userEvent.setup();

        renderBookingForm({ onCancel });

        await user.click(
            screen.getByRole("button", {
                name: "Cancel",
            }),
        );

        expect(onCancel).toHaveBeenCalled();
    });
});

