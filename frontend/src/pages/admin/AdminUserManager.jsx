import React, { useEffect, useState } from "react";
import { API } from "../../api";

export default function AdminUserManager() {
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [addAmount, setAddAmount] = useState("");
  const [userPurchases, setUserPurchases] = useState({});
  const [userContacts, setUserContacts] = useState({});
  const [hiddenProducts, setHiddenProducts] = useState([]);

  // Fetch users and products
  useEffect(() => {
    Promise.all([
      fetch(`${API}/admin/users`).then((res) => res.json()),
      fetch(`${API}/products`).then((res) => res.json()),
    ]).then(([usersData, productsData]) => {
      setUsers(usersData);
      setProducts(productsData);
      setLoading(false);
    });
  }, []);

  // Fetch purchases and contact for each user
  useEffect(() => {
    users.forEach((user) => {
      fetch(`${API}/keys/user/${user._id}`)
        .then((res) => (res.ok ? res.json() : []))
        .then((keys) => {
          setUserPurchases((prev) => ({
            ...prev,
            [user._id]: Array.isArray(keys)
              ? keys.map((k) => k.productId?.name || "NA")
              : [],
          }));
        });
      fetch(`${API}/payments/user/${user._id}`)
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
    let customPricesToSave = editingUser.customPrices || [];
    // Update or add the custom price for the selected product+duration
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
    await fetch(
      `${API}/admin/users/${editingUser._id}/custom-prices`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customPrices: customPricesToSave,
          balance: addAmount ? Number(addAmount) : 0,
          hiddenProducts,
        }),
      }
    );
    setEditingUser(null);
    fetch(`${API}/admin/users`)
      .then((res) => res.json())
      .then((data) => setUsers(data));
  };

  // Delete a user
  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    await fetch(`${API}/admin/users/${userId}`, {
      method: "DELETE",
    });
    setUsers(users.filter((u) => u._id !== userId));
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

  return (
    <div>
      <h3 style={{ marginBottom: 24 }}>Manage Users</h3>
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
                  <td>
                    {userContacts[user._id] || "NA"}
                  </td>
                  <td>
                    <button onClick={() => handleEditPrices(user)}>
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

      {/* Modal for editing prices, wallet, and product visibility */}
      {editingUser && (
        <div className="admin-modal">
          <div className="admin-modal-content" style={{ maxHeight: "80vh", overflowY: "auto" }}>
            <h4>Edit Prices, Wallet & Product Visibility for {editingUser.username}</h4>
            <div style={{ marginBottom: 16 }}>
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
              <div style={{ marginBottom: 16 }}>
                <label>
                  <b>Duration:</b>
                  <select
                    className="admin-product-input"
                    value={selectedDuration}
                    onChange={e => setSelectedDuration(e.target.value)}
                  >
                    <option value="">Select Duration</option>
                    {durations.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}
            {selectedProduct && selectedDuration && (
              <div style={{ marginBottom: 16 }}>
                <label>
                  <b>Custom Price (₹):</b>
                  <input
                    className="admin-product-input"
                    type="number"
                    value={customPrice}
                    onChange={e => setCustomPrice(e.target.value)}
                    style={{ width: 100 }}
                  />
                </label>
              </div>
            )}
            {selectedProduct && (
              <div style={{ marginBottom: 16 }}>
                <label>
                  <b>Hide this product for user:</b>{" "}
                  <input
                    type="checkbox"
                    checked={hiddenProducts.includes(selectedProduct)}
                    onChange={() => handleToggleProduct(selectedProduct)}
                  />
                </label>
              </div>
            )}
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
                      ₹{entry.amount} (expires:{" "}
                      {entry.expiresAt
                        ? new Date(entry.expiresAt).toLocaleDateString()
                        : "Never"}
                      )
                    </li>
                  ))
                ) : (
                  <li>No wallet entries</li>
                )}
              </ul>
            </div>
            <button onClick={handleSave}>Save</button>
            <button onClick={() => setEditingUser(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}