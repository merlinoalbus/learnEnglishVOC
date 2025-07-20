// =====================================================
// 📁 src/components/TestHistory.tsx - TypeScript Migration
// =====================================================

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ChevronDown, ChevronUp, BookOpen, Target, Calendar, Award } from 'lucide-react';
import { Word } from '../types/entities/Word.types';

// =====================================================
// 🔧 TYPES & INTERFACES
// =====================================================

interface TestParameters {
  selectedChapters: string[];
  includeLearnedWords: boolean;
  totalAvailableWords: number;
}

interface ChapterStats {
  percentage: number;
  correctWords: number;
  incorrectWords: number;
}

interface TestHistoryItem {
  id: string;
  timestamp: string;
  percentage: number;
  totalWords: number;
  correctWords: number;
  incorrectWords: number;
  difficulty: 'easy' | 'medium' | 'hard';
  testType: 'complete' | 'selective' | 'unknown';
  testParameters?: TestParameters;
  chapterStats?: Record<string, ChapterStats>;
  wrongWords?: Word[];
}

interface TestHistoryProps {
  testHistory: TestHistoryItem[];
  onClearHistory: () => void;
}

interface TestHistoryCardProps {
  test: TestHistoryItem;
  testNumber: number;
  isExpanded: boolean;
  onToggleExpansion: () => void;
  formatDifficulty: (difficulty: string) => DifficultyFormat;
  formatTestType: (testType: string) => TestTypeFormat;
}

interface DifficultyFormat {
  label: string;
  color: string;
  emoji: string;
}

interface TestTypeFormat {
  label: string;
  color: string;
  emoji: string;
}

// =====================================================
// 🎯 MAIN COMPONENT
// =====================================================

