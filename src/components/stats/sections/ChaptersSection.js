// =====================================================
// 📁 src/components/stats/sections/ChaptersSection.js - FIXED Dati Corretti + Date Ordinate
// =====================================================

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  ComposedChart
} from 'recharts';
import { BookOpen, TrendingUp, Award, Target, Info } from 'lucide-react';

const ChaptersSection = ({ testHistory, words, localRefresh }) => {
  const [selectedChapterForTrend, setSelectedChapterForTrend] = useState(null);

  // ⭐ FIXED: Calcolo corretto dei dati per capitoli
  const enhancedChapterData = useMemo(() => {
    const chapterStats = {};
    const chapterFirstTestDate = {};
    const chapterDetailedHistory = {};


    // 1️⃣ STEP 1: Raccolta dati base per capitolo dalle parole
    words.forEach(word => {
      const chapter = word.chapter || 'Senza Capitolo';
      if (!chapterStats[chapter]) {
        chapterStats[chapter] = {
          totalWords: 0,
          learnedWords: 0,
          difficultWords: 0,
          // Performance metrics (will be calculated from tests)
          testsPerformed: 0,
          totalCorrect: 0,
          totalIncorrect: 0,
          totalTestsAnswers: 0, // Total questions answered in tests
          estimatedHints: 0 // We'll estimate hints proportionally
        };
      }
      chapterStats[chapter].totalWords++;
      if (word.learned) chapterStats[chapter].learnedWords++;
      if (word.difficult) chapterStats[chapter].difficultWords++;
    });

    // 2️⃣ STEP 2: Analisi test history per capitolo con distribuzione aiuti
    testHistory.forEach((test, testIndex) => {
      const testDate = new Date(test.timestamp);
      
      if (test.chapterStats) {
        Object.entries(test.chapterStats).forEach(([chapter, stats]) => {
          if (!chapterStats[chapter]) {
            // If chapter exists in tests but not in words, create entry
            chapterStats[chapter] = {
              totalWords: 0, learnedWords: 0, difficultWords: 0,
              testsPerformed: 0, totalCorrect: 0, totalIncorrect: 0,
              totalTestsAnswers: 0, estimatedHints: 0
            };
          }
          
          const chapterStat = chapterStats[chapter];
          
          // Track first test date for ordering
          if (!chapterFirstTestDate[chapter] || testDate < chapterFirstTestDate[chapter]) {
            chapterFirstTestDate[chapter] = testDate;
          }
          
          // Update chapter performance
          chapterStat.testsPerformed++;
          chapterStat.totalCorrect += stats.correctWords || 0;
          chapterStat.totalIncorrect += stats.incorrectWords || 0;
          chapterStat.totalTestsAnswers += (stats.correctWords || 0) + (stats.incorrectWords || 0);
          
          // ⭐ CRITICAL: Distribute hints proportionally across chapters in test
          if (test.hintsUsed > 0) {
            const totalWordsInAllChapters = Object.values(test.chapterStats)
              .reduce((sum, chStats) => sum + (chStats.correctWords || 0) + (chStats.incorrectWords || 0), 0);
            const wordsInThisChapter = (stats.correctWords || 0) + (stats.incorrectWords || 0);
            
            if (totalWordsInAllChapters > 0) {
              const proportionalHints = (test.hintsUsed * wordsInThisChapter) / totalWordsInAllChapters;
              chapterStat.estimatedHints += proportionalHints;
            }
          }
          
          // Store detailed history for trend analysis
          if (!chapterDetailedHistory[chapter]) {
            chapterDetailedHistory[chapter] = [];
          }
          chapterDetailedHistory[chapter].push({
            date: testDate,
            accuracy: stats.percentage || 0,
            correct: stats.correctWords || 0,
            incorrect: stats.incorrectWords || 0,
            hints: test.hintsUsed || 0, // Total hints in test
            estimatedChapterHints: chapterStat.estimatedHints,
            timestamp: test.timestamp,
            testIndex
          });
        });
      }
    });

    // 3️⃣ STEP 3: Calcolo metriche finali CORRETTE
    const processedData = Object.entries(chapterStats).map(([chapter, data]) => {
      // ⭐ FIXED: Use correct denominators
      const totalAnswers = data.totalCorrect + data.totalIncorrect;
      const accuracy = totalAnswers > 0 ? Math.round((data.totalCorrect / totalAnswers) * 100) : 0;
      const hintsPercentage = totalAnswers > 0 ? Math.round((data.estimatedHints / totalAnswers) * 100) : 0;
      const efficiency = Math.max(0, accuracy - hintsPercentage);
      const completionRate = data.totalWords > 0 ? Math.round((data.learnedWords / data.totalWords) * 100) : 0;
      const difficultyRate = data.totalWords > 0 ? Math.round((data.difficultWords / data.totalWords) * 100) : 0;
      const studyProgress = Math.min(100, completionRate + (accuracy / 3));
      
      // Get first test date for ordering
      const firstTestDate = chapterFirstTestDate[chapter] || new Date();
      return {
        chapter: chapter === 'Senza Capitolo' ? 'Senza Cap.' : `Cap. ${chapter}`,
        fullChapter: chapter,
        totalWords: data.totalWords,
        learnedWords: data.learnedWords,
        difficultWords: data.difficultWords,
        testsPerformed: data.testsPerformed,
        totalAnswers: totalAnswers,
        accuracy,
        hintsPercentage,
        efficiency,
        completionRate,
        difficultyRate,
        studyProgress,
        estimatedHints: Math.round(data.estimatedHints * 100) / 100,
        firstTestDate,
        detailedHistory: chapterDetailedHistory[chapter] || []
      };
    }).sort((a, b) => {
      // ⭐ FIXED: Sort by first test date (chronological order)
      if (a.testsPerformed === 0 && b.testsPerformed === 0) {
        return a.fullChapter.localeCompare(b.fullChapter);
      }
      if (a.testsPerformed === 0) return 1;
      if (b.testsPerformed === 0) return -1;
      return a.firstTestDate - b.firstTestDate;
    });

    return { processedData, chapterDetailedHistory };
  }, [testHistory, words, localRefresh]);

  // ⭐ FIXED: Trend data for selected chapter only - CHRONOLOGICALLY ORDERED
  const selectedChapterTrendData = useMemo(() => {
    if (!selectedChapterForTrend || !enhancedChapterData.chapterDetailedHistory[selectedChapterForTrend]) {
      return [];
    }

    const history = enhancedChapterData.chapterDetailedHistory[selectedChapterForTrend];
    
    // ⭐ CRITICAL: Sort chronologically (oldest to newest) BEFORE taking last 15
    // Timestamps are ISO strings, sort them directly as Date objects
    const sortedHistory = [...history].sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return dateA.getTime() - dateB.getTime(); // Oldest first
    });
    
    // Take last 15 tests (most recent) but keep chronological order
    const recentHistory = sortedHistory.slice(-15);
        
    return recentHistory.map((entry, index) => ({
      testNumber: `Test ${index + 1}`,
      date: entry.date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }),
      accuracy: entry.accuracy,
      correct: entry.correct,
      incorrect: entry.incorrect,
      fullDate: entry.date.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      timestamp: entry.timestamp
    }));
  }, [selectedChapterForTrend, enhancedChapterData.chapterDetailedHistory]);

  // ⭐ FIXED: Statistics calculations
  const overviewStats = useMemo(() => {
    const testedChapters = enhancedChapterData.processedData.filter(c => c.testsPerformed > 0);
    
    return {
      totalChapters: enhancedChapterData.processedData.length,
      testedChapters: testedChapters.length,
      bestEfficiency: testedChapters.length > 0 ? Math.max(...testedChapters.map(c => c.efficiency)) : 0,
      averageCompletion: enhancedChapterData.processedData.length > 0 
        ? Math.round(enhancedChapterData.processedData.reduce((sum, c) => sum + c.completionRate, 0) / enhancedChapterData.processedData.length)
        : 0,
      averageAccuracy: testedChapters.length > 0
        ? Math.round(testedChapters.reduce((sum, c) => sum + c.accuracy, 0) / testedChapters.length)
        : 0
    };
  }, [enhancedChapterData.processedData]);

  // ⭐ FIXED: Top and struggling chapters
  const topChapters = enhancedChapterData.processedData
    .filter(c => c.testsPerformed > 0)
    .sort((a, b) => b.efficiency - a.efficiency)
    .slice(0, 5);

  const strugglingChapters = enhancedChapterData.processedData
    .filter(c => c.testsPerformed > 2) // At least 3 tests to be considered struggling
    .sort((a, b) => a.efficiency - b.efficiency)
    .slice(0, 3);

  // Colors for charts
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16'];

  return (
    <div className="space-y-8" key={`chapters-${localRefresh}`}>
      
      {/* ⭐ FIXED: Overview Cards with correct calculations */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4 text-center">
            <BookOpen className="w-8 h-8 mx-auto mb-2" />
            <div className="text-2xl font-bold">{overviewStats.totalChapters}</div>
            <div className="text-blue-100 text-sm">Capitoli Totali</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-4 text-center">
            <Award className="w-8 h-8 mx-auto mb-2" />
            <div className="text-2xl font-bold">{overviewStats.bestEfficiency}%</div>
            <div className="text-green-100 text-sm">Miglior Efficienza</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4 text-center">
            <Target className="w-8 h-8 mx-auto mb-2" />
            <div className="text-2xl font-bold">{overviewStats.averageCompletion}%</div>
            <div className="text-purple-100 text-sm">Completamento Medio</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 mx-auto mb-2" />
            <div className="text-2xl font-bold">{overviewStats.testedChapters}</div>
            <div className="text-orange-100 text-sm">Capitoli Testati</div>
          </CardContent>
        </Card>
      </div>

      {/* ⭐ FIXED: Performance Comparison Chart with correct data */}
      <Card className="bg-white border-0 shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <CardTitle className="flex items-center gap-3 text-white">
            <BarChart className="w-6 h-6" />
            Analisi Performance Dettagliata per Capitolo
          </CardTitle>
          <div className="text-blue-100 text-sm space-y-1">
            <p><strong>Efficienza = Precisione - Aiuti utilizzati.</strong> Verde = Ottimo, Giallo = Buono, Rosso = Da migliorare</p>
            <p>📊 Aiuti stimati proporzionalmente dai test. Capitoli ordinati per primo test cronologico.</p>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart 
              data={enhancedChapterData.processedData.filter(c => c.testsPerformed > 0)} 
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e4e7" />
              <XAxis dataKey="chapter" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value, name) => [
                  `${value}%`,
                  name === 'accuracy' ? 'Precisione' :
                  name === 'hintsPercentage' ? 'Aiuti Stimati' :
                  name === 'efficiency' ? 'Efficienza Netta' :
                  name === 'completionRate' ? 'Completamento' : name
                ]}
                labelFormatter={(label) => `Capitolo: ${label}`}
                contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
                labelStyle={{ fontWeight: 'bold' }}
              />
              <Bar dataKey="accuracy" fill="#3b82f6" name="accuracy" />
              <Bar dataKey="hintsPercentage" fill="#f59e0b" name="hintsPercentage" />
              <Bar dataKey="efficiency" fill="#10b981" name="efficiency" />
              <Line type="monotone" dataKey="completionRate" stroke="#8b5cf6" strokeWidth={3} name="completionRate" />
            </ComposedChart>
          </ResponsiveContainer>
          
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span>Precisione %</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span>Aiuti Stimati %</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Efficienza Netta</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 bg-purple-500 rounded"></div>
              <span>Completamento</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ⭐ FIXED: Interactive Chapter Trend Analysis with correct chronological order */}
      {selectedChapterForTrend && selectedChapterTrendData.length > 0 && (
        <Card className="bg-white border-0 shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
            <CardTitle className="flex items-center gap-3 text-white">
              <TrendingUp className="w-6 h-6" />
              Andamento Temporale: {selectedChapterForTrend === 'Senza Capitolo' ? 'Senza Cap.' : `Cap. ${selectedChapterForTrend}`}
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-green-100">
              <span>Ultimi {selectedChapterTrendData.length} test del capitolo (cronologici)</span>
              <span>•</span>
              <span>
                Dal {selectedChapterTrendData[0]?.date} al {selectedChapterTrendData[selectedChapterTrendData.length - 1]?.date}
              </span>
              <button 
                onClick={() => setSelectedChapterForTrend(null)}
                className="px-3 py-1 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
              >
                ✕ Chiudi
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={selectedChapterTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  labelFormatter={(label, payload) => {
                    if (payload && payload.length > 0) {
                      return `Data: ${payload[0].payload.fullDate}`;
                    }
                    return `Data: ${label}`;
                  }}
                  formatter={(value, name) => [
                    name === 'accuracy' ? `${value}%` : value,
                    name === 'accuracy' ? 'Precisione' :
                    name === 'correct' ? 'Corrette' :
                    name === 'incorrect' ? 'Sbagliate' : name
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="accuracy" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  name="accuracy"
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
                <Bar dataKey="correct" fill="#10b981" name="correct" opacity={0.7} />
                <Bar dataKey="incorrect" fill="#ef4444" name="incorrect" opacity={0.7} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ⭐ FIXED: Top & Struggling Chapters with correct calculations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Performing */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
          <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
            <CardTitle className="flex items-center gap-3">
              <Award className="w-6 h-6" />
              🏆 Top Capitoli Performer
            </CardTitle>
            <div className="flex items-center gap-2 text-green-100">
              <Info className="w-4 h-4" />
              <span className="text-sm">Efficienza = Precisione - % Aiuti Stimati</span>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {topChapters.length > 0 ? topChapters.map((chapter, index) => (
                <div key={chapter.fullChapter} className="flex items-center justify-between p-4 bg-white rounded-xl border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-bold text-gray-800">{chapter.chapter}</div>
                      <div className="text-sm text-gray-600">
                        {chapter.totalWords} parole • {chapter.testsPerformed} test • {chapter.totalAnswers} risposte
                      </div>
                      <div className="text-xs text-gray-500">
                        Precisione: {chapter.accuracy}% • Aiuti: {chapter.hintsPercentage}%
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-green-600">{chapter.efficiency}%</div>
                    <div className="text-sm text-green-700">Efficienza</div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Nessun capitolo testato ancora</p>
                  <p className="text-sm">Completa alcuni test per vedere i top performer</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Struggling Chapters */}
        <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
            <CardTitle className="flex items-center gap-3">
              <Target className="w-6 h-6" />
              📚 Capitoli da Migliorare
            </CardTitle>
            <div className="text-orange-100 text-sm">
              Capitoli con almeno 3 test e bassa efficienza
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {strugglingChapters.length > 0 ? strugglingChapters.map((chapter, index) => (
                <div key={chapter.fullChapter} className="p-4 bg-white rounded-xl border border-orange-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-bold text-gray-800">{chapter.chapter}</div>
                    <div className="text-xl font-bold text-red-600">{chapter.efficiency}%</div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                    <div className="text-center">
                      <div className="font-bold text-blue-600">{chapter.accuracy}%</div>
                      <div className="text-blue-700 text-xs">Precisione</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-orange-600">{chapter.hintsPercentage}%</div>
                      <div className="text-orange-700 text-xs">Aiuti Stimati</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-purple-600">{chapter.difficultyRate}%</div>
                      <div className="text-purple-700 text-xs">Difficili</div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-600 mb-2">
                    {chapter.totalAnswers} risposte in {chapter.testsPerformed} test • 
                    Aiuti stimati: {chapter.estimatedHints}
                  </div>
                  
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <p className="text-xs text-orange-800">
                      💡 <strong>Suggerimento:</strong> 
                      {chapter.hintsPercentage > 30 ? ' Riduci l\'uso degli aiuti.' : ''}
                      {chapter.difficultyRate > 50 ? ' Ripassa le parole difficili.' : ''}
                      {chapter.accuracy < 60 ? ' Concentrati su questo capitolo.' : ''}
                      {chapter.hintsPercentage <= 30 && chapter.difficultyRate <= 50 && chapter.accuracy >= 60 ? ' Continua così, stai migliorando!' : ''}
                    </p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Nessun capitolo in difficoltà</p>
                  <p className="text-sm">Ottimo lavoro! Tutti i capitoli testati hanno buone performance</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ⭐ ENHANCED: Detailed Chapter Breakdown with Interactive Trend */}
      <Card className="bg-white border-0 shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
          <CardTitle className="flex items-center gap-3 text-white">
            <BookOpen className="w-6 h-6" />
            Analisi Dettagliata Tutti i Capitoli
          </CardTitle>
          <div className="text-indigo-100 text-sm">
            Clicca su un capitolo per vedere l'andamento temporale • Ordinati per primo test cronologico
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 font-bold">Capitolo</th>
                  <th className="text-center py-3 px-2 font-bold">Parole</th>
                  <th className="text-center py-3 px-2 font-bold">Test</th>
                  <th className="text-center py-3 px-2 font-bold">Risposte</th>
                  <th className="text-center py-3 px-2 font-bold">Precisione</th>
                  <th className="text-center py-3 px-2 font-bold">Aiuti Est.</th>
                  <th className="text-center py-3 px-2 font-bold">Efficienza</th>
                  <th className="text-center py-3 px-2 font-bold">Completamento</th>
                  <th className="text-center py-3 px-2 font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {enhancedChapterData.processedData.map((chapter, index) => (
                  <tr 
                    key={chapter.fullChapter} 
                    className={`border-b border-gray-100 transition-colors ${
                      index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                    } ${
                      chapter.testsPerformed > 0 ? 'hover:bg-blue-50 cursor-pointer' : ''
                    } ${
                      selectedChapterForTrend === chapter.fullChapter ? 'bg-blue-100 border-blue-300' : ''
                    }`}
                    onClick={() => {
                      if (chapter.testsPerformed > 0) {
                        setSelectedChapterForTrend(
                          selectedChapterForTrend === chapter.fullChapter ? null : chapter.fullChapter
                        );
                      }
                    }}
                  >
                    <td className="py-3 px-2 font-medium">{chapter.chapter}</td>
                    <td className="text-center py-3 px-2">
                      <span className="inline-flex items-center gap-1">
                        {chapter.totalWords}
                        {chapter.difficultWords > 0 && (
                          <span className="text-xs bg-red-100 text-red-700 px-1 rounded">
                            {chapter.difficultWords}⭐
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="text-center py-3 px-2">{chapter.testsPerformed}</td>
                    <td className="text-center py-3 px-2">
                      <span className="text-xs">
                        {chapter.totalAnswers}
                        {chapter.testsPerformed > 0 && (
                          <div className="text-gray-500">
                            ({Math.round(chapter.totalAnswers / chapter.testsPerformed)}/test)
                          </div>
                        )}
                      </span>
                    </td>
                    <td className="text-center py-3 px-2">
                      <span className={`font-bold ${
                        chapter.accuracy >= 80 ? 'text-green-600' : 
                        chapter.accuracy >= 60 ? 'text-blue-600' : 'text-red-600'
                      }`}>
                        {chapter.accuracy}%
                      </span>
                    </td>
                    <td className="text-center py-3 px-2">
                      <span className={`font-bold ${
                        chapter.hintsPercentage <= 20 ? 'text-green-600' : 
                        chapter.hintsPercentage <= 40 ? 'text-orange-600' : 'text-red-600'
                      }`}>
                        {chapter.hintsPercentage}%
                      </span>
                      <div className="text-xs text-gray-500">
                        ({chapter.estimatedHints})
                      </div>
                    </td>
                    <td className="text-center py-3 px-2">
                      <span className={`font-bold ${
                        chapter.efficiency >= 70 ? 'text-green-600' : 
                        chapter.efficiency >= 50 ? 'text-orange-600' : 'text-red-600'
                      }`}>
                        {chapter.efficiency}%
                      </span>
                    </td>
                    <td className="text-center py-3 px-2">
                      <div className="flex items-center justify-center">
                        <div className="w-12 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              chapter.completionRate >= 80 ? 'bg-green-500' : 
                              chapter.completionRate >= 50 ? 'bg-blue-500' : 'bg-orange-500'
                            }`}
                            style={{ width: `${Math.min(100, chapter.completionRate)}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-xs font-bold">{chapter.completionRate}%</span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-2">
                      {chapter.testsPerformed === 0 ? (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Non testato</span>
                      ) : chapter.efficiency >= 70 ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">🏆 Eccellente</span>
                      ) : chapter.efficiency >= 50 ? (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">👍 Buono</span>
                      ) : (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">📚 Da migliorare</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {enhancedChapterData.processedData.some(c => c.testsPerformed > 0) && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                💡 <strong>Suggerimento:</strong> Clicca su un capitolo testato per visualizzare il suo andamento temporale dettagliato.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChaptersSection;