import React, { useEffect, useState } from "react";
import { API } from "../../api";

export default function AdminPaymentManager() {
  const [payments, setPayments] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // UPI management
  const [upiId, setUpiId] = useState("");
  const [upiInput, setUpiInput] = useState("");
  const [upiMsg, setUpiMsg] = useState("");
  const [paymentEnabled, setPaymentEnabled] = useState(true);
  const [paymentMsg, setPaymentMsg] = useState("");

  // Fetch payments and UPI ID
  const fetchPayments = () => {
    setLoading(true);
    fetch(`${API}/payments`)
      .then((res) => res.ok ? res.json() : [])
      .then((data) => {
        setPayments(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setPayments([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPayments();
    // Fetch UPI ID and payment enabled status
    fetch(`${API}/settings/upi`)
      .then((res) => res.json())
      .then((data) => {
        setUpiId(data.upiId?.trim() || "");
        setUpiInput(data.upiId?.trim() || "");
        setPaymentEnabled(data.paymentEnabled !== false); // default to true
      });
  }, []);

  const handleApprove = async (id) => {
    await fetch(`${API}/payments/${id}/approve`, { method: "PUT" });
    fetchPayments();
  };

  const handleReject = async (id) => {
    await fetch(`${API}/payments/${id}/reject`, { method: "PUT" });
    fetchPayments();
  };

  // **NEW: Delete payment**
  const handleDeletePayment = async (id) => {
    if (!window.confirm("Are you sure you want to delete this payment?")) return;
    await fetch(`${API}/payments/${id}`, { method: "DELETE" });
    fetchPayments();
  };

  // UPI ID update
  const handleUpiSave = async () => {
    const res = await fetch(`${API}/settings/upi`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ upiId: upiInput, paymentEnabled }),
    });
    if (res.ok) {
      setUpiId(upiInput);
      setUpiMsg("UPI ID updated!");
      setTimeout(() => setUpiMsg(""), 2000);
    } else {
      setUpiMsg("Failed to update UPI ID.");
    }
  };

  // Payment receiving toggle
  const handlePaymentToggle = async () => {
    const res = await fetch(`${API}/settings/upi`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ upiId: upiId, paymentEnabled: !paymentEnabled }),
    });
    if (res.ok) {
      setPaymentEnabled((prev) => !prev);
      setPaymentMsg(
        !paymentEnabled
          ? "Payment receiving enabled!"
          : "Payment receiving disabled!"
      );
      setTimeout(() => setPaymentMsg(""), 2000);
    } else {
      setPaymentMsg("Failed to update payment status.");
    }
  };

  // Separate wallet and purchase transactions
  const walletTx = payments.filter(
    (p) => p.type === "add_money" || p.type === "deduct_money"
  );
  const purchaseTx = payments.filter((p) => p.type === "buy_key");

  // Filter by status
  const userMatches = (p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (p.userId?.username && p.userId.username.toLowerCase().includes(q)) ||
      (p.userId?.email && p.userId.email.toLowerCase().includes(q))
    );
  };
  const filteredWalletTx =
    filter === "all"
      ? walletTx.filter(userMatches)
      : walletTx.filter((p) => p.status === filter && userMatches(p));

  const filteredPurchaseTx =
    filter === "all"
      ? purchaseTx.filter(userMatches)
      : purchaseTx.filter((p) => p.status === filter && userMatches(p));

  return (
    <div>
      <h3>Payment Approvals</h3>
      <div className="admin-payment-controls">
        <label>
          Filter:{" "}
          <select
            className="admin-payment-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>
        <input
          className="admin-product-input"
          style={{ width: 180, marginLeft: 16 }}
          type="text"
          placeholder="Search by user/email"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button className="admin-payment-refresh" onClick={fetchPayments}>
          Refresh
        </button>
      </div>

      <div className="admin-upi-box">
        <label>
          <b>UPI ID:</b>
          <input
            className="admin-product-input"
            style={{ width: 220, marginLeft: 8 }}
            type="text"
            value={upiInput}
            onChange={e => setUpiInput(e.target.value)}
            placeholder="Enter UPI ID"
          />
        </label>
        <button className="admin-payment-refresh" onClick={handleUpiSave}>
          Save UPI ID
        </button>
        {upiMsg && (
          <span
            style={{
              marginLeft: 12,
              color: upiMsg === "UPI ID updated!" ? "#22c55e" : "#ff6b81",
              fontWeight: 600,
            }}
          >
            {upiMsg}
          </span>
        )}
        <div style={{ marginTop: 12 }}>
          <label>
            <b>Payment Receiving:</b>{" "}
            <button
              className={`admin-payment-toggle-btn ${paymentEnabled ? "enabled" : "disabled"}`}
              onClick={handlePaymentToggle}
            >
              {paymentEnabled ? "ON" : "OFF"}
            </button>
          </label>
          {paymentMsg && (
            <span
              style={{
                marginLeft: 12,
                color: paymentMsg.includes("enabled") ? "#22c55e" : "#ff6b81",
                fontWeight: 600,
              }}
            >
              {paymentMsg}
            </span>
          )}
        </div>
      </div>

      <h4>Wallet Transactions (Add/Deduct Money)</h4>
      <table className="admin-user-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Type</th>
            <th>Amount</th>
            <th>UTR</th>
            <th>Contact Detail</th>
            <th>Status</th>
            <th>Time</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={8} className="admin-payment-loading">
                Loading...
              </td>
            </tr>
          ) : filteredWalletTx.length === 0 ? (
            <tr>
              <td colSpan={8} className="admin-payment-empty">
                No wallet transactions found.
              </td>
            </tr>
          ) : (
            filteredWalletTx.map((p) => (
              <tr key={p._id}>
                <td>
                  {p.userId?.username || p.userId?.email || (
                    <span className="admin-payment-deleted">Deleted</span>
                  )}
                </td>
                <td>
                  {p.type === "add_money"
                    ? "Add Money"
                    : p.type === "deduct_money"
                    ? "Deduct Money"
                    : ""}
                </td>
                <td>₹{p.amount}</td>
                <td>{p.utr || "-"}</td>
                <td>{p.payerName || "NA"}</td>
                <td>
                  <span className={`admin-payment-status ${p.status}`}>
                    {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                  </span>
                </td>
                <td>{new Date(p.createdAt).toLocaleString()}</td>
                <td>
                  {p.status === "pending" && p.type === "add_money" && (
                    <>
                      <button
                        className="admin-key-edit-btn"
                        onClick={() => handleApprove(p._id)}
                      >
                        Approve
                      </button>
                      <button
                        className="admin-key-delete-btn"
                        onClick={() => handleReject(p._id)}
                      >
                        Reject
                      </button>
                    </>
                  )}
                  <button
                    className="admin-key-delete-btn"
                    onClick={() => handleDeletePayment(p._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <h4 style={{ marginTop: 32 }}>Key Purchases</h4>
      <table className="admin-user-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Product</th>
            <th>Duration</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Time</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={7} className="admin-payment-loading">
                Loading...
              </td>
            </tr>
          ) : filteredPurchaseTx.length === 0 ? (
            <tr>
              <td colSpan={7} className="admin-payment-empty">
                No key purchases found.
              </td>
            </tr>
          ) : (
            filteredPurchaseTx.map((p) => (
              <tr key={p._id}>
                <td>
                  {p.userId?.username || p.userId?.email || (
                    <span className="admin-payment-deleted">Deleted</span>
                  )}
                </td>
                <td>
                  {p.productId?.name || (
                    <span className="admin-payment-deleted">Deleted</span>
                  )}
                </td>
                <td>{p.duration || "-"}</td>
                <td>₹{p.amount}</td>
                <td>
                  <span className={`admin-payment-status ${p.status}`}>
                    {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                  </span>
                </td>
                <td>{new Date(p.createdAt).toLocaleString()}</td>
                <td>
                  <button
                    className="admin-key-delete-btn"
                    onClick={() => handleDeletePayment(p._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}