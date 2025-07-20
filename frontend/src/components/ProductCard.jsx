import React from "react";

export default function ProductCard({
  name,
  prices = [],
  price, // user-specific price (optional)
  description,
  hot,
  onBuy,
}) {
  // Find the lowest price from the prices array
  const minPrice =
    prices.length > 0
      ? Math.min(...prices.map((p) => Number(p.price) || 0))
      : null;

  const displayPrice = price !== undefined && price !== null ? price : minPrice;

  return (
    <div className="product-card">
      <div className="product-header">
        <span className="product-name">{name}</span>
        {hot && <span className="hot-sale">HOT SALE</span>}
      </div>
      <div className="product-price">
        {displayPrice !== null && <span className="inr">₹{displayPrice}</span>}
      </div>
      <div className="product-desc">
        <span>Description: </span>
        {description}
      </div>
      <button className="buy-btn" onClick={onBuy}>
        Purchase Key
      </button>
    </div>
  );
}
