import React, { useState, useEffect } from "react";
import "./Main_page.css";
import Sidebar from './Sidebar';
import { FaBars, FaReact } from 'react-icons/fa';
import CarouselApp from "./CarouselApp";
import { useNavigate, useLocation } from "react-router-dom";

function MainPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Grab sessionKey from URL query string
    const params = new URLSearchParams(location.search);
    const sessionKey = params.get("sessionKey");
    if (sessionKey) {
      localStorage.setItem("sessionKey", sessionKey); // store for ProtectedRoute
      navigate("/dashboard", { replace: true }); // redirect to dashboard
    }
  }, [location, navigate]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);  
  const goToSignup = () => navigate("/signup");

  return (
    <div className="App">
      {sidebarOpen && <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />}
      {sidebarOpen && <div className="overlay" onClick={closeSidebar}></div>}

      <div className="app-wrapper">
        <header className="header">
          <div className="left">
            <button onClick={toggleSidebar} className="my-btn">
              <FaBars />
            </button>
            <FaReact className="logo" />
            <span className="title">Welcome to Studymate</span>
          </div>
          <div className="right">
            <button className="my-btn" onClick={goToSignup}>Sign in</button>
          </div>
        </header>
        <main className="main-body">
          <div className="carousel-container">
            <CarouselApp />
          </div>
        </main>
      </div>
    </div>
  );
}

export default MainPage;
