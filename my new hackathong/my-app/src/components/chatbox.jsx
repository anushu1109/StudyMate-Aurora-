import React, { useState, useRef, useEffect } from "react";
// It's good practice to keep API calls clean, but for simplicity, we'll keep fetch here.
// import axios from "axios"; 
import "./chatbox.css";

function App() {
  // --- Original State ---
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  // We don't need the 'file' state anymore, as we'll handle it directly.

  // --- NEW State for Authentication and API interaction ---
  const [sessionKey, setSessionKey] = useState(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState(''); // To store the URL of the PDF from our backend
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const chatEndRef = useRef(null);

  // --- 1. NEW: Handle Authentication on App Load ---
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const key = urlParams.get('sessionKey');
    if (key) {
      console.log("Session Key found in URL:", key);
      setSessionKey(key);
      localStorage.setItem('sessionKey', key); // Store for future visits
      // Clean the URL so the key isn't visible
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      const storedKey = localStorage.getItem('sessionKey');
      if (storedKey) {
        console.log("Session Key found in localStorage:", storedKey);
        setSessionKey(storedKey);
      }
    }
  }, []);

  // --- 2. MODIFIED: This now handles selecting AND uploading the file immediately ---
  const handleFileSelectAndUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Add a message to the UI immediately
    const fileMessage = {
      id: Date.now(),
      text: `Uploading ${file.name}...`,
      file: URL.createObjectURL(file),
      fileName: file.name,
      fileType: file.type,
      sender: "user",
    };
    setMessages(prev => [...prev, fileMessage]);
    
    setIsLoading(true);
    setError('');

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("File upload failed. Please try again.");

      const result = await res.json();
      console.log("File uploaded, URL:", result.url);
      setUploadedFileUrl(result.url); // IMPORTANT: Save the server URL for the AI to use

      // Add a confirmation message
      const botMessage = {
        id: Date.now() + 1,
        text: `PDF '${file.name}' is uploaded and ready. What would you like to know?`,
        sender: "bot",
      };
      setMessages(prev => [...prev, botMessage]);

    } catch (err) {
      setError(err.message);
      const errorMessage = { id: Date.now() + 1, text: `Error: ${err.message}`, sender: "bot" };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 3. REWRITTEN: This now sends the query to the AI about the uploaded file ---
  const handleSend = async () => {
    if (!input.trim()) return;

    if (!uploadedFileUrl) {
      setError("Please upload a PDF file before asking a question.");
      return;
    }
    
    const userMessage = { id: Date.now(), text: input, sender: "user" };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch("http://localhost:5000/api/ask", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionKey}`
        },
        body: JSON.stringify({
          pdfUrl: uploadedFileUrl,
          query: input,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "An error occurred.");
      }

      const result = await res.json();
      const botMessage = { id: Date.now() + 1, text: result.answer, sender: "bot" };
      setMessages(prev => [...prev, botMessage]);

    } catch (err) {
      setError(err.message);
      const errorMessage = { id: Date.now() + 1, text: `Error: ${err.message}`, sender: "bot" };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Unchanged Helper Functions ---
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      messages.forEach(msg => {
        if (msg.file) URL.revokeObjectURL(msg.file);
      });
    };
  }, [messages]);

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // --- Render Logic ---
  return (
    <div className="chat-container">
      {/* NEW: Show Login Button if not authenticated */}
      {!sessionKey ? (
        <div className="login-container">
          <h2>Welcome</h2>
          <p>Please log in to continue.</p>
          <a href="http://localhost:5000/auth/google" className="login-button">
            Login with Google
          </a>
        </div>
      ) : (
        <>
          <div className="chat-box">
            {messages.map((msg) => (
              // Your original message rendering logic is great, no changes needed here
              <div key={msg.id} className={`message ${msg.sender === "user" ? "right" : "left"}`}>
                {msg.text && <p>{msg.text}</p>}
                {msg.file && msg.fileType === "application/pdf" && (
                   <div className="pdf-bubble">
                     <span className="pdf-icon">📄</span>
                     <span className="pdf-name">{msg.fileName}</span>
                   </div>
                 )}
              </div>
            ))}
             {isLoading && <div className="message left"><p>Thinking...</p></div>}
             {error && <div className="message left error-message"><p>{error}</p></div>}
            <div ref={chatEndRef} />
          </div>

          <div className="chat-input">
            <input
              type="text"
              placeholder={uploadedFileUrl ? "Ask about the PDF..." : "First, upload a PDF"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              aria-label="Message input"
              disabled={!uploadedFileUrl || isLoading} // Disable input until PDF is ready
            />
            <label className="file-label" aria-label="Attach file">
              📎
              {/* This input now triggers the immediate upload */}
              <input type="file" accept=".pdf" onChange={handleFileSelectAndUpload} />
            </label>
            <button onClick={handleSend} aria-label="Send message" disabled={isLoading}>
              Send
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default App;