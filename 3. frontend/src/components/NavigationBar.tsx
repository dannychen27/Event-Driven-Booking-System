import { Link } from "react-router-dom";
import "../styles/navbar.css";


function NavigationBar() {
    return (
        <nav>
            <Link to="/events">Events</Link>
            <Link to="/venues">Venues</Link>
            <Link to="/bookings">My Bookings</Link>
        </nav>
    );
}

export default NavigationBar;
