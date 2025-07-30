import React from 'react';
import { Card, CardTitle } from '../ui/card';
import { BarChart3 } from 'lucide-react';
import { useStats } from '../../hooks/data/useStats';
import StatisticCard from './components/StatisticCard';
import type { TestHistoryItem } from '../../types';

type ColorType = 'blue' | 'emerald' | 'green' | 'purple' | 'yellow' | 'indigo';

interface StatsHeaderProps {
  testHistory: TestHistoryItem[];
}

const StatsHeader: React.FC<StatsHeaderProps> = ({ 
  testHistory
}) => {
  const { stats, calculatedStats, getAllWordsPerformance, testHistory: dbTestHistory, getDetailedTestSessions, correctStatsData, detailedSessions } = useStats();
  
  // ⭐ USA I DATI CORRETTI DAL SERVICE
  const {
    testCompletati,
    paroleStudiate,
    mediaCorretta,
    recordScore,
    aiutiTotali,
    maxHintsPercentage
  } = correctStatsData;

  // Logs removed as requested

  const mainStats: Array<{label: string; value: string | number; color: ColorType}> = [
    { label: 'Test Completati', value: testCompletati, color: 'blue' },
    { label: '📚 Parole Studiate', value: paroleStudiate, color: 'emerald' },
    { label: 'Media', value: `${mediaCorretta}%`, color: 'green' },
    { label: 'Record', value: `${recordScore}%`, color: 'purple' },
    { label: 'Aiuti', value: aiutiTotali, color: 'yellow' },
    { label: '% Aiuti', value: `${maxHintsPercentage}%`, color: 'indigo' }
  ];

  return (
    <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border-0 shadow-2xl rounded-3xl overflow-hidden">
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-1">
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6">
          <div className="flex justify-center items-center mb-6">
            <CardTitle className="flex items-center gap-3 text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              <BarChart3 className="w-8 h-8 text-purple-600" />
              Analisi Avanzata dell'Apprendimento
              <span className="text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                Live: {testHistory.length} test
              </span>
            </CardTitle>
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