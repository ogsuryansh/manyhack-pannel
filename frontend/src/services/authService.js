import { API } from "../api";

const API_URL = `${API}/auth`;

export async function login(username, password) {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error("Server error or invalid response");
  }
  if (!res.ok) throw new Error((data && data.message) || "Login failed");
  localStorage.setItem("user", JSON.stringify(data.user));
  localStorage.setItem("token", data.token);
  return data.user;
}

export async function register(email, username, password) {
  const res = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, username, password }),
  });
  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error("Server error or invalid response");
  }
  if (!res.ok) throw new Error((data && data.message) || "Register failed");
  return data;
}

export function logout() {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
}

export function getCurrentUser() {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

export function getToken() {
  return localStorage.getItem("token");
}