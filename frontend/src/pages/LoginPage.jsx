import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login as apiLogin } from "../services/authService";
import { useAuth } from "../context/useAuth";
export default function LoginPage() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const user = await apiLogin(form.username, form.password);
      login(user);
      navigate("/"); // Redirect to dashboard
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-outer-card">
      <div className="auth-left">
        <div className="auth-welcome">
          <h2>Welcome Back!</h2>
          <p>
            Login to your GAMING GARAGE account.<br />
            Don't have an account? <Link to="/signup" className="auth-link">Register</Link>
          </p>
        </div>
      </div>
      <div className="auth-right">
        <form className="auth-form" onSubmit={handleSubmit}>
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
          <button className="auth-btn" type="submit">Login</button>
          <div className="auth-bottom-text">
            Don't have an account? <Link to="/signup" className="auth-link">Register</Link>
          </div>
        </form>
      </div>
    </div>
  );
}