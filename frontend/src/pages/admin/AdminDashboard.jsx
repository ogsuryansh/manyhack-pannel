import React, { useEffect, useState } from "react";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5000/api/admin/stats")
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="admin-dashboard">
      <h2 className="section-title admin-dashboard-title">Admin Dashboard</h2>
      {loading ? (
        <div className="admin-dashboard-loading">Loading...</div>
      ) : (
        <div className="admin-dashboard-cards">
          <div className="admin-dashboard-card">
            <div className="admin-dashboard-label">Total Users</div>
            <div className="admin-dashboard-value">{stats?.totalUsers ?? "NA"}</div>
          </div>
          <div className="admin-dashboard-card">
            <div className="admin-dashboard-label">Total Products</div>
            <div className="admin-dashboard-value">{stats?.totalProducts ?? "NA"}</div>
          </div>
          <div className="admin-dashboard-card">
            <div className="admin-dashboard-label">Total Payments</div>
            <div className="admin-dashboard-value">{stats?.totalPayments ?? "NA"}</div>
          </div>
          <div className="admin-dashboard-card">
            <div className="admin-dashboard-label">Pending Payments</div>
            <div className="admin-dashboard-value">{stats?.pendingPayments ?? "NA"}</div>
          </div>
          <div className="admin-dashboard-card">
            <div className="admin-dashboard-label">Approved Payments</div>
            <div className="admin-dashboard-value">{stats?.approvedPayments ?? "NA"}</div>
          </div>
        </div>
      )}
    </div>
  );
}