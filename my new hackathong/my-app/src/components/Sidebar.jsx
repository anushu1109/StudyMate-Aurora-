import React from "react";
import "./Sidebar.css";

function Sidebar({ isOpen, closeSidebar }) {
  return (
    <div className={`sidebar ${isOpen ? "open" : ""}`}>
      <h2>Menu</h2>
      <ul>
        <li><a href="#">Home</a></li>
        <li><a href="/profile">Profile</a></li>
        <li><a href="#">Settings</a></li>
      </ul>
      <button className="close-btn" onClick={closeSidebar}>Close</button>
    </div>
  );
}

export default Sidebar;