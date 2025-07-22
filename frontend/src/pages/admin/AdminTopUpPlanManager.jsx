import React, { useEffect, useState } from "react";
import { API } from "../../api";

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
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-3xl font-bold mb-6 text-center">Top-Up Plans Manager</h2>
      <div className="mb-6 text-center text-gray-400 text-sm">
        Create, edit, or remove top-up offers. <span className="text-accent font-semibold">Active plans</span> are visible to users.
      </div>
      <form onSubmit={handleSubmit} className="mb-8 bg-card p-6 rounded-xl shadow-md space-y-4 animate-fade-in">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[120px]">
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
          <div className="flex-1 min-w-[120px]">
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
          <div className="flex items-center min-w-[100px] mt-6">
            <label className="inline-flex items-center">
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
        <div className="bg-card rounded-xl shadow-md p-4 animate-fade-in">
          <table className="w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border-b text-left">Amount</th>
                <th className="p-2 border-b text-left">Bonus</th>
                <th className="p-2 border-b text-center">Active</th>
                <th className="p-2 border-b text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan._id} className="transition-all hover:bg-primary/10">
                  <td className="p-2 font-semibold text-primary">₹{plan.amount}</td>
                  <td className="p-2 font-semibold text-green-600">
                    ₹{plan.bonus}
                    {plan.bonus > plan.amount && (
                      <span className="ml-2 inline-block bg-accent text-white px-2 py-0.5 rounded-full text-xs animate-bounce">Offer</span>
                    )}
                  </td>
                  <td className="p-2 text-center">{plan.isActive ? "✅" : "❌"}</td>
                  <td className="p-2 text-center">
                    <button
                      className="add-money-btn px-4 py-1 text-sm mr-2"
                      onClick={() => handleEdit(plan)}
                    >
                      Edit
                    </button>
                    <button
                      className="offer-btn px-4 py-1 text-sm"
                      onClick={() => handleDelete(plan._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {plans.length === 0 && <div className="alert alert-info mt-4">No top-up plans found.</div>}
        </div>
      )}
    </div>
  );
};

export default AdminTopUpPlanManager; 