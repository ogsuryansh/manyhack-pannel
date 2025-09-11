import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../api";

export default function AdminLoginPage() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`${API}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include', // Important for session cookies
        body: JSON.stringify(form),
      });
      let data;
      try {
        data = await res.json();
      } catch {
        data = {};
      }
      if (!res.ok) throw new Error(data.message || "Login failed");
      localStorage.setItem("adminUser", JSON.stringify(data.admin));
      navigate("/admin");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-outer-card">
      <div className="auth-left">
        <div className="auth-welcome">
          <h2>Admin Login</h2>
          <p>Enter your admin credentials to access the admin panel.</p>
        </div>
      </div>
      <div className="auth-right">
        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            className="auth-input"
            type="text"
            name="username"
            placeholder="Admin Username"
            value={form.username}
            onChange={handleChange}
            required
          />
          <input
            className="auth-input"
            type="password"
            name="password"
            placeholder="Admin Password"
            value={form.password}
            onChange={handleChange}
            required
          />
          {error && (
            <div style={{ color: "var(--accent)", textAlign: "center" }}>
              {error}
            </div>
          )}
          <button className="auth-btn" type="submit">Login as Admin</button>
        </form>
      </div>
    </div>
  );
}