import React, { useState , useEffect} from "react";
import "./logged_main_page.css";
import Sidebar from './Sidebar';
import { FaBars, FaReact } from 'react-icons/fa';
import CarouselApp from "./CarouselApp";
import { useNavigate } from "react-router-dom";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);  

  const navigate = useNavigate();

  const gotToProfile = () => {
    navigate("/profile");   // programmatic navigation
  };
  const GoToChatbox = () => {
    navigate("/chatbox");   // programmatic navigation
  };
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      const fetchProfile = async () => {
        const sessionKey = localStorage.getItem("sessionKey"); // or cookie
        if (!sessionKey) return;
  
        try {
          const res = await fetch("http://localhost:5000/api/profile", {
            headers: {
              "Authorization": `Bearer ${sessionKey}`,
            },
          });
  
          if (!res.ok) throw new Error("Failed to fetch profile");
  
          const data = await res.json();
          setUser(data);
        } catch (err) {
          console.error("Error fetching profile:", err);
          setUser(null);
        } finally {
          setLoading(false);
        }
      };
  
      fetchProfile();
    }, []);

  return (
    <div className="App">
      {/* Sidebar and overlay */}
      {sidebarOpen && <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />}
      {sidebarOpen && <div className="overlay" onClick={closeSidebar}></div>}

      {/* App wrapper containing header + main body */}
      <div className="app-wrapper">
        {/* Header */}
        <header className="header">
          <div className="left">
            <button onClick={toggleSidebar} className="my-btn">
              <FaBars />
            </button>
            <FaReact className="logo" />
            <span className="title">Welcome to Studymate</span>
          </div>
          <div className="right">
            <button className="google-btn" onClick={gotToProfile}  style={{ backgroundImage: `url(${user?.profilePicture})` }}></button>
          </div>
        </header>
        <main className="main-body">
          <div className="carousel-container">
            <CarouselApp />
          </div>
          <div className="center-container">
            <button className="big-button" onClick={GoToChatbox}>Go To Pdf Analyzer</button>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
