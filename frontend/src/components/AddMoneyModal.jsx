import React, { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Link } from "react-router-dom";
import { API } from "../api";

export default function AddMoneyModal({ upiId, onClose, paymentEnabled = true, onSuccess }) {
  const [amount, setAmount] = useState("");
  const [utr, setUtr] = useState("");
  const [contactDetail, setContactDetail] = useState("");
  const [success, setSuccess] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [copied, setCopied] = useState(false);

  const upiLink =
    upiId && amount > 0
      ? `upi://pay?pa=${upiId}&pn=shashwat&am=${amount}&cu=INR`
      : "";

  const canSubmit = amount > 0 && utr && contactDetail && agreed;

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

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
      <div className="upi-modal-content" style={{ maxHeight: "90vh", overflowY: "auto" }}>
        <button className="buykey-btn buykey-btn-cancel upi-modal-close" onClick={onClose}>
          Cancel
        </button>
        <h3>Add Money to Wallet</h3>
        {!paymentEnabled ? (
          <div className="upi-payment-offline">
            <b style={{ color: "#ff6b81", fontSize: "1.1rem" }}>
              Admin is offline. You cannot add money right now.
            </b>
            <div style={{ marginTop: 12 }}>
              You can use your existing wallet balance. Please try adding money later.
            </div>
          </div>
        ) : (
          <>
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
                <div className="upi" style={{ textAlign: "center", marginTop: 8 }}>
                  <a href={upiLink} className="upi-link" target="_blank" rel="noopener noreferrer">
                    👉 Pay ₹{amount} via UPI
                  </a>
                </div>
                <div className="upi-id-copy-box">
                  <span className="upi-id-label">UPI ID:</span>
                  <span className="upi-id-value">{upiId}</span>
                  <button className="upi-id-copy-btn" onClick={handleCopyUPI}>
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <div className="upi-instruction">
                  <b>
                    If QR is not working, copy the UPI ID above and pay manually in your UPI app.
                  </b>
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
                <b>Contact Detail (Phone):</b>
                <input
                  type="tel"
                  className="buykey-input"
                  value={contactDetail}
                  onChange={e => setContactDetail(e.target.value)}
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
          </>
        )}
      </div>
    </div>
  );
}