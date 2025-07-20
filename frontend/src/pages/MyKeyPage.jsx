import React, { useEffect, useState } from "react";
import { useAuth } from "../context/useAuth";
import { API } from "../api";

const TELEGRAM_CHANNEL_URL = "https://t.me/+5lW1baqq4a5hYWRl";
const TELEGRAM_DM_URL = "https://t.me/legitsells66";

function ExpiryCountdown({ expiry }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    function updateCountdown() {
      const now = new Date();
      const end = new Date(expiry);
      const diff = end - now;
      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      setTimeLeft(`${days}d ${hours}h ${mins}m`);
    }
    updateCountdown();
    const timer = setInterval(updateCountdown, 60000);
    return () => clearInterval(timer);
  }, [expiry]);

  return <span className="mykey-expiry">{timeLeft}</span>;
}

export default function MyKeyPage() {
  const { user } = useAuth();
  const [myKeys, setMyKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedKeyId, setCopiedKeyId] = useState(null);

  useEffect(() => {
    if (!user) return;
    fetch(`${API}/keys/user`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setMyKeys(data);
        setLoading(false);
      });
  }, [user]);

  const handleCopy = (key, id) => {
    navigator.clipboard.writeText(key);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 1500);
  };

  return (
    <div className="mykey-page">
      <h2 className="section-title" style={{ textAlign: "center" }}>My Keys</h2>
      {/* Only show Telegram message if user has at least one key */}
      {myKeys.length > 0 && (
        <div className="mykey-telegram-box">
          <div>
            <b>JOIN THIS TELEGRAM CHANNEL</b> for your loader APK and search the loader you purchased.
            <br />
            <button
              className="mykey-telegram-btn"
              onClick={() => window.open(TELEGRAM_CHANNEL_URL, "_blank")}
            >
              <TelegramIcon />
              <span style={{ marginLeft: 8 }}>Join Channel</span>
            </button>
          </div>
          <div style={{ marginTop: 8 }}>
            Everything is uploaded there: <b>setup, loader APK, process</b>.<br />
            For any queries, DM me on Telegram:{" "}
            <button
              className="mykey-telegram-btn"
              onClick={() => window.open(TELEGRAM_DM_URL, "_blank")}
            >
              <TelegramIcon />
              <span style={{ marginLeft: 8 }}>t.me/legitsells66</span>
            </button>
          </div>
        </div>
      )}
      <div className="mykey-list">
        {loading ? (
          <div>Loading...</div>
        ) : myKeys.length === 0 ? (
          <div style={{ textAlign: "center", color: "#aaa" }}>No keys found.</div>
        ) : (
          myKeys.map((k) => (
            <div className="mykey-card" key={k._id}>
              <div className="mykey-row">
                <span className="mykey-product">{k.productId?.name || "NA"}</span>
                <span className="mykey-duration">{k.duration || "NA"}</span>
              </div>
              <div className="mykey-key-row">
                <div className="mykey-key-scroll">
                  <span className="mykey-key">{k.key || "NA"}</span>
                </div>
                <button
                  className="mykey-copy-btn"
                  onClick={() => handleCopy(k.key, k._id)}
                >
                  {copiedKeyId === k._id ? "Copied!" : "Copy"}
                </button>
              </div>
              <div className="mykey-row">
                <span>
                  <b>Purchased:</b> {k.assignedAt ? new Date(k.assignedAt).toLocaleDateString() : "NA"}
                </span>
                <span>
                  <b>Expires:</b> {k.expiresAt ? new Date(k.expiresAt).toLocaleDateString() : "NA"}
                </span>
              </div>
              <div className="mykey-row">
                <span>
                  <b>Countdown:</b>{" "}
                  {k.expiresAt ? <ExpiryCountdown expiry={k.expiresAt} /> : "NA"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Telegram SVG icon
function TelegramIcon() {
  return (
    <svg height="20" width="20" viewBox="0 0 240 240" style={{ verticalAlign: "middle" }}>
      <circle cx="120" cy="120" r="120" fill="#37aee2" />
      <path
        d="M100 170l-40-15 160-65-120 80 10 30 30-10 80-120-65 160-15-40z"
        fill="#fff"
      />
    </svg>
  );
}