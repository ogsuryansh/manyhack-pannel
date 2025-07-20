import React, { useEffect, useState } from "react";
import { API } from "../../api";

export default function AdminUserManager() {
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [customPrices, setCustomPrices] = useState([]);
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
    const priceList = [];
    products.forEach((prod) => {
      prod.prices.forEach((pr) => {
        const custom = user.customPrices?.find(
          (p) =>
            String(p.productId) === String(prod._id) &&
            p.duration === pr.duration
        );
        priceList.push({
          productId: prod._id,
          name: prod.name,
          duration: pr.duration,
          price: custom ? custom.price : pr.price,
        });
      });
    });
    setCustomPrices(priceList);
  };

  // Update price in state
  const handlePriceChange = (idx, value) => {
    setCustomPrices((prices) =>
      prices.map((p, i) => (i === idx ? { ...p, price: value } : p))
    );
  };

  // Toggle product visibility for the user
  const handleToggleProduct = (productId) => {
    setHiddenProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  // Save custom prices, add/deduct money, and hidden products
  const handleSave = async () => {
    const customPricesToSave = customPrices.filter(
      (p) => p.price !== "" && p.price !== null && p.price !== undefined
    );
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
          <div className="admin-modal-content">
            <h4>Edit Prices, Wallet & Product Visibility for {editingUser.username}</h4>
            <table className="admin-user-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Duration</th>
                  <th>Custom Price (₹)</th>
                  <th>Hide</th>
                </tr>
              </thead>
              <tbody>
                {customPrices.map((p, idx) => (
                  <tr key={p.productId + p.duration}>
                    <td>{p.name}</td>
                    <td>{p.duration}</td>
                    <td>
                      <input
                        type="number"
                        value={p.price}
                        onChange={(e) => handlePriceChange(idx, e.target.value)}
                        style={{ width: 80 }}
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={hiddenProducts.includes(p.productId)}
                        onChange={() => handleToggleProduct(p.productId)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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