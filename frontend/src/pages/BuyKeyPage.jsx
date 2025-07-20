import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { QRCodeCanvas } from "qrcode.react";
import { Link } from "react-router-dom";
import { API } from "../api";

function AddMoneyModal({ upiId, onClose, onSuccess }) {
  const [amount, setAmount] = useState("");
  const [utr, setUtr] = useState("");
  const [contactDetail, setContactDetail] = useState("");
  const [success, setSuccess] = useState("");
  const [agreed, setAgreed] = useState(false);

  const upiLink =
    upiId && amount > 0
      ? `upi://pay?pa=${upiId}&pn=shashwat&am=${amount}&cu=INR`
      : "";

  const canSubmit = amount > 0 && utr && contactDetail && agreed;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API}/payments/add-money`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        amount,
        utr,
        payerName: contactDetail,
      }),
    });
    if (res.ok) {
      setSuccess("Request submitted! Wait for admin approval.");
      if (onSuccess) onSuccess();
      setTimeout(() => {
        setSuccess("");
        onClose && onClose();
      }, 2000);
    }
  };

  return (
    <div className="upi-modal">
      <div className="upi-modal-content">
        <button
          className="buykey-btn buykey-btn-cancel upi-modal-close"
          onClick={onClose}
        >
          Cancel
        </button>
        <h3>Add Money to Wallet</h3>
        <input
          className="buykey-input"
          type="number"
          min={1}
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        {upiLink && (
          <>
            <div className="qr">
              <QRCodeCanvas value={upiLink} size={200} />
            </div>
            <div className="upi" style={{ textAlign: "center" }}>
              <a
                href={upiLink}
                className="upi-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                👉 Pay ₹{amount} via UPI
              </a>
            </div>
          </>
        )}
        <form className="upi-modal-form" onSubmit={handleSubmit}>
          <label>
            <b>After payment, enter your UTR/Txn ID:</b>
            <input
              className="buykey-input"
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
              placeholder="Enter UTR/Txn ID"
              required
            />
          </label>
          <label>
            <b>Contact Detail (Phone):</b>
            <input
              type="tel"
              className="buykey-input"
              value={contactDetail}
              onChange={(e) => setContactDetail(e.target.value)}
              placeholder="Enter your mobile number"
              inputMode="numeric"
              pattern="[0-9]{10}"
              maxLength={10}
              required
            />
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={{ width: 18, height: 18 }}
            />
            <span>
              I agree to the{" "}
              <Link
                to="/terms-policy"
                target="_blank"
                style={{ color: "var(--primary)" }}
              >
                Terms & Policy
              </Link>
            </span>
          </label>
          <button className="buykey-btn" type="submit" disabled={!canSubmit}>
            Submit Payment
          </button>
        </form>
        {success && <div className="buykey-success">{success}</div>}
      </div>
    </div>
  );
}

export default function BuyKeyPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const [products, setProducts] = useState([]);
  const [product, setProduct] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [search, setSearch] = useState("");
  const [duration, setDuration] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);
  const [upiId, setUpiId] = useState("");
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [success, setSuccess] = useState("");
  const [buying, setBuying] = useState(false);
  const [available, setAvailable] = useState(null);

  const inputRef = useRef();

  useEffect(() => {
    fetch(`${API}/products`)
      .then((res) => res.json())
      .then((data) => setProducts(data));
  }, []);

  useEffect(() => {
    fetch(`${API}/settings/upi`)
      .then((res) => res.json())
      .then((data) => setUpiId(data.upiId?.trim() || ""));
  }, []);

  useEffect(() => {
    if (location.state?.selectedProduct) {
      setProduct(location.state.selectedProduct);
      setSearch(location.state.selectedProduct);
    }
  }, [location.state]);

  useEffect(() => {
    const selected = products.find((p) => p.name === product);
    if (selected && duration) {
      let userPrice = null;
      if (user && user.customPrices && user.customPrices.length > 0) {
        const custom = user.customPrices.find(
          (cp) => String(cp.productId) === String(selected._id)
        );
        if (custom) userPrice = custom.price;
      }
      if (userPrice !== null && userPrice !== undefined) {
        setPrice(userPrice);
      } else {
        const priceObj = selected.prices.find((pr) => pr.duration === duration);
        setPrice(priceObj ? priceObj.price : 0);
      }
      // Fetch available keys for this product+duration
      fetch(
        `${API}/keys/stats?productId=${
          selected._id
        }&duration=${encodeURIComponent(duration)}`
      )
        .then((res) => res.json())
        .then((stats) => setAvailable(stats.available || 0));
    } else {
      setPrice(0);
      setAvailable(null);
    }
  }, [product, duration, products, user]);

  // Calculate wallet balance (only non-expired entries)
  const now = new Date();
  const userBalance = user?.wallet
    ? user.wallet
        .filter((entry) => !entry.expiresAt || new Date(entry.expiresAt) > now)
        .reduce((sum, entry) => sum + entry.amount, 0)
    : 0;

  const durations =
    products.find((p) => p.name === product)?.prices.map((pr) => pr.duration) ||
    [];

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleProductSelect = (name) => {
    setProduct(name);
    setSearch(name);
    setShowDropdown(false);
    setDuration("");
    inputRef.current.blur();
  };

  const canBuy =
    userBalance >= price * quantity &&
    price > 0 &&
    duration &&
    available > 0 &&
    !buying;

  const handleBuyWithWallet = async () => {
    setBuying(true);
    const selected = products.find((p) => p.name === product);
    const res = await fetch(`${API}/keys/buy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        productId: selected._id,
        duration,
        quantity,
      }),
    });
    if (res.ok) {
      setSuccess("Key(s) purchased successfully!");
      await refreshUser();
      setTimeout(() => {
        setSuccess("");
        setBuying(false);
        navigate("/my-key");
      }, 2500);
    } else {
      setSuccess("Failed to purchase key(s).");
      setBuying(false);
    }
  };

  return (
    <div className="buykey-form-card">
      <div className="user-balance-box">
        <span>Balance</span>
        <span className="user-balance-amount">
          ₹{userBalance.toLocaleString()}
        </span>
      </div>
      <form className="buykey-form" onSubmit={(e) => e.preventDefault()}>
        <label className="buykey-label">Product</label>
        <div className="buykey-product-select">
          <input
            className="buykey-input"
            type="text"
            placeholder="Search for a product"
            value={search}
            ref={inputRef}
            onFocus={() => setShowDropdown(true)}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowDropdown(true);
            }}
            autoComplete="off"
          />
          {showDropdown && filteredProducts.length > 0 && (
            <div className="buykey-dropdown">
              {filteredProducts.map((p) => (
                <div
                  key={p._id}
                  className="buykey-dropdown-item"
                  onMouseDown={() => handleProductSelect(p.name)}
                >
                  {p.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <label className="buykey-label">Duration</label>
        <select
          className="buykey-input"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          disabled={!product}
        >
          <option value="">Select a duration</option>
          {durations.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <label className="buykey-label">Quantity</label>
        <input
          className="buykey-input"
          type="number"
          min={1}
          max={100}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
        <div className="buykey-hint">
          Enter the number of license keys you want to generate (max 100)
        </div>

        <div className="buykey-total">
          {price > 0 && duration && (
            <>
              Total: ₹{price * quantity} ({quantity} × ₹{price})
            </>
          )}
        </div>

        {product &&
          duration &&
          quantity > 0 &&
          price > 0 &&
          available === 0 && (
            <div className="buykey-error">
              OUT OF STOCK for this product/duration.
            </div>
          )}

        {product &&
          duration &&
          quantity > 0 &&
          price > 0 &&
          userBalance < price * quantity &&
          available > 0 && (
            <div className="buykey-error">
              Low balance! Please add at least ₹{price * quantity - userBalance}
            </div>
          )}

        {success && <div className="buykey-success">{success}</div>}

        <button
          className={`buykey-btn buykey-btn-primary${
            available === 0 ? " out-of-stock" : ""
          }`}
          type="button"
          disabled={!canBuy}
          style={{
            cursor: !canBuy ? "not-allowed" : "pointer",
          }}
          onClick={handleBuyWithWallet}
        >
          {available === 0
            ? "OUT OF STOCK"
            : buying
            ? "Processing..."
            : "Buy with Wallet"}
        </button>
        <button
          className="buykey-btn buykey-btn-cancel"
          type="button"
          onClick={() => setShowAddMoney(true)}
        >
          Add Money
        </button>
      </form>

      {/* Add Money Modal */}
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
