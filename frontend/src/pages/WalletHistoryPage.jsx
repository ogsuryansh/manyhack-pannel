import React, { useEffect, useState } from "react";
import { useAuth } from "../context/useAuth";
import { API } from "../api";

export default function WalletHistoryPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetch(`${API}/payments/user`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setTransactions(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, [user]);

  // Calculate summary
  const moneyAdded = transactions
    .filter((t) => t.type === "add_money" && t.status === "approved")
    .reduce((sum, t) => sum + (t.meta && t.meta.bonus ? t.meta.bonus : t.amount), 0);
  const moneyDeducted = transactions
    .filter((t) => t.type === "deduct_money" && t.status === "approved")
    .reduce((sum, t) => sum + t.amount, 0);
  const moneyUsed = transactions
    .filter((t) => t.type === "buy_key" && t.status === "approved")
    .reduce((sum, t) => sum + t.amount, 0);
  const netBalance = moneyAdded - moneyUsed - moneyDeducted;

  // Filtered transactions
  const filteredTx = transactions.filter((t) => {
    if (filter === "all") return true;
    if (filter === "credited") return t.type === "add_money" && t.status === "approved";
    if (filter === "debited") return (t.type === "buy_key" || t.type === "deduct_money") && t.status === "approved";
    return true;
  });

  return (
    <div className="wallet-history-page">
      <h2 className="section-title" style={{ textAlign: "center" }}>Wallet History</h2>
      <div className="wallet-history-summary">
        <button className="wallet-filter-btn">
          Filter Transactions
          <select
            className="wallet-filter-select"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="credited">Credited</option>
            <option value="debited">Debited</option>
          </select>
        </button>
        <div className="wallet-summary-cards">
          <div className="wallet-summary-card added">
            <div>Money Added</div>
            <div className="wallet-summary-amount">₹{moneyAdded.toLocaleString()}</div>
          </div>
          <div className="wallet-summary-card used">
            <div>Money Used</div>
            <div className="wallet-summary-amount">₹{(moneyUsed + moneyDeducted).toLocaleString()}</div>
          </div>
          <div className="wallet-summary-card balance">
            <div>Net Balance</div>
            <div className="wallet-summary-amount">₹{netBalance.toLocaleString()}</div>
          </div>
        </div>
      </div>
      <div className="wallet-history-list">
        {loading ? (
          <div style={{ color: "#aaa", textAlign: "center", marginTop: 24 }}>Loading...</div>
        ) : filteredTx.length === 0 ? (
          <div style={{ color: "#aaa", textAlign: "center", marginTop: 24 }}>No transactions found.</div>
        ) : (
          filteredTx.map((tx) => {
            const credited = tx.type === "add_money" && tx.meta && tx.meta.bonus ? tx.meta.bonus : tx.amount;
            const isOffer = tx.type === "add_money" && tx.meta && tx.meta.offer;
            return (
              <div className="wallet-history-card" key={tx._id}>
                <div className="wallet-history-row">
                  <span>{new Date(tx.createdAt).toLocaleDateString()}</span>
                  <span
                    className={`wallet-history-amount ${
                      tx.type === "add_money" ? "credit" : "debit"
                    }`}
                  >
                    {tx.type === "add_money" ? "+" : "-"}₹{tx.type === "add_money" ? credited : tx.amount}
                  </span>
                </div>
                <div className="wallet-history-row">
                  <span>
                    {tx.type === "add_money"
                      ? "Added to wallet"
                      : tx.type === "deduct_money"
                      ? "Deducted by admin"
                      : tx.type === "buy_key"
                      ? `Used for ${tx.productId?.name || "Product"}`
                      : ""}
                  </span>
                  <span>Status: {tx.status}</span>
                </div>
                {isOffer && (
                  <div className="wallet-history-row" style={{ color: "#22c55e", fontSize: "0.95em" }}>
                    <span>
                      <b>Offer:</b> Paid ₹{tx.amount}, Credited ₹{credited}
                    </span>
                  </div>
                )}
                <div className="wallet-history-row">
                  <span>UTR: {tx.utr || "NA"}</span>
                  <span>Contact: {tx.payerName || "NA"}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}