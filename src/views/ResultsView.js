import React from 'react';
import { useAppContext } from '../contexts/AppContext'; // ✅ Fixed: named export
import TestResults from '../components/TestResults'; // ✅ Fixed: default import

export const ResultsView = React.memo(() => {
  const {
    stats,
    wrongWords,
    startNewTest,
    resetTest
  } = useAppContext();

  return (
    <TestResults
      stats={stats}
      wrongWords={wrongWords}
      onStartNewTest={startNewTest}
      onResetTest={resetTest}
    />
  );
});