import React, { useEffect, useState } from "react";
import BalanceCard from "../components/BalanceCard";
import ProductCard from "../components/ProductCard";
import { useAuth } from "../context/useAuth";
import { useNavigate } from "react-router-dom";
import { API } from "../api";
import AddMoneyModal from "../components/AddMoneyModal";

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [availableKeys, setAvailableKeys] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [upiId, setUpiId] = useState("");
  const [notice, setNotice] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API}/products`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
        data.forEach((product) => {
          const duration = product.prices?.[0]?.duration;
          if (duration) {
            fetch(`${API}/keys/stats?productId=${product._id}&duration=${encodeURIComponent(duration)}`)
              .then(res => res.json())
              .then(stats => {
                setAvailableKeys(prev => ({
                  ...prev,
                  [product._id]: stats.available || 0
                }));
              });
          }
        });
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch(`${API}/settings/upi`)
      .then((res) => res.json())
      .then((data) => setUpiId(data.upiId?.trim() || ""));
  }, []);

  // Fetch notice
  useEffect(() => {
    fetch(`${API}/notice`)
      .then(res => res.json())
      .then(data => setNotice(data.text || ""));
  }, []);

  const now = new Date();
  const inrBalance = user?.wallet
    ? user.wallet
        .filter((entry) => !entry.expiresAt || new Date(entry.expiresAt) > now)
        .reduce((sum, entry) => sum + entry.amount, 0)
    : 0;
  const usdBalance = user?.usdBalance ?? 0;

  const handleBuy = (product) => {
    navigate("/buy", { state: { selectedProduct: product.name } });
  };

  // Hide products for this user
  const hiddenProducts = user?.hiddenProducts?.map(id => String(id)) || [];

  return (
    <div className="dashboard">
      {notice && (
        <div
          className="dashboard-notice-marquee"
          style={{
            background: "#2e2e2e",
            color: "#ff6b81",
            border: "2px solid #ff6b81",
            fontWeight: 700,
            fontSize: "1.08rem",
            borderRadius: 8,
            margin: "18px 0 28px 0",
            padding: "10px 0",
            boxShadow: "0 2px 8px #0002",
            textAlign: "center",
            animation: "marquee 18s linear infinite"
          }}
        >
          <span>{notice}</span>
        </div>
      )}
      {!user && (
        <div style={{ color: "rgb(220,20,60)", marginBottom: 16 }}>
          Login to see your balance.
        </div>
      )}
      <div className="balance-row" style={{ alignItems: "center" }}>
        <BalanceCard label="INR Balance" value={inrBalance} currency="INR" />
        <BalanceCard label="USD Balance" value={usdBalance} currency="USD" />
        {user && (
          <button
            className="add-money-btn"
            onClick={() => setShowAddMoney(true)}
          >
            + Add Money
          </button>
        )}
      </div>
      <h2 className="section-title">Available Products</h2>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="product-list">
          {products
            .filter(
              (p) =>
                !user ||
                !hiddenProducts.includes(String(p._id)) // Hide if in user's hiddenProducts
            )
            .map((p, i) => {
              let userPrice = null;
              if (user && user.customPrices && user.customPrices.length > 0) {
                const custom = user.customPrices.find(
                  (cp) => String(cp.productId) === String(p._id)
                );
                if (custom) userPrice = custom.price;
              }
              // OUT OF STOCK logic only for logged-in users
              const outOfStock =
                user && (availableKeys[p._id] || 0) === 0;
              return (
                <ProductCard
                  key={i}
                  {...p}
                  price={userPrice}
                  available={user ? availableKeys[p._id] || 0 : 1} // always available for guests
                  onBuy={() => handleBuy(p)}
                  user={user}
                  outOfStock={outOfStock}
                />
              );
            })}
        </div>
      )}
      {showAddMoney && (
        <AddMoneyModal
          upiId={upiId}
          onClose={() => setShowAddMoney(false)}
          onSuccess={refreshUser}
        />
      )}
    </div>
  );
}