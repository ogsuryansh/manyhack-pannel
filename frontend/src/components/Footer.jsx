import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="main-footer">
      <div className="footer-links">
        <a
          href="https://t.me/legitsells66"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-btn"
        >
          Contact Admin
        </a>
        <Link to="/refund-policy" className="footer-btn">
          Refund Policy
        </Link>
        <Link to="/terms-policy" className="footer-btn">
          Terms & Policy
        </Link>
      </div>
      <div className="footer-center">
        © 2025 <b>GamingGarage</b>. All rights reserved.
      </div>
    </footer>
  );
}