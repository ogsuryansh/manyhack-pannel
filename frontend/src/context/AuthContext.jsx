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
    const token = getToken();
    if (!token) {
      logout();
      return;
    }
    try {
      const res = await fetch(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        localStorage.setItem("user", JSON.stringify(data));
      } else {
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

  const logout = () => {
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