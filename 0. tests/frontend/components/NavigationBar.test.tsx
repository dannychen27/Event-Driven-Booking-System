import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderNavigationBar } from "../helpers/navigationBarTestHelpers";


describe("NavigationBar", () => {

    it("renders the navigation links", () => {
        renderNavigationBar();

        expect(
            screen.getByRole("link", {
                name: "Events",
            }),
        ).toBeInTheDocument();

        expect(
            screen.getByRole("link", {
                name: "Venues",
            }),
        ).toBeInTheDocument();

        expect(
            screen.getByRole("link", {
                name: "My Bookings",
            }),
        ).toBeInTheDocument();
    });

    it("renders the correct theme toggle in light mode", () => {
        renderNavigationBar({ darkMode: false });

        expect(
            screen.getByRole("button", {
                name: "Switch to dark mode",
            }),
        ).toBeInTheDocument();
    });

    it("renders the correct theme toggle in dark mode", () => {
        renderNavigationBar({ darkMode: true });

        expect(
            screen.getByRole("button", {
                name: "Switch to light mode",
            }),
        ).toBeInTheDocument();
    });

    it("calls onToggleDarkMode when the theme toggle is clicked", async () => {
        const onToggleDarkMode = vi.fn();
        const user = userEvent.setup();

        renderNavigationBar({ onToggleDarkMode });

        await user.click(
            screen.getByRole("button", {
                name: "Switch to dark mode",
            }),
        );

        expect(onToggleDarkMode).toHaveBeenCalled();
    });
});

