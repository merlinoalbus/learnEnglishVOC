import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { MainView } from '../views/MainView';
import { TestView } from '../views/TestView';
import { ResultsView } from '../views/ResultsView';
import { StatsView } from '../views/StatsView';

export const AppRouter = () => {
  const { currentView, testMode, showResults } = useAppContext();

  // Test in corso
  if (testMode) {
    return <TestView />;
  }

  // Risultati test
  if (showResults) {
    return <ResultsView />;
  }

  // Viste principali
  switch (currentView) {
    case 'stats':
      return <StatsView />;
    case 'main':
    default:
      return <MainView />;
  }
};