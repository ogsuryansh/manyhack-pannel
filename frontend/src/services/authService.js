const API_URL = "http://localhost:5000/api/auth";

export async function login(username, password) {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Login failed");
  const data = await res.json();
  // Save to localStorage
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
  return localStorage.getItem("token");
}