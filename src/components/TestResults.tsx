// =====================================================
// 📁 src/components/TestResults.tsx - TypeScript Migration
// =====================================================

import React from 'react';
import { Button } from './ui/button';
import { Play, Check, X, Trophy, Clock, Lightbulb, Target, Home, BarChart3, Brain } from 'lucide-react';
import { getTestResult } from '../utils/textUtils';
import { formatNotes } from '../utils/textUtils';
import { getCategoryStyle } from '../utils/categoryUtils';
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
  onNavigate?: (view: string) => void;
}

interface PerformanceMetrics {
  accuracy: number;
  hintsUsed: number;
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

const TestResults: React.FC<TestResultsProps> = ({ stats, wrongWords, onStartNewTest, onResetTest, onNavigate }) => {
  
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
    <div className="test-results-container">
      <div className="test-results-card">
        {/* Modern Header */}
        <div className="test-results-header">
          <div className="text-6xl mb-4">
            {result.type === 'victory' ? '🏆' : 
             result.type === 'good' ? '🎉' : '📚'}
          </div>
          <h1 className="test-results-title">
            {result.message}
          </h1>
          <div className="text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            {percentage}%
          </div>
          <p className="test-results-subtitle">
            {finalStats.correct} corrette su {totalAnswers} domande
          </p>
        </div>
          {/* Statistics Grid - Modern Layout */}
          <div className="test-results-stats-grid">
            <div className="test-results-stat-card test-results-stat-correct">
              <Check className="w-6 h-6 mx-auto mb-2 text-green-600 dark:text-green-400" />
              <div className="test-results-stat-value">{finalStats.correct}</div>
              <div className="test-results-stat-label">Corrette</div>
            </div>
            
            <div className="test-results-stat-card test-results-stat-incorrect">
              <X className="w-6 h-6 mx-auto mb-2 text-red-600 dark:text-red-400" />
              <div className="test-results-stat-value">{finalStats.incorrect}</div>
              <div className="test-results-stat-label">Sbagliate</div>
            </div>
            
            <div className="test-results-stat-card test-results-stat-hints">
              <Lightbulb className="w-6 h-6 mx-auto mb-2 text-orange-600 dark:text-orange-400" />
              <div className="test-results-stat-value">{finalStats.hints}</div>
              <div className="test-results-stat-label">Aiuti</div>
            </div>
            
            <div className="test-results-stat-card test-results-stat-time">
              <Clock className="w-6 h-6 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
              <div className="test-results-stat-value">{performanceMetrics.totalTime}</div>
              <div className="test-results-stat-label">Tempo Totale</div>
            </div>

            <div className="test-results-stat-card test-results-stat-accuracy">
              <Target className="w-6 h-6 mx-auto mb-2 text-purple-600 dark:text-purple-400" />
              <div className="test-results-stat-value">{Math.round(performanceMetrics.accuracy)}%</div>
              <div className="test-results-stat-label">Precisione</div>
            </div>
          </div>

          {/* Performance Analysis Card */}
          {(finalStats.avgTimePerWord > 0 || finalStats.hints > 0) && (
            <div className="test-results-analysis-card">
              <div className="test-results-analysis-title">
                <BarChart3 className="w-5 h-5" />
                Analisi Performance
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{performanceMetrics.avgTime}s</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Tempo Medio</div>
                </div>
                {finalStats.maxTimePerWord > 0 && (
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-600 dark:text-red-400">{finalStats.maxTimePerWord}s</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Tempo Max</div>
                  </div>
                )}
                {finalStats.minTimePerWord > 0 && (
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">{finalStats.minTimePerWord}s</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Tempo Min</div>
                  </div>
                )}
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{Math.round(performanceMetrics.efficiency)}%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Efficienza</div>
                </div>
              </div>
            </div>
          )}

          {/* Performance Tips and Analysis */}
          <div className="test-results-analysis-card">
            <div className="test-results-analysis-title">
              <Lightbulb className="w-5 h-5" />
              Analisi e Suggerimenti
            </div>
            <div className="space-y-3 text-sm">
              {percentage < 60 && (
                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800/50">
                  <span className="text-red-600 dark:text-red-400">📚</span>
                  <span className="text-red-700 dark:text-red-300">Ripassa le parole sbagliate prima del prossimo test</span>
                </div>
              )}
              {performanceMetrics.hintsUsed > 2 && (
                <div className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800/50">
                  <span className="text-orange-600 dark:text-orange-400">💭</span>
                  <span className="text-orange-700 dark:text-orange-300">Prova a riflettere di più prima di usare gli aiuti (usati: {performanceMetrics.hintsUsed})</span>
                </div>
              )}
              {finalStats.avgTimePerWord > 25 && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800/50">
                  <span className="text-blue-600 dark:text-blue-400">⚡</span>
                  <span className="text-blue-700 dark:text-blue-300">Pratica per migliorare i tempi di risposta (media attuale: {finalStats.avgTimePerWord}s)</span>
                </div>
              )}
              {finalStats.maxTimePerWord > 60 && (
                <div className="flex items-start gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800/50">
                  <span className="text-purple-600 dark:text-purple-400">⏰</span>
                  <span className="text-purple-700 dark:text-purple-300">Alcune parole richiedono troppo tempo (max: {finalStats.maxTimePerWord}s) - ripassa quelle più difficili</span>
                </div>
              )}
              {percentage >= 80 && performanceMetrics.hintsUsed <= 2 && finalStats.avgTimePerWord <= 20 && (
                <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800/50">
                  <span className="text-green-600 dark:text-green-400">🏆</span>
                  <span className="text-green-700 dark:text-green-300">Performance eccellente! Considera di aggiungere parole più difficili al tuo vocabolario</span>
                </div>
              )}
              {performanceMetrics.efficiency > 70 && (
                <div className="flex items-start gap-2 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800/50">
                  <span className="text-indigo-600 dark:text-indigo-400">✨</span>
                  <span className="text-indigo-700 dark:text-indigo-300">Ottima efficienza ({Math.round(performanceMetrics.efficiency)}%) - equilibrio perfetto tra precisione e autonomia</span>
                </div>
              )}
            </div>
          </div>

