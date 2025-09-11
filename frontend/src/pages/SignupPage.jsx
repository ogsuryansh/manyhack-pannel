import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register as apiRegister } from "../services/authService";

export default function SignupPage() {
  const [form, setForm] = useState({ email: "", username: "", password: "", referralCode: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [referralValid, setReferralValid] = useState(null);
  const [checkingReferral, setCheckingReferral] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validateReferralCode = async (code) => {
    if (!code || code.length < 3) {
      setReferralValid(null);
      return;
    }

    setCheckingReferral(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/referral/validate/${code}`);
      const data = await res.json();
      setReferralValid(data.valid);
    } catch (err) {
      setReferralValid(false);
    } finally {
      setCheckingReferral(false);
    }
  };

  const handleReferralChange = (e) => {
    const value = e.target.value.toUpperCase();
    setForm({ ...form, referralCode: value });
    validateReferralCode(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.referralCode) {
      setError("Referral code is required");
      return;
    }

    if (referralValid === false) {
      setError("Invalid referral code");
      return;
    }

    if (referralValid === null && form.referralCode) {
      setError("Please wait while we validate your referral code");
      return;
    }

    try {
      await apiRegister(form.email, form.username, form.password, form.referralCode);
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
          <div style={{ position: "relative", width: "100%" }}>
            <input
              className="auth-input"
              type="text"
              name="referralCode"
              placeholder="Referral Code (Required)"
              value={form.referralCode}
              onChange={handleReferralChange}
              required
              style={{
                borderColor: referralValid === true ? "#22c55e" : referralValid === false ? "#ff6b81" : undefined,
                width: "100%",
                boxSizing: "border-box"
              }}
            />
            {checkingReferral && (
              <div style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#666"
              }}>
                <div className="loader loader-xs"></div>
              </div>
            )}
            {referralValid === true && (
              <div style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#22c55e",
                fontSize: "18px"
              }}>
                ✓
              </div>
            )}
            {referralValid === false && (
              <div style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#ff6b81",
                fontSize: "18px"
              }}>
                ✗
              </div>
            )}
          </div>
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