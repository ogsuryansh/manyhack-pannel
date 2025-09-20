import React, { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

const adminTabs = [
  { label: "Dashboard", to: "/admin/dashboard", icon: "📊" },
  { label: "Product Manager", to: "/admin/product-manager", icon: "📦" },
  { label: "User Manager", to: "/admin/user-manager", icon: "👥" },
  { label: "Key Manager", to: "/admin/key-manager", icon: "🔑" }, 
  { label: "Payment Manager", to: "/admin/payment-manager", icon: "💳" },
  { label: "Purchases", to: "/admin/purchases", icon: "🛒" },
  { label: "Top-Up Plan Manager", to: "/admin/topup-plan-manager", icon: "💰" },
  { label: "Referral Manager", to: "/admin/referral-manager", icon: "🔗" },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Ensure mobile starts with sidebar closed, desktop open
  React.useEffect(() => {
    const syncSidebarWithViewport = () => {
      if (window.innerWidth <= 900) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    syncSidebarWithViewport();
    window.addEventListener("resize", syncSidebarWithViewport);
    return () => window.removeEventListener("resize", syncSidebarWithViewport);
  }, []);

  const handleLogout = async () => {
    try {
      // Call backend logout to clear session
      await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/admin/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (err) {
      console.error("Error logging out from backend:", err);
    }
    
    localStorage.removeItem("adminUser");
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
              onClick={() => {
                if (window.innerWidth <= 900) {
                  setSidebarOpen(false);
                }
              }}
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
        {/* Mobile Header with Hamburger */}
        <div className="admin-mobile-header">
          <div className="admin-hamburger" onClick={() => setSidebarOpen(prev => !prev)}>
            <div className="bar" />
            <div className="bar" />
            <div className="bar" />
          </div>
          <div className="admin-mobile-title">Admin Panel</div>
        </div>
        {/* Mobile overlay to close sidebar */}
        {sidebarOpen && (
          <div
            className="admin-mobile-overlay"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}