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

// Admin area imports
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminKeyManager from "./pages/admin/AdminKeyManager";
import AdminProductManager from "./pages/admin/AdminProductManager";
import AdminUserManager from "./pages/admin/AdminUserManager";
import AdminPaymentManager from "./pages/admin/AdminPaymentManager";
import OfferAddPage from "./pages/OfferAddPage";
import AdminOfferManager from "./pages/admin/AdminOfferManager";

function App() {
  const [theme, setTheme] = useState("dark");

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
          <Route path="offer-manager" element={<AdminOfferManager />} />
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
                  path="/offers"
                  element={
                    <ProtectedRoute>
                      <OfferAddPage />
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