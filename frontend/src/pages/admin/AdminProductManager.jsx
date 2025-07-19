import React, { useEffect, useState } from "react";
import { API } from "../../api";

const DURATION_OPTIONS = [
  "1 Day",
  "7 Day",
  "1 Month",
  "3 Month",
  "6 Month",
  "1 Year",
];

export default function AdminProductManager() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    prices: [{ duration: "", price: "" }],
    hot: false,
    keys: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/products`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      });
  }, []);

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handlePriceChange = (idx, field, value) => {
    setForm((prev) => {
      const prices = [...prev.prices];
      prices[idx][field] = value;
      return { ...prev, prices };
    });
  };

  const addPriceRow = () => {
    setForm((prev) => ({
      ...prev,
      prices: [...prev.prices, { duration: "", price: "" }],
    }));
  };

  const removePriceRow = (idx) => {
    setForm((prev) => ({
      ...prev,
      prices: prev.prices.filter((_, i) => i !== idx),
    }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    let productId = editingId;
    let isNew = !editingId;
    let newProduct = null;

    // Create or update product
    const url = editingId
      ? `${API}/products/${editingId}`
      : `${API}/products`;
    const method = editingId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description,
        prices: form.prices,
        hot: form.hot,
      }),
    });

    if (isNew && res.ok) {
      newProduct = await res.json();
      productId = newProduct._id;
    }

    // Bulk add keys for each duration
    if (form.keys.trim() && productId) {
      const keysArray = form.keys
        .split("\n")
        .map((k) => k.trim())
        .filter((k) => k);
      for (const price of form.prices) {
        await fetch(`${API}/keys/bulk`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId,
            duration: price.duration,
            keys: keysArray,
          }),
        });
      }
    }

    setForm({
      name: "",
      description: "",
      prices: [{ duration: "", price: "" }],
      hot: false,
      keys: "",
    });
    setEditingId(null);
    fetch(`${API}/products`)
      .then((res) => res.json())
      .then((data) => setProducts(data));
  };

  const handleEdit = (product) => {
    setForm({
      name: product.name,
      description: product.description,
      prices: product.prices,
      hot: product.hot,
      keys: "",
    });
    setEditingId(product._id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    await fetch(`${API}/products/${id}`, {
      method: "DELETE",
    });
    setProducts(products.filter((p) => p._id !== id));
  };

  // Prevent duplicate durations in the same product
  const usedDurations = form.prices.map((row) => row.duration);

  return (
    <div className="admin-product-manager">
      <h3>Product Manager</h3>
      <form className="admin-product-form" onSubmit={handleSubmit}>
        <input
          className="admin-product-input"
          name="name"
          placeholder="Product Name"
          value={form.name}
          onChange={handleFormChange}
          required
        />
        <input
          className="admin-product-input"
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleFormChange}
        />
        <label>
          <input
            type="checkbox"
            name="hot"
            checked={form.hot}
            onChange={handleFormChange}
          />{" "}
          Hot Sale
        </label>
        <div>
          <b>Durations & Prices:</b>
          {form.prices.map((row, idx) => (
            <div key={idx} className="admin-product-duration-row">
              <select
                className="admin-product-input"
                value={row.duration}
                onChange={(e) =>
                  handlePriceChange(idx, "duration", e.target.value)
                }
                required
              >
                <option value="">Select Duration</option>
                {DURATION_OPTIONS.filter(
                  (d) => !usedDurations.includes(d) || d === row.duration
                ).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <input
                className="admin-product-input"
                placeholder="Price"
                type="number"
                value={row.price}
                onChange={(e) =>
                  handlePriceChange(idx, "price", e.target.value)
                }
                required
              />
              {form.prices.length > 1 && (
                <button
                  className="admin-product-btn admin-product-btn-delete"
                  type="button"
                  onClick={() => removePriceRow(idx)}
                >
                  -
                </button>
              )}
            </div>
          ))}
          <button
            className="admin-product-btn admin-product-btn-add"
            type="button"
            onClick={addPriceRow}
          >
            + Add Duration
          </button>
        </div>
        <label>
          <b>Bulk Add Keys (one per line):</b>
          <textarea
            className="admin-product-input"
            rows={4}
            name="keys"
            value={form.keys}
            onChange={handleFormChange}
            placeholder="Paste keys here, one per line"
          />
        </label>
        <button className="admin-product-btn" type="submit">
          {editingId ? "Update Product" : "Add Product"}
        </button>
        {editingId && (
          <button
            className="admin-product-btn admin-product-btn-cancel"
            type="button"
            onClick={() => {
              setForm({
                name: "",
                description: "",
                prices: [{ duration: "", price: "" }],
                hot: false,
                keys: "",
              });
              setEditingId(null);
            }}
          >
            Cancel
          </button>
        )}
      </form>
      <hr />
      <h4>All Products</h4>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="admin-product-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Durations & Prices</th>
              <th>Hot</th>
              <th>Keys</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p._id}>
                <td>{p.name}</td>
                <td>{p.description}</td>
                <td>
                  {p.prices.map((pr, i) => (
                    <div key={i}>
                      {pr.duration}: ₹{pr.price}
                    </div>
                  ))}
                </td>
                <td>{p.hot ? "Yes" : "No"}</td>
                <td>
                  <span>View in Key Manager</span>
                </td>
                <td>
                  <button
                    className="admin-product-btn"
                    onClick={() => handleEdit(p)}
                  >
                    Edit
                  </button>
                  <button
                    className="admin-product-btn admin-product-btn-delete"
                    onClick={() => handleDelete(p._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
