import React from "react";
import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }) {
  const adminUser = localStorage.getItem("adminUser");
  if (!adminUser) {
    return <Navigate to="/admin-login" replace />;
  }
  return children;
}