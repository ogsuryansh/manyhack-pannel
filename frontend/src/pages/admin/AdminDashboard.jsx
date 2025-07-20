import React, { useEffect, useState } from "react";
import { API } from "../../api";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [noticeInput, setNoticeInput] = useState("");
  const [noticeMsg, setNoticeMsg] = useState("");

  useEffect(() => {
    fetch(`${API}/admin/stats`)
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    // Fetch current notice
    fetch(`${API}/notice`)
      .then(res => res.json())
      .then(data => {
        setNotice(data.text || "");
        setNoticeInput(data.text || "");
      });
  }, []);

  const handleNoticeSave = async () => {
    const res = await fetch(`${API}/notice`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: noticeInput }),
    });
    if (res.ok) {
      setNoticeMsg("Notice updated!");
      setNotice(noticeInput);
      setTimeout(() => setNoticeMsg(""), 2000);
    } else {
      setNoticeMsg("Failed to update notice.");
    }
  };

  return (
    <div className="admin-dashboard">
      <h2 className="section-title admin-dashboard-title">Admin Dashboard</h2>
      {/* Show the current notice as a moving marquee */}
      {notice && (
        <div className="dashboard-notice-marquee">
          <span>{notice}</span>
        </div>
      )}
      <div className="admin-notice-editor">
        <label>
          <b>Notice (shown to all users):</b>
          <textarea
            className="admin-notice-input"
            value={noticeInput}
            onChange={e => setNoticeInput(e.target.value)}
            rows={3}
            placeholder="Enter a moving notice for users (e.g. Buy X, get Y free!)"
          />
        </label>
        <button className="admin-notice-save-btn" onClick={handleNoticeSave}>
          Save Notice
        </button>
        {noticeMsg && (
          <div
            style={{
              color: noticeMsg === "Notice updated!" ? "#22c55e" : "#ff6b81",
              marginTop: 8,
              fontWeight: 600,
            }}
          >
            {noticeMsg}
          </div>
        )}
      </div>
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