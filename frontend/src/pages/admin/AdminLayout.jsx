import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

const adminTabs = [
  { label: "Dashboard", to: "/admin/dashboard" },
  { label: "Product Manager", to: "/admin/product-manager" },
  { label: "User Manager", to: "/admin/user-manager" },
  { label: "Key Manager", to: "/admin/key-manager" }, 
  { label: "Payment Manager", to: "/admin/payment-manager" },
];

export default function AdminLayout() {
  const location = useLocation();
  return (
    <div>
      <nav className="admin-navbar">
        <div className="admin-navbar-title">Admin Panel</div>
        <div className="admin-navbar-tabs">
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
      </nav>
      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
}