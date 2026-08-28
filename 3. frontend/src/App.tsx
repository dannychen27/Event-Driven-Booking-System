import { Navigate, Routes, Route } from "react-router-dom";
import EventsPage from "./pages/EventsPage";
import VenuesPage from "./pages/VenuesPage";
import BookingsPage from "./pages/BookingsPage";
import NavigationBar from "./components/NavigationBar";
import { useState } from "react";
import "./styles/theme.css";


function App() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div id="app" className={darkMode ? "dark-mode" : ""}>
      <NavigationBar
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />
      <Routes>
        <Route path="/" element={ <Navigate to="/events" /> } />
        <Route path="/events" element={ <EventsPage /> } />
        <Route path="/venues" element={ <VenuesPage /> } />
        <Route path="/bookings" element={ <BookingsPage /> } />
      </Routes>
    </div>
  )
}

export default App;
