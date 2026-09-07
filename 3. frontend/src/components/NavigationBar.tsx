import { NavLink } from "react-router-dom";
import "../styles/navbar.css";


interface NavigationBarProps {
    darkMode: boolean;
    onToggleDarkMode: () => void;
}


export default function NavigationBar(
    { darkMode, onToggleDarkMode }: NavigationBarProps
) {
    return (
        <nav>
            <NavLink to="/events">Events</NavLink>
            <NavLink to="/venues">Venues</NavLink>
            <NavLink to="/bookings">My Bookings</NavLink>
            <button
                className="theme-toggle"
                onClick={onToggleDarkMode}
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
                {darkMode ? "☀" : "☾"}
            </button>
        </nav>
    );
}
