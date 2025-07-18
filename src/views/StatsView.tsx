import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import StatsOverview from '../components/stats/StatsOverview';

export const StatsView: React.FC = React.memo(() => {
  const {
    testHistory,
    words,
    clearHistoryOnly,
    dispatch,
    forceRefresh
  } = useAppContext();

  return (
    <StatsOverview
      testHistory={testHistory}
      words={words}
      onClearHistory={clearHistoryOnly}
      onGoToMain={() => dispatch({ type: 'SET_VIEW', payload: 'main' })}
      forceUpdate={forceRefresh}
    />
  );
});

StatsView.displayName = 'StatsView';