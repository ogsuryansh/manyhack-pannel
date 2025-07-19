import React, { useEffect, useState } from "react";

export default function AdminKeyManager() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("");
  const [keys, setKeys] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    assigned: 0,
    expired: 0,
  });
  const [bulkKeys, setBulkKeys] = useState("");
  const [editKeyId, setEditKeyId] = useState(null);
  const [editKeyValue, setEditKeyValue] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch products
  useEffect(() => {
    fetch("http://localhost:5000/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data));
  }, []);

  // Fetch keys and stats for selected product+duration
  useEffect(() => {
    if (!selectedProduct || !selectedDuration) {
      setKeys([]);
      setStats({ total: 0, available: 0, assigned: 0, expired: 0 });
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      fetch(
        `http://localhost:5000/api/keys?productId=${selectedProduct}&duration=${encodeURIComponent(
          selectedDuration
        )}`
      ).then((res) => res.json()),
      fetch(
        `http://localhost:5000/api/keys/stats?productId=${selectedProduct}&duration=${encodeURIComponent(
          selectedDuration
        )}`
      ).then((res) => res.json()),
    ])
      .then(([keysData, statsData]) => {
        setKeys(keysData);
        setStats(statsData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedProduct, selectedDuration]);

  // Get durations for selected product
  const durations =
    products
      .find((p) => p._id === selectedProduct)
      ?.prices.map((pr) => pr.duration) || [];

  // Bulk add keys
  const handleBulkAdd = async (e) => {
    e.preventDefault();
    if (!selectedProduct || !selectedDuration || !bulkKeys.trim()) return;
    const keysArray = bulkKeys
      .split("\n")
      .map((k) => k.trim())
      .filter((k) => k);
    const res = await fetch("http://localhost:5000/api/keys/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: selectedProduct,
        duration: selectedDuration,
        keys: keysArray,
      }),
    });
    if (res.ok) {
      setBulkKeys("");
      setLoading(true);
      Promise.all([
        fetch(
          `http://localhost:5000/api/keys?productId=${selectedProduct}&duration=${encodeURIComponent(
            selectedDuration
          )}`
        ).then((res) => res.json()),
        fetch(
          `http://localhost:5000/api/keys/stats?productId=${selectedProduct}&duration=${encodeURIComponent(
            selectedDuration
          )}`
        ).then((res) => res.json()),
      ])
        .then(([keysData, statsData]) => {
          setKeys(keysData);
          setStats(statsData);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  };

  // Delete key
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this key?")) return;
    await fetch(`http://localhost:5000/api/keys/${id}`, { method: "DELETE" });
    setKeys(keys.filter((k) => k._id !== id));
  };

  // Start editing a key
  const handleEditKey = (key) => {
    setEditKeyId(key._id);
    setEditKeyValue(key.key);
  };

  // Save edited key
  const handleSaveEditKey = async (id) => {
    await fetch(`http://localhost:5000/api/keys/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: editKeyValue }),
    });
    setKeys(keys.map((k) => (k._id === id ? { ...k, key: editKeyValue } : k)));
    setEditKeyId(null);
    setEditKeyValue("");
  };

  return (
    <div className="admin-key-manager">
      <h3>Key Manager</h3>
      <div className="admin-key-manager-controls">
        <select
          className="admin-key-manager-select"
          value={selectedProduct}
          onChange={(e) => {
            setSelectedProduct(e.target.value);
            setSelectedDuration("");
            setKeys([]);
          }}
        >
          <option value="">Select Product</option>
          {products.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          className="admin-key-manager-select"
          value={selectedDuration}
          onChange={(e) => setSelectedDuration(e.target.value)}
          disabled={!selectedProduct}
        >
          <option value="">Select Duration</option>
          {durations.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>
      <form className="admin-key-bulk-form" onSubmit={handleBulkAdd}>
        <textarea
          className="admin-key-bulk-textarea"
          placeholder="Paste keys here, one per line"
          value={bulkKeys}
          onChange={(e) => setBulkKeys(e.target.value)}
          rows={6}
        />
        <button
          className="admin-key-bulk-btn"
          type="submit"
          disabled={!selectedProduct || !selectedDuration}
        >
          Add Keys
        </button>
      </form>
      <div className="admin-key-stats">
        <span>
          Total: <b>{stats.total}</b>
        </span>
        <span>
          Available: <b>{stats.available}</b>
        </span>
        <span>
          Assigned: <b>{stats.assigned}</b>
        </span>
        <span>
          Expired: <b>{stats.expired}</b>
        </span>
      </div>
      <h4>Keys</h4>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="admin-key-table">
          <thead>
            <tr>
              <th>Key</th>
              <th>Assigned To</th>
              <th>Assigned At</th>
              <th>Expires At</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {keys.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center" }}>
                  No keys found.
                </td>
              </tr>
            )}
            {keys.map((k) => (
              <tr key={k._id}>
                <td>
                  {editKeyId === k._id ? (
                    <>
                      <input
                        className="admin-key-edit-input"
                        value={editKeyValue}
                        onChange={(e) => setEditKeyValue(e.target.value)}
                      />
                      <button
                        className="admin-key-edit-btn"
                        onClick={() => handleSaveEditKey(k._id)}
                      >
                        Save
                      </button>
                      <button
                        className="admin-key-edit-btn admin-key-edit-cancel"
                        onClick={() => setEditKeyId(null)}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    k.key || "NA"
                  )}
                </td>
                <td>
                  {k.assignedTo
                    ? k.assignedTo.username || k.assignedTo.email
                    : "NA"}
                </td>
                <td>
                  {k.assignedAt
                    ? new Date(k.assignedAt).toLocaleString()
                    : "NA"}
                </td>
                <td>
                  {k.expiresAt ? new Date(k.expiresAt).toLocaleString() : "NA"}
                </td>
                <td>
                  {k.assignedTo
                    ? k.expiresAt && new Date(k.expiresAt) < new Date()
                      ? "Expired"
                      : "Assigned"
                    : "Available"}
                </td>
                <td>
                  <button
                    className="admin-key-edit-btn"
                    onClick={() => handleEditKey(k)}
                  >
                    Edit
                  </button>
                  <button
                    className="admin-key-delete-btn"
                    onClick={() => handleDelete(k._id)}
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
