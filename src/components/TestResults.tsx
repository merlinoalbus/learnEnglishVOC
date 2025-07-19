// =====================================================
// 📁 src/components/TestResults.tsx - TypeScript Migration
// =====================================================

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Play, RotateCcw, Check, X, Trophy, Clock, Lightbulb, Target, Timer, Zap } from 'lucide-react';
import { getTestResult } from '../utils/textUtils';
import { formatNotes } from '../utils/textUtils';
import { Word } from '../types/entities/Word.types';

// =====================================================
// 🔧 TYPES & INTERFACES
// =====================================================

interface TestStats {
  correct: number;
  incorrect: number;
  hints: number;
  totalTime: number;
  avgTimePerWord: number;
  maxTimePerWord: number;
  minTimePerWord: number;
  totalRecordedTime: number;
  total?: number;
  correctAnswers?: number;
  incorrectAnswers?: number;
  right?: number;
  wrong?: number;
  hintsUsed?: number;
  timeSpent?: number;
  averageTime?: number;
}

interface WrongWord extends Word {
  usedHint?: boolean;
}

interface TestResult {
  type: 'victory' | 'good' | 'study';
  message: string;
  color: string;
}

interface TestResultsProps {
  stats: TestStats;
  wrongWords: WrongWord[];
  onStartNewTest: () => void;
  onResetTest: () => void;
}

interface PerformanceMetrics {
  accuracy: number;
  hintsUsed: number;
  hintsPercentage: number;
  totalTime: string;
  totalTimeSeconds: number;
  avgTime: number;
  maxTime: number;
  minTime: number;
  totalRecordedTime: string;
  speedRating: string;
  efficiency: number;
}

interface ProcessedStats {
  correct: number;
  incorrect: number;
  hints: number;
  totalTime: number;
  avgTimePerWord: number;
  maxTimePerWord: number;
  minTimePerWord: number;
  totalRecordedTime: number;
}

// =====================================================
// 🎯 MAIN COMPONENT
// =====================================================

