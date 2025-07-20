import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register as apiRegister } from "../services/authService";

export default function SignupPage() {
  const [form, setForm] = useState({ email: "", username: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await apiRegister(form.email, form.username, form.password);
      setSuccess("Registration successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500); // Redirect after 1.5s
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-outer-card">
      <div className="auth-left">
        <div className="auth-welcome">
          <h2>Welcome!</h2>
          <p>
            Create your account to access the GAMING GARAGE Panel.<br />
            Already have an account? <Link to="/login" className="auth-link">Login</Link>
          </p>
        </div>
      </div>
      <div className="auth-right">
        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            className="auth-input"
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            className="auth-input"
            type="text"
            name="username"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            required
          />
          <input
            className="auth-input"
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />
          {error && (
            <div style={{ color: "var(--accent)", textAlign: "center" }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ color: "var(--primary)", textAlign: "center" }}>
              {success}
            </div>
          )}
          <button className="auth-btn" type="submit">Register</button>
          <div className="auth-bottom-text">
            Already a user? <Link to="/login" className="auth-link">Login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}