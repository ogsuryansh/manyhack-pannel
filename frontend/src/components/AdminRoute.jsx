import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { API } from "../api";

export default function AdminRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = loading, true = authenticated, false = not authenticated
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check both localStorage and backend session
        const adminUser = localStorage.getItem("adminUser");
        if (!adminUser) {
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        // Verify session with backend
        const res = await fetch(`${API}/admin/check`, {
          credentials: 'include'
        });
        
        if (res.ok) {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await res.json();
            setIsAuthenticated(data.isLoggedIn);
          } else {
            console.error('Admin check returned non-JSON response');
            const text = await res.text();
            console.error('Response text:', text);
            localStorage.removeItem("adminUser");
            setIsAuthenticated(false);
          }
        } else {
          // Handle 401 and other errors
          const errorData = await res.json().catch(() => ({}));
          console.error('Admin check failed:', errorData);
          localStorage.removeItem("adminUser");
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Admin check error:', error);
        localStorage.removeItem("adminUser");
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin-login" replace />;
  }

  return children;
}