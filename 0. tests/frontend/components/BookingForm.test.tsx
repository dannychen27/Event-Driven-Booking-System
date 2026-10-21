import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";


import { renderBookingForm } from "../../mocks/bookingFormMocks";


describe("BookingForm", () => {
    it("renders the booking confirmation form", () => {
        renderBookingForm();

        expect(
            screen.getByRole("heading", {
                name: "Book This Event",
            }),
        ).toBeInTheDocument();

        expect(
            screen.getByText("Are you sure you want to book this event?"),
        ).toBeInTheDocument();

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

    it("does not render name or guest inputs", () => {
        renderBookingForm();

        expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();
        expect(
            screen.queryByLabelText("Number of Guests"),
        ).not.toBeInTheDocument();
    });

    it("calls onBookingCreated when the user confirms the booking", async () => {
        const onBookingCreated = vi.fn();
        const user = userEvent.setup();

        renderBookingForm({ onBookingCreated });

        await user.click(
            screen.getByRole("button", {
                name: "Book Event",
            }),
        );

        expect(onBookingCreated).toHaveBeenCalledOnce();
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

        expect(onCancel).toHaveBeenCalledOnce();
    });

    it("does not submit when the user cancels", async () => {
        const onBookingCreated = vi.fn();
        const onCancel = vi.fn();
        const user = userEvent.setup();

        renderBookingForm({ onBookingCreated, onCancel });

        await user.click(
            screen.getByRole("button", {
                name: "Cancel",
            }),
        );

        expect(onCancel).toHaveBeenCalledOnce();
        expect(onBookingCreated).not.toHaveBeenCalled();
    });
});
