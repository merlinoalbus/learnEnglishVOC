import React, { useState, useEffect } from 'react';
import StatsHeader from './StatsHeader';
import StatsNavigation from './StatsNavigation';
import DataManagementPanel from './DataManagementPanel';
import EmptyState from './components/EmptyState';
import type { TestHistoryItem, Word } from '../../types';


// Lazy loading delle sezioni
const OverviewSection = React.lazy(() => import('./sections/OverviewSection'));
const ChaptersSection = React.lazy(() => import('./sections/ChaptersSection'));
const WordsSection = React.lazy(() => import('./sections/WordsSection'));
const PerformanceSection = React.lazy(() => import('./sections/PerformanceSection'));
const TrendsSection = React.lazy(() => import('./sections/TrendsSection'));

interface StatsOverviewProps {
  testHistory: TestHistoryItem[];
  words: Word[];
  onClearHistory: () => void;
  onGoToMain: () => void;
  forceUpdate: number | (() => void);
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ testHistory, words, onClearHistory, onGoToMain, forceUpdate }) => {
  const [selectedView, setSelectedView] = useState<string>('overview');
  const [showDataManagement, setShowDataManagement] = useState<boolean>(false);
  const [localRefresh, setLocalRefresh] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setLocalRefresh(prev => prev + 1);
  }, [testHistory.length, typeof forceUpdate === 'function' ? 0 : forceUpdate]);

  // Wait for initial data load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000); // Give 2 seconds for data to load

    return () => clearTimeout(timer);
  }, []);

  // Show loading state initially
  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-600 dark:text-gray-400">
        Caricamento dati...
      </div>
    );
  }

  // Se non ci sono test dopo il caricamento, mostra empty state
  if (testHistory.length === 0) {
    return (
      <EmptyState 
        onGoToMain={onGoToMain}
        showDataManagement={showDataManagement}
        setShowDataManagement={setShowDataManagement}
      />
    );
  }

  const renderSelectedSection = () => {
    const commonProps = { 
      testHistory, 
      words, 
      localRefresh,
      onClearHistory 
    };

    switch (selectedView) {
      case 'overview':
        return <OverviewSection {...commonProps} />;
      case 'chapters':
        return <ChaptersSection {...commonProps} />;
      case 'words':
        return <WordsSection {...commonProps} />;
      case 'performance':
        return <PerformanceSection {...commonProps} />;
      case 'trends':
        return <TrendsSection {...commonProps} />;
      default:
        return <OverviewSection {...commonProps} />;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <StatsHeader 
        testHistory={testHistory}
        showDataManagement={showDataManagement}
        setShowDataManagement={setShowDataManagement}
        onClearHistory={onClearHistory}
      />

      <StatsNavigation 
        selectedView={selectedView}
        setSelectedView={setSelectedView}
      />

      {showDataManagement && <DataManagementPanel />}

      <React.Suspense fallback={<div className="text-center py-8 text-gray-600 dark:text-gray-400">Caricamento...</div>}>
        {renderSelectedSection()}
      </React.Suspense>
    </div>
  );
};

export default StatsOverview;