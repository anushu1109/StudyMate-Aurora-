// App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Your page components
import Intro from "./components/Main_page";
import Signup from "./components/login";
import LoggedMainPage from "./components/logged_main_page";
import Profile from "./components/profile";
import Chatbox from "./components/chatbox";

// Our Gatekeeper component
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        {/* --- Public Routes --- */}
        <Route path="/" element={<Intro />} />
        <Route path="/signup" element={<Signup />} />

        {/* --- Protected Routes --- */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <LoggedMainPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Chatbox"
          element={
            <ProtectedRoute>
              <Chatbox />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute> {/* <-- Add protection here */}
              <Profile />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;