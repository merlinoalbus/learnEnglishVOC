import React from 'react';

const WordPerformanceCard = ({ word, isSelected, onClick }) => {
  const getStatusColor = (status) => {
    const colors = {
      critical: 'bg-red-500',
      inconsistent: 'bg-orange-500',
      struggling: 'bg-yellow-500',
      promising: 'bg-blue-500',
      improving: 'bg-green-500',
      consolidated: 'bg-emerald-500',
      new: 'bg-gray-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusLabel = (status) => {
    const labels = {
      critical: '🔴 Critica',
      inconsistent: '🟠 Instabile',
      struggling: '🟡 In difficoltà',
      promising: '🔵 Promettente',
      improving: '🟢 Migliorando',
      consolidated: '🟢 Consolidata',
      new: '⚪ Nuova'
    };
    return labels[status] || '⚪ Sconosciuto';
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
        isSelected 
          ? 'border-blue-500 bg-blue-50 shadow-lg' 
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <div className="font-bold text-lg text-gray-800">{word.english}</div>
            <div className="text-gray-600">{word.italian}</div>
            {word.chapter && (
              <div className="text-sm text-blue-600">📖 Capitolo {word.chapter}</div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{word.accuracy}%</div>
            <div className="text-blue-700 text-xs">Precisione</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">{word.hintsPercentage}%</div>
            <div className="text-orange-700 text-xs">Aiuti</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">{word.currentStreak}</div>
            <div className="text-green-700 text-xs">Streak</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">{word.avgTime}s</div>
            <div className="text-purple-700 text-xs">Tempo Medio</div>
          </div>
          
          <div className={`px-3 py-1 rounded-full text-white text-sm font-medium ${getStatusColor(word.status)}`}>
            {getStatusLabel(word.status)}
          </div>
        </div>
      </div>
      
      <div className="mt-3 text-sm text-gray-500">
        {word.totalAttempts} tentativi • Ultimo: {word.lastAttempt ? new Date(word.lastAttempt.timestamp).toLocaleDateString('it-IT') : 'Mai'}
      </div>
    </div>
  );
};

export default WordPerformanceCard;