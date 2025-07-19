/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect } from "react";
import {
  getCurrentUser,
  logout as doLogout,
  getToken,
} from "../services/authService";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getCurrentUser());

  // Refresh user from backend
  const refreshUser = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch("http://localhost:5000/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        localStorage.setItem("user", JSON.stringify(data));
      }
    } catch (err) {
      console.error("Error refreshing user:", err);
    }
  };

  useEffect(() => {
    const token = getToken();
    if (token) refreshUser();
  }, []);

  const login = (user) => {
    setUser(user);
    localStorage.setItem("user", JSON.stringify(user));
  };

  const logout = () => {
    doLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}