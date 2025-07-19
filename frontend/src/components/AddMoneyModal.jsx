import React, { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Link } from "react-router-dom";

export default function AddMoneyModal({ upiId, onClose, onSuccess }) {
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
        <button className="buykey-btn buykey-btn-cancel upi-modal-close" onClick={onClose}>
          Cancel
        </button>
        <h3>Add Money to Wallet</h3>
        <input
          className="buykey-input"
          type="number"
          min={1}
          placeholder="Enter amount"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          required
        />
        {upiLink && (
          <>
            <div className="qr">
              <QRCodeCanvas value={upiLink} size={200} />
            </div>
            <div className="upi" style={{ textAlign: "center" }}>
              <a href={upiLink} className="upi-link" target="_blank" rel="noopener noreferrer">
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
              onChange={e => setUtr(e.target.value)}
              placeholder="Enter UTR/Txn ID"
              required
            />
          </label>
          <label>
            <b>Contact Detail (Telegram/Phone):</b>
            <input
              className="buykey-input"
              value={contactDetail}
              onChange={e => setContactDetail(e.target.value)}
              placeholder="Enter your contact detail"
              required
            />
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              style={{ width: 18, height: 18 }}
            />
            <span>
              I agree to the{" "}
              <Link to="/terms-policy" target="_blank" style={{ color: "var(--primary)" }}>
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