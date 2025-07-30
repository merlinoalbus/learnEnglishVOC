import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import StatsOverview from '../components/stats/StatsOverview';

export const StatsView: React.FC = React.memo(() => {
  const {
    testHistory,
    words,
    clearAllStatistics, // ⭐ RENAMED: from clearHistoryOnly to clearAllStatistics
    dispatch,
    forceRefresh
  } = useAppContext();

  return (
    <StatsOverview
      testHistory={testHistory}
      words={words}
      onClearAllStatistics={clearAllStatistics} // ⭐ RENAMED: from onClearHistory to onClearAllStatistics
      onGoToMain={() => dispatch({ type: 'SET_VIEW', payload: 'main' })}
      forceUpdate={forceRefresh}
    />
  );
});

StatsView.displayName = 'StatsView';