import React, { useEffect, useState } from "react";
import { API } from "../api";
import { useAuth } from "../context/useAuth";
import { QRCodeCanvas } from "qrcode.react";

export default function OfferAddPage() {
  const { user } = useAuth();
  const [offers, setOffers] = useState([]);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [utr, setUtr] = useState("");
  const [payerName, setPayerName] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [upiId, setUpiId] = useState("");

  useEffect(() => {
    fetch(`${API}/topup-offers`)
      .then((res) => res.json())
      .then((data) => {
        setOffers(data);
        setLoading(false);
      });
    // Fetch UPI ID for QR
    fetch(`${API}/settings/upi`)
      .then((res) => res.json())
      .then((data) => setUpiId(data.upiId?.trim() || ""));
  }, []);

  const upiLink =
    upiId && selectedOffer
      ? `upi://pay?pa=${upiId}&pn=Topup&am=${selectedOffer.amount}&cu=INR`
      : "";

  const handlePurchase = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!selectedOffer || !utr || !payerName) {
      setError("Please fill all fields and select an offer.");
      return;
    }
    const res = await fetch(`${API}/topup-offers/purchase`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        offerId: selectedOffer._id,
        utr,
        payerName,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setSuccess("Purchase request submitted! Wait for admin approval.");
      setUtr("");
      setPayerName("");
      setSelectedOffer(null);
    } else {
      setError(data.message || "Failed to submit request.");
    }
  };

  return (
    <div className="offer-add-page" style={{ maxWidth: 500, margin: "40px auto", padding: 16 }}>
      <h2 className="section-title" style={{ textAlign: "center" }}>Top-up Offers</h2>
      {loading ? (
        <div>Loading offers...</div>
      ) : offers.length === 0 ? (
        <div>No offers available right now.</div>
      ) : (
        <div className="offer-list" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {offers.map((offer) => (
            <div
              key={offer._id}
              className={`offer-card${selectedOffer?._id === offer._id ? " selected" : ""}`}
              style={{
                border: selectedOffer?._id === offer._id ? "2px solid var(--primary)" : "1.5px solid var(--border)",
                borderRadius: 12,
                padding: 18,
                background: "var(--card-bg)",
                cursor: "pointer",
              }}
              onClick={() => setSelectedOffer(offer)}
            >
              <div style={{ fontWeight: 600, fontSize: "1.1rem" }}>{offer.description || `₹${offer.amount} = ₹${offer.bonus}`}</div>
              <div style={{ color: "var(--primary)", fontWeight: 500 }}>Pay ₹{offer.amount} &rarr; Get ₹{offer.bonus} in wallet</div>
            </div>
          ))}
        </div>
      )}
      {selectedOffer && (
        <div style={{ margin: "32px 0", textAlign: "center" }}>
          <h3>Selected Offer</h3>
          <div style={{ fontWeight: 600, fontSize: "1.1rem", marginBottom: 8 }}>{selectedOffer.description || `₹${selectedOffer.amount} = ₹${selectedOffer.bonus}`}</div>
          <div style={{ color: "var(--primary)", fontWeight: 500, marginBottom: 8 }}>Pay ₹{selectedOffer.amount} &rarr; Get ₹{selectedOffer.bonus} in wallet</div>
          {upiLink && (
            <>
              <div style={{ margin: "16px 0" }}>
                <QRCodeCanvas value={upiLink} size={180} />
              </div>
              <div style={{ marginBottom: 8 }}>
                <a href={upiLink} className="upi-link" target="_blank" rel="noopener noreferrer">
                  👉 Pay ₹{selectedOffer.amount} via UPI
                </a>
              </div>
              <div style={{ color: "#888", fontSize: "0.98rem" }}>UPI ID: <b>{upiId}</b></div>
            </>
          )}
        </div>
      )}
      {user && offers.length > 0 && (
        <form className="offer-purchase-form" onSubmit={handlePurchase} style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          <label>
            <b>Selected Offer:</b> {selectedOffer ? (selectedOffer.description || `₹${selectedOffer.amount} = ₹${selectedOffer.bonus}`) : "None"}
          </label>
          <input
            className="buykey-input"
            type="text"
            placeholder="Enter UTR/Txn ID after payment"
            value={utr}
            onChange={e => setUtr(e.target.value)}
            required
          />
          <input
            className="buykey-input"
            type="tel"
            placeholder="Enter your mobile number"
            value={payerName}
            onChange={e => setPayerName(e.target.value)}
            required
            maxLength={10}
            pattern="[0-9]{10}"
          />
          <button className="buykey-btn buykey-btn-primary" type="submit" disabled={!selectedOffer || !utr || !payerName}>
            Purchase Offer
          </button>
          {error && <div className="buykey-error">{error}</div>}
          {success && <div className="buykey-success">{success}</div>}
        </form>
      )}
    </div>
  );
} 