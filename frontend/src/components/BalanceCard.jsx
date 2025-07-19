import React from "react";

export default function BalanceCard({ label, value, currency }) {
  return (
    <div className="gradient-card">
      <div className="gradient-card-inner">
        <div className="balance-label">{label}</div>
        <div className="balance-value">
          {currency === "INR" ? "₹" : "$"}
          {value}
        </div>
      </div>
    </div>
  );
}