import { Navigate, Routes, Route } from "react-router-dom";
import EventsPage from "./pages/EventsPage";
import NavigationBar from "./components/NavigationBar";
import "./styles/navbar.css";


function App() {
  return <>
    <NavigationBar />
    <Routes>
      <Route path="/" element={ <Navigate to="/events" /> } />
      <Route path="/events" element={ <EventsPage /> } />
    </Routes>
  </>;
}

export default App;
