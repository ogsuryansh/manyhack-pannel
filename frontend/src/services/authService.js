import { API } from "../api";
const API_URL = `${API}/auth`;

export async function login(username, password) {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: 'include', // Important for session cookies
    body: JSON.stringify({ username, password }),
  });
  let data;
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  if (!res.ok) throw new Error(data.message || "Login failed");
  localStorage.setItem("user", JSON.stringify(data.user));
  return data.user;
}

export async function register(email, username, password, referralCode) {
  const res = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, username, password, referralCode }),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Register failed");
  return await res.json();
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
  // For session-based auth, we don't need tokens
  // This is kept for compatibility but returns null
  return null;
}