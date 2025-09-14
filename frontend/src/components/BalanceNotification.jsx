import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';

export default function BalanceNotification() {
  const { user } = useAuth();
  const [lastBalance, setLastBalance] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  useEffect(() => {
    if (user && user.wallet) {
      const currentBalance = user.wallet
        .filter((entry) => !entry.expiresAt || new Date(entry.expiresAt) > new Date())
        .reduce((sum, entry) => sum + entry.amount, 0);

      console.log('🔔 BalanceNotification: Current balance:', currentBalance, 'Last balance:', lastBalance);

      if (lastBalance > 0 && currentBalance !== lastBalance) {
        const difference = currentBalance - lastBalance;
        const message = difference > 0 
          ? `💰 Balance increased by ₹${difference.toLocaleString()}`
          : `💸 Balance decreased by ₹${Math.abs(difference).toLocaleString()}`;
        
        console.log('🔔 BalanceNotification: Showing notification:', message);
        setNotificationMessage(message);
        setShowNotification(true);
        
        // Hide notification after 5 seconds
        setTimeout(() => {
          setShowNotification(false);
        }, 5000);
      }
      
      setLastBalance(currentBalance);
    }
  }, [user, lastBalance]);

  if (!showNotification) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      backgroundColor: '#2e7d32',
      color: 'white',
      padding: '12px 20px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      zIndex: 1000,
      fontSize: '14px',
      fontWeight: '500',
      animation: 'slideIn 0.3s ease-out'
    }}>
      {notificationMessage}
      <button
        onClick={() => setShowNotification(false)}
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          marginLeft: '10px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        ×
      </button>
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
