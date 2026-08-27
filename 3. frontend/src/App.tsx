import { Navigate, Routes, Route } from "react-router-dom";
import EventsPage from "./pages/EventsPage";
import VenuesPage from "./pages/VenuesPage";
import BookingsPage from "./pages/BookingsPage";
import NavigationBar from "./components/NavigationBar";
import "./styles/navbar.css";


function App() {
  return <>
    <NavigationBar />
    <Routes>
      <Route path="/" element={ <Navigate to="/events" /> } />
      <Route path="/events" element={ <EventsPage /> } />
      <Route path="/venues" element={ <VenuesPage /> } />
      <Route path="/bookings" element={ <BookingsPage /> } />
    </Routes>
  </>;
}

export default App;
