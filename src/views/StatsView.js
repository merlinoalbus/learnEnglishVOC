import React from 'react';
import { useAppContext } from '../contexts/AppContext'; // ✅ Fixed: named export
import StatsOverview from '../components/StatsOverview'; // ✅ Fixed: default import

export const StatsView = React.memo(() => {
  const {
    testHistory,
    words,
    clearHistoryOnly,
    dispatch,
    forceUpdate
  } = useAppContext();

  return (
    <StatsOverview
      testHistory={testHistory}
      words={words}
      onClearHistory={clearHistoryOnly}
      onGoToMain={() => dispatch({ type: 'SET_VIEW', payload: 'main' })}
      forceUpdate={forceUpdate}
    />
  );
});