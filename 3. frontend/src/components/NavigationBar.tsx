import { Link } from "react-router-dom";

function NavigationBar() {
    return (
        <nav>
            <Link to="/events">Events</Link>
        </nav>
    );
}

export default NavigationBar;
