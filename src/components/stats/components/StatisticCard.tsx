// =====================================================
// 7. components/StatisticCard.js - Card Riutilizzabile
// =====================================================

import React from 'react';

type ColorType = 'blue' | 'emerald' | 'green' | 'purple' | 'yellow' | 'indigo';

interface StatisticCardProps {
  label: string;
  value: string | number;
  color?: ColorType;
}

const StatisticCard: React.FC<StatisticCardProps> = ({ label, value, color = 'blue' }) => {
  const colorClasses: Record<ColorType, string> = {
    blue: 'from-blue-500 to-cyan-500 dark:from-blue-600 dark:to-cyan-600 text-blue-100',
    emerald: 'from-emerald-500 to-green-500 dark:from-emerald-600 dark:to-green-600 text-emerald-100',
    green: 'from-green-500 to-emerald-500 dark:from-green-600 dark:to-emerald-600 text-green-100',
    purple: 'from-purple-500 to-pink-500 dark:from-purple-600 dark:to-pink-600 text-purple-100',
    yellow: 'from-yellow-500 to-orange-500 dark:from-yellow-600 dark:to-orange-600 text-yellow-100',
    indigo: 'from-indigo-500 to-blue-500 dark:from-indigo-600 dark:to-blue-600 text-indigo-100'
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} p-4 rounded-2xl text-white text-center shadow-xl`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm">{label}</div>
    </div>
  );
};

export default StatisticCard;