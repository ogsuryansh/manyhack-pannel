import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../api";

export default function AdminLoginPage() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include', // Important for session cookies
        body: JSON.stringify(form),
      });
      
      
      let data;
      try {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          data = await res.json();
        } else {
          console.error('Admin login returned non-JSON response');
          const text = await res.text();
          console.error('Raw response:', text);
          throw new Error('Server returned non-JSON response');
        }
      } catch (parseError) {
        console.error('Failed to parse admin login response:', parseError);
        const text = await res.text();
        console.error('Raw response:', text);
        throw new Error('Invalid response from server');
      }
      
      if (!res.ok) {
        console.error('Admin login failed:', data);
        throw new Error(data.message || "Login failed");
      }
      
      localStorage.setItem("adminUser", JSON.stringify(data.admin));
      
      // Small delay to ensure session is properly saved
      setTimeout(() => {
        navigate("/admin");
      }, 100);
    } catch (err) {
      console.error('Admin login error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
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
              'Login as Admin'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}