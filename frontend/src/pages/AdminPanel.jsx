import React from "react";

export default function AdminPanel() {
  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: 24 }}>
      <h2 className="section-title" style={{ textAlign: "center" }}>Admin Panel</h2>
      <div style={{ textAlign: "center", marginTop: 32 }}>
        <p>Welcome, Admin! Here you can manage products, keys, users, and more.</p>
        {/* Add links/buttons to manage products, keys, users, coupons, etc. */}
      </div>
    </div>
  );
}