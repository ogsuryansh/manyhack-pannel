import React, { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

const adminTabs = [
  { label: "Dashboard", to: "/admin/dashboard", icon: "📊" },
  { label: "Product Manager", to: "/admin/product-manager", icon: "📦" },
  { label: "User Manager", to: "/admin/user-manager", icon: "👥" },
  { label: "Key Manager", to: "/admin/key-manager", icon: "🔑" }, 
  { label: "Payment Manager", to: "/admin/payment-manager", icon: "💳" },
  { label: "Top-Up Plan Manager", to: "/admin/topup-plan-manager", icon: "💰" },
  { label: "Referral Manager", to: "/admin/referral-manager", icon: "🔗" },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin-login");
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <div className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-title">
            <span className="admin-logo">⚡</span>
            <span className="admin-title-text">Admin Panel</span>
          </div>
          <button 
            className="admin-sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>
        
        <nav className="admin-sidebar-nav">
          {adminTabs.map(tab => (
            <Link
              key={tab.to}
              to={tab.to}
              className={`admin-sidebar-link ${location.pathname === tab.to ? "active" : ""}`}
              title={sidebarOpen ? "" : tab.label}
            >
              <span className="admin-sidebar-icon">{tab.icon}</span>
              {sidebarOpen && <span className="admin-sidebar-text">{tab.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <button className="admin-sidebar-logout" onClick={handleLogout}>
            <span className="admin-sidebar-icon">🚪</span>
            {sidebarOpen && <span className="admin-sidebar-text">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`admin-main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}