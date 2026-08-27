import { Link } from "react-router-dom";

function NavigationBar() {
    return (
        <nav>
            <Link to="/events">Events</Link>
            <Link to="/venues">Venues</Link>
        </nav>
    );
}

export default NavigationBar;
