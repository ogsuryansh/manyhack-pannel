import { API } from "../api";
const API_URL = `${API}/auth`;

export async function login(username, password) {
  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include', // Important for session cookies
      body: JSON.stringify({ username, password }),
    });
    
    // Check if response is HTML (error page) instead of JSON
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      console.error('Received non-JSON response:', text.substring(0, 200));
      throw new Error(`Server returned HTML instead of JSON. Status: ${res.status}`);
    }
    
    let data;
    try {
      data = await res.json();
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error("Invalid response format from server");
    }
    
    if (!res.ok) {
      throw new Error(data.message || `Login failed with status ${res.status}`);
    }
    
    localStorage.setItem("user", JSON.stringify(data.user));
    return data.user;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

export async function register(email, username, password, referralCode) {
  try {
    const res = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, username, password, referralCode }),
    });
    
    // Check if response is HTML (error page) instead of JSON
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      console.error('Received non-JSON response:', text.substring(0, 200));
      throw new Error(`Server returned HTML instead of JSON. Status: ${res.status}`);
    }
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || `Register failed with status ${res.status}`);
    return data;
  } catch (error) {
    console.error('Register error:', error);
    throw error;
  }
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

// Test API connection
export async function testApiConnection() {
  try {
    const res = await fetch(`${API}/cors-test`, {
      method: "GET",
      credentials: 'include',
    });
    
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      console.error('API test received non-JSON response:', text.substring(0, 200));
      return { success: false, error: 'Server returned HTML instead of JSON' };
    }
    
    const data = await res.json();
    return { success: true, data };
  } catch (error) {
    console.error('API connection test failed:', error);
    return { success: false, error: error.message };
  }
}

// Reset device lock
export async function resetDeviceLock(username, password) {
  try {
    const res = await fetch(`${API_URL}/reset-device-lock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });
    
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      console.error('Device reset received non-JSON response:', text.substring(0, 200));
      throw new Error(`Server returned HTML instead of JSON. Status: ${res.status}`);
    }
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || `Device reset failed with status ${res.status}`);
    return data;
  } catch (error) {
    console.error('Device reset error:', error);
    throw error;
  }
}