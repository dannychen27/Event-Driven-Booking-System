import { NavLink } from "react-router-dom";
import "../styles/navbar.css";


function NavigationBar() {
    return (
        <nav>
            <NavLink to="/events">Events</NavLink>
            <NavLink to="/venues">Venues</NavLink>
            <NavLink to="/bookings">My Bookings</NavLink>
        </nav>
    );
}

export default NavigationBar;
