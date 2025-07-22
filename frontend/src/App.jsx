import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import BuyKeyPage from "./pages/BuyKeyPage";
import MyKeyPage from "./pages/MyKeyPage";
import WalletHistoryPage from "./pages/WalletHistoryPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import AdminLoginPage from "./pages/AdminLoginPage";
import TermsAndPolicy from "./pages/TermsAndPolicy";
import Footer from "./components/Footer";
import AddBalancePage from "./pages/AddBalancePage";

// Admin area imports
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminKeyManager from "./pages/admin/AdminKeyManager";
import AdminProductManager from "./pages/admin/AdminProductManager";
import AdminUserManager from "./pages/admin/AdminUserManager";
import AdminPaymentManager from "./pages/admin/AdminPaymentManager";
import AdminTopUpPlanManager from "./pages/admin/AdminTopUpPlanManager";
import { API } from "./api";

function App() {
  const [theme, setTheme] = useState("dark");

  // Poll for settingsVersion and reload if changed (for users only)
  useEffect(() => {
    let interval;
    const isAdmin = window.location.pathname.startsWith("/admin");
    if (!isAdmin) {
      const checkVersion = async () => {
        try {
          const res = await fetch(`${API}/settings/version`);
          const data = await res.json();
          const lastVersion = localStorage.getItem("settingsVersion");
          if (lastVersion && Number(lastVersion) !== data.settingsVersion) {
            localStorage.setItem("settingsVersion", data.settingsVersion);
            window.location.reload();
          } else {
            localStorage.setItem("settingsVersion", data.settingsVersion);
          }
        } catch {}
      };
      checkVersion();
      interval = setInterval(checkVersion, 30000);
    }
    return () => interval && clearInterval(interval);
  }, []);

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <Router>
      <Routes>
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="key-manager" element={<AdminKeyManager />} />
          <Route path="product-manager" element={<AdminProductManager />} />
          <Route path="user-manager" element={<AdminUserManager />} />
          <Route path="payment-manager" element={<AdminPaymentManager />} />
          <Route path="topup-plan-manager" element={<AdminTopUpPlanManager />} />
        </Route>

        <Route path="/terms-policy" element={<TermsAndPolicy />} />

        <Route
          path="*"
          element={
            <>
              <Navbar theme={theme} setTheme={setTheme} />
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route
                  path="/buy"
                  element={
                    <ProtectedRoute>
                      <BuyKeyPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-key"
                  element={
                    <ProtectedRoute>
                      <MyKeyPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/wallet-history"
                  element={
                    <ProtectedRoute>
                      <WalletHistoryPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/add-balance"
                  element={
                    <ProtectedRoute>
                      <AddBalancePage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/admin-login" element={<AdminLoginPage />} />
              </Routes>
              <Footer />
            </>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;