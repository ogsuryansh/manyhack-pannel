import React from "react";

export default function ProductCard({
  name,
  prices = [],
  price, // user-specific price (optional)
  description,
  hot,
  onBuy,
  available, // number of available keys as a prop
  user,
}) {
  // Find the lowest price from the prices array
  const minPrice =
    prices.length > 0
      ? Math.min(...prices.map((p) => Number(p.price) || 0))
      : null;

  const displayPrice = price !== undefined && price !== null ? price : minPrice;

  return (
    <div className="product-card" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div>
        <div className="product-header">
          <span className="product-name">{name}</span>
          {hot && <span className="hot-sale">HOT SALE</span>}
        </div>
        <div className="product-price">
          {user ? (
            displayPrice !== null && (
              <span>
                <b>Price:</b> <span className="inr">₹{displayPrice}</span>
              </span>
            )
          ) : (
            <span>
              <b>Price:</b>{" "}
              <span style={{ color: "var(--primary)", textDecoration: "underline", cursor: "pointer" }}>
                Login to see price
              </span>
            </span>
          )}
        </div>
        <div className="product-desc">
          <span>Description: </span>
          {description}
        </div>
      </div>
      <button
        className={`buy-btn${available === 0 ? " out-of-stock" : ""}`}
        onClick={onBuy}
        disabled={available === 0}
        style={{ marginTop: "auto" }}
      >
        {available === 0 ? "OUT OF STOCK" : "Purchase Key"}
      </button>
    </div>
  );
}