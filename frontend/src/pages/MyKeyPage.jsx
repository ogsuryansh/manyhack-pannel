import React, { useEffect, useState } from "react";
import { useAuth } from "../context/useAuth";
import { API } from "../api";


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
                  <b>Purchased:</b> {k.assignedAt ? new Date(k.assignedAt).toLocaleString() : "NA"}
                </span>
                <span>
                  <b>Expires:</b> {k.expiresAt ? new Date(k.expiresAt).toLocaleString() : "NA"}
                </span>
              </div>
              <div className="mykey-row">
                <span>
                  <b>Countdown:</b>{" "}
                  {k.expiresAt ? <ExpiryCountdown expiry={k.expiresAt} /> : "NA"}
                </span>
              </div>
              <div className="mykey-row">
                <span style={{ fontSize: "0.85em", color: "#888" }}>
                  Your real countdown will start when you started using your key.
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
