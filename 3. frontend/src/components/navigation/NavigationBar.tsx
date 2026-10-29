import { NavLink } from "react-router-dom";
import "../../styles/navigation/navbar.css";
import type { NavigationBarProps } from "./NavigationBar.types";
import Button from "../ui/buttons/Button";


export default function NavigationBar(
    { darkMode, onToggleDarkMode }: NavigationBarProps
) {
    return (
        <nav>
            <NavLink to="/events">Events</NavLink>
            <NavLink to="/venues">Venues</NavLink>
            <NavLink to="/bookings">My Bookings</NavLink>
            <Button
                variant="icon"
                className="theme-toggle"
                onClick={onToggleDarkMode}
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
                {darkMode ? "☀" : "☾"}
            </Button>
        </nav>
    );
}
