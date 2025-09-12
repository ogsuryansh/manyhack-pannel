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
      await fetch(`${API}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (err) {
      console.error("Error logging out from backend:", err);
    }
    
    doLogout();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}