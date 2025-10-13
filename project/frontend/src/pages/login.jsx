import React, { useState } from "react";
import "../styles/Signup.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faLock, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../context/AuthContext";

function Login({ onSwitch }) {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { success, message } = await login(formData.email, formData.password);
    if (success) alert("Login successful!");
    else alert(message || "Login failed");
  };

  return (
    <div className="container">
      <h2 className="form-title">Sign In</h2>
      <form className="form" onSubmit={handleSubmit}>
        <label>Email</label>
        <div className="input-group">
          <FontAwesomeIcon icon={faEnvelope} />
          <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="user@example.com" required />
        </div>

        <label>Password</label>
        <div className="input-group">
          <FontAwesomeIcon icon={faLock} />
          <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} placeholder="Enter password" required />
          <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} onClick={() => setShowPassword(!showPassword)} style={{ cursor: "pointer" }} />
        </div>

        <button type="submit" className="btn-primary">Sign In</button>
      </form>

      <p className="switch-text">
        Don't have an account? <span className="switch-link" onClick={onSwitch}>Create New Account</span>
      </p>
    </div>
  );
}

export default Login;
