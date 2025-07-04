
// /src/components/StatsOverview.js - Enhanced con word performance tracking
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ScatterPlot, Scatter, ReferenceLine } from 'recharts';
import { BarChart3, TrendingUp, Trophy, Sparkles, Play, BookOpen, Target, Award, Calendar, Filter, Search, AlertTriangle, CheckCircle, Clock, Lightbulb } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

const StatsOverview = ({ testHistory, words, onClearHistory, onGoToMain, forceUpdate }) => {
  const [selectedView, setSelectedView] = useState('overview');
  const [selectedChapter, setSelectedChapter] = useState('all');
  const [searchWord, setSearchWord] = useState('');
  const [selectedWordId, setSelectedWordId] = useState(null);
  
  // ⭐ NEW: Get word performance from context
  const { getAllWordsPerformance, getWordAnalysis } = useAppContext();
  
  const [localRefresh, setLocalRefresh] = useState(0);

  useEffect(() => {
    setLocalRefresh(prev => prev + 1);
  }, [testHistory.length, forceUpdate]);

  // ⭐ ENHANCED: Advanced stats with hints
  const getAdvancedStats = React.useMemo(() => {
    if (testHistory.length === 0) {
      return {
        totalTests: 0,
        averageScore: 0,
        bestScore: 0,
        worstScore: 0,
        totalWordsStudied: 0,
        totalCorrect: 0,
        totalIncorrect: 0,
        totalHints: 0, // ⭐ NEW
        hintsPercentage: 0, // ⭐ NEW
        chaptersAnalyzed: 0,
        testTypeDistribution: {},
        difficultyDistribution: {},
        improvementTrend: 0,
        lastWeekTests: 0,
        chapterPerformance: {}
      };
    }

    const totalTests = testHistory.length;
    const totalCorrect = testHistory.reduce((sum, test) => sum + (test.correctWords || 0), 0);
    const totalIncorrect = testHistory.reduce((sum, test) => sum + (test.incorrectWords || 0), 0);
    const totalHints = testHistory.reduce((sum, test) => sum + (test.hintsUsed || 0), 0); // ⭐ NEW
    const totalWordsStudied = totalCorrect + totalIncorrect;
    const hintsPercentage = totalWordsStudied > 0 ? Math.round((totalHints / totalWordsStudied) * 100) : 0; // ⭐ NEW
    const averageScore = Math.round(testHistory.reduce((sum, test) => sum + (test.percentage || 0), 0) / totalTests);
    const bestScore = Math.max(...testHistory.map(test => test.percentage || 0));
    const worstScore = Math.min(...testHistory.map(test => test.percentage || 100));

    // Performance per capitolo con hints
    const chapterPerformance = {};
    testHistory.forEach(test => {
      if (test.chapterStats) {
        Object.entries(test.chapterStats).forEach(([chapter, stats]) => {
          if (!chapterPerformance[chapter]) {
            chapterPerformance[chapter] = {
              totalTests: 0,
              totalWords: 0,
              totalCorrect: 0,
              totalIncorrect: 0,
              totalHints: 0, // ⭐ NEW
              averagePercentage: 0,
              bestPercentage: 0,
              worstPercentage: 100,
              hintsPercentage: 0 // ⭐ NEW
            };
          }
          
          const perf = chapterPerformance[chapter];
          perf.totalTests += 1;
          perf.totalWords += stats.totalWords || 0;
          perf.totalCorrect += stats.correctWords || 0;
          perf.totalIncorrect += stats.incorrectWords || 0;
          perf.totalHints += stats.hintsUsed || 0; // ⭐ NEW
          perf.bestPercentage = Math.max(perf.bestPercentage, stats.percentage || 0);
          perf.worstPercentage = Math.min(perf.worstPercentage, stats.percentage || 100);
        });
      }
    });

    // Calcola percentuali medie per capitolo
    Object.keys(chapterPerformance).forEach(chapter => {
      const perf = chapterPerformance[chapter];
      perf.averagePercentage = perf.totalWords > 0 ? Math.round((perf.totalCorrect / perf.totalWords) * 100) : 0;
      perf.hintsPercentage = perf.totalWords > 0 ? Math.round((perf.totalHints / perf.totalWords) * 100) : 0; // ⭐ NEW
    });

    return {
      totalTests,
      averageScore,
      bestScore,
      worstScore,
      totalWordsStudied,
      totalCorrect,
      totalIncorrect,
      totalHints, // ⭐ NEW
      hintsPercentage, // ⭐ NEW
      chaptersAnalyzed: Object.keys(chapterPerformance).length,
      testTypeDistribution: {},
      difficultyDistribution: {},
      improvementTrend: 0,
      lastWeekTests: 0,
      chapterPerformance
    };
  }, [testHistory]);

  // ⭐ ENHANCED: Timeline with hints and timing
  const getTimelineData = React.useMemo(() => {
    const data = [...testHistory].reverse().slice(-20).map((test, index) => ({
      test: `Test ${index + 1}`,
      percentage: test.percentage || 0,
      correct: test.correctWords || 0,
      incorrect: test.incorrectWords || 0,
      hints: test.hintsUsed || 0, // ⭐ NEW
      avgTime: test.avgTimePerWord || 0, // ⭐ NEW
      date: new Date(test.timestamp).toLocaleDateString('it-IT'),
      time: new Date(test.timestamp).toLocaleTimeString('it-IT', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      chapters: test.testParameters?.selectedChapters?.length || 0,
      difficulty: test.difficulty || 'medium',
      type: test.testType || 'unknown'
    }));
    
    return data;
  }, [testHistory]);

  // ⭐ NEW: Chapter performance with better visualization
  const getChapterComparisonData = React.useMemo(() => {
    return Object.entries(getAdvancedStats.chapterPerformance).map(([chapter, perf]) => ({
      chapter: chapter === 'Senza Capitolo' ? 'Senza Cap.' : `Cap. ${chapter}`,
      fullChapter: chapter,
      accuracy: perf.averagePercentage,
      tests: perf.totalTests,
      words: perf.totalWords,
      hints: perf.hintsPercentage, // ⭐ NEW: Hints percentage
      efficiency: Math.max(0, perf.averagePercentage - perf.hintsPercentage), // ⭐ NEW: Performance without hints
      trend: perf.bestPercentage - perf.worstPercentage // ⭐ NEW: Improvement range
    })).sort((a, b) => b.accuracy - a.accuracy);
  }, [getAdvancedStats]);

  // ⭐ NEW: Word performance data
  const getWordPerformanceData = React.useMemo(() => {
    if (!getAllWordsPerformance) return [];
    
    const wordsPerformance = getAllWordsPerformance();
    return wordsPerformance.filter(word => {
      if (searchWord && !word.english.toLowerCase().includes(searchWord.toLowerCase())) {
        return false;
      }
      if (selectedChapter !== 'all' && word.chapter !== selectedChapter) {
        return false;
      }
      return true;
    });
  }, [getAllWordsPerformance, searchWord, selectedChapter]);

  const handleClearHistory = React.useCallback(() => {
    if (window.confirm(`Vuoi cancellare la cronologia di ${testHistory.length} test? Questa azione non può essere annullata.`)) {
      onClearHistory();
      setTimeout(() => {
        setLocalRefresh(prev => prev + 1);
      }, 100);
    }
  }, [testHistory.length, onClearHistory]);

  if (testHistory.length === 0) {
    return (
      <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-2xl rounded-3xl overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-1">
          <div className="bg-white rounded-3xl p-8">
            <div className="text-center py-16">
              <div className="text-8xl mb-6">📊</div>
              <h3 className="text-2xl font-bold text-gray-700 mb-4">Nessun test completato</h3>
              <p className="text-gray-600 text-lg mb-8">Completa il tuo primo test per vedere le statistiche dettagliate!</p>
              <Button 
                onClick={onGoToMain} 
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-8 py-4 text-lg rounded-2xl shadow-xl"
              >
                <Play className="w-5 h-5 mr-2" />
                Inizia il Primo Test
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header with enhanced indicators */}
      <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-2xl rounded-3xl overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-1">
          <div className="bg-white rounded-3xl p-6">
            <div className="flex justify-between items-center mb-6">
              <CardTitle className="flex items-center gap-3 text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                <BarChart3 className="w-8 h-8 text-purple-600" />
                Analisi Avanzata dell'Apprendimento
                <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  Live: {testHistory.length} test
                </span>
              </CardTitle>
              <Button
                onClick={handleClearHistory}
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50"
                disabled={testHistory.length === 0}
              >
                🗑️ Pulisci Cronologia ({testHistory.length})
              </Button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 mb-6">
              {[
                { id: 'overview', label: 'Panoramica', icon: '📈' },
                { id: 'chapters', label: 'Per Capitoli', icon: '📚' },
                { id: 'words', label: 'Per Parole', icon: '🔍' }, // ⭐ NEW
                { id: 'performance', label: 'Performance', icon: '🎯' },
                { id: 'trends', label: 'Tendenze', icon: '📊' }
              ].map(tab => (
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

            {/* ⭐ ENHANCED: Statistiche Generali con hints */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-4 rounded-2xl text-white text-center shadow-xl">
                <div className="text-2xl font-bold">{getAdvancedStats.totalTests}</div>
                <div className="text-blue-100 text-sm">Test Totali</div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-4 rounded-2xl text-white text-center shadow-xl">
                <div className="text-2xl font-bold">{getAdvancedStats.averageScore}%</div>
                <div className="text-green-100 text-sm">Media</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded-2xl text-white text-center shadow-xl">
                <div className="text-2xl font-bold">{getAdvancedStats.bestScore}%</div>
                <div className="text-purple-100 text-sm">Record</div>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-red-500 p-4 rounded-2xl text-white text-center shadow-xl">
                <div className="text-2xl font-bold">{getAdvancedStats.totalWordsStudied}</div>
                <div className="text-orange-100 text-sm">Parole</div>
              </div>
              <div className="bg-gradient-to-br from-yellow-500 to-orange-500 p-4 rounded-2xl text-white text-center shadow-xl">
                <div className="text-2xl font-bold">{getAdvancedStats.totalHints}</div>
                <div className="text-yellow-100 text-sm">Aiuti</div>
              </div>
              <div className="bg-gradient-to-br from-indigo-500 to-blue-500 p-4 rounded-2xl text-white text-center shadow-xl">
                <div className="text-2xl font-bold">{getAdvancedStats.hintsPercentage}%</div>
                <div className="text-indigo-100 text-sm">% Aiuti</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Dynamic Content Based on Selected View */}
      {selectedView === 'overview' && (
        <OverviewSection 
          stats={getAdvancedStats} 
          timelineData={getTimelineData} 
          localRefresh={localRefresh}
        />
      )}

      {selectedView === 'chapters' && (
        <ChaptersSection 
          chapterData={getChapterComparisonData}
          selectedChapter={selectedChapter}
          setSelectedChapter={setSelectedChapter}
          testHistory={testHistory}
          localRefresh={localRefresh}
        />
      )}

      {/* ⭐ NEW: Words performance section */}
      {selectedView === 'words' && (
        <WordsSection 
          wordsData={getWordPerformanceData}
          searchWord={searchWord}
          setSearchWord={setSearchWord}
          selectedChapter={selectedChapter}
          setSelectedChapter={setSelectedChapter}
          selectedWordId={selectedWordId}
          setSelectedWordId={setSelectedWordId}
          getWordAnalysis={getWordAnalysis}
          localRefresh={localRefresh}
        />
      )}

      {selectedView === 'performance' && (
        <PerformanceSection 
          stats={getAdvancedStats}
          timelineData={getTimelineData}
          localRefresh={localRefresh}
        />
      )}

      {selectedView === 'trends' && (
        <TrendsSection 
          timelineData={getTimelineData}
          stats={getAdvancedStats}
          localRefresh={localRefresh}
        />
      )}
    </div>
  );
};

// ⭐ ENHANCED: Overview Section with hints visualization
const OverviewSection = ({ stats, timelineData, localRefresh }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" key={`overview-${localRefresh}`}>
    {/* Enhanced Timeline with hints */}
    <Card className="bg-white border-0 shadow-xl rounded-3xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <CardTitle className="flex items-center gap-3 text-white">
          <TrendingUp className="w-6 h-6" />
          Andamento con Aiuti (Ultimi 20 Test)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timelineData} key={`line-${localRefresh}`}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e4e7" />
            <XAxis dataKey="test" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="percentage" 
              stroke="#3b82f6" 
              strokeWidth={3}
              name="Precisione %"
            />
            <Line 
              type="monotone" 
              dataKey="hints" 
              stroke="#f59e0b" 
              strokeWidth={2}
              name="Aiuti"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>

    {/* Performance Metrics */}
    <Card className="bg-white border-0 shadow-xl rounded-3xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
        <CardTitle className="flex items-center gap-3 text-white">
          <Target className="w-6 h-6" />
          Metriche Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <div className="text-2xl font-bold text-blue-600">{stats.averageScore}%</div>
              <div className="text-blue-700 text-sm">Precisione Media</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-xl">
              <div className="text-2xl font-bold text-orange-600">{stats.hintsPercentage}%</div>
              <div className="text-orange-700 text-sm">% Aiuti Usati</div>
            </div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-xl">
            <div className="text-xl font-bold text-green-600">
              {Math.max(0, stats.averageScore - stats.hintsPercentage)}%
            </div>
            <div className="text-green-700 text-sm">Efficienza (senza aiuti)</div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="text-center p-2 bg-purple-50 rounded-lg">
              <div className="font-bold text-purple-600">{stats.totalCorrect}</div>
              <div className="text-purple-700 text-xs">Corrette</div>
            </div>
            <div className="text-center p-2 bg-red-50 rounded-lg">
              <div className="font-bold text-red-600">{stats.totalIncorrect}</div>
              <div className="text-red-700 text-xs">Sbagliate</div>
            </div>
            <div className="text-center p-2 bg-yellow-50 rounded-lg">
              <div className="font-bold text-yellow-600">{stats.totalHints}</div>
              <div className="text-yellow-700 text-xs">Aiuti</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

// ⭐ ENHANCED: Chapters Section with efficiency metrics
const ChaptersSection = ({ chapterData, selectedChapter, setSelectedChapter, testHistory, localRefresh }) => (
  <div className="space-y-8" key={`chapters-${localRefresh}`}>
    {/* Chapter Performance Comparison - Redesigned */}
    <Card className="bg-white border-0 shadow-xl rounded-3xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <CardTitle className="flex items-center gap-3 text-white">
          <BookOpen className="w-6 h-6" />
          Efficienza per Capitolo (Precisione vs Aiuti)
        </CardTitle>
        <p className="text-purple-100 text-sm">Più alta è la barra verde, migliore è l'efficienza del capitolo</p>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chapterData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} key={`bar-${localRefresh}`}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="chapter" />
            <YAxis domain={[0, 100]} />
            <Tooltip 
              formatter={(value, name) => [
                `${value}%`,
                name === 'accuracy' ? 'Precisione' :
                name === 'hints' ? 'Aiuti Usati' :
                name === 'efficiency' ? 'Efficienza Netta' : name
              ]}
            />
            <Bar dataKey="accuracy" fill="#3b82f6" name="accuracy" />
            <Bar dataKey="hints" fill="#f59e0b" name="hints" />
            <Bar dataKey="efficiency" fill="#10b981" name="efficiency" />
          </BarChart>
        </ResponsiveContainer>
        
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-sm">Precisione %</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-sm">Aiuti %</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-sm">Efficienza Netta</span>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

// ⭐ NEW: Words Performance Section
const WordsSection = ({ wordsData, searchWord, setSearchWord, selectedChapter, setSelectedChapter, selectedWordId, setSelectedWordId, getWordAnalysis, localRefresh }) => {
  const availableChapters = [...new Set(wordsData.map(w => w.chapter).filter(Boolean))].sort();
  
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
    <div className="space-y-8" key={`words-${localRefresh}`}>
      {/* Search and Filter */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">🔍 Cerca Parola</label>
              <Input
                placeholder="Scrivi la parola inglese..."
                value={searchWord}
                onChange={(e) => setSearchWord(e.target.value)}
                className="border-2 border-blue-300 rounded-xl focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">📚 Filtra per Capitolo</label>
              <select
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(e.target.value)}
                className="w-full px-3 py-2 border-2 border-blue-300 rounded-xl focus:border-blue-500 bg-white"
              >
                <option value="all">Tutti i capitoli</option>
                {availableChapters.map(chapter => (
                  <option key={chapter} value={chapter}>📖 {chapter}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Words Performance List */}
      <Card className="bg-white border-0 shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
          <CardTitle className="flex items-center gap-3 text-white">
            <Search className="w-6 h-6" />
            Performance Parole ({wordsData.length} parole)
          </CardTitle>
          <p className="text-indigo-100 text-sm">Clicca su una parola per vedere il grafico dell'andamento temporale</p>
        </CardHeader>
        <CardContent className="p-6">
          {wordsData.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-gray-600">Nessuna parola trovata con i filtri attuali</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {wordsData.map((word) => (
                <WordPerformanceCard 
                  key={word.wordId} 
                  word={word} 
                  isSelected={selectedWordId === word.wordId}
                  onClick={() => setSelectedWordId(selectedWordId === word.wordId ? null : word.wordId)}
                  getStatusColor={getStatusColor}
                  getStatusLabel={getStatusLabel}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Word Detail */}
      {selectedWordId && (
        <WordDetailSection 
          wordId={selectedWordId}
          getWordAnalysis={getWordAnalysis}
          localRefresh={localRefresh}
        />
      )}
    </div>
  );
};

// ⭐ NEW: Word Performance Card Component
const WordPerformanceCard = ({ word, isSelected, onClick, getStatusColor, getStatusLabel }) => (
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

// ⭐ NEW: Word Detail Section with Timeline
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

// ⭐ ENHANCED: Performance Section with hints
const PerformanceSection = ({ stats, timelineData, localRefresh }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" key={`performance-${localRefresh}`}>
    <Card className="bg-white border-0 shadow-xl rounded-3xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
        <CardTitle className="flex items-center gap-3 text-white">
          <Trophy className="w-6 h-6" />
          Analisi Efficienza
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="text-center p-6 bg-green-50 rounded-2xl border border-green-200">
            <div className="text-3xl font-bold text-green-600 mb-2">{stats.averageScore}%</div>
            <div className="text-green-700">Precisione Media</div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-orange-50 rounded-xl">
              <div className="text-xl font-bold text-orange-600">{stats.hintsPercentage}%</div>
              <div className="text-orange-700 text-sm">Aiuti Usati</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <div className="text-xl font-bold text-blue-600">
                {Math.max(0, stats.averageScore - stats.hintsPercentage)}%
              </div>
              <div className="text-blue-700 text-sm">Efficienza Netta</div>
            </div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-xl">
            <div className="text-lg font-bold text-purple-600">
              {stats.totalWordsStudied > 0 ? ((stats.totalCorrect / stats.totalWordsStudied) * 100).toFixed(1) : 0}%
            </div>
            <div className="text-purple-700 text-sm">Accuratezza Globale</div>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card className="bg-white border-0 shadow-xl rounded-3xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
        <CardTitle className="flex items-center gap-3 text-white">
          <Lightbulb className="w-6 h-6" />
          Andamento Aiuti vs Prestazioni
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={timelineData.slice(-10)} key={`performance-bar-${localRefresh}`}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="test" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="correct" stackId="a" fill="#10b981" name="Corrette" />
            <Bar dataKey="incorrect" stackId="a" fill="#ef4444" name="Sbagliate" />
            <Bar dataKey="hints" fill="#f59e0b" name="Aiuti" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  </div>
);

// ⭐ ENHANCED: Trends Section with timing analysis
const TrendsSection = ({ timelineData, stats, localRefresh }) => (
  <div className="space-y-8" key={`trends-${localRefresh}`}>
    <Card className="bg-white border-0 shadow-xl rounded-3xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
        <CardTitle className="flex items-center gap-3 text-white">
          <Clock className="w-6 h-6" />
          Tendenze Temporali e Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={timelineData} key={`trends-line-${localRefresh}`}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="percentage" 
              stroke="#8b5cf6" 
              strokeWidth={3}
              name="Percentuale"
            />
            <Line 
              type="monotone" 
              dataKey="hints" 
              stroke="#f59e0b" 
              strokeWidth={2}
              name="Aiuti"
            />
            <Line 
              type="monotone" 
              dataKey="avgTime" 
              stroke="#06b6d4" 
              strokeWidth={2}
              name="Tempo Medio (s)"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>

    {/* Enhanced Insights */}
    <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200">
      <CardContent className="p-6">
        <h3 className="text-xl font-bold text-yellow-800 mb-4 flex items-center gap-2">
          <Sparkles className="w-6 h-6" />
          Insights e Raccomandazioni Avanzate
        </h3>
        <div className="space-y-3 text-yellow-700">
          <p>🎯 <strong>Precisione:</strong> {stats.averageScore}% (target: 80%+)</p>
          <p>💡 <strong>Uso aiuti:</strong> {stats.hintsPercentage}% (ideale: 20%+)</p>
          <p>⚡ <strong>Efficienza netta:</strong> {Math.max(0, stats.averageScore - stats.hintsPercentage)}%</p>
          
          {stats.hintsPercentage > 30 && (
            <div className="p-3 bg-orange-100 rounded-lg border border-orange-300">
              <p>⚠️ <strong>Suggerimento:</strong> Stai usando molti aiuti. Prova a riflettere di più prima di chiedere aiuto.</p>
            </div>
          )}
          
          {stats.averageScore >= 80 && stats.hintsPercentage <= 20 && (
            <div className="p-3 bg-green-100 rounded-lg border border-green-300">
              <p>🏆 <strong>Eccellente!</strong> Hai raggiunto un ottimo equilibrio tra precisione e autonomia.</p>
            </div>
          )}
          
          <p>📊 <strong>Stato attuale:</strong> {stats.totalTests} test con {stats.totalWordsStudied} parole studiate e {stats.totalHints} aiuti utilizzati.</p>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default StatsOverview;