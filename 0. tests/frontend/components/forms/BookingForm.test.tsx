import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";


import { renderBookingForm } from "../../helpers/bookingFormTestHelpers";


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

    it("disables booking controls while the booking request is pending", async () => {
        let resolveRequest!: () => void;
        const request = new Promise<void>((resolve) => {
            resolveRequest = resolve;
        });

        const onBookingCreated = vi.fn(() => request);
        const user = userEvent.setup();

        renderBookingForm({ onBookingCreated });

        const bookButton = screen.getByRole("button", {
            name: "Book Event",
        });
        const cancelButton = screen.getByRole("button", {
            name: "Cancel",
        });

        await user.click(bookButton);

        // Verify the pending state.
        expect(onBookingCreated).toHaveBeenCalledOnce();
        expect(bookButton).toHaveTextContent("Booking...");
        expect(bookButton).toBeDisabled();
        expect(cancelButton).toBeDisabled();

        // Verify another click cannot trigger a duplicate booking.
        await user.click(bookButton);
        expect(onBookingCreated).toHaveBeenCalledOnce();

        // Resolve the request and verify the controls become available again.
        resolveRequest();

        await waitFor(() => {
            expect(bookButton).toHaveTextContent("Book Event");
            expect(bookButton).toBeEnabled();
            expect(cancelButton).toBeEnabled();
        });
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
