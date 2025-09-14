import { useEffect, useRef } from 'react';
import { useAuth } from '../context/useAuth';
import { API } from '../api';

export function useBalanceSync() {
  const { user, refreshUser } = useAuth();
  const lastBalanceRef = useRef(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    const syncBalance = async () => {
      try {
        // Get current balance from server
        const response = await fetch(`${API}/auth/me`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const userData = await response.json();
          const currentBalance = userData.wallet
            ? userData.wallet
                .filter((entry) => !entry.expiresAt || new Date(entry.expiresAt) > new Date())
                .reduce((sum, entry) => sum + entry.amount, 0)
            : 0;

          // Check if balance changed
          if (lastBalanceRef.current > 0 && currentBalance !== lastBalanceRef.current) {
            console.log('🔄 Balance changed detected:', {
              from: lastBalanceRef.current,
              to: currentBalance,
              difference: currentBalance - lastBalanceRef.current
            });
            
            // Refresh user data to update all components
            await refreshUser();
          }
          
          lastBalanceRef.current = currentBalance;
        }
      } catch (error) {
        console.error('❌ Balance sync error:', error);
      }
    };

    // Initial sync
    syncBalance();

    // Set up interval for periodic sync
    intervalRef.current = setInterval(syncBalance, 5000); // Check every 5 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user, refreshUser]);

  return {
    syncBalance: async () => {
      if (user) {
        await refreshUser();
      }
    }
  };
}