const TestResults: React.FC<TestResultsProps> = ({ stats, wrongWords, onStartNewTest, onResetTest }) => {
  
  // ⭐ ENHANCED: Gestione robusta dei dati stats con timing e hints completi
  const getCorrectStats = (): ProcessedStats => {
    // ⭐ PRIORITY 1: Se stats contiene già i dati enhanced, usali direttamente
    if (stats && typeof stats === 'object') {
      const processedStats: ProcessedStats = {
        correct: stats.correct || 0,
        incorrect: stats.incorrect || 0,
        hints: stats.hints || 0,
        totalTime: stats.totalTime || 0,
        avgTimePerWord: stats.avgTimePerWord || 0,
        maxTimePerWord: stats.maxTimePerWord || 0,
        minTimePerWord: stats.minTimePerWord || 0,
        totalRecordedTime: stats.totalRecordedTime || 0
      };
      return processedStats;
    }
    
    // ⭐ FALLBACK: Try legacy format extraction (just in case)
    if (stats) {
      const statsAny = stats as any;
      const correct = statsAny.correct || statsAny.correctAnswers || statsAny.right || 0;
      const incorrect = statsAny.incorrect || statsAny.incorrectAnswers || statsAny.wrong || 0;
      const hints = statsAny.hints || statsAny.hintsUsed || 0;
      const totalTime = statsAny.totalTime || statsAny.timeSpent || 0;
      const avgTimePerWord = statsAny.avgTimePerWord || statsAny.averageTime || 0;
      const maxTimePerWord = statsAny.maxTimePerWord || 0;
      const minTimePerWord = statsAny.minTimePerWord || 0;
      const totalRecordedTime = statsAny.totalRecordedTime || 0;
      
      if (correct > 0 || incorrect > 0) {
        const legacyStats: ProcessedStats = { 
          correct, 
          incorrect, 
          hints, 
          totalTime, 
          avgTimePerWord, 
          maxTimePerWord, 
          minTimePerWord, 
          totalRecordedTime 
        };
        return legacyStats;
      }
    }
    
    // ⭐ FINAL FALLBACK: Calculate from wrongWords
    if (wrongWords && Array.isArray(wrongWords)) {
      const incorrect = wrongWords.length;
      const correct = Math.max(0, ((stats as any)?.total || 10) - incorrect);
      
      const fallbackStats: ProcessedStats = { 
        correct, 
        incorrect, 
        hints: 0, 
        totalTime: 0, 
        avgTimePerWord: 0,
        maxTimePerWord: 0,
        minTimePerWord: 0,
        totalRecordedTime: 0
      };
      return fallbackStats;
    }
    
    // ⭐ DEFAULT: Empty stats
    const defaultStats: ProcessedStats = { 
      correct: 0, 
      incorrect: 0, 
      hints: 0, 
      totalTime: 0, 
      avgTimePerWord: 0,
      maxTimePerWord: 0,
      minTimePerWord: 0,
      totalRecordedTime: 0
    };
    return defaultStats;
  };

  const finalStats = getCorrectStats();
  const totalAnswers = finalStats.correct + finalStats.incorrect;
  const percentage = totalAnswers > 0 
    ? Math.round((finalStats.correct / totalAnswers) * 100) 
    : 0;

  const result = getTestResult({ 
    correct: finalStats.correct, 
    incorrect: finalStats.incorrect,
    total: totalAnswers
  }) as TestResult;

  // ⭐ ENHANCED: Format time helper
  const formatTime = (seconds: number): string => {
    if (!seconds || seconds <= 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ⭐ ENHANCED: Calculate performance metrics with ALL timing data
  const performanceMetrics: PerformanceMetrics = {
    accuracy: percentage,
    hintsUsed: finalStats.hints,
    hintsPercentage: totalAnswers > 0 ? Math.round((finalStats.hints / totalAnswers) * 100) : 0,
    totalTime: formatTime(finalStats.totalTime),
    totalTimeSeconds: finalStats.totalTime,
    avgTime: finalStats.avgTimePerWord,
    maxTime: finalStats.maxTimePerWord,
    minTime: finalStats.minTimePerWord,
    totalRecordedTime: formatTime(finalStats.totalRecordedTime),
    speedRating: finalStats.avgTimePerWord <= 8 ? 'Molto veloce' :
                 finalStats.avgTimePerWord <= 15 ? 'Veloce' : 
                 finalStats.avgTimePerWord <= 25 ? 'Normale' : 'Lento',
    efficiency: Math.max(0, percentage - (finalStats.hints / Math.max(1, totalAnswers) * 100))
  };

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
            {finalStats.correct} corrette su {totalAnswers} domande
          </p>
          
          {/* ⭐ ENHANCED: Performance summary with ALL stats */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
            {finalStats.hints > 0 && (
              <div className="flex items-center justify-center gap-1 bg-orange-100 px-3 py-2 rounded-lg">
                <Lightbulb className="w-4 h-4 text-orange-500" />
                <span>{finalStats.hints} aiuti ({performanceMetrics.hintsPercentage}%)</span>
              </div>
            )}
            {finalStats.totalTime > 0 && (
              <div className="flex items-center justify-center gap-1 bg-blue-100 px-3 py-2 rounded-lg">
                <Clock className="w-4 h-4 text-blue-500" />
                <span>{performanceMetrics.totalTime} totale</span>
              </div>
            )}
            {finalStats.avgTimePerWord > 0 && (
              <div className="flex items-center justify-center gap-1 bg-purple-100 px-3 py-2 rounded-lg">
                <Target className="w-4 h-4 text-purple-500" />
                <span>{finalStats.avgTimePerWord}s media ({performanceMetrics.speedRating})</span>
              </div>
            )}
            {finalStats.maxTimePerWord > 0 && (
              <div className="flex items-center justify-center gap-1 bg-red-100 px-3 py-2 rounded-lg">
                <Timer className="w-4 h-4 text-red-500" />
                <span>{finalStats.maxTimePerWord}s massimo</span>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="relative pb-12">
          {/* ⭐ ENHANCED: Statistiche complete con timing dettagliato */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 max-w-6xl mx-auto mb-8">
            <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-6 rounded-2xl text-white text-center shadow-xl transform hover:scale-105 transition-transform">
              <div className="text-3xl font-bold">{finalStats.correct}</div>
              <div className="text-green-100">Corrette</div>
              <Check className="w-8 h-8 mx-auto mt-2 opacity-80" />
            </div>
            <div className="bg-gradient-to-br from-red-500 to-pink-500 p-6 rounded-2xl text-white text-center shadow-xl transform hover:scale-105 transition-transform">
              <div className="text-3xl font-bold">{finalStats.incorrect}</div>
              <div className="text-red-100">Sbagliate</div>
              <X className="w-8 h-8 mx-auto mt-2 opacity-80" />
            </div>
            
            {/* ⭐ ENHANCED: Hints card con percentuale */}
            <div className="bg-gradient-to-br from-orange-500 to-yellow-500 p-6 rounded-2xl text-white text-center shadow-xl transform hover:scale-105 transition-transform">
              <div className="text-3xl font-bold">{finalStats.hints}</div>
              <div className="text-orange-100">Aiuti ({performanceMetrics.hintsPercentage}%)</div>
              <Lightbulb className="w-8 h-8 mx-auto mt-2 opacity-80" />
            </div>
            
            {/* ⭐ ENHANCED: Time card con dettagli */}
            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-6 rounded-2xl text-white text-center shadow-xl transform hover:scale-105 transition-transform">
              <div className="text-3xl font-bold">{performanceMetrics.totalTime}</div>
              <div className="text-blue-100">Tempo Totale</div>
              <Clock className="w-8 h-8 mx-auto mt-2 opacity-80" />
            </div>

            {/* ⭐ ENHANCED: Efficiency card */}
            <div className="bg-gradient-to-br from-purple-500 to-indigo-500 p-6 rounded-2xl text-white text-center shadow-xl transform hover:scale-105 transition-transform">
              <div className="text-3xl font-bold">{Math.round(performanceMetrics.efficiency)}%</div>
              <div className="text-purple-100">Efficienza</div>
              <Zap className="w-8 h-8 mx-auto mt-2 opacity-80" />
            </div>
          </div>

          {/* ⭐ ENHANCED: Detailed Timing Analysis */}
          {(finalStats.avgTimePerWord > 0 || finalStats.hints > 0) && (
            <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-3xl overflow-hidden shadow-xl mb-8">
              <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                <CardTitle className="flex items-center gap-3 text-white">
                  <Target className="w-6 h-6" />
                  Analisi Dettagliata Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Timing Stats */}
                  <div className="text-center">
                    <h4 className="font-bold text-indigo-800 mb-3">⏱️ Statistiche Tempo</h4>
                    <div className="space-y-2">
                      <div className="bg-white p-3 rounded-lg border border-indigo-200">
                        <div className="text-lg font-bold text-indigo-600">{performanceMetrics.avgTime}s</div>
                        <div className="text-indigo-800 text-sm">Tempo Medio</div>
                      </div>
                      {finalStats.maxTimePerWord > 0 && (
                        <div className="bg-white p-3 rounded-lg border border-red-200">
                          <div className="text-lg font-bold text-red-600">{finalStats.maxTimePerWord}s</div>
                          <div className="text-red-800 text-sm">Tempo Massimo</div>
                        </div>
                      )}
                      {finalStats.minTimePerWord > 0 && (
                        <div className="bg-white p-3 rounded-lg border border-green-200">
                          <div className="text-lg font-bold text-green-600">{finalStats.minTimePerWord}s</div>
                          <div className="text-green-800 text-sm">Tempo Minimo</div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Accuracy & Hints */}
                  <div className="text-center">
                    <h4 className="font-bold text-purple-800 mb-3">🎯 Accuratezza</h4>
                    <div className="space-y-2">
                      <div className="bg-white p-3 rounded-lg border border-purple-200">
                        <div className="text-lg font-bold text-purple-600">{performanceMetrics.accuracy}%</div>
                        <div className="text-purple-800 text-sm">Precisione</div>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-orange-200">
                        <div className="text-lg font-bold text-orange-600">{performanceMetrics.hintsPercentage}%</div>
                        <div className="text-orange-800 text-sm">Aiuti Utilizzati</div>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-indigo-200">
                        <div className="text-lg font-bold text-indigo-600">{Math.round(performanceMetrics.efficiency)}%</div>
                        <div className="text-indigo-800 text-sm">Efficienza Netta</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Overall Rating */}
                  <div className="text-center">
                    <h4 className="font-bold text-green-800 mb-3">🏆 Valutazione</h4>
                    <div className="space-y-2">
                      <div className="bg-white p-3 rounded-lg border border-green-200">
                        <div className="text-lg font-bold text-green-600">{performanceMetrics.speedRating}</div>
                        <div className="text-green-800 text-sm">Velocità</div>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-blue-200">
                        <div className="text-lg font-bold text-blue-600">
                          {performanceMetrics.accuracy >= 80 && performanceMetrics.hintsPercentage <= 20 ? 'Eccellente' :
                           performanceMetrics.accuracy >= 70 ? 'Molto Buono' :
                           performanceMetrics.accuracy >= 60 ? 'Buono' : 'Da Migliorare'}
                        </div>
                        <div className="text-blue-800 text-sm">Performance</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* ⭐ ENHANCED: Performance tips */}
                <div className="mt-6 p-4 bg-white rounded-xl border border-indigo-200">
                  <h4 className="font-bold text-indigo-800 mb-2">💡 Analisi e Suggerimenti:</h4>
                  <div className="text-sm text-indigo-700 space-y-1">
                    {percentage < 60 && (
                      <p>• 📚 Ripassa le parole sbagliate prima del prossimo test</p>
                    )}
                    {performanceMetrics.hintsPercentage > 30 && (
                      <p>• 💭 Prova a riflettere di più prima di usare gli aiuti (attuale: {performanceMetrics.hintsPercentage}%)</p>
                    )}
                    {finalStats.avgTimePerWord > 25 && (
                      <p>• ⚡ Pratica per migliorare i tempi di risposta (media attuale: {finalStats.avgTimePerWord}s)</p>
                    )}
                    {finalStats.maxTimePerWord > 60 && (
                      <p>• ⏰ Alcune parole richiedono troppo tempo (max: {finalStats.maxTimePerWord}s) - ripassa quelle più difficili</p>
                    )}
                    {percentage >= 80 && performanceMetrics.hintsPercentage <= 20 && finalStats.avgTimePerWord <= 20 && (
                      <p>• 🏆 Performance eccellente! Considera di aggiungere parole più difficili al tuo vocabolario</p>
                    )}
                    {performanceMetrics.efficiency > 70 && (
                      <p>• ✨ Ottima efficienza ({Math.round(performanceMetrics.efficiency)}%) - equilibrio perfetto tra precisione e autonomia</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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

          {/* ⭐ ENHANCED: Parole Sbagliate con info hints e timing */}
          {wrongWords && wrongWords.length > 0 && (
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
                              
                              {/* ⭐ ENHANCED: Hint indicator */}
                              {word.usedHint && (
                                <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium">
                                  <Lightbulb className="w-3 h-3" />
                                  Aiuto usato
                                </span>
                              )}
                            </div>
                            
                            {word.group && (
                              <div className="mb-3">
                                <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                                  📂 {word.group}
                                </span>
                              </div>
                            )}
                            
                            {word.sentences && word.sentences.length > 0 && (
                              <div className="mb-3 p-4 bg-green-50 rounded-xl border border-green-200">
                                <div className="text-green-600 font-semibold text-sm mb-1 flex items-center gap-2">
                                  <span>💬</span> Esempio:
                                </div>
                                <div className="text-green-800 italic">"{word.sentences[0]}"</div>
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