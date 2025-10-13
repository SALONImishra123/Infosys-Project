import React, { useState } from "react";
import "../styles/Signup.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faEnvelope, faLock, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../context/AuthContext";

function SignUp({ onSwitch }) {
  const { register } = useAuth();
  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    const { success, message } = await register(formData.name, formData.email, formData.password);
    if (success) {
      alert("Signup successful!");
      onSwitch(); // switch to login
    } else alert(message || "Signup failed");
  };

  return (
    <div className="container">
      <h2 className="form-title">Sign Up</h2>
      <form className="form" onSubmit={handleSubmit}>
        <label>Name</label>
        <div className="input-group">
          <FontAwesomeIcon icon={faUser} />
          <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Enter your name" required />
        </div>

        <label>Email</label>
        <div className="input-group">
          <FontAwesomeIcon icon={faEnvelope} />
          <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter your email" required />
        </div>

        <label>Password</label>
        <div className="input-group">
          <FontAwesomeIcon icon={faLock} />
          <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} placeholder="Enter password" required />
          <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} onClick={() => setShowPassword(!showPassword)} style={{ cursor: "pointer" }} />
        </div>

        <label>Confirm Password</label>
        <div className="input-group">
          <FontAwesomeIcon icon={faLock} />
          <input type={showConfirm ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm password" required />
          <FontAwesomeIcon icon={showConfirm ? faEyeSlash : faEye} onClick={() => setShowConfirm(!showConfirm)} style={{ cursor: "pointer" }} />
        </div>

        <button type="submit" className="btn-primary">Sign Up</button>
      </form>

      <p className="switch-text">
        Already have an account? <span className="switch-link" onClick={onSwitch}>Login</span>
      </p>
    </div>
  );
}

export default SignUp;
