import React, { createContext, useState, useEffect } from "react";
import { API } from "../api";
import {
  getCurrentUser,
  logout as doLogout,
  getToken,
} from "../services/authService";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getCurrentUser());

  
  const refreshUser = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        localStorage.setItem("user", JSON.stringify(data));
      } else if (res.status === 404) {
        // If admin, ignore; if user, log out
        const storedUser = getCurrentUser();
        if (storedUser && storedUser.isAdmin) {
          // Ignore 404 for admin
          return;
        } else {
          logout();
        }
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