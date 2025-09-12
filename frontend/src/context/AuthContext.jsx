import React, { createContext, useState, useEffect } from "react";
import { API } from "../api";
import {
  getCurrentUser,
  logout as doLogout,
  getToken,
} from "../services/authService";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getCurrentUser());
  const [token, setToken] = useState(getToken());

  const refreshUser = async () => {
    try {
      const res = await fetch(`${API}/auth/me`, {
        credentials: 'include' // Important for session cookies
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        localStorage.setItem("user", JSON.stringify(data));
      } else {
        const errorData = await res.json();
        if (errorData.code === "DEVICE_MISMATCH" || errorData.code === "SESSION_EXPIRED") {
          // Show device mismatch message
          alert("Login detected on another device. Please login again.");
        } else if (errorData.code === "DEVICE_ALREADY_LOGGED_IN") {
          // Show device already logged in message
          alert("You are already logged in on another device. Please logout from the other device first.");
        }
        logout();
      }
    } catch (err) {
      console.error("Error refreshing user:", err);
      logout();
    }
  };

  useEffect(() => {
    const token = getToken();
    setToken(token);
    if (token) refreshUser();
  }, []);

  const login = (user) => {
    setUser(user);
    setToken(getToken());
    localStorage.setItem("user", JSON.stringify(user));
  };

  const logout = async () => {
    // Call backend logout to clear session
    try {
      const response = await fetch(`${API}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!response.ok) {
        console.error("Logout failed with status:", response.status);
        const errorText = await response.text();
        console.error("Logout error response:", errorText);
      } else {
        console.log("Backend logout successful");
      }
    } catch (err) {
      console.error("Error logging out from backend:", err);
    }
    
    // Always clear local state regardless of backend response
    doLogout();
    setUser(null);
    setToken(null);
    
    // Force page reload to clear any cached state
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}