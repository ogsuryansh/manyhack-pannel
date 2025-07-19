import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

const NAV_LINKS = [
  { label: "Dashboard", to: "/" },
  { label: "Buy Key", to: "/buy" },
  { label: "My Key", to: "/my-key" },
  { label: "Wallet History", to: "/wallet-history" },
];

export default function Navbar({ theme, setTheme }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleNavClick = () => setMenuOpen(false);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        MANYHACK <span className="panel">Panel</span>
      </div>
      <div className={`navbar-links${menuOpen ? " open" : ""}`}>
        {NAV_LINKS.map((link) => (
          <Link
            key={link.label}
            to={link.to}
            className={`navbar-link${location.pathname === link.to ? " active" : ""}`}
            onClick={handleNavClick}
          >
            {link.label}
          </Link>
        ))}
        {/* Show Logout if logged in, Login if not (mobile menu) */}
        {user ? (
          <button className="login-btn mobile-only" onClick={handleLogout}>
            <span className="user-icon" role="img" aria-label="user">👤</span>
            Logout
          </button>
        ) : (
          <Link to="/signup" className="login-btn mobile-only" onClick={handleNavClick}>
            <span className="user-icon" role="img" aria-label="user">👤</span>
            Login
          </Link>
        )}
      </div>
      <div className="navbar-actions">
        {/* Show Logout if logged in, Login if not (desktop) */}
        {user ? (
          <button className="login-btn desktop-only" onClick={handleLogout}>
            <span className="user-icon" role="img" aria-label="user">👤</span>
            Logout
          </button>
        ) : (
          <Link to="/signup" className="login-btn desktop-only">
            <span className="user-icon" role="img" aria-label="user">👤</span>
            Login
          </Link>
        )}
        <button
          className="theme-toggle"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
        <div
          className={`hamburger${menuOpen ? " open" : ""}`}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <div className="hamburger-bar bar1"></div>
          <div className="hamburger-bar bar2"></div>
          <div className="hamburger-bar bar3"></div>
        </div>
      </div>
    </nav>
  );
}