import React, { useEffect, useState } from "react";
import { API } from "../../api";
import { useAuth } from "../../context/useAuth";

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

export default function AdminUserManager() {
  const { refreshUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [addAmount, setAddAmount] = useState("");
  const [userPurchases, setUserPurchases] = useState({});
  const [userContacts, setUserContacts] = useState({});
  const [hiddenProducts, setHiddenProducts] = useState([]);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch]);

  // Function to refresh user data after balance changes
  const refreshUserData = async () => {
    try {
      // Refresh the current user's data if they're logged in
      await refreshUser();
      
      // Also refresh the users list to show updated balances
      const usersRes = await fetch(`${API}/admin/users`, { credentials: 'include' });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  // Fetch users and products with pagination and search
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${API}/admin/users?limit=${pageSize}&skip=${page*pageSize}&search=${encodeURIComponent(debouncedSearch)}`, { credentials: 'include' })
        .then(async (res) => {
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
          }
          return res.json();
        }),
      fetch(`${API}/products`, { credentials: 'include' })
        .then(async (res) => {
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
          }
          return res.json();
        }),
    ]).then(([usersData, productsData]) => {
      setUsers(usersData.users || []);
      setTotal(usersData.total || 0);
      setProducts(productsData || []);
      setLoading(false);
    }).catch((error) => {
      console.error('Error fetching data:', error);
      setUsers([]);
      setTotal(0);
      setProducts([]);
      setLoading(false);
      setMessage({ type: "error", text: error.message || "Failed to load data" });
    });
  }, [page, debouncedSearch]);

  // Fetch purchases and contact for each user
  useEffect(() => {
    users.forEach((user) => {
      fetch(`${API}/keys/user/${user._id}`, { credentials: 'include' })
        .then((res) => (res.ok ? res.json() : []))
        .then((keys) => {
          setUserPurchases((prev) => ({
            ...prev,
            [user._id]: Array.isArray(keys)
              ? keys.map((k) => k.productId?.name || "NA")
              : [],
          }));
        });
      fetch(`${API}/payments/user/${user._id}`, { credentials: 'include' })
        .then((res) => (res.ok ? res.json() : []))
        .then((payments) => {
          const latest = Array.isArray(payments)
            ? payments.find(
                (p) =>
                  p.type === "add_money" &&
                  p.status === "approved" &&
                  p.payerName
              )
            : null;
          setUserContacts((prev) => ({
            ...prev,
            [user._id]: latest?.payerName || "NA",
          }));
        });
    });
  }, [users]);

  // Open price editor for a user (per product+duration)
  const handleEditPrices = (user) => {
    setEditingUser(user);
    setAddAmount("");
    setHiddenProducts(user.hiddenProducts || []);
    setSelectedProduct("");
    setSelectedDuration("");
    setCustomPrice("");
    setMessage({ type: "", text: "" });
  };

  // When product or duration changes, set the custom price
  useEffect(() => {
    if (!editingUser || !selectedProduct || !selectedDuration) {
      setCustomPrice("");
      return;
    }
    const prod = products.find((p) => p._id === selectedProduct);
    const pr = prod?.prices.find((pr) => pr.duration === selectedDuration);
    const custom = editingUser.customPrices?.find(
      (p) =>
        String(p.productId) === String(selectedProduct) &&
        p.duration === selectedDuration
    );
    setCustomPrice(custom ? custom.price : pr?.price || "");
  }, [selectedProduct, selectedDuration, editingUser, products]);

  // Save custom price, add/deduct money, and hidden products
  const handleSave = async () => {
    try {
    let customPricesToSave = editingUser.customPrices || [];
    if (selectedProduct && selectedDuration && customPrice !== "") {
      const idx = customPricesToSave.findIndex(
        (p) =>
          String(p.productId) === String(selectedProduct) &&
          p.duration === selectedDuration
      );
      if (idx > -1) {
        customPricesToSave[idx].price = customPrice;
      } else {
        customPricesToSave.push({
          productId: selectedProduct,
          duration: selectedDuration,
          price: customPrice,
        });
      }
    }
      
    const res = await fetch(
      `${API}/admin/users/${editingUser._id}/custom-prices`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
          credentials: 'include', // Important for session cookies
        body: JSON.stringify({
          customPrices: customPricesToSave,
          balance: addAmount ? Number(addAmount) : 0,
          hiddenProducts,
        }),
      }
      );
      
      if (res.ok) {
        setMessage({ type: "success", text: "User updated successfully!" });
        // Refresh user data to reflect balance changes everywhere
        await refreshUserData();
      } else {
        const errorData = await res.json().catch(() => ({}));
        setMessage({ type: "error", text: errorData.message || "Failed to update user." });
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setMessage({ type: "error", text: error.message || "Failed to update user." });
    } finally {
      setEditingUser(null);
    }
  };

  // Delete a user
  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    
    try {
      const res = await fetch(`${API}/admin/users/${userId}`, {
        method: "DELETE",
        credentials: 'include'
      });
      
      if (res.ok) {
        setUsers(users.filter((u) => u._id !== userId));
        setMessage({ type: "success", text: "User deleted successfully!" });
      } else {
        const errorData = await res.json().catch(() => ({}));
        setMessage({ type: "error", text: errorData.message || "Failed to delete user." });
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      setMessage({ type: "error", text: error.message || "Failed to delete user." });
    }
  };

  // Calculate wallet balance (non-expired)
  const getWalletBalance = (user) => {
    const now = new Date();
    return user.wallet
      ? user.wallet
          .filter(
            (entry) => !entry.expiresAt || new Date(entry.expiresAt) > now
          )
          .reduce((sum, entry) => sum + entry.amount, 0)
      : 0;
  };

  // Toggle product visibility for the user
  const handleToggleProduct = (productId) => {
    setHiddenProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  // Get durations for selected product
  const durations =
    products.find((p) => p._id === selectedProduct)?.prices.map((pr) => pr.duration) || [];

  // Remove client-side filteredUsers, use users directly from backend

  return (
    <div>
      <h3 style={{ marginBottom: 24 }}>Manage Users</h3>
      <div style={{ marginBottom: 16, textAlign: "right" }}>
        <input
          className="admin-product-input"
          style={{ width: 220 }}
          type="text"
          placeholder="Search by username"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="admin-user-table-container">
          <table className="admin-user-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Email</th>
                <th>Username</th>
                <th>Register Time</th>
                <th>Total Balance</th>
                <th>Purchases</th>
                <th>Contact</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center" }}>
                    No users found.
                  </td>
                </tr>
              )}
              {users.map((user) => (
                <tr key={user._id}>
                  <td>{user._id || "NA"}</td>
                  <td>{user.email || "NA"}</td>
                  <td>{user.username || "NA"}</td>
                  <td>
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleString()
                      : "NA"}
                  </td>
                  <td>₹{getWalletBalance(user)}</td>
                  <td>
                    {userPurchases[user._id] && userPurchases[user._id].length > 0
                      ? userPurchases[user._id].join(", ")
                      : "NA"}
                  </td>
                  <td>{userContacts[user._id] || "NA"}</td>
                  <td>
                    <button 
                      className="admin-user-action-btn"
                      onClick={() => handleEditPrices(user)}
                    >
                      Edit Prices/Wallet
                    </button>
                    <button
                      className="admin-user-delete-btn"
                      onClick={() => handleDeleteUser(user._id)}
                    >
                      Delete User
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h4 style={{ marginTop: 32 }}>Hidden Products</h4>
      <table className="admin-user-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Hidden Product(s)</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user._id}>
              <td>{user.username}</td>
              <td>
                {user.hiddenProducts && user.hiddenProducts.length > 0
                  ? user.hiddenProducts
                      .map(
                        (pid) =>
                          products.find((p) => String(p._id) === String(pid))
                            ?.name || "Unknown"
                      )
                      .join(", ")
                  : "None"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 16, textAlign: "center" }}>
        <button 
          className="admin-user-action-btn"
          onClick={() => setPage(page-1)} 
          disabled={page===0}
        >
          Previous
        </button>
        <span style={{ margin: "0 12px" }}>Page {page+1} of {Math.ceil(total/pageSize)}</span>
        <button 
          className="admin-user-action-btn"
          onClick={() => setPage(page+1)} 
          disabled={(page+1)*pageSize >= total}
        >
          Next
        </button>
      </div>

      {editingUser && (
        <div className="admin-modal">
          <div
            className="admin-modal-content"
            style={{ maxHeight: "80vh", overflowY: "auto" }}
          >
            <h4>
              Edit Prices, Wallet & Product Visibility for {editingUser.username}
            </h4>
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
            {/* Custom price editor for selected product */}
            <div style={{ marginBottom: 24 }}>
              <b>Custom Prices for Selected Product:</b>
              <div style={{ margin: '8px 0' }}>
                <label>
                  <b>Product:</b>
                  <select
                    className="admin-product-input"
                    value={selectedProduct}
                    onChange={e => {
                      setSelectedProduct(e.target.value);
                      setSelectedDuration("");
                      setCustomPrice("");
                    }}
                  >
                    <option value="">Select Product</option>
                    {products.map((prod) => (
                      <option key={prod._id} value={prod._id}>
                        {prod.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {selectedProduct && (
                <table className="admin-user-table" style={{ marginTop: 8 }}>
                  <thead>
                    <tr>
                      <th>Duration</th>
                      <th>Custom Price (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products
                      .find((p) => p._id === selectedProduct)
                      ?.prices.map((pr) => {
                        const idx =
                          editingUser.customPrices?.findIndex(
                            (p) =>
                              String(p.productId) === String(selectedProduct) &&
                              p.duration === pr.duration
                          ) ?? -1;
                        const value =
                          idx > -1
                            ? editingUser.customPrices[idx].price
                            : pr.price;
                        return (
                          <tr key={pr.duration}>
                            <td>{pr.duration}</td>
                            <td>
                              <input
                                type="number"
                                className="admin-product-input"
                                value={value}
                                onChange={e => {
                                  const val = e.target.value;
                                  setEditingUser((prev) => {
                                    const cp = prev.customPrices ? [...prev.customPrices] : [];
                                    const idx = cp.findIndex(
                                      (p) =>
                                        String(p.productId) === String(selectedProduct) &&
                                        p.duration === pr.duration
                                    );
                                    if (idx > -1) {
                                      cp[idx].price = val;
                                    } else {
                                      cp.push({ productId: selectedProduct, duration: pr.duration, price: val });
                                    }
                                    return { ...prev, customPrices: cp };
                                  });
                                }}
                                style={{ width: 80 }}
                              />
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              )}
            </div>
            {/* Hide products with Select All */}
            <div style={{ marginBottom: 24 }}>
              <b>Hide Products for User:</b>
              <div style={{ marginTop: 8 }}>
                <label style={{ marginRight: 16 }}>
                  <input
                    type="checkbox"
                    checked={
                      hiddenProducts.length === products.length && products.length > 0
                    }
                    onChange={e => {
                      if (e.target.checked) {
                        setHiddenProducts(products.map(p => p._id));
                      } else {
                        setHiddenProducts([]);
                      }
                    }}
                  />
                  Select All
                </label>
                {products.map((prod) => (
                  <label key={prod._id} style={{ marginRight: 16 }}>
                    <input
                      type="checkbox"
                      checked={hiddenProducts.includes(prod._id)}
                      onChange={() => {
                        setHiddenProducts((prev) =>
                          prev.includes(prod._id)
                            ? prev.filter((id) => id !== prod._id)
                            : [...prev, prod._id]
                        );
                      }}
                    />
                    {prod.name}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ margin: "16px 0" }}>
              <label>
                <b>Add/Deduct Money to Wallet:</b>{" "}
                <input
                  type="number"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  style={{ width: 100 }}
                  placeholder="Amount (e.g. 10 or -10)"
                />
                <span style={{ marginLeft: 12, color: "#aaa" }}>
                  (Positive to add, negative to deduct, expires in 60 days)
                </span>
              </label>
            </div>
            <div style={{ margin: "16px 0" }}>
              <b>Wallet Entries:</b>
              <ul>
                {editingUser.wallet && editingUser.wallet.length > 0 ? (
                  editingUser.wallet.map((entry, i) => (
                    <li key={i}>
                      ₹{entry.amount} (expires: {entry.expiresAt ? new Date(entry.expiresAt).toLocaleDateString() : "Never"})
                    </li>
                  ))
                ) : (
                  <li>No wallet entries</li>
                )}
              </ul>
            </div>
            <button
              className="admin-user-save-btn"
              disabled={isSaving}
              onClick={async () => {
                try {
                  if (isSaving) return;
                  setIsSaving(true);
                  // Save all custom prices and hidden products in one go
                  const res = await fetch(
                    `${API}/admin/users/${editingUser._id}/custom-prices`,
                    {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      credentials: 'include', // Important for session cookies
                      body: JSON.stringify({
                        customPrices: editingUser.customPrices,
                        balance: addAmount ? Number(addAmount) : 0,
                        hiddenProducts,
                      }),
                    }
                  );
                  
                  if (res.ok) {
                    setMessage({ type: "success", text: "User updated successfully!" });
                    // Refresh user data to reflect balance changes everywhere
                    await refreshUserData();
                  } else {
                    const errorData = await res.json().catch(() => ({}));
                    setMessage({ type: "error", text: errorData.message || "Failed to update user." });
                  }
                } catch (error) {
                  console.error('Error updating user:', error);
                  setMessage({ type: "error", text: error.message || "Failed to update user." });
                } finally {
                  setIsSaving(false);
                  setEditingUser(null);
                }
              }}
            >
              {isSaving ? 'Saving…' : 'Save All'}
            </button>
            <button 
              className="admin-user-cancel-btn"
              onClick={() => { if (!isSaving) setEditingUser(null); }}
              disabled={isSaving}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}