import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import StatsHeader from './StatsHeader';
import StatsNavigation from './StatsNavigation';
import DataManagementPanel from './DataManagementPanel';
import EmptyState from '../stats/components/EmptyState';


// Lazy loading delle sezioni
const OverviewSection = React.lazy(() => import('./sections/OverviewSection'));
const ChaptersSection = React.lazy(() => import('./sections/ChaptersSection'));
const WordsSection = React.lazy(() => import('./sections/WordsSection'));
const PerformanceSection = React.lazy(() => import('./sections/PerformanceSection'));
const TrendsSection = React.lazy(() => import('./sections/TrendsSection'));

const StatsOverview = ({ testHistory, words, onClearHistory, onGoToMain, forceUpdate }) => {
  const [selectedView, setSelectedView] = useState('overview');
  const [showDataManagement, setShowDataManagement] = useState(false);
  const [localRefresh, setLocalRefresh] = useState(0);

  useEffect(() => {
    setLocalRefresh(prev => prev + 1);
  }, [testHistory.length, forceUpdate]);

  // Se non ci sono test, mostra empty state
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

      <React.Suspense fallback={<div className="text-center py-8">Caricamento...</div>}>
        {renderSelectedSection()}
      </React.Suspense>
    </div>
  );
};

export default StatsOverview;