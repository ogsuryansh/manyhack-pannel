import React, { useEffect, useState } from "react";
import { API } from "../../api";

export default function AdminPaymentManager() {
  const [payments, setPayments] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

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
  }, []);

  const handleApprove = async (id) => {
    await fetch(`${API}/payments/${id}/approve`, { method: "PUT" });
    fetchPayments();
  };

  const handleReject = async (id) => {
    await fetch(`${API}/payments/${id}/reject`, { method: "PUT" });
    fetchPayments();
  };

  // Separate wallet and purchase transactions
  const walletTx = payments.filter(
    (p) => p.type === "add_money" || p.type === "deduct_money"
  );
  const purchaseTx = payments.filter((p) => p.type === "buy_key");

  // Filter by status
  const filteredWalletTx =
    filter === "all"
      ? walletTx
      : walletTx.filter((p) => p.status === filter);

  const filteredPurchaseTx =
    filter === "all"
      ? purchaseTx
      : purchaseTx.filter((p) => p.status === filter);

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
        <button className="admin-payment-refresh" onClick={fetchPayments}>
          Refresh
        </button>
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
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={6} className="admin-payment-loading">
                Loading...
              </td>
            </tr>
          ) : filteredPurchaseTx.length === 0 ? (
            <tr>
              <td colSpan={6} className="admin-payment-empty">
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
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}