          {/* Bottoni azione */}
          <div className="test-results-actions justify-center">
            <Button 
              onClick={onStartNewTest} 
              className="test-results-action-button test-results-retry-button px-8 py-4 text-lg rounded-2xl"
            >
              <Play className="w-5 h-5 mr-2" />
              Nuovo Test
            </Button>
            <Button 
              onClick={onResetTest} 
              variant="outline"
              className="test-results-action-button test-results-new-button px-8 py-4 text-lg rounded-2xl"
            >
              <Home className="w-5 h-5 mr-2" />
              Home
            </Button>
          </div>

          {/* Wrong Words Section - Full detailed formatting */}
          {wrongWords && wrongWords.length > 0 && (
            <div className="test-results-wrong-words">
              <div className="test-results-tips-card">
                <div className="test-results-tips-header">
                  <h3 className="test-results-wrong-words-title">
                    <Trophy className="w-6 h-6" />
                    📚 Parole da Ripassare ({wrongWords.length})
                  </h3>
                  <p className="text-indigo-100 text-sm mt-2">
                    ✨ Studia queste parole per migliorare nel prossimo test!
                  </p>
                </div>
                <div className="space-y-2 p-4">
                  {wrongWords.map((word, index) => (
                    <div key={index} className={`${word.group ? getCategoryStyle(word.group).bgGradient : 'bg-gradient-to-br from-gray-500 to-gray-600'} backdrop-blur-sm rounded-lg p-3 border border-white/30 dark:border-white/30`}>
                      {/* Layout compatto orizzontale */}
                      <div className="flex items-center justify-between gap-4">
                        {/* Info principale compatta */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-white font-semibold text-lg truncate">{word.english}</span>
                            <span className="text-white/60 text-sm">→</span>
                            <span className="text-white/90 font-medium truncate">{word.italian}</span>
                          </div>
                          
                          {/* Badges compatti */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {word.group && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-white/20 text-white">
                                📂 {word.group}
                              </span>
                            )}
                            {word.usedHint && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-yellow-400/20 text-yellow-200">
                                💡 Aiuto
                              </span>
                            )}
                            {word.difficult && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-red-400/20 text-red-200">
                                🎯 Difficile
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Contenuto compatto - layout linea per linea come TestCard */}
                      <div className="mt-2 space-y-1 text-sm">
                        {/* Sinonimi */}
                        {word.synonyms && word.synonyms.length > 0 && (
                          <div className="flex items-start gap-2">
                            <span className="text-white/80 flex-shrink-0">🔄</span>
                            <span className="text-white/90 font-semibold flex-shrink-0 min-w-[60px]">Sinonimi:</span>
                            <span className="text-white/80">{word.synonyms.join(', ')}</span>
                          </div>
                        )}
                        
                        {/* Contrari */}
                        {word.antonyms && word.antonyms.length > 0 && (
                          <div className="flex items-start gap-2">
                            <span className="text-white/80 flex-shrink-0">⚡</span>
                            <span className="text-white/90 font-semibold flex-shrink-0 min-w-[60px]">Contrari:</span>
                            <span className="text-white/80">{word.antonyms.join(', ')}</span>
                          </div>
                        )}
                        
                        {/* Esempi */}
                        {word.sentences && word.sentences.length > 0 && (
                          <div className="space-y-0.5">
                            <div className="flex items-start gap-2">
                              <span className="text-white/80 flex-shrink-0">💬</span>
                              <span className="text-white/90 font-semibold">Esempi:</span>
                            </div>
                            <div className="ml-7 space-y-0.5">
                              {word.sentences.map((sentence, sentenceIndex) => (
                                <div key={sentenceIndex} className="text-white/80 italic text-sm">
                                  • "{sentence}"
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Note */}
                        {word.notes && (
                          <div className="flex items-start gap-2">
                            <span className="text-white/80 flex-shrink-0">📝</span>
                            <span className="text-white/90 font-semibold flex-shrink-0 min-w-[60px]">Note:</span>
                            <span className="text-white/80">{formatNotes(word.notes)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default TestResults;