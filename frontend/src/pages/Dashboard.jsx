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
  const [loading, setLoading] = useState(true);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [upiId, setUpiId] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API}/products`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch(`${API}settings/upi`)
      .then((res) => res.json())
      .then((data) => setUpiId(data.upiId?.trim() || ""));
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

  return (
    <div className="dashboard">
      {!user && (
        <div style={{ color: "var(--accent)", marginBottom: 16 }}>
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
          {products.map((p, i) => {
            let userPrice = null;
            if (user && user.customPrices && user.customPrices.length > 0) {
              const custom = user.customPrices.find(
                (cp) => String(cp.productId) === String(p._id)
              );
              if (custom) userPrice = custom.price;
            }
            return (
              <ProductCard
                key={i}
                {...p}
                price={userPrice}
                onBuy={() => handleBuy(p)}
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
