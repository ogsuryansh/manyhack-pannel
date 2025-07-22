import React, { useEffect, useState } from "react";
import { API } from "../../api";
import { useAuth } from "../../context/useAuth";
import { useNavigate } from "react-router-dom";

export default function AdminOfferManager() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // offer being edited or null
  const [form, setForm] = useState({ amount: "", bonus: "", description: "", isActive: true });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (user === null) return; // wait for user to load
    if (!user?.isAdmin) {
      navigate("/admin-login");
      return;
    }
    fetchOffers();
    // eslint-disable-next-line
  }, [user]);

  const fetchOffers = async () => {
    setLoading(true);
    const res = await fetch(`${API}/topup-offers/admin`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    const data = await res.json();
    setOffers(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const handleInput = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddOrEdit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!form.amount || !form.bonus) {
      setError("Amount and bonus are required.");
      return;
    }
    const payload = {
      amount: Number(form.amount),
      bonus: Number(form.bonus),
      description: form.description,
      isActive: form.isActive,
    };
    let res, data;
    if (editing) {
      res = await fetch(`${API}/topup-offers/admin/${editing._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });
      data = await res.json();
      if (res.ok) setSuccess("Offer updated!");
    } else {
      res = await fetch(`${API}/topup-offers/admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });
      data = await res.json();
      if (res.ok) setSuccess("Offer added!");
    }
    if (!res.ok) setError(data.message || "Failed to save offer.");
    setForm({ amount: "", bonus: "", description: "", isActive: true });
    setEditing(null);
    fetchOffers();
  };

  const handleEdit = (offer) => {
    setEditing(offer);
    setForm({
      amount: offer.amount,
      bonus: offer.bonus,
      description: offer.description || "",
      isActive: offer.isActive,
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this offer?")) return;
    const res = await fetch(`${API}/topup-offers/admin/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (res.ok) setSuccess("Offer deleted!");
    else setError("Failed to delete offer.");
    fetchOffers();
  };

  const handleToggle = async (offer) => {
    const res = await fetch(`${API}/topup-offers/admin/${offer._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ ...offer, isActive: !offer.isActive }),
    });
    if (res.ok) setSuccess("Offer status updated!");
    else setError("Failed to update status.");
    fetchOffers();
  };

  return (
    <div className="admin-offer-manager" style={{ maxWidth: 700, margin: "40px auto", padding: 16 }}>
      <h2 className="section-title">Admin: Manage Top-up Offers</h2>
      <form onSubmit={handleAddOrEdit} style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 24 }}>
        <input
          type="number"
          name="amount"
          className="buykey-input"
          placeholder="Amount (user pays)"
          value={form.amount}
          onChange={handleInput}
          required
          min={1}
          style={{ width: 120 }}
        />
        <input
          type="number"
          name="bonus"
          className="buykey-input"
          placeholder="Bonus (wallet credit)"
          value={form.bonus}
          onChange={handleInput}
          required
          min={1}
          style={{ width: 120 }}
        />
        <input
          type="text"
          name="description"
          className="buykey-input"
          placeholder="Description (optional)"
          value={form.description}
          onChange={handleInput}
          style={{ width: 180 }}
        />
        <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <input
            type="checkbox"
            name="isActive"
            checked={form.isActive}
            onChange={e => setForm({ ...form, isActive: e.target.checked })}
          />
          Active
        </label>
        <button className="buykey-btn buykey-btn-primary" type="submit">
          {editing ? "Update Offer" : "Add Offer"}
        </button>
        {editing && (
          <button className="buykey-btn buykey-btn-cancel" type="button" onClick={() => { setEditing(null); setForm({ amount: "", bonus: "", description: "", isActive: true }); }}>
            Cancel
          </button>
        )}
      </form>
      {error && <div className="buykey-error">{error}</div>}
      {success && <div className="buykey-success">{success}</div>}
      <div className="offer-list" style={{ marginTop: 24 }}>
        {loading ? (
          <div>Loading offers...</div>
        ) : offers.length === 0 ? (
          <div>No offers found.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--card-bg)", borderBottom: "2px solid var(--border)" }}>
                <th style={{ padding: 8 }}>Amount</th>
                <th style={{ padding: 8 }}>Bonus</th>
                <th style={{ padding: 8 }}>Description</th>
                <th style={{ padding: 8 }}>Status</th>
                <th style={{ padding: 8 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((offer) => (
                <tr key={offer._id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: 8 }}>₹{offer.amount}</td>
                  <td style={{ padding: 8 }}>₹{offer.bonus}</td>
                  <td style={{ padding: 8 }}>{offer.description || `₹${offer.amount} = ₹${offer.bonus}`}</td>
                  <td style={{ padding: 8 }}>
                    <span style={{ color: offer.isActive ? "#22c55e" : "#ff6b81", fontWeight: 600 }}>
                      {offer.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ padding: 8 }}>
                    <button className="buykey-btn" style={{ marginRight: 6 }} onClick={() => handleEdit(offer)}>Edit</button>
                    <button className="buykey-btn buykey-btn-cancel" style={{ marginRight: 6 }} onClick={() => handleDelete(offer._id)}>Delete</button>
                    <button className="buykey-btn" onClick={() => handleToggle(offer)}>
                      {offer.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
} 