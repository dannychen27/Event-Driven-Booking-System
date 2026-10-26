import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";


import { Modal } from "../../../3. frontend/src/components/Modal";


describe("Modal", () => {

    it("renders its body and actions", () => {
        render(
            <Modal
                body={
                    <>
                        <h2>Test Modal</h2>
                        <p>Test message.</p>
                    </>
                }
                actions={[
                    {
                        label: "Confirm",
                        onClick: () => {},
                    },
                ]}
            />,
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

        expect(
            document.querySelector(".modal-body"),
        ).toContainElement(
            screen.getByRole("heading", {
                name: "Test Modal",
            }),
        );

        expect(
            document.querySelector(".modal-actions"),
        ).toBeInTheDocument();
    });

    it("calls an action handler when the action button is clicked", async () => {
        const onClick = vi.fn();
        const user = userEvent.setup();

        render(
            <Modal
                body={<h2>Test Modal</h2>}
                actions={[
                    {
                        label: "Confirm",
                        onClick,
                    },
                ]}
            />,
        );

        await user.click(
            screen.getByRole("button", {
                name: "Confirm",
            }),
        );

        expect(onClick).toHaveBeenCalledOnce();
    });

    it("does not render an empty actions container when no actions are supplied", () => {
        render(
            <Modal
                body={
                    <>
                        <h2>Test Modal</h2>
                        <p>Test message.</p>
                    </>
                }
            />,
        );

        expect(
            screen.getByRole("heading", {
                name: "Test Modal",
            }),
        ).toBeInTheDocument();

        expect(
            document.querySelector(".modal-actions"),
        ).not.toBeInTheDocument();
    });
});

