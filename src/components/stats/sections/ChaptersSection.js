// =====================================================
// 📁 src/components/stats/sections/ChaptersSection.js - ENHANCED
// =====================================================

import React, { useMemo } from 'react';
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
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Area,
  AreaChart
} from 'recharts';
import { BookOpen, TrendingUp, Award, Target } from 'lucide-react';
import { useStatsData } from '../hooks/useStatsData';

const ChaptersSection = ({ testHistory, words, localRefresh }) => {
  const { advancedStats, chapterComparisonData } = useStatsData(testHistory);

  // ⭐ ENHANCED: Elaborazione dati completa per capitoli
  const enhancedChapterData = useMemo(() => {
    const chapterStats = {};
    const chapterTrends = {};

    // Raccolta dati base per capitolo
    words.forEach(word => {
      const chapter = word.chapter || 'Senza Capitolo';
      if (!chapterStats[chapter]) {
        chapterStats[chapter] = {
          totalWords: 0,
          learnedWords: 0,
          difficultWords: 0,
          tests: 0,
          totalCorrect: 0,
          totalIncorrect: 0,
          totalHints: 0,
          testsPerformed: 0
        };
      }
      chapterStats[chapter].totalWords++;
      if (word.learned) chapterStats[chapter].learnedWords++;
      if (word.difficult) chapterStats[chapter].difficultWords++;
    });

    // Analisi test history per capitolo
    testHistory.forEach(test => {
      if (test.chapterStats) {
        Object.entries(test.chapterStats).forEach(([chapter, stats]) => {
          if (!chapterStats[chapter]) {
            chapterStats[chapter] = {
              totalWords: 0, learnedWords: 0, difficultWords: 0,
              tests: 0, totalCorrect: 0, totalIncorrect: 0, totalHints: 0, testsPerformed: 0
            };
          }
          
          chapterStats[chapter].tests++;
          chapterStats[chapter].totalCorrect += stats.correctWords || 0;
          chapterStats[chapter].totalIncorrect += stats.incorrectWords || 0;
          chapterStats[chapter].totalHints += stats.hintsUsed || 0;
          chapterStats[chapter].testsPerformed++;

          // Trend temporale
          const testDate = new Date(test.timestamp).toISOString().split('T')[0];
          if (!chapterTrends[chapter]) {
            chapterTrends[chapter] = [];
          }
          chapterTrends[chapter].push({
            date: testDate,
            accuracy: stats.percentage || 0,
            hints: stats.hintsUsed || 0,
            timestamp: test.timestamp
          });
        });
      }
    });

    // Calcolo metriche finali
    const processedData = Object.entries(chapterStats).map(([chapter, data]) => {
      const totalAnswers = data.totalCorrect + data.totalIncorrect;
      const accuracy = totalAnswers > 0 ? Math.round((data.totalCorrect / totalAnswers) * 100) : 0;
      const hintsPercentage = totalAnswers > 0 ? Math.round((data.totalHints / totalAnswers) * 100) : 0;
      const efficiency = Math.max(0, accuracy - hintsPercentage);
      const completionRate = data.totalWords > 0 ? Math.round((data.learnedWords / data.totalWords) * 100) : 0;
      const difficultyRate = data.totalWords > 0 ? Math.round((data.difficultWords / data.totalWords) * 100) : 0;

      return {
        chapter: chapter === 'Senza Capitolo' ? 'Senza Cap.' : `Cap. ${chapter}`,
        fullChapter: chapter,
        totalWords: data.totalWords,
        learnedWords: data.learnedWords,
        difficultWords: data.difficultWords,
        testsPerformed: data.testsPerformed,
        accuracy,
        hintsPercentage,
        efficiency,
        completionRate,
        difficultyRate,
        studyProgress: Math.min(100, completionRate + (accuracy / 2)),
        trend: chapterTrends[chapter] ? chapterTrends[chapter].slice(-5) : []
      };
    }).sort((a, b) => b.studyProgress - a.studyProgress);

    return { processedData, chapterTrends };
  }, [testHistory, words, localRefresh]);

  // ⭐ NEW: Dati per grafico trend temporale
  const trendData = useMemo(() => {
    const trends = {};
    testHistory.slice(-20).forEach(test => {
      const date = new Date(test.timestamp).toLocaleDateString('it-IT', { month: 'short', day: 'numeric' });
      if (!trends[date]) {
        trends[date] = { date, chapters: {} };
      }
      
      if (test.chapterStats) {
        Object.entries(test.chapterStats).forEach(([chapter, stats]) => {
          const chapterKey = chapter === 'Senza Capitolo' ? 'Senza Cap.' : `Cap. ${chapter}`;
          if (!trends[date].chapters[chapterKey]) {
            trends[date].chapters[chapterKey] = [];
          }
          trends[date].chapters[chapterKey].push(stats.percentage || 0);
        });
      }
    });

    return Object.values(trends).map(day => {
      const result = { date: day.date };
      Object.entries(day.chapters).forEach(([chapter, scores]) => {
        result[chapter] = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
      });
      return result;
    });
  }, [testHistory]);

  // ⭐ NEW: Top performing chapters
  const topChapters = enhancedChapterData.processedData.slice(0, 5);
  const strugglingChapters = enhancedChapterData.processedData
    .filter(c => c.testsPerformed > 0)
    .sort((a, b) => a.efficiency - b.efficiency)
    .slice(0, 3);

  // ⭐ NEW: Colors for charts
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16'];

  return (
    <div className="space-y-8" key={`chapters-${localRefresh}`}>
      
      {/* ⭐ ENHANCED: Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4 text-center">
            <BookOpen className="w-8 h-8 mx-auto mb-2" />
            <div className="text-2xl font-bold">{enhancedChapterData.processedData.length}</div>
            <div className="text-blue-100 text-sm">Capitoli Totali</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-4 text-center">
            <Award className="w-8 h-8 mx-auto mb-2" />
            <div className="text-2xl font-bold">
              {topChapters.length > 0 ? Math.round(topChapters[0]?.efficiency || 0) : 0}%
            </div>
            <div className="text-green-100 text-sm">Miglior Efficienza</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4 text-center">
            <Target className="w-8 h-8 mx-auto mb-2" />
            <div className="text-2xl font-bold">
              {Math.round(enhancedChapterData.processedData.reduce((sum, c) => sum + c.completionRate, 0) / Math.max(1, enhancedChapterData.processedData.length))}%
            </div>
            <div className="text-purple-100 text-sm">Completamento Medio</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 mx-auto mb-2" />
            <div className="text-2xl font-bold">
              {enhancedChapterData.processedData.filter(c => c.testsPerformed > 0).length}
            </div>
            <div className="text-orange-100 text-sm">Capitoli Testati</div>
          </CardContent>
        </Card>
      </div>

      {/* ⭐ ENHANCED: Performance Comparison Chart */}
      <Card className="bg-white border-0 shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <CardTitle className="flex items-center gap-3 text-white">
            <BarChart className="w-6 h-6" />
            Analisi Performance Dettagliata per Capitolo
          </CardTitle>
          <p className="text-blue-100 text-sm">
            Efficienza = Precisione - Aiuti utilizzati. Verde = Ottimo, Giallo = Buono, Rosso = Da migliorare
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={enhancedChapterData.processedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e4e7" />
              <XAxis dataKey="chapter" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value, name) => [
                  `${value}%`,
                  name === 'accuracy' ? 'Precisione' :
                  name === 'hintsPercentage' ? 'Aiuti Usati' :
                  name === 'efficiency' ? 'Efficienza Netta' :
                  name === 'completionRate' ? 'Completamento' : name
                ]}
                labelFormatter={(label) => `Capitolo: ${label}`}
                contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
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
              <span>Aiuti %</span>
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

      {/* ⭐ NEW: Trend Temporale */}
      {trendData.length > 5 && (
        <Card className="bg-white border-0 shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
            <CardTitle className="flex items-center gap-3 text-white">
              <TrendingUp className="w-6 h-6" />
              Andamento Temporale per Capitolo (Ultimi Test)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                {Object.keys(trendData[0] || {})
                  .filter(key => key !== 'date')
                  .slice(0, 5)
                  .map((chapter, index) => (
                    <Line 
                      key={chapter}
                      type="monotone" 
                      dataKey={chapter} 
                      stroke={colors[index]} 
                      strokeWidth={2}
                      name={chapter}
                    />
                  ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ⭐ NEW: Top & Struggling Chapters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Performing */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
          <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
            <CardTitle className="flex items-center gap-3">
              <Award className="w-6 h-6" />
              🏆 Top Capitoli Performer
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {topChapters.map((chapter, index) => (
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
                        {chapter.totalWords} parole • {chapter.testsPerformed} test
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-green-600">{chapter.efficiency}%</div>
                    <div className="text-sm text-green-700">Efficienza</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Struggling Chapters */}
        {strugglingChapters.length > 0 && (
          <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
              <CardTitle className="flex items-center gap-3">
                <Target className="w-6 h-6" />
                📚 Capitoli da Migliorare
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {strugglingChapters.map((chapter, index) => (
                  <div key={chapter.fullChapter} className="p-4 bg-white rounded-xl border border-orange-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-bold text-gray-800">{chapter.chapter}</div>
                      <div className="text-xl font-bold text-red-600">{chapter.efficiency}%</div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-center">
                        <div className="font-bold text-blue-600">{chapter.accuracy}%</div>
                        <div className="text-blue-700 text-xs">Precisione</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-orange-600">{chapter.hintsPercentage}%</div>
                        <div className="text-orange-700 text-xs">Aiuti</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-purple-600">{chapter.difficultyRate}%</div>
                        <div className="text-purple-700 text-xs">Difficili</div>
                      </div>
                    </div>
                    
                    <div className="mt-3 p-2 bg-orange-100 rounded-lg">
                      <p className="text-xs text-orange-800">
                        💡 <strong>Suggerimento:</strong> 
                        {chapter.hintsPercentage > 30 ? ' Riduci l\'uso degli aiuti' : ''}
                        {chapter.difficultyRate > 50 ? ' Ripassa le parole difficili' : ''}
                        {chapter.accuracy < 60 ? ' Concentrati su questo capitolo' : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ⭐ NEW: Detailed Chapter Breakdown */}
      <Card className="bg-white border-0 shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
          <CardTitle className="flex items-center gap-3 text-white">
            <BookOpen className="w-6 h-6" />
            Analisi Dettagliata Tutti i Capitoli
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 font-bold">Capitolo</th>
                  <th className="text-center py-3 px-2 font-bold">Parole</th>
                  <th className="text-center py-3 px-2 font-bold">Test</th>
                  <th className="text-center py-3 px-2 font-bold">Precisione</th>
                  <th className="text-center py-3 px-2 font-bold">Aiuti</th>
                  <th className="text-center py-3 px-2 font-bold">Efficienza</th>
                  <th className="text-center py-3 px-2 font-bold">Completamento</th>
                  <th className="text-center py-3 px-2 font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {enhancedChapterData.processedData.map((chapter, index) => (
                  <tr key={chapter.fullChapter} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default ChaptersSection;