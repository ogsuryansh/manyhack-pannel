import React, { useEffect, useState } from "react";
import { API } from "../../api";
import DeleteConfirmationModal from "../../components/DeleteConfirmationModal";

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
  const [message, setMessage] = useState({ type: "", text: "" });
  const [allStats, setAllStats] = useState({});
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Fetch all stats once
  useEffect(() => {
    fetch(`${API}/keys/all-stats`).then(res => res.json()).then(setAllStats);
  }, []);

  // Fetch products
  useEffect(() => {
    fetch(`${API}/products`)
      .then((res) => res.json())
      .then((data) => setProducts(data));
  }, []);

  // Fetch keys for selected product+duration, calculate stats from actual keys data
  useEffect(() => {
    if (!selectedProduct || !selectedDuration) {
      setKeys([]);
      setStats({ total: 0, available: 0, assigned: 0, expired: 0 });
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(
      `${API}/keys?productId=${selectedProduct}&duration=${encodeURIComponent(selectedDuration)}`
    )
      .then((res) => res.json())
      .then((keysData) => {
        setKeys(keysData);
        
        // Calculate stats from actual keys data
        const total = keysData.length;
        const available = keysData.filter(key => !key.assignedTo).length;
        const assigned = keysData.filter(key => key.assignedTo).length;
        const expired = keysData.filter(key => 
          key.expiresAt && new Date(key.expiresAt) < new Date()
        ).length;
        
        setStats({ total, available, assigned, expired });
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
    setMessage({ type: "", text: "" });
    if (!selectedProduct || !selectedDuration || !bulkKeys.trim()) return;
    const keysArray = bulkKeys
      .split(/\r?\n|\r/g)
      .map((k) => k.trim())
      .filter((k) => k);

    const res = await fetch(`${API}/keys/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: selectedProduct,
        duration: selectedDuration,
        keys: keysArray,
      }),
    });

    if (res.ok) {
      setMessage({ type: "success", text: "Keys added successfully!" });
      setBulkKeys("");
      setLoading(true);
      fetch(
        `${API}/keys?productId=${selectedProduct}&duration=${encodeURIComponent(
          selectedDuration
        )}`
      )
        .then((res) => res.json())
        .then((keysData) => {
          setKeys(keysData);
          
          // Calculate stats from actual keys data
          const total = keysData.length;
          const available = keysData.filter(key => !key.assignedTo).length;
          const assigned = keysData.filter(key => key.assignedTo).length;
          const expired = keysData.filter(key => 
            key.expiresAt && new Date(key.expiresAt) < new Date()
          ).length;
          
          setStats({ total, available, assigned, expired });
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      const error = await res.json();
      if (
        error.message &&
        error.message.includes("duplicate key error")
      ) {
        setMessage({
          type: "error",
          text:
            "Some or all keys were duplicates and were not added. Please check your keys.",
        });
      } else {
        setMessage({ type: "error", text: error.message || "Failed to add keys." });
      }
    }
  };

  // Delete key
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this key?")) return;
    await fetch(`${API}/keys/${id}`, { method: "DELETE" });
    const updatedKeys = keys.filter((k) => k._id !== id);
    setKeys(updatedKeys);
    
    // Recalculate stats
    const total = updatedKeys.length;
    const available = updatedKeys.filter(key => !key.assignedTo).length;
    const assigned = updatedKeys.filter(key => key.assignedTo).length;
    const expired = updatedKeys.filter(key => 
      key.expiresAt && new Date(key.expiresAt) < new Date()
    ).length;
    
    setStats({ total, available, assigned, expired });
  };

  // Start editing a key
  const handleEditKey = (key) => {
    setEditKeyId(key._id);
    setEditKeyValue(key.key);
  };

  // Save edited key
  const handleSaveEditKey = async (id) => {
    await fetch(`${API}/keys/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: editKeyValue }),
    });
    const updatedKeys = keys.map((k) => (k._id === id ? { ...k, key: editKeyValue } : k));
    setKeys(updatedKeys);
    
    // Recalculate stats
    const total = updatedKeys.length;
    const available = updatedKeys.filter(key => !key.assignedTo).length;
    const assigned = updatedKeys.filter(key => key.assignedTo).length;
    const expired = updatedKeys.filter(key => 
      key.expiresAt && new Date(key.expiresAt) < new Date()
    ).length;
    
    setStats({ total, available, assigned, expired });
    setEditKeyId(null);
    setEditKeyValue("");
  };

  // Show delete confirmation modal
  const handleDeleteAll = () => {
    if (!selectedProduct || !selectedDuration) {
      setMessage({ type: "error", text: "Please select a product and duration first." });
      return;
    }
    console.log('Opening delete modal...');
    setShowDeleteModal(true);
  };

  // Confirm delete all keys
  const confirmDeleteAll = async () => {
    setDeleteAllLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch(`${API}/keys/bulk/${selectedProduct}/${encodeURIComponent(selectedDuration)}`, {
        method: "DELETE",
      });

      if (res.ok) {
        const data = await res.json();
        setMessage({ 
          type: "success", 
          text: `Successfully deleted ${data.deletedCount} keys!` 
        });
        
        // Refresh the keys list and stats
        setKeys([]);
        setStats({ total: 0, available: 0, assigned: 0, expired: 0 });
        
        // Refresh all stats
        fetch(`${API}/keys/all-stats`)
          .then(res => res.json())
          .then(setAllStats);
      } else {
        const error = await res.json();
        setMessage({ type: "error", text: error.message || "Failed to delete keys." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setDeleteAllLoading(false);
      setShowDeleteModal(false);
    }
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
      {message.text && (
        <div
          className={
            message.type === "success"
              ? "admin-key-success"
              : "admin-key-error"
          }
          style={{
            margin: "12px 0",
            textAlign: "center",
            fontWeight: 600,
            color: message.type === "success" ? "#22c55e" : "#ff6b81",
          }}
        >
          {message.text}
        </div>
      )}
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
      
      {/* Delete All Keys Button */}
      <div style={{ marginTop: "16px", textAlign: "center" }}>
        <button
          className="admin-key-delete-all-btn"
          onClick={handleDeleteAll}
          disabled={!selectedProduct || !selectedDuration || deleteAllLoading}
          style={{
            backgroundColor: "#ff4757",
            color: "white",
            border: "none",
            padding: "12px 24px",
            borderRadius: "8px",
            cursor: deleteAllLoading ? "not-allowed" : "pointer",
            opacity: (!selectedProduct || !selectedDuration || deleteAllLoading) ? 0.6 : 1,
            fontWeight: "600",
            fontSize: "14px",
            transition: "all 0.2s ease",
            position: "relative"
          }}
        >
          {deleteAllLoading ? (
            <>
              <div className="loader loader-sm" style={{ marginRight: "8px" }}></div>
              Deleting All Keys...
            </>
          ) : (
            "🗑️ Delete All Keys"
          )}
        </button>
        <div style={{ 
          fontSize: "12px", 
          color: "#666", 
          marginTop: "8px",
          maxWidth: "300px",
          margin: "8px auto 0"
        }}>
          This will delete ALL keys for the selected product and duration. This action cannot be undone!
        </div>
      </div>
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
                  {k.expiresAt ? new Date(k.expiresAt).toLocaleDateString() : "NA"}
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          console.log('Closing delete modal...');
          setShowDeleteModal(false);
        }}
        onConfirm={confirmDeleteAll}
        title="Delete All Keys"
        message={`Are you sure you want to delete ALL keys for this product and duration?\n\nThis action cannot be undone!\n\nProduct: ${products.find(p => p._id === selectedProduct)?.name}\nDuration: ${selectedDuration}`}
        confirmText="Delete All"
        cancelText="Cancel"
        isLoading={deleteAllLoading}
      />
      
      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ position: 'fixed', top: '10px', right: '10px', background: 'yellow', padding: '10px', zIndex: 9999 }}>
          Modal State: {showDeleteModal ? 'OPEN' : 'CLOSED'}
          <button onClick={() => setShowDeleteModal(true)} style={{ marginLeft: '10px' }}>
            Test Modal
          </button>
        </div>
      )}
    </div>
  );
}