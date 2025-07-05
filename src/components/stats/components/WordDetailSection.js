
// =====================================================
// 📁 FILE MANCANTE: components/WordDetailSection.js
// =====================================================
// src/components/stats/components/WordDetailSection.js

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Award } from 'lucide-react';

const WordDetailSection = ({ wordId, getWordAnalysis, localRefresh }) => {
  const wordAnalysis = getWordAnalysis ? getWordAnalysis(wordId) : null;
  
  if (!wordAnalysis) return null;

  const timelineData = wordAnalysis.attempts.map((attempt, index) => ({
    attempt: `#${index + 1}`,
    success: attempt.correct ? 100 : 0,
    hint: attempt.usedHint ? 50 : 0,
    time: Math.round(attempt.timeSpent / 1000),
    date: new Date(attempt.timestamp).toLocaleDateString('it-IT')
  }));

  return (
    <Card className="bg-white border-0 shadow-xl rounded-3xl overflow-hidden" key={`detail-${wordId}-${localRefresh}`}>
      <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
        <CardTitle className="flex items-center gap-3 text-white">
          <Award className="w-6 h-6" />
          Andamento Temporale Parola
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Timeline Chart */}
          <div>
            <h4 className="font-bold text-lg text-gray-800 mb-4">Ultimi 10 Tentativi</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={timelineData} key={`word-line-${wordId}-${localRefresh}`}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="attempt" />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'success' ? (value === 100 ? 'Corretta' : 'Sbagliata') :
                    name === 'hint' ? (value === 50 ? 'Con aiuto' : 'Senza aiuto') :
                    `${value}s`,
                    name === 'success' ? 'Risultato' :
                    name === 'hint' ? 'Aiuto' : 'Tempo'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="success" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  name="success"
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="hint" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  name="hint"
                  strokeDasharray="5 5"
                />
                <Line 
                  type="monotone" 
                  dataKey="time" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  name="time"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Statistics */}
          <div>
            <h4 className="font-bold text-lg text-gray-800 mb-4">Statistiche Dettagliate</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-xl">
                <div className="text-xl font-bold text-blue-600">{wordAnalysis.accuracy}%</div>
                <div className="text-blue-700 text-sm">Precisione</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-xl">
                <div className="text-xl font-bold text-orange-600">{wordAnalysis.hintsPercentage}%</div>
                <div className="text-orange-700 text-sm">% Aiuti</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-xl">
                <div className="text-xl font-bold text-green-600">{wordAnalysis.currentStreak}</div>
                <div className="text-green-700 text-sm">Streak Attuale</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-xl">
                <div className="text-xl font-bold text-purple-600">{wordAnalysis.avgTime}s</div>
                <div className="text-purple-700 text-sm">Tempo Medio</div>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-gray-50 rounded-xl">
              <div className="text-sm text-gray-700">
                <div className="mb-2">
                  <strong>Tentativi totali:</strong> {wordAnalysis.totalAttempts}
                </div>
                <div className="mb-2">
                  <strong>Precisione recente:</strong> {wordAnalysis.recentAccuracy}% (ultimi 5)
                </div>
                <div>
                  <strong>Stato:</strong> <span className="font-medium">{wordAnalysis.status}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WordDetailSection;
