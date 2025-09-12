import React, { useEffect, useState } from "react";
import { API } from "../../api";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noticeInput, setNoticeInput] = useState("");
  const [noticeMsg, setNoticeMsg] = useState("");
  const [refreshMsg, setRefreshMsg] = useState("");

  // Website name/title state
  const [siteName, setSiteName] = useState("");
  const [siteTitle, setSiteTitle] = useState("");
  const [siteMsg, setSiteMsg] = useState("");

  useEffect(() => {
    fetch(`${API}/admin/stats`, {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    fetch(`${API}/notice`, {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        setNoticeInput(data.text || "");
      });
    // Fetch website name/title
    fetch(`${API}/settings/site`, {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        setSiteName(data.websiteName || "");
        setSiteTitle(data.websiteTitle || "");
      });
  }, []);

  const handleNoticeSave = async () => {
    const res = await fetch(`${API}/notice`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify({ text: noticeInput }),
    });
    if (res.ok) {
      setNoticeMsg("Notice updated!");
      setNoticeInput(""); // Clear the textarea after saving
      setTimeout(() => setNoticeMsg(""), 2000);
    } else {
      setNoticeMsg("Failed to update notice.");
    }
  };

  const handleRefreshAll = async () => {
    setRefreshMsg("");
    try {
      const res = await fetch(`${API}/settings/refresh-version`, { 
        method: "POST",
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRefreshMsg("All user websites will refresh within 1 minute!");
      } else {
        setRefreshMsg("Failed to trigger refresh. Try again.");
      }
    } catch {
      setRefreshMsg("Failed to trigger refresh. Try again.");
    }
    setTimeout(() => setRefreshMsg(""), 4000);
  };

  const handleSiteSave = async () => {
    setSiteMsg("");
    const res = await fetch(`${API}/settings/site`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify({ websiteName: siteName, websiteTitle: siteTitle }),
    });
    if (res.ok) {
      setSiteMsg("Website name and title updated!");
      setTimeout(() => setSiteMsg(""), 2000);
    } else {
      setSiteMsg("Failed to update website name/title.");
    }
  };

  return (
    <div className="admin-dashboard">
      <h2 className="section-title admin-dashboard-title">Admin Dashboard</h2>
      {/* Website Name/Title Editor */}
      <div className="admin-site-editor" style={{marginBottom: 24}}>
        <label>
          <b>Website Name:</b>
          <input
            className="admin-site-input"
            value={siteName}
            onChange={e => setSiteName(e.target.value)}
            placeholder="Website Name"
            style={{marginLeft: 8, minWidth: 200}}
          />
        </label>
        <label style={{marginLeft: 16}}>
          <b>Website Title (HTML):</b>
          <input
            className="admin-site-input"
            value={siteTitle}
            onChange={e => setSiteTitle(e.target.value)}
            placeholder="Website Title"
            style={{marginLeft: 8, minWidth: 260}}
          />
        </label>
        <button className="admin-notice-save-btn" style={{marginLeft: 16}} onClick={handleSiteSave}>
          Save Website Name/Title
        </button>
        {siteMsg && (
          <div style={{ color: siteMsg.includes("updated") ? "#22c55e" : "#ff6b81", marginTop: 8, fontWeight: 600 }}>
            {siteMsg}
          </div>
        )}
      </div>
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
        <button className="admin-notice-save-btn" style={{ marginLeft: 12, background: '#2e90fa' }} onClick={handleRefreshAll}>
          Refresh All User Websites
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
        {refreshMsg && (
          <div
            style={{
              color: refreshMsg.includes("refresh") ? "#22c55e" : "#ff6b81",
              marginTop: 8,
              fontWeight: 600,
            }}
          >
            {refreshMsg}
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