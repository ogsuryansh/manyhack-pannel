import React, { useEffect, useState } from "react";
import { API } from "../../api";
import { FaGift, FaRupeeSign, FaCheckCircle, FaTimesCircle, FaEdit, FaTrash } from "react-icons/fa";

const getAdminToken = () => localStorage.getItem("adminToken");

const AdminTopUpPlanManager = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ amount: "", bonus: "", isActive: true });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchPlans = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/payments/topup-plans`, {
        headers: { Authorization: `Bearer ${getAdminToken()}` },
      });
      if (!res.ok) throw new Error("Unable to fetch plans. Make sure you are logged in as admin.");
      const data = await res.json();
      setPlans(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId
        ? `${API}/payments/topup-plans/${editingId}`
        : `${API}/payments/topup-plans`;
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAdminToken()}`,
        },
        body: JSON.stringify({
          amount: Number(form.amount),
          bonus: Number(form.bonus),
          isActive: form.isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save plan");
      setMessage(editingId ? "Plan updated" : "Plan created");
      setForm({ amount: "", bonus: "", isActive: true });
      setEditingId(null);
      fetchPlans();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleEdit = (plan) => {
    setForm({
      amount: plan.amount,
      bonus: plan.bonus,
      isActive: plan.isActive,
    });
    setEditingId(plan._id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this plan?")) return;
    setError("");
    setMessage("");
    try {
      const res = await fetch(`${API}/payments/topup-plans/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getAdminToken()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete");
      setMessage("Plan deleted");
      fetchPlans();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(""), 3000);
    }
  };

  return (
    <div className="admin-topup-bg max-w-3xl mx-auto p-4">
      <h2 className="text-3xl font-bold mb-6 text-center">Top-Up Plans Manager</h2>
      <div className="mb-6 text-center text-gray-400 text-sm">
        Create, edit, or remove top-up offers. <span className="text-accent font-semibold">Active plans</span> are visible to users.
      </div>
      <form onSubmit={handleSubmit} className="mb-8 bg-card p-6 rounded-xl shadow-md space-y-4 animate-fade-in">
        <div className="admin-topup-form-row flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[160px]">
            <label className="block mb-1 font-medium">Amount (₹)</label>
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              required
              className="buykey-input w-full"
              min="1"
              placeholder="Enter amount"
            />
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="block mb-1 font-medium">Bonus (₹ credited)</label>
            <input
              type="number"
              name="bonus"
              value={form.bonus}
              onChange={handleChange}
              required
              className="buykey-input w-full"
              min="1"
              placeholder="Enter bonus"
            />
          </div>
          <div className="flex items-center min-w-[100px] mb-2" style={{height: '100%'}}>
            <label className="inline-flex items-center mt-6">
              <input
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={handleChange}
                className="mr-2"
              />
              Active
            </label>
          </div>
        </div>
        <div className="flex gap-3 mt-2">
          <button
            type="submit"
            className="add-money-btn text-lg px-8 py-2 rounded-lg shadow-md"
          >
            {editingId ? "Update Plan" : "Add Plan"}
          </button>
          {editingId && (
            <button
              type="button"
              className="offer-btn text-lg px-6 py-2 rounded-lg"
              onClick={() => {
                setEditingId(null);
                setForm({ amount: "", bonus: "", isActive: true });
              }}
            >
              Cancel
            </button>
          )}
        </div>
        {error && <div className="alert alert-error animate-fade-in mt-2">{error}</div>}
        {message && <div className="alert alert-success animate-fade-in mt-2">{message}</div>}
      </form>
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="loader" />
          <span className="ml-3">Loading plans...</span>
        </div>
      ) : (
        <div className="admin-topup-card-list grid grid-cols-1 sm:grid-cols-2 gap-6 animate-fade-in">
          {plans.length === 0 && <div className="alert alert-info col-span-2">No top-up plans found.</div>}
          {plans.map((plan) => (
            <div
              key={plan._id}
              className={`admin-topup-card flex flex-col gap-2 p-5 rounded-2xl shadow-md bg-card border-2 transition-all duration-200 ${plan.isActive ? "border-primary" : "border-gray-500"}`}
              style={{ borderColor: plan.bonus > plan.amount ? "var(--accent)" : plan.isActive ? "var(--primary)" : "#888" }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="admin-topup-icon flex items-center justify-center rounded-full bg-primary/10 p-3">
                  {plan.bonus > plan.amount ? (
                    <FaGift size={26} className="text-accent" />
                  ) : (
                    <FaRupeeSign size={26} className="text-primary" />
                  )}
                </div>
                <div>
                  <div className="font-semibold text-lg flex items-center gap-1 mb-1">
                    Pay <span className="text-primary">₹{plan.amount}</span>
                  </div>
                  <div className="text-green-600 font-bold text-xl flex items-center gap-1 mb-1">
                    Get ₹{plan.bonus} in wallet
                  </div>
                  {plan.bonus > plan.amount && (
                    <div className="text-xs text-green-500 font-semibold flex items-center gap-2 mt-1 mb-1">
                      <span className="inline-block bg-accent text-white px-2 py-0.5 rounded-full animate-bounce font-bold shadow-sm">OFFER</span>
                      <span>Bonus: ₹{plan.bonus - plan.amount}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-sm mt-2 mb-1">
                    {plan.isActive ? (
                      <FaCheckCircle className="text-green-500" />
                    ) : (
                      <FaTimesCircle className="text-gray-400" />
                    )}
                    {plan.isActive ? "Active" : "Inactive"}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-auto pt-2 admin-topup-btn-row">
                <button
                  className="admin-topup-action-btn"
                  title="Edit"
                  onClick={() => handleEdit(plan)}
                >
                  <FaEdit />
                </button>
                <button
                  className="admin-topup-action-btn admin-topup-delete"
                  title="Delete"
                  onClick={() => handleDelete(plan._id)}
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminTopUpPlanManager; 