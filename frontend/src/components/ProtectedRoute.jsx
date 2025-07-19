import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) {
    // Not logged in, redirect to signup
    return <Navigate to="/signup" replace />;
  }
  // Logged in, show the page
  return children;
}