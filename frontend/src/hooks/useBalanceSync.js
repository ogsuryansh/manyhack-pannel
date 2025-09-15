import { useEffect, useRef } from 'react';
import { useAuth } from '../context/useAuth';
import { useRefresh } from '../context/RefreshContext';
import { API } from '../api';

export function useBalanceSync() {
  const { user, refreshUser } = useAuth();
  const { refreshTrigger } = useRefresh();
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

          

          // Always refresh user data to ensure it's up to date
          if (lastBalanceRef.current !== currentBalance) {
            // Refresh user data to update all components
            await refreshUser();
          }
          
          lastBalanceRef.current = currentBalance;
        } else {
          console.error('❌ useBalanceSync: Failed to fetch user data:', response.status);
        }
      } catch (error) {
        console.error('❌ Balance sync error:', error);
      }
    };

    // Initial sync
    syncBalance();

    // Set up interval for periodic sync - check every 3 seconds for faster updates
    intervalRef.current = setInterval(syncBalance, 3000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user, refreshUser, refreshTrigger]);

  return {
    syncBalance: async () => {
      if (user) {
        await refreshUser();
      }
    }
  };
}
