import React from "react";
import "./login.css";
import { FaUser, FaLock } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

// We can rename the component to follow standard naming conventions (e.g., Login)
export default function Login() {
  // The username/password logic can be removed if you only use Google login
  // const [name, setName] = useState("");
  // const [password, setPassword] = useState("");

  // This is the only function this component needs
  const loginWithGoogle = () => {
    window.location.href = "http://localhost:5000/auth/google";
  };

  // No more useEffect or checkSession needed here!

  return (
    <div className="login-container">
      <div className="login-box">
        {/* Left Side */}
        <div className="login-left">
          <h1>Welcome Back</h1>
          <p>Access your account and continue your journey.</p>
        </div>

        {/* Divider */}
        <div className="divider"></div>

        {/* Right Side */}
        <div className="login-right">
          <button className="google-btn" onClick={loginWithGoogle}>
            <FcGoogle size={24} />
          </button>
          <h2>Login</h2>
          {/* You can keep or remove the username/password form */}
        </div>
      </div>
    </div>
  );
}
