import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login as apiLogin } from "../services/authService";
import { useAuth } from "../context/useAuth";
import { API } from "../api";
export default function LoginPage() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const user = await apiLogin(form.username, form.password);
      login(user);
      navigate("/"); // Redirect to dashboard
    } catch (err) {
      if (err.message.includes("already logged in") || err.message.includes("device lock")) {
        setError("You are already logged in on another device. Please reset device lock from your current device first (available after 24 hours).");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetDevice = async () => {
    if (!form.username || !form.password) {
      setResetMessage("Please enter username and password first.");
      return;
    }

    if (!window.confirm('Are you sure you want to reset your device lock? This will allow you to login on other devices.')) {
      return;
    }

    setResetLoading(true);
    setResetMessage("");

    try {
      const response = await fetch(`${API}/auth/reset-device-lock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username: form.username,
          password: form.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        setResetMessage("Device lock reset successfully! You can now login on other devices.");
        setError(""); // Clear any login errors
      } else {
        setResetMessage(data.message || 'Failed to reset device lock');
      }
    } catch (error) {
      console.error('Error resetting device lock:', error);
      setResetMessage('Network error. Please try again.');
    } finally {
      setResetLoading(false);
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
          {resetMessage && (
            <div style={{ 
              color: resetMessage.includes('successfully') ? "#22c55e" : "var(--accent)", 
              textAlign: "center",
              fontSize: "14px",
              marginBottom: "12px"
            }}>
              {resetMessage}
            </div>
          )}
          <button 
            className="auth-btn" 
            type="submit" 
            disabled={loading}
            style={{ 
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
              position: 'relative'
            }}
          >
            {loading ? (
              <>
                <div className="loader loader-sm" style={{ marginRight: '8px' }}></div>
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>
          
          {/* Reset Device Lock Button */}
          <button 
            type="button"
            onClick={handleResetDevice}
            disabled={resetLoading || loading}
            style={{
              width: '100%',
              padding: '12px',
              marginTop: '12px',
              backgroundColor: '#ff6b81',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: resetLoading || loading ? 'not-allowed' : 'pointer',
              opacity: resetLoading || loading ? 0.6 : 1,
              fontSize: '14px',
              fontWeight: '600',
              position: 'relative'
            }}
          >
            {resetLoading ? (
              <>
                <div className="loader loader-sm" style={{ marginRight: '8px' }}></div>
                Resetting Device Lock...
              </>
            ) : (
              '🔓 Reset Device Lock'
            )}
          </button>
          <div className="auth-bottom-text">
            Don't have an account? <Link to="/signup" className="auth-link">Register</Link>
          </div>
        </form>
      </div>
    </div>
  );
}