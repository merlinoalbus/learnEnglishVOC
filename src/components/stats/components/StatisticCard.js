// =====================================================
// 7. components/StatisticCard.js - Card Riutilizzabile
// =====================================================

import React from 'react';

const StatisticCard = ({ label, value, color = 'blue' }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-cyan-500 text-blue-100',
    emerald: 'from-emerald-500 to-green-500 text-emerald-100',
    green: 'from-green-500 to-emerald-500 text-green-100',
    purple: 'from-purple-500 to-pink-500 text-purple-100',
    yellow: 'from-yellow-500 to-orange-500 text-yellow-100',
    indigo: 'from-indigo-500 to-blue-500 text-indigo-100'
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} p-4 rounded-2xl text-white text-center shadow-xl`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm">{label}</div>
    </div>
  );
};

export default StatisticCard;