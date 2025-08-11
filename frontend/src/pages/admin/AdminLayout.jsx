import React, { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

const adminTabs = [
  { label: "Dashboard", to: "/admin/dashboard" },
  { label: "Product Manager", to: "/admin/product-manager" },
  { label: "User Manager", to: "/admin/user-manager" },
  { label: "Key Manager", to: "/admin/key-manager" }, 
  { label: "Payment Manager", to: "/admin/payment-manager" },
  { label: "Top-Up Plan Manager", to: "/admin/topup-plan-manager" },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin-login");
  };
  return (
    <div>
      <nav className="admin-navbar">
        <div className="admin-navbar-title">Admin Panel</div>
        <div className="admin-navbar-tabs desktop-only">
          {adminTabs.map(tab => (
            <Link
              key={tab.to}
              to={tab.to}
              className={`admin-navbar-link${location.pathname === tab.to ? " active" : ""}`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
        <div className="admin-navbar-actions desktop-only">
          <button className="admin-logout-btn" onClick={handleLogout}>
            <span role="img" aria-label="logout">🚪</span>
            Logout
          </button>
        </div>
        <div className="admin-hamburger mobile-only" onClick={() => setMenuOpen(v => !v)}>
          <div className={`bar${menuOpen ? " open" : ""}`}></div>
          <div className={`bar${menuOpen ? " open" : ""}`}></div>
          <div className={`bar${menuOpen ? " open" : ""}`}></div>
        </div>
      </nav>
      {/* Slide-out menu for mobile */}
      <div className={`admin-slide-menu${menuOpen ? " open" : ""}`} onClick={() => setMenuOpen(false)}>
        <div className="admin-slide-menu-content" onClick={e => e.stopPropagation()}>
          <div className="admin-slide-title">Admin Menu</div>
          {adminTabs.map(tab => (
            <Link
              key={tab.to}
              to={tab.to}
              className={`admin-navbar-link${location.pathname === tab.to ? " active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              {tab.label}
            </Link>
          ))}
          <button 
            className="admin-navbar-link admin-logout-btn-mobile" 
            onClick={() => {
              handleLogout();
              setMenuOpen(false);
            }}
          >
            <span role="img" aria-label="logout">🚪</span>
            Logout
          </button>
        </div>
      </div>
      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
}