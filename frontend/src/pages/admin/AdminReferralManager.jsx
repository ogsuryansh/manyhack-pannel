import React, { useEffect, useState } from "react";
import { API } from "../../api";
import { adminApi } from "../../utils/adminApi";

export default function AdminReferralManager() {
  const [referralCodes, setReferralCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCode, setEditingCode] = useState(null);
  const [stats, setStats] = useState(null);
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    maxUsage: "",
    rewardAmount: "",
    isActive: true
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchReferralCodes();
    fetchStats();
  }, []);

  const fetchReferralCodes = async () => {
    try {
      const data = await adminApi.get('/referral');
      setReferralCodes(data);
    } catch (err) {
      console.error("Error fetching referral codes:", err);
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await adminApi.get('/referral/stats');
      setStats(data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const url = editingCode 
        ? `${API}/referral/${editingCode._id}`
        : `${API}/referral`;
      
      const method = editingCode ? "PUT" : "POST";
      
      const requestBody = {
        ...formData,
        maxUsage: formData.maxUsage ? parseInt(formData.maxUsage) : null,
        rewardAmount: formData.rewardAmount ? parseFloat(formData.rewardAmount) : 0
      };
      
      if (editingCode) {
        await adminApi.put(`/referral/${editingCode._id}`, requestBody);
        setMessage("Referral code updated!");
      } else {
        await adminApi.post('/referral', requestBody);
        setMessage("Referral code created!");
      }
      
      setShowModal(false);
      setEditingCode(null);
      setFormData({ code: "", description: "", maxUsage: "", isActive: true });
      fetchReferralCodes();
      fetchStats();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const handleEdit = (code) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      description: code.description,
      maxUsage: code.maxUsage || "",
      isActive: code.isActive
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this referral code?")) return;

    try {
      await adminApi.delete(`/referral/${id}`);
      setMessage("Referral code deleted!");
      fetchReferralCodes();
      fetchStats();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      await adminApi.put(`/referral/${id}`, { isActive: !currentStatus });
      setMessage("Status updated!");
      fetchReferralCodes();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const openCreateModal = () => {
    setEditingCode(null);
    setFormData({ code: "", description: "", maxUsage: "", isActive: true });
    setShowModal(true);
  };

  return (
    <div className="admin-referral-manager">
      <div className="admin-referral-header">
        <h2 className="section-title">Referral Code Manager</h2>
        <button className="admin-product-btn" onClick={openCreateModal}>
          + Add Referral Code
        </button>
      </div>

      {message && (
        <div className={`alert ${message.includes("Error") ? "alert-error" : "alert-success"}`}>
          {message}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="admin-dashboard-cards" style={{ marginBottom: "24px" }}>
          <div className="admin-dashboard-card">
            <div className="admin-dashboard-label">Total Codes</div>
            <div className="admin-dashboard-value">{stats.totalCodes}</div>
          </div>
          <div className="admin-dashboard-card">
            <div className="admin-dashboard-label">Active Codes</div>
            <div className="admin-dashboard-value">{stats.activeCodes}</div>
          </div>
          <div className="admin-dashboard-card">
            <div className="admin-dashboard-label">Total Usage</div>
            <div className="admin-dashboard-value">{stats.totalUsage}</div>
          </div>
        </div>
      )}

      {/* Top Codes */}
      {stats?.topCodes && stats.topCodes.length > 0 && (
        <div className="admin-referral-top-codes">
          <h3>Top Used Codes</h3>
          <div className="admin-referral-top-list">
            {stats.topCodes.map((code, index) => (
              <div key={code._id} className="admin-referral-top-item">
                <span className="rank">#{index + 1}</span>
                <span className="code">{code.code}</span>
                <span className="usage">{code.usageCount} uses</span>
                {code.maxUsage && (
                  <span className="limit">/ {code.maxUsage}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Referral Codes Table */}
      {loading ? (
        <div className="admin-dashboard-loading">Loading...</div>
      ) : (
        <div className="admin-referral-table-container">
          <table className="admin-user-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Description</th>
                <th>Usage</th>
                <th>Limit</th>
                <th>Reward (₹)</th>
                <th>Status</th>
                <th>Created By</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {referralCodes.map((code) => (
                <tr key={code._id}>
                  <td>
                    <span className="referral-code">{code.code}</span>
                  </td>
                  <td>{code.description}</td>
                  <td>{code.usageCount}</td>
                  <td>{code.maxUsage || "Unlimited"}</td>
                  <td>₹{code.rewardAmount || 0}</td>
                  <td>
                    <span className={`admin-payment-status ${code.isActive ? "approved" : "rejected"}`}>
                      {code.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>{code.createdBy?.username || "N/A"}</td>
                  <td>{new Date(code.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="admin-key-edit-btn"
                      onClick={() => handleEdit(code)}
                    >
                      Edit
                    </button>
                    <button
                      className={`admin-key-edit-btn ${code.isActive ? "admin-key-edit-cancel" : ""}`}
                      onClick={() => handleToggleActive(code._id, code.isActive)}
                    >
                      {code.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      className="admin-key-delete-btn"
                      onClick={() => handleDelete(code._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="admin-modal">
          <div className="admin-modal-content">
            <h3>{editingCode ? "Edit Referral Code" : "Create Referral Code"}</h3>
            <form onSubmit={handleSubmit}>
              <label>
                <b>Referral Code:</b>
                <input
                  className="admin-product-input"
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="Enter referral code"
                  required
                />
              </label>
              <label>
                <b>Description:</b>
                <input
                  className="admin-product-input"
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter description"
                  required
                />
              </label>
              <label>
                <b>Max Usage (optional):</b>
                <input
                  className="admin-product-input"
                  type="number"
                  value={formData.maxUsage}
                  onChange={(e) => setFormData({ ...formData, maxUsage: e.target.value })}
                  placeholder="Leave empty for unlimited"
                  min="1"
                />
              </label>
              <label>
                <b>Reward Amount (₹):</b>
                <input
                  className="admin-product-input"
                  type="number"
                  value={formData.rewardAmount}
                  onChange={(e) => setFormData({ ...formData, rewardAmount: e.target.value })}
                  placeholder="Amount to give referrer when code is used"
                  min="0"
                  step="0.01"
                />
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <span>Active</span>
              </label>
              <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                <button type="submit" className="admin-product-btn">
                  {editingCode ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  className="admin-key-edit-cancel"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
