import React, { useEffect, useState } from "react";
import { API } from "../api";
import { useAuth } from "../context/useAuth";
import { useNavigate } from "react-router-dom";
import AddMoneyModal from "../components/AddMoneyModal";

const AddBalancePage = () => {
  const { token, logout } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [upiId, setUpiId] = useState("");
  const [paymentEnabled, setPaymentEnabled] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("[DEBUG] User token:", token);
    if (!token) {
      setError("You must be logged in to view top-up plans. Please log in as a user.");
      setLoading(false);
      setTimeout(() => {
        logout();
        navigate("/login");
      }, 1500);
      return;
    }
    const fetchPlans = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API}/payments/topup-plans/active`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch plans. Please make sure you are logged in as a user.");
        const data = await res.json();
        setPlans(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, [token, logout, navigate]);

  useEffect(() => {
    fetch(`${API}/settings/upi`)
      .then((res) => res.json())
      .then((data) => {
        setUpiId(data.upiId?.trim() || "");
        setPaymentEnabled(data.paymentEnabled !== false);
      });
  }, []);

  const handleOfferClick = (plan) => {
    setSelectedPlan(plan);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedPlan(null);
  };

  const handleModalSuccess = () => {
    setMessage("Request submitted! Wait for admin approval.");
    setShowModal(false);
    setSelectedPlan(null);
    setTimeout(() => setMessage(""), 3500);
  };

  return (
    <div className="container mx-auto max-w-lg p-4">
      <h2 className="text-3xl font-bold mb-6 text-center">Add Balance</h2>
      <div className="mb-6 text-center text-gray-400 text-sm">
        Choose a top-up plan and get instant wallet credit. <span className="text-accent font-semibold">Special offers</span> are highlighted!
      </div>
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="loader" />
          <span className="ml-3">Loading plans...</span>
        </div>
      ) : error ? (
        <div className="alert alert-error animate-fade-in">{error}</div>
      ) : (
        <div className="space-y-4">
          {plans.length === 0 && <div className="alert alert-info">No top-up plans available.</div>}
          {plans.map((plan) => (
            <div
              key={plan._id}
              className={`transition-all duration-200 border rounded-xl p-5 flex items-center justify-between shadow-sm cursor-pointer relative bg-card hover:border-primary/60`}
              onClick={() => handleOfferClick(plan)}
            >
              <div>
                <div className="font-semibold text-lg">Pay <span className="text-primary">₹{plan.amount}</span></div>
                <div className="text-green-600 font-bold text-xl">Get ₹{plan.bonus} in wallet</div>
                {plan.bonus > plan.amount && (
                  <div className="text-xs text-green-500 font-semibold flex items-center gap-1 mt-1">
                    <span className="inline-block bg-accent text-white px-2 py-0.5 rounded-full animate-bounce">Offer</span>
                    Bonus: ₹{plan.bonus - plan.amount}
                  </div>
                )}
              </div>
              <span className="ml-2 text-primary font-bold text-lg animate-fade-in">→</span>
            </div>
          ))}
        </div>
      )}
      {message && <div className="alert alert-success animate-fade-in mt-6 text-center">{message}</div>}
      {error && <div className="alert alert-error animate-fade-in mt-6 text-center">{error}</div>}
      {showModal && selectedPlan && (
        <AddMoneyModal
          upiId={upiId}
          paymentEnabled={paymentEnabled}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          defaultAmount={selectedPlan.amount}
          planId={selectedPlan._id}
          bonus={selectedPlan.bonus}
        />
      )}
    </div>
  );
};

export default AddBalancePage; 