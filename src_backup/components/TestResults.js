// /src/components/TestResults.js
// This file contains the TestResults component, which displays the results of a vocabulary test.
// It shows the user's performance statistics, including the number of correct and incorrect answers, and provides options to start a new test or return to the menu.
// The component also highlights words that were answered incorrectly, allowing users to review and learn from their mistakes.

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Play, RotateCcw, Check, X, Trophy } from 'lucide-react';
import { getTestResult } from '../utils/textUtils';
import { formatNotes } from '../utils/textUtils';

const TestResults = ({ stats, wrongWords, onStartNewTest, onResetTest }) => {
  const result = getTestResult(stats);
  const percentage = Math.round((stats.correct / (stats.correct + stats.incorrect)) * 100);

  return (
    <div className="space-y-8">
      <Card className="relative overflow-hidden backdrop-blur-sm bg-white/90 border-0 shadow-2xl rounded-3xl">
        {/* Background animato */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 opacity-50"></div>
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
        
        <CardHeader className="relative text-center py-12">
          <div className="text-8xl mb-6 animate-bounce">
            {result.type === 'victory' ? '🏆' : 
             result.type === 'good' ? '🎉' : '📚'}
          </div>
          <CardTitle className={`text-4xl font-bold mb-4 ${result.color}`}>
            {result.message}
          </CardTitle>
          <div className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            {percentage}%
          </div>
          <p className="text-xl text-gray-600">
            {stats.correct} corrette su {stats.correct + stats.incorrect} domande
          </p>
        </CardHeader>
        
        <CardContent className="relative pb-12">
          {/* Statistiche */}
          <div className="grid grid-cols-2 gap-6 max-w-md mx-auto mb-8">
            <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-6 rounded-2xl text-white text-center shadow-xl transform hover:scale-105 transition-transform">
              <div className="text-3xl font-bold">{stats.correct}</div>
              <div className="text-green-100">Corrette</div>
              <Check className="w-8 h-8 mx-auto mt-2 opacity-80" />
            </div>
            <div className="bg-gradient-to-br from-red-500 to-pink-500 p-6 rounded-2xl text-white text-center shadow-xl transform hover:scale-105 transition-transform">
              <div className="text-3xl font-bold">{stats.incorrect}</div>
              <div className="text-red-100">Sbagliate</div>
              <X className="w-8 h-8 mx-auto mt-2 opacity-80" />
            </div>
          </div>

          {/* Bottoni azione */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={onStartNewTest} 
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 text-lg rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <Play className="w-5 h-5 mr-2" />
              Nuovo Test
            </Button>
            <Button 
              onClick={onResetTest} 
              variant="outline"
              className="border-2 border-gray-300 hover:border-gray-400 px-8 py-4 text-lg rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Torna al Menu
            </Button>
          </div>

          {/* Parole Sbagliate */}
          {wrongWords.length > 0 && (
            <div className="mt-12">
              <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-3xl overflow-hidden shadow-xl">
                <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                  <CardTitle className="flex items-center gap-3">
                    <Trophy className="w-6 h-6" />
                    Parole da Ripassare ({wrongWords.length})
                  </CardTitle>
                  <p className="text-orange-100">
                    Studia queste parole per migliorare nel prossimo test!
                  </p>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid gap-4">
                    {wrongWords.map((word, index) => (
                      <div
                        key={`${word.id}-${index}`}
                        className="bg-white p-6 rounded-2xl border border-orange-200 shadow-lg hover:shadow-xl transition-shadow duration-200"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{word.english}</span>
                              <span className="text-orange-400">→</span>
                              <span className="text-xl text-gray-700">{word.italian}</span>
                            </div>
                            
                            {word.group && (
                              <div className="mb-3">
                                <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                                  📂 {word.group}
                                </span>
                              </div>
                            )}
                            
                            {word.sentence && (
                              <div className="mb-3 p-4 bg-green-50 rounded-xl border border-green-200">
                                <div className="text-green-600 font-semibold text-sm mb-1 flex items-center gap-2">
                                  <span>💬</span> Esempio:
                                </div>
                                <div className="text-green-800 italic">"{word.sentence}"</div>
                              </div>
                            )}
                            
                            {word.notes && (
                              <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                                <div className="text-yellow-600 font-semibold text-sm mb-1 flex items-center gap-2">
                                  <span>📝</span> Note:
                                </div>
                                <div className="text-yellow-800 text-sm whitespace-pre-line">
                                  {formatNotes(word.notes)}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="text-3xl text-orange-500 ml-4">❌</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TestResults;