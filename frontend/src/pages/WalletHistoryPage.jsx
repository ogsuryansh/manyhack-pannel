import React, { useEffect, useState } from "react";
import { useAuth } from "../context/useAuth";
import { API } from "../api";
import { useBalanceSync } from "../hooks/useBalanceSync";

export default function WalletHistoryPage() {
  const { user } = useAuth();
  const { syncBalance } = useBalanceSync();
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetch(`${API}/auth/balance-history`, {
      credentials: 'include', // Important for session cookies
    })
      .then((res) => res.json())
      .then((data) => {
        setTransactions(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching balance history:', error);
        setLoading(false);
      });
  }, [user]);

  // Refresh balance history when user data changes (e.g., after admin balance changes)
  useEffect(() => {
    if (user) {
      const refreshHistory = async () => {
        try {
          const res = await fetch(`${API}/auth/balance-history`, {
            credentials: 'include',
          });
          
          if (res.ok) {
            const data = await res.json();
            const newTransactions = Array.isArray(data) ? data : [];
            
            // Only update if transactions actually changed
            if (JSON.stringify(newTransactions) !== JSON.stringify(transactions)) {
              setTransactions(newTransactions);
            } else {
              
            }
          } else {
            console.error('❌ WalletHistory: Failed to refresh balance history:', res.status);
          }
        } catch (error) {
          console.error('❌ WalletHistory: Error refreshing balance history:', error);
        }
      };

      // Refresh every 5 seconds to catch admin changes more quickly
      const interval = setInterval(refreshHistory, 5000);
      
      // Also refresh when page becomes visible (user switches back to tab)
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          refreshHistory();
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        clearInterval(interval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [user, transactions]);

  const moneyAdded = transactions
    .filter((t) => t.type === "topup" || t.type === "referral_reward")
    .reduce((sum, t) => sum + t.amount, 0);
  const moneyDeducted = transactions
    .filter((t) => t.type === "admin_adjustment" && t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const moneyUsed = transactions
    .filter((t) => t.type === "purchase")
    .reduce((sum, t) => sum + t.amount, 0);
  const netBalance = moneyAdded - moneyUsed - moneyDeducted;

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await syncBalance();
      
      // Also refresh the balance history specifically
      const res = await fetch(`${API}/auth/balance-history`, {
        credentials: 'include',
      });
      
      if (res.ok) {
        const data = await res.json();
        setTransactions(Array.isArray(data) ? data : []);
      } else {
        console.error('❌ WalletHistory: Manual refresh failed:', res.status);
      }
    } catch (error) {
      console.error('❌ WalletHistory: Manual refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const filteredTx = transactions.filter((t) => {
    if (filter === "all") return true;
    if (filter === "credited") return t.type === "topup" || t.type === "referral_reward";
    if (filter === "debited") return t.type === "purchase" || (t.type === "admin_adjustment" && t.amount < 0);
    return true;
  });

  return (
    <div className="wallet-history-page">
      <h2 className="section-title" style={{ textAlign: "center" }}>Wallet History</h2>
      <div className="wallet-history-summary">
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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
          <button
            className="wallet-filter-btn"
            onClick={handleManualRefresh}
            disabled={refreshing}
            style={{ 
              backgroundColor: refreshing ? '#666' : '#007bff',
              opacity: refreshing ? 0.7 : 1
            }}
          >
            {refreshing ? 'Refreshing...' : '🔄 Refresh'}
          </button>
        </div>
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
            const isCredit = tx.type === "topup" || tx.type === "referral_reward";
            const isDebit = tx.type === "purchase" || (tx.type === "admin_adjustment" && tx.amount < 0);
            return (
              <div className="wallet-history-card" key={tx._id}>
                <div className="wallet-history-row">
                  <span>{new Date(tx.createdAt).toLocaleDateString()}</span>
                  <span
                    className={`wallet-history-amount ${isCredit ? "credit" : "debit"}`}
                  >
                    {isCredit ? "+" : "-"}₹{Math.abs(tx.amount)}
                  </span>
                </div>
                <div className="wallet-history-row">
                  <span>
                    {tx.type === "topup"
                      ? "Top-up added to wallet"
                      : tx.type === "referral_reward"
                      ? tx.description || "Referral reward"
                      : tx.type === "purchase"
                      ? `Purchase: ${tx.description || "Product"}`
                      : tx.type === "admin_adjustment"
                      ? tx.description || "Admin adjustment"
                      : tx.description || "Transaction"}
                  </span>
                  <span>
                    {tx.type === "referral_reward" && tx.referralCode && tx.referralCode !== 'N/A' 
                      ? `Code: ${tx.referralCode}` 
                      : `Type: ${tx.type}`}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}