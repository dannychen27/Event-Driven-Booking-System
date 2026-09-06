import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";


import { Modal } from "../../../3. frontend/src/components/Modal";


describe("Modal", () => {

    it("renders its content and actions", () => {
        render(
            <Modal
                actions={[
                    {
                        label: "Confirm",
                        onClick: () => {},
                    },
                ]}
            >
                <h2>Test Modal</h2>
                <p>Test message.</p>
            </Modal>,
        );

        expect(
            screen.getByRole("heading", {
                name: "Test Modal",
            }),
        ).toBeInTheDocument();

        expect(
            screen.getByText("Test message."),
        ).toBeInTheDocument();

        expect(
            screen.getByRole("button", {
                name: "Confirm",
            }),
        ).toBeInTheDocument();
    });

    it("calls an action handler when the action button is clicked", async () => {
        const onClick = vi.fn();
        const user = userEvent.setup();

        render(
            <Modal
                actions={[
                    {
                        label: "Confirm",
                        onClick,
                    },
                ]}
            >
                <h2>Test Modal</h2>
            </Modal>,
        );

        await user.click(
            screen.getByRole("button", {
                name: "Confirm",
            }),
        );

        expect(onClick).toHaveBeenCalled();
    });
});

