import React, { createContext, useState, useCallback, useContext } from 'react';

export const RefreshContext = createContext();

export function RefreshProvider({ children }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = useCallback(() => {
    console.log('🔄 RefreshContext: Global refresh triggered');
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return (
    <RefreshContext.Provider value={{ refreshTrigger, triggerRefresh }}>
      {children}
    </RefreshContext.Provider>
  );
}

// Convenience hook for consumers
export function useRefresh() {
  const context = useContext(RefreshContext);
  if (!context) {
    throw new Error('useRefresh must be used within a RefreshProvider');
  }
  return context;
}
