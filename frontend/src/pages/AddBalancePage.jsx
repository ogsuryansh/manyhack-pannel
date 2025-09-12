import React, { useEffect, useState } from "react";
import { API } from "../api";
import { useAuth } from "../context/useAuth";
import { useNavigate } from "react-router-dom";
import AddMoneyModal from "../components/AddMoneyModal";
import { FaWallet, FaGift, FaRupeeSign } from "react-icons/fa";

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
    <div className="add-balance-bg min-h-screen flex flex-col items-center justify-center py-8 px-2">
      <div className="add-balance-header text-center mb-8 animate-fade-in">
        <div className="flex items-center justify-center gap-3 mb-2">
          <FaWallet size={32} className="text-primary" />
          <h2 className="text-3xl font-bold">Add Balance</h2>
        </div>
        <div className="text-gray-400 text-base max-w-md mx-auto">
          Choose a top-up plan and get instant wallet credit. <span className="text-accent font-semibold">Special offers</span> are highlighted!
        </div>
      </div>
      <div className="w-full max-w-2xl">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="loader" />
            <span className="ml-3">Loading plans...</span>
          </div>
        ) : error ? (
          <div className="alert alert-error animate-fade-in">{error}</div>
        ) : (
          <div className="add-balance-card-list grid grid-cols-1 sm:grid-cols-2 gap-6 animate-fade-in">
            {plans.length === 0 && <div className="alert alert-info col-span-2">No top-up plans available.</div>}
            {plans.map((plan) => (
              <div
                key={plan._id}
                className={`add-balance-card group transition-all duration-200 border-2 rounded-2xl p-6 flex flex-col items-start justify-between shadow-md cursor-pointer relative bg-card hover:border-primary/80 hover:scale-[1.025]`}
                onClick={() => handleOfferClick(plan)}
                style={{ boxShadow: "0 4px 24px 0 rgba(44,62,80,0.10)", borderColor: plan.bonus > plan.amount ? "var(--accent)" : "var(--primary)" }}
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="add-balance-icon flex items-center justify-center rounded-full bg-primary/10 p-3 mr-2">
                    {plan.bonus > plan.amount ? (
                      <FaGift size={28} className="text-accent" />
                    ) : (
                      <FaRupeeSign size={28} className="text-primary" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-lg flex items-center gap-1">
                      Pay <span className="text-primary">₹{plan.amount}</span>
                    </div>
                    <div className="text-green-600 font-bold text-xl flex items-center gap-1">
                      Get ₹{plan.bonus} in wallet
                    </div>
                  </div>
                </div>
                {plan.bonus > plan.amount && (
                  <div className="text-xs text-green-500 font-semibold flex items-center gap-2 mt-1 mb-2">
                    <span className="inline-block bg-accent text-white px-2 py-0.5 rounded-full animate-bounce font-bold shadow-sm">OFFER</span>
                    <span>Bonus: ₹{plan.bonus - plan.amount}</span>
                    <span className="ml-1 text-yellow-400 font-bold">Best Value</span>
                  </div>
                )}
                <div className="flex w-full justify-end mt-2">
                  <span className="text-primary font-bold text-2xl group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            ))}
          </div>
        )}
        {message && <div className="alert alert-success animate-fade-in mt-6 text-center">{message}</div>}
        {error && <div className="alert alert-error animate-fade-in mt-6 text-center">{error}</div>}
      </div>
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