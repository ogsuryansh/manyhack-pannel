import React, { useState, useEffect } from 'react';
import { API } from '../../api';

export default function AdminPurchasesPage() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  const itemsPerPage = 50;

  // Fetch purchases data
  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: itemsPerPage,
        skip: (page - 1) * itemsPerPage,
        ...(search && { search }),
      });

      const response = await fetch(`${API}/payments/purchases?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch purchases');
      }

      const data = await response.json();
      setPurchases(data.purchases || []);
      setTotal(data.total || 0);
      setTotalRevenue(data.totalRevenue || 0);
    } catch (error) {
      console.error('Error fetching purchases:', error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, [page, search]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchPurchases();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };


  // Calculate total pages
  const totalPages = Math.ceil(total / itemsPerPage);

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Purchase Management</h1>
        <div className="admin-stats">
          <div className="stat-card">
            <h3>Total Purchases</h3>
            <p>{total.toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <h3>Total Revenue</h3>
            <p>{formatCurrency(totalRevenue)}</p>
          </div>
        </div>
      </div>

      {message.text && (
        <div className={`admin-message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div className="admin-filters">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Search by username or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-input"
          />
        </div>
        <button
          onClick={() => {
            setSearch('');
            setPage(1);
          }}
          className="admin-btn admin-btn-secondary"
        >
          Clear Filters
        </button>
      </div>

      {/* Purchases Table */}
      <div className="admin-table-container">
        {loading ? (
          <div className="admin-loading">Loading purchases...</div>
        ) : (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Purchase ID</th>
                  <th>User</th>
                  <th>Product</th>
                  <th>Duration</th>
                  <th>Qty</th>
                  <th>Amount</th>
                  <th>Purchase Date</th>
                </tr>
              </thead>
              <tbody>
                {purchases.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center' }}>
                      No purchases found.
                    </td>
                  </tr>
                ) : (
                  purchases.map((purchase) => (
                    <tr key={purchase._id}>
                      <td>
                        <code style={{ fontSize: '0.8em', color: '#888' }}>#{purchase._id.slice(-8)}</code>
                      </td>
                      <td>
                        <div>
                          <div><strong>{purchase.username || 'N/A'}</strong></div>
                          <div style={{ fontSize: '0.8em', color: '#666' }}>
                            {purchase.email || 'N/A'}
                          </div>
                          <div style={{ fontSize: '0.7em', color: '#888' }}>
                            Ref: {purchase.referralCode || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ maxWidth: '200px' }}>
                          <div style={{ 
                            fontWeight: 'bold', 
                            fontSize: '0.9em',
                            marginBottom: '4px'
                          }}>
                            {purchase.productName || 'N/A'}
                          </div>
                          {purchase.productDescription && purchase.productDescription !== 'N/A' && (
                            <div style={{ 
                              fontSize: '0.8em', 
                              color: '#666',
                              marginBottom: '4px',
                              lineHeight: '1.3'
                            }}>
                              {purchase.productDescription}
                            </div>
                          )}
                          <div style={{ 
                            fontSize: '0.75em', 
                            color: '#888'
                          }}>
                            {purchase.type === 'buy_key' && 'Key Purchase'}
                            {purchase.type === 'add_money' && 'Add Money'}
                            {purchase.type === 'deduct_money' && 'Deduct Money'}
                            {purchase.type === 'topup' && 'Top-up'}
                          </div>
                        </div>
                      </td>
                      <td>
                        {purchase.duration === '1Day' && '1 Day'}
                        {purchase.duration === '1 month' && '1 Month'}
                        {purchase.duration === '3 months' && '3 Months'}
                        {purchase.duration === '6 months' && '6 Months'}
                        {purchase.duration === '1 year' && '1 Year'}
                        {!['1Day', '1 month', '3 months', '6 months', '1 year'].includes(purchase.duration) && 
                          (purchase.duration || 'N/A')}
                      </td>
                      <td>
                        <strong>{purchase.quantity || 1}</strong>
                      </td>
                      <td>
                        <div>
                          <strong>{formatCurrency(purchase.amount || 0)}</strong>
                          {purchase.unitPrice && purchase.unitPrice > 0 && purchase.quantity > 1 && (
                            <div style={{ fontSize: '0.8em', color: '#666' }}>
                              @ {formatCurrency(purchase.unitPrice)} each
                            </div>
                          )}
                        </div>
                      </td>
                      <td>{formatDate(purchase.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="admin-pagination">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="admin-btn admin-btn-secondary"
                >
                  Previous
                </button>
                <span>
                  Page {page} of {totalPages} ({total} total purchases)
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="admin-btn admin-btn-secondary"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

      </div>

      <style jsx={true}>{`
        .admin-page {
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          flex-wrap: wrap;
          gap: 20px;
        }

        .admin-header h1 {
          margin: 0;
          color: var(--text-primary);
        }

        .admin-stats {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }

        .stat-card {
          background: var(--card-bg);
          padding: 15px 20px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          text-align: center;
          min-width: 120px;
        }

        .stat-card h3 {
          margin: 0 0 8px 0;
          font-size: 0.9em;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .stat-card p {
          margin: 0;
          font-size: 1.5em;
          font-weight: bold;
          color: var(--accent);
        }

        .admin-filters {
          display: flex;
          gap: 15px;
          margin-bottom: 20px;
          flex-wrap: wrap;
          align-items: center;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .admin-input {
          padding: 8px 12px;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          background: var(--input-bg);
          color: var(--text-primary);
          font-size: 14px;
        }

        .admin-input:focus {
          outline: none;
          border-color: var(--accent);
        }

        .admin-table-container {
          background: var(--card-bg);
          border-radius: 8px;
          border: 1px solid var(--border-color);
          overflow: hidden;
        }

        .admin-table {
          width: 100%;
          border-collapse: collapse;
        }

        .admin-table th {
          background: var(--header-bg);
          padding: 12px 8px;
          text-align: left;
          font-weight: 600;
          color: var(--text-primary);
          border-bottom: 1px solid var(--border-color);
          font-size: 0.9em;
        }

        .admin-table td {
          padding: 12px 8px;
          border-bottom: 1px solid var(--border-color);
          color: var(--text-primary);
          font-size: 0.85em;
          vertical-align: top;
        }

        .admin-table tr:hover {
          background: var(--hover-bg);
        }



        .status-badge, .type-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.7em;
          font-weight: 600;
          text-transform: uppercase;
        }

        .status-approved {
          background: #d4edda;
          color: #155724;
        }

        .status-pending {
          background: #fff3cd;
          color: #856404;
        }

        .status-rejected {
          background: #f8d7da;
          color: #721c24;
        }

        .type-purchase {
          background: #cce5ff;
          color: #004085;
        }

        .type-add-money {
          background: #d1ecf1;
          color: #0c5460;
        }

        .type-deduct-money {
          background: #f8d7da;
          color: #721c24;
        }

        .admin-pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 15px;
          padding: 20px;
          background: var(--card-bg);
          border-top: 1px solid var(--border-color);
        }

        .admin-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .admin-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .admin-btn-secondary {
          background: var(--button-secondary-bg);
          color: var(--text-primary);
          border: 1px solid var(--border-color);
        }

        .admin-btn-secondary:hover:not(:disabled) {
          background: var(--button-secondary-hover);
        }

        .admin-loading {
          text-align: center;
          padding: 40px;
          color: var(--text-secondary);
        }

        .admin-message {
          padding: 12px 16px;
          border-radius: 4px;
          margin-bottom: 20px;
        }

        .admin-message.error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        code {
          background: var(--code-bg);
          padding: 2px 6px;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
          font-size: 0.8em;
        }

        details summary {
          cursor: pointer;
          color: var(--accent);
          font-size: 0.8em;
        }

        details summary:hover {
          text-decoration: underline;
        }

        @media (max-width: 768px) {
          .admin-table-container {
            overflow-x: auto;
          }
          
          .admin-table {
            min-width: 1000px;
          }
          
          .admin-filters {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>
    </div>
  );
}
