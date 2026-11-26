import { Navigate, Routes, Route } from "react-router-dom";
import EventsPage from "./pages/EventsPage";
import VenuesPage from "./pages/VenuesPage";
import BookingsPage from "./pages/BookingsPage";
import NavigationBar from "./components/navigation/NavigationBar";
import { useState } from "react";
import { TimeFormatProvider } from "./contexts/TimeFormatContext.tsx";
import "./styles/theme.css";


function App() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <TimeFormatProvider>
      <div id="app" data-theme={darkMode ? "dark" : "light"}>
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
    </TimeFormatProvider>
  )
}

export default App;
