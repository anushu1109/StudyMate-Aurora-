// components/ProtectedRoute.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// This component will be our "gatekeeper"
function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const verifySession = async () => {
      const sessionKey = localStorage.getItem("sessionKey");

      if (!sessionKey) {
        // No key found, user is not authenticated.
        navigate('/'); // Send them to the Intro page
        return;
      }

      try {
        // We have a key, let's ask the backend if it's valid
        const response = await fetch(`http://localhost:5000/session/${sessionKey}`);
        const data = await response.json();

        if (data.valid) {
          // Key is valid! Let the user in.
          setIsAuthenticated(true);
        } else {
          // Key is invalid (expired, etc.)
          localStorage.removeItem("sessionKey"); // Clean up bad key
          navigate('/'); // Send them to the Intro page
        }
      } catch (error) {
        console.error("Session verification failed:", error);
        navigate('/'); // If error, send to Intro page
      } finally {
        // We're done checking, so we can stop loading
        setIsLoading(false);
      }
    };

    verifySession();
  }, [navigate]);

  // While we're checking the session, we can show a loading message
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // If authenticated, show the actual page content (the children).
  // Otherwise, this will return null because we've already navigated away.
  return isAuthenticated ? children : null;
}

export default ProtectedRoute;