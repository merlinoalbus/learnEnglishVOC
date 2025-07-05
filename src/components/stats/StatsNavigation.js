import React from 'react';
import { Button } from '../ui/button';

const StatsNavigation = ({ selectedView, setSelectedView }) => {
  const tabs = [
    { id: 'overview', label: 'Panoramica', icon: '📈' },
    { id: 'chapters', label: 'Per Capitoli', icon: '📚' },
    { id: 'words', label: 'Per Parole', icon: '🔍' },
    { id: 'performance', label: 'Performance', icon: '🎯' },
    { id: 'trends', label: 'Tendenze', icon: '📊' }
  ];

  return (
    <div className="flex gap-2 mb-6">
      {tabs.map(tab => (
        <Button
          key={tab.id}
          onClick={() => setSelectedView(tab.id)}
          className={`px-6 py-3 rounded-xl transition-all ${
            selectedView === tab.id
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <span className="mr-2">{tab.icon}</span>
          {tab.label}
        </Button>
      ))}
    </div>
  );
};

export default StatsNavigation;
