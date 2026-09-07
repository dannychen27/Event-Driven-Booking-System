import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";


import NavigationBar from "../../../3. frontend/src/components/NavigationBar";


describe("NavigationBar", () => {

    it("renders the navigation links", () => {
        render(
            <MemoryRouter>
                <NavigationBar
                    darkMode={false}
                    onToggleDarkMode={() => {}}
                />
            </MemoryRouter>,
        );

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
        render(
            <MemoryRouter>
                <NavigationBar
                    darkMode={false}
                    onToggleDarkMode={() => {}}
                />
            </MemoryRouter>,
        );

        expect(
            screen.getByRole("button", {
                name: "Switch to dark mode",
            }),
        ).toBeInTheDocument();
    });

    it("renders the correct theme toggle in dark mode", () => {
        render(
            <MemoryRouter>
                <NavigationBar
                    darkMode={true}
                    onToggleDarkMode={() => {}}
                />
            </MemoryRouter>,
        );

        expect(
            screen.getByRole("button", {
                name: "Switch to light mode",
            }),
        ).toBeInTheDocument();
    });

    it("calls onToggleDarkMode when the theme toggle is clicked", async () => {
        const onToggleDarkMode = vi.fn();
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <NavigationBar
                    darkMode={false}
                    onToggleDarkMode={onToggleDarkMode}
                />
            </MemoryRouter>,
        );

        await user.click(
            screen.getByRole("button", {
                name: "Switch to dark mode",
            }),
        );

        expect(onToggleDarkMode).toHaveBeenCalled();
    });
});