const TestHistory: React.FC<TestHistoryProps> = ({ testHistory, onClearHistory }) => {
  const [expandedTest, setExpandedTest] = useState<string | null>(null);

  if (testHistory.length === 0) return null;

  const toggleTestExpansion = (testId: string): void => {
    setExpandedTest(expandedTest === testId ? null : testId);
  };

  const formatDifficulty = (difficulty: string): DifficultyFormat => {
    const difficultyMap: Record<string, DifficultyFormat> = {
      'easy': { label: 'Facile', color: 'bg-green-500', emoji: '😊' },
      'medium': { label: 'Medio', color: 'bg-yellow-500', emoji: '😐' },
      'hard': { label: 'Difficile', color: 'bg-red-500', emoji: '😤' }
    };
    return difficultyMap[difficulty] || difficultyMap['medium'];
  };

  const formatTestType = (testType: string): TestTypeFormat => {
    const typeMap: Record<string, TestTypeFormat> = {
      'complete': { label: 'Completo', color: 'bg-blue-500', emoji: '🎯' },
      'selective': { label: 'Selettivo', color: 'bg-purple-500', emoji: '📚' },
      'unknown': { label: 'Standard', color: 'bg-gray-500', emoji: '📝' }
    };
    return typeMap[testType] || typeMap['unknown'];
  };

  return (
    <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-2xl rounded-3xl overflow-hidden">
      <CardHeader className="test-history-header">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-3 text-white">
            <Calendar className="w-6 h-6" />
            Cronologia Test Dettagliata ({testHistory.length})
          </CardTitle>
          <Button
            onClick={onClearHistory}
            variant="outline"
            className="border-white/30 text-white hover:bg-white/20 hover:border-white/50 rounded-xl"
          >
            <span className="w-4 h-4 mr-2">🗑️</span>
            Pulisci
          </Button>
        </div>
        <p className="text-indigo-100 mt-2">
          Storico completo con parametri di test, capitoli e performance dettagliate
        </p>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
          {testHistory.map((test, index) => (
            <TestHistoryCard
              key={test.id}
              test={test}
              testNumber={testHistory.length - index}
              isExpanded={expandedTest === test.id}
              onToggleExpansion={() => toggleTestExpansion(test.id)}
              formatDifficulty={formatDifficulty}
              formatTestType={formatTestType}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// =====================================================
// 🃏 TEST HISTORY CARD COMPONENT
// =====================================================

const TestHistoryCard: React.FC<TestHistoryCardProps> = ({ 
  test, 
  testNumber, 
  isExpanded, 
  onToggleExpansion, 
  formatDifficulty, 
  formatTestType 
}) => {
  const difficulty = formatDifficulty(test.difficulty);
  const testType = formatTestType(test.testType);
  
  return (
    <div className="test-history-item">
      {/* Header del Test */}
      <div 
        className="p-6 cursor-pointer"
        onClick={onToggleExpansion}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-3">
              <div className="text-xl font-bold text-gray-800">
                Test #{testNumber}
              </div>
              
              {/* Badge Percentuale */}
              <div className={`px-4 py-2 rounded-full text-sm font-bold shadow-lg text-white ${
                test.percentage >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                test.percentage >= 60 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                'bg-gradient-to-r from-red-500 to-pink-500'
              }`}>
                {test.percentage}%
              </div>
              
              {/* Badge Tipo Test */}
              <div className={`px-3 py-1 rounded-full text-xs font-medium text-white ${testType.color}`}>
                <span className="mr-1">{testType.emoji}</span>
                {testType.label}
              </div>
              
              {/* Badge Difficoltà */}
              <div className={`px-3 py-1 rounded-full text-xs font-medium text-white ${difficulty.color}`}>
                <span className="mr-1">{difficulty.emoji}</span>
                {difficulty.label}
              </div>
            </div>
            
            {/* Informazioni Base */}
            <div className="text-sm text-gray-600 mb-4 flex items-center gap-6">
              <div className="flex items-center gap-1">
                📅 {new Date(test.timestamp).toLocaleDateString('it-IT', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
              
              {test.testParameters?.selectedChapters && (
                <div className="flex items-center gap-1">
                  📚 {test.testParameters.selectedChapters.length} 
                  {test.testParameters.selectedChapters.length === 1 ? ' capitolo' : ' capitoli'}
                </div>
              )}
              
              <div className="flex items-center gap-1">
                🎯 {test.totalWords} parole
              </div>
            </div>
            
            {/* Statistiche Rapide */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 p-3 rounded-xl text-center">
                <div className="text-lg font-bold text-blue-600">{test.totalWords}</div>
                <div className="text-blue-700 text-xs">Totale</div>
              </div>
              <div className="bg-green-50 p-3 rounded-xl text-center">
                <div className="text-lg font-bold text-green-600">{test.correctWords}</div>
                <div className="text-green-700 text-xs">Corrette</div>
              </div>
              <div className="bg-red-50 p-3 rounded-xl text-center">
                <div className="text-lg font-bold text-red-600">{test.incorrectWords}</div>
                <div className="text-red-700 text-xs">Sbagliate</div>
              </div>
            </div>
          </div>
          
          {/* Indicatore Espansione */}
          <div className="ml-4">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </div>
      
      {/* Dettagli Espansi */}
      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50">
          <div className="p-6 space-y-6">
            
            {/* Parametri del Test */}
            {test.testParameters && (
              <div>
                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Parametri del Test
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <div className="text-sm text-gray-600 mb-1">Capitoli Selezionati</div>
                    <div className="flex flex-wrap gap-2">
                      {test.testParameters.selectedChapters?.map(chapter => (
                        <span key={chapter} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs">
                          {chapter === 'Senza Capitolo' ? '📋 Senza Cap.' : `📖 ${chapter}`}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <div className="text-sm text-gray-600 mb-1">Configurazione</div>
                    <div className="space-y-1">
                      <div className="text-xs">
                        {test.testParameters.includeLearnedWords ? '✅' : '❌'} Parole apprese incluse
                      </div>
                      <div className="text-xs text-gray-500">
                        {test.testParameters.totalAvailableWords} parole disponibili totali
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Performance per Capitolo */}
            {test.chapterStats && Object.keys(test.chapterStats).length > 0 && (
              <div>
                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Performance per Capitolo
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(test.chapterStats).map(([chapter, stats]) => (
                    <div key={chapter} className="bg-white p-4 rounded-xl border border-gray-200">
                      <div className="font-medium text-gray-800 mb-2">
                        {chapter === 'Senza Capitolo' ? '📋 Senza Capitolo' : `📖 Capitolo ${chapter}`}
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Accuratezza:</span>
                          <span className={`font-bold ${
                            stats.percentage >= 80 ? 'text-green-600' :
                            stats.percentage >= 60 ? 'text-blue-600' : 'text-red-600'
                          }`}>
                            {stats.percentage}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <span>Corrette: {stats.correctWords}</span>
                          <span>Sbagliate: {stats.incorrectWords}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              stats.percentage >= 80 ? 'bg-green-500' :
                              stats.percentage >= 60 ? 'bg-blue-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${stats.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Parole Sbagliate */}
            {test.wrongWords && test.wrongWords.length > 0 && (
              <div>
                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Parole da Ripassare ({test.wrongWords.length})
                </h4>
                <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                  <div className="flex flex-wrap gap-2">
                    {test.wrongWords.map((word, wordIndex) => (
                      <div
                        key={wordIndex}
                        className="bg-white border border-red-200 px-3 py-2 rounded-lg text-sm"
                      >
                        <span className="font-medium text-red-700">{word.english}</span>
                        <span className="mx-2 text-red-400">→</span>
                        <span className="text-red-600">{word.italian}</span>
                        {word.chapter && (
                          <span className="ml-2 text-xs text-red-500">
                            📖 {word.chapter}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Raccomandazioni */}
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <h5 className="font-medium text-blue-800 mb-2">💡 Raccomandazioni per il prossimo test:</h5>
              <div className="text-sm text-blue-700 space-y-1">
                {test.percentage < 60 && (
                  <p>• Rivedi le parole sbagliate prima del prossimo test</p>
                )}
                {test.chapterStats && Object.values(test.chapterStats).some(s => s.percentage < 70) && (
                  <p>• Concentrati sui capitoli con performance inferiore al 70%</p>
                )}
                {test.testParameters?.selectedChapters?.length === 1 && (
                  <p>• Prova a combinare più capitoli per aumentare la varietà</p>
                )}
                {test.percentage >= 80 && (
                  <p>• Ottimo lavoro! Potresti provare un test più difficile</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestHistory;