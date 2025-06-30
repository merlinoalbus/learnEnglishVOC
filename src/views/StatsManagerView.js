import React from 'react';
import { useAppContext } from '../contexts/AppContext'; // ✅ Fixed: named export
import StatsManager from '../components/StatsManager'; // ✅ Fixed: default import

export const StatsManagerView = React.memo(() => {
  const {
    refreshData,
    forceUpdate
  } = useAppContext();

  const handleDataUpdated = React.useCallback(() => {
    setTimeout(() => {
      refreshData();
    }, 100);
  }, [refreshData]);

  return (
    <StatsManager 
      onDataUpdated={handleDataUpdated}
      forceUpdate={forceUpdate}
    />
  );
});