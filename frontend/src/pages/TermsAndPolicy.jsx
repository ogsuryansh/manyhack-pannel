import React from "react";

export default function TermsAndPolicy() {
  return (
    <div className="terms-policy-page" style={{ maxWidth: 700, margin: "40px auto", padding: 24 }}>
      <h2 className="section-title" style={{ textAlign: "center" }}>Terms & Policy</h2>
      <div style={{ fontSize: "1.1rem", lineHeight: 1.7, color: "var(--text)" }}>
        <p>
          <b>By using this platform and making any payment, you agree to the following terms:</b>
        </p>
        <ul>
          <li>
            You are paying with your full willingness and understanding of the service/product you are purchasing.
          </li>
          <li>
            <b>No refunds will be provided in any case.</b>
          </li>
          <li>
            You have no right to make any legal or other action against us regarding your payment or purchase.
          </li>
          <li>
            All payments are final and non-reversible.
          </li>
        </ul>
        <p>
          If you do not agree with these terms, please do not proceed with any payment.
        </p>
      </div>
    </div>
  );
}