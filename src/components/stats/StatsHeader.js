import React from 'react';
import { Card, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { BarChart3, Database } from 'lucide-react';
import { useStatsData } from './hooks/useStatsData';
import StatisticCard from './components/StatisticCard';

const StatsHeader = ({ 
  testHistory, 
  showDataManagement, 
  setShowDataManagement,
  onClearHistory 
}) => {
  const { advancedStats } = useStatsData(testHistory);

  const mainStats = [
    { label: 'Test Completati', value: advancedStats.totalTests, color: 'blue' },
    { label: '📚 Parole Studiate', value: advancedStats.totalWordsStudied, color: 'emerald' },
    { label: 'Media', value: `${advancedStats.averageScore}%`, color: 'green' },
    { label: 'Record', value: `${advancedStats.bestScore}%`, color: 'purple' },
    { label: 'Aiuti', value: advancedStats.totalHints, color: 'yellow' },
    { label: '% Aiuti', value: `${advancedStats.hintsPercentage}%`, color: 'indigo' }
  ];

  return (
    <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border-0 shadow-2xl rounded-3xl overflow-hidden">
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-1">
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6">
          <div className="flex justify-between items-center mb-6">
            <CardTitle className="flex items-center gap-3 text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              <BarChart3 className="w-8 h-8 text-purple-600" />
              Analisi Avanzata dell'Apprendimento
              <span className="text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                Live: {testHistory.length} test
              </span>
            </CardTitle>
            
            <div className="flex gap-2">
              <Button
                onClick={() => setShowDataManagement(!showDataManagement)}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-4 py-2 rounded-xl"
              >
                <Database className="w-4 h-4 mr-2" />
                Gestione Dati
              </Button>
              <Button
                onClick={onClearHistory}
                variant="outline"
                className="border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
              >
                🗑️ Pulisci Cronologia ({testHistory.length})
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {mainStats.map((stat, index) => (
              <StatisticCard 
                key={index}
                label={stat.label}
                value={stat.value}
                color={stat.color}
              />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default StatsHeader;