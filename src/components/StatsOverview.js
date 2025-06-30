// /src/components/StatsOverview.js
// This file contains the StatsOverview component, which displays an overview of the user's learning statistics.
// It includes general statistics, charts showing progress over time, and a history of completed tests.
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import { BarChart3, TrendingUp, Trophy, Sparkles, Play, BookOpen, Target, Award, Calendar, Filter } from 'lucide-react';

const StatsOverview = ({ testHistory, onClearHistory, onGoToMain }) => {
  const [selectedView, setSelectedView] = useState('overview'); // overview, chapters, performance, trends
  const [selectedChapter, setSelectedChapter] = useState('all');

  // Analisi avanzata dei dati
  const getAdvancedStats = () => {
    if (testHistory.length === 0) {
      return {
        totalTests: 0,
        averageScore: 0,
        bestScore: 0,
        worstScore: 0,
        totalWordsStudied: 0,
        totalCorrect: 0,
        totalIncorrect: 0,
        chaptersAnalyzed: 0,
        testTypeDistribution: {},
        difficultyDistribution: {},
        improvementTrend: 0,
        lastWeekTests: 0,
        chapterPerformance: {}
      };
    }

    const totalTests = testHistory.length;
    const totalCorrect = testHistory.reduce((sum, test) => sum + test.correctWords, 0);
    const totalIncorrect = testHistory.reduce((sum, test) => sum + test.incorrectWords, 0);
    const totalWordsStudied = totalCorrect + totalIncorrect;
    const averageScore = Math.round(testHistory.reduce((sum, test) => sum + test.percentage, 0) / totalTests);
    const bestScore = Math.max(...testHistory.map(test => test.percentage));
    const worstScore = Math.min(...testHistory.map(test => test.percentage));

    // Analisi tipi di test
    const testTypeDistribution = testHistory.reduce((acc, test) => {
      const type = test.testType || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // Analisi difficoltà
    const difficultyDistribution = testHistory.reduce((acc, test) => {
      const difficulty = test.difficulty || 'medium';
      acc[difficulty] = (acc[difficulty] || 0) + 1;
      return acc;
    }, {});

    // Performance per capitolo
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
              averagePercentage: 0,
              bestPercentage: 0,
              worstPercentage: 100
            };
          }
          
          const perf = chapterPerformance[chapter];
          perf.totalTests += 1;
          perf.totalWords += stats.totalWords;
          perf.totalCorrect += stats.correctWords;
          perf.totalIncorrect += stats.incorrectWords;
          perf.bestPercentage = Math.max(perf.bestPercentage, stats.percentage);
          perf.worstPercentage = Math.min(perf.worstPercentage, stats.percentage);
        });
      }
    });

    // Calcola percentuali medie per capitolo
    Object.keys(chapterPerformance).forEach(chapter => {
      const perf = chapterPerformance[chapter];
      perf.averagePercentage = Math.round((perf.totalCorrect / perf.totalWords) * 100);
    });

    // Trend di miglioramento
    let improvementTrend = 0;
    if (totalTests >= 4) {
      const recentTests = testHistory.slice(0, Math.min(5, Math.floor(totalTests / 2)));
      const olderTests = testHistory.slice(Math.min(5, Math.floor(totalTests / 2)), Math.min(10, totalTests));
      
      if (olderTests.length > 0) {
        const recentAvg = recentTests.reduce((sum, test) => sum + test.percentage, 0) / recentTests.length;
        const olderAvg = olderTests.reduce((sum, test) => sum + test.percentage, 0) / olderTests.length;
        improvementTrend = Math.round(recentAvg - olderAvg);
      }
    }

    // Test ultima settimana
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const lastWeekTests = testHistory.filter(test => 
      new Date(test.timestamp) >= oneWeekAgo
    ).length;

    return {
      totalTests,
      averageScore,
      bestScore,
      worstScore,
      totalWordsStudied,
      totalCorrect,
      totalIncorrect,
      chaptersAnalyzed: Object.keys(chapterPerformance).length,
      testTypeDistribution,
      difficultyDistribution,
      improvementTrend,
      lastWeekTests,
      chapterPerformance
    };
  };

  const getTimelineData = () => {
    return [...testHistory].reverse().slice(-20).map((test, index) => ({
      test: `Test ${index + 1}`,
      percentage: test.percentage,
      correct: test.correctWords,
      incorrect: test.incorrectWords,
      date: new Date(test.timestamp).toLocaleDateString('it-IT'),
      time: new Date(test.timestamp).toLocaleTimeString('it-IT', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      chapters: test.testParameters?.selectedChapters?.length || 0,
      difficulty: test.difficulty || 'medium',
      type: test.testType || 'unknown'
    }));
  };

  const getChapterComparisonData = () => {
    const stats = getAdvancedStats();
    return Object.entries(stats.chapterPerformance).map(([chapter, perf]) => ({
      chapter: chapter === 'Senza Capitolo' ? 'Senza Cap.' : `Cap. ${chapter}`,
      fullChapter: chapter,
      percentage: perf.averagePercentage,
      tests: perf.totalTests,
      words: perf.totalWords,
      best: perf.bestPercentage,
      worst: perf.worstPercentage
    })).sort((a, b) => b.percentage - a.percentage);
  };

  const getDifficultyData = () => {
    const stats = getAdvancedStats();
    return Object.entries(stats.difficultyDistribution).map(([difficulty, count]) => ({
      name: difficulty === 'easy' ? 'Facile' : difficulty === 'medium' ? 'Medio' : 'Difficile',
      value: count,
      percentage: Math.round((count / stats.totalTests) * 100),
      color: difficulty === 'easy' ? '#10b981' : difficulty === 'medium' ? '#f59e0b' : '#ef4444'
    }));
  };

  const stats = getAdvancedStats();

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
      {/* Header con Navigation */}
      <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-2xl rounded-3xl overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-1">
          <div className="bg-white rounded-3xl p-6">
            <div className="flex justify-between items-center mb-6">
              <CardTitle className="flex items-center gap-3 text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                <BarChart3 className="w-8 h-8 text-purple-600" />
                Analisi Avanzata dell'Apprendimento
              </CardTitle>
              <Button
                onClick={onClearHistory}
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                🗑️ Pulisci Cronologia
              </Button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 mb-6">
              {[
                { id: 'overview', label: 'Panoramica', icon: '📈' },
                { id: 'chapters', label: 'Per Capitoli', icon: '📚' },
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

            {/* Statistiche Generali Sempre Visibili */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-4 rounded-2xl text-white text-center shadow-xl">
                <div className="text-2xl font-bold">{stats.totalTests}</div>
                <div className="text-blue-100 text-sm">Test Totali</div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-4 rounded-2xl text-white text-center shadow-xl">
                <div className="text-2xl font-bold">{stats.averageScore}%</div>
                <div className="text-green-100 text-sm">Media</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded-2xl text-white text-center shadow-xl">
                <div className="text-2xl font-bold">{stats.bestScore}%</div>
                <div className="text-purple-100 text-sm">Record</div>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-red-500 p-4 rounded-2xl text-white text-center shadow-xl">
                <div className="text-2xl font-bold">{stats.totalWordsStudied}</div>
                <div className="text-orange-100 text-sm">Parole</div>
              </div>
              <div className="bg-gradient-to-br from-indigo-500 to-blue-500 p-4 rounded-2xl text-white text-center shadow-xl">
                <div className="text-2xl font-bold">{stats.chaptersAnalyzed}</div>
                <div className="text-indigo-100 text-sm">Capitoli</div>
              </div>
              <div className="bg-gradient-to-br from-teal-500 to-cyan-500 p-4 rounded-2xl text-white text-center shadow-xl">
                <div className="text-2xl font-bold">{stats.lastWeekTests}</div>
                <div className="text-teal-100 text-sm">Ultima Settimana</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Contenuto Dinamico Basato sulla Vista Selezionata */}
      {selectedView === 'overview' && (
        <OverviewSection 
          stats={stats} 
          timelineData={getTimelineData()} 
          difficultyData={getDifficultyData()}
        />
      )}

      {selectedView === 'chapters' && (
        <ChaptersSection 
          chapterData={getChapterComparisonData()}
          selectedChapter={selectedChapter}
          setSelectedChapter={setSelectedChapter}
          testHistory={testHistory}
        />
      )}

      {selectedView === 'performance' && (
        <PerformanceSection 
          stats={stats}
          timelineData={getTimelineData()}
        />
      )}

      {selectedView === 'trends' && (
        <TrendsSection 
          timelineData={getTimelineData()}
          stats={stats}
        />
      )}
    </div>
  );
};

// Sezione Panoramica
const OverviewSection = ({ stats, timelineData, difficultyData }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
    {/* Andamento Generale */}
    <Card className="bg-white border-0 shadow-xl rounded-3xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <CardTitle className="flex items-center gap-3 text-white">
          <TrendingUp className="w-6 h-6" />
          Andamento Generale (Ultimi 20 Test)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={timelineData}>
            <defs>
              <linearGradient id="colorPercentage" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e4e7" />
            <XAxis dataKey="test" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="percentage" 
              stroke="#3b82f6" 
              fillOpacity={1}
              fill="url(#colorPercentage)"
              strokeWidth={3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>

    {/* Distribuzione Difficoltà */}
    <Card className="bg-white border-0 shadow-xl rounded-3xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
        <CardTitle className="flex items-center gap-3 text-white">
          <Target className="w-6 h-6" />
          Distribuzione Difficoltà Test
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={difficultyData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({name, percentage}) => `${name}: ${percentage}%`}
            >
              {difficultyData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>

    {/* Trend di Miglioramento */}
    {stats.improvementTrend !== 0 && (
      <Card className="lg:col-span-2 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 shadow-xl rounded-3xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className={`p-6 rounded-3xl ${stats.improvementTrend > 0 ? 'bg-green-500' : 'bg-red-500'}`}>
              <TrendingUp className="w-12 h-12 text-white" />
            </div>
            <div>
              <div className="text-3xl font-bold">
                Trend di Miglioramento: 
                <span className={`ml-3 ${stats.improvementTrend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.improvementTrend > 0 ? '+' : ''}{stats.improvementTrend}%
                </span>
              </div>
              <div className="text-gray-600 text-lg">
                {stats.improvementTrend > 0 ? 
                  '🎉 Continua così! Stai migliorando costantemente.' :
                  '💪 Non mollare! Focalizzati sulle aree più difficili.'
                }
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )}
  </div>
);

// Sezione Capitoli
const ChaptersSection = ({ chapterData, selectedChapter, setSelectedChapter, testHistory }) => (
  <div className="space-y-8">
    {/* Filtro Capitoli */}
    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-blue-600" />
          <label className="font-medium text-blue-800">Analizza Capitolo:</label>
          <select
            value={selectedChapter}
            onChange={(e) => setSelectedChapter(e.target.value)}
            className="px-4 py-2 border border-blue-300 rounded-lg bg-white"
          >
            <option value="all">Tutti i Capitoli</option>
            {chapterData.map(chapter => (
              <option key={chapter.fullChapter} value={chapter.fullChapter}>
                {chapter.chapter}
              </option>
            ))}
          </select>
        </div>
      </CardContent>
    </Card>

    {/* Confronto Performance Capitoli */}
    <Card className="bg-white border-0 shadow-xl rounded-3xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <CardTitle className="flex items-center gap-3 text-white">
          <BookOpen className="w-6 h-6" />
          Performance per Capitolo
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chapterData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="chapter" />
            <YAxis domain={[0, 100]} />
            <Tooltip 
              formatter={(value, name) => [
                name === 'percentage' ? `${value}%` :
                name === 'best' ? `${value}%` :
                name === 'worst' ? `${value}%` : value,
                name === 'percentage' ? 'Media' :
                name === 'best' ? 'Miglior Risultato' :
                name === 'worst' ? 'Peggior Risultato' :
                name === 'tests' ? 'Test Completati' : 'Parole Studiate'
              ]}
            />
            <Bar dataKey="percentage" fill="#8b5cf6" name="percentage" />
            <Bar dataKey="best" fill="#10b981" name="best" />
            <Bar dataKey="worst" fill="#ef4444" name="worst" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>

    {/* Dettagli Capitolo Selezionato */}
    {selectedChapter !== 'all' && (
      <ChapterDetailCard 
        chapter={selectedChapter}
        chapterData={chapterData.find(c => c.fullChapter === selectedChapter)}
        testHistory={testHistory}
      />
    )}
  </div>
);

// Dettagli di un capitolo specifico
const ChapterDetailCard = ({ chapter, chapterData, testHistory }) => {
  const chapterTests = testHistory.filter(test => 
    test.chapterStats && test.chapterStats[chapter]
  ).slice(0, 10);

  const chapterTimeline = chapterTests.reverse().map((test, index) => ({
    test: `Test ${index + 1}`,
    percentage: test.chapterStats[chapter].percentage,
    correct: test.chapterStats[chapter].correctWords,
    incorrect: test.chapterStats[chapter].incorrectWords,
    date: new Date(test.timestamp).toLocaleDateString('it-IT')
  }));

  return (
    <Card className="bg-white border-0 shadow-xl rounded-3xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
        <CardTitle className="flex items-center gap-3 text-white">
          <Award className="w-6 h-6" />
          Dettagli Capitolo: {chapter === 'Senza Capitolo' ? 'Senza Capitolo' : `Capitolo ${chapter}`}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Statistiche */}
          <div className="space-y-4">
            <h4 className="font-bold text-lg text-gray-800">Statistiche Generali</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <div className="text-2xl font-bold text-blue-600">{chapterData?.percentage}%</div>
                <div className="text-blue-700 text-sm">Media</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <div className="text-2xl font-bold text-green-600">{chapterData?.best}%</div>
                <div className="text-green-700 text-sm">Record</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <div className="text-2xl font-bold text-purple-600">{chapterData?.tests}</div>
                <div className="text-purple-700 text-sm">Test</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-xl">
                <div className="text-2xl font-bold text-orange-600">{chapterData?.words}</div>
                <div className="text-orange-700 text-sm">Parole</div>
              </div>
            </div>
          </div>

          {/* Andamento nel Tempo */}
          <div>
            <h4 className="font-bold text-lg text-gray-800 mb-4">Andamento Ultimi 10 Test</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chapterTimeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="test" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="percentage" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Sezione Performance
const PerformanceSection = ({ stats, timelineData }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
    <Card className="bg-white border-0 shadow-xl rounded-3xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
        <CardTitle className="flex items-center gap-3 text-white">
          <Trophy className="w-6 h-6" />
          Distribuzione Punteggi
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="text-center p-6 bg-green-50 rounded-2xl border border-green-200">
            <div className="text-3xl font-bold text-green-600 mb-2">{stats.averageScore}%</div>
            <div className="text-green-700">Punteggio Medio</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <div className="text-xl font-bold text-blue-600">{stats.bestScore}%</div>
              <div className="text-blue-700 text-sm">Massimo</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-xl">
              <div className="text-xl font-bold text-red-600">{stats.worstScore}%</div>
              <div className="text-red-700 text-sm">Minimo</div>
            </div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-xl">
            <div className="text-lg font-bold text-purple-600">
              {((stats.totalCorrect / stats.totalWordsStudied) * 100).toFixed(1)}%
            </div>
            <div className="text-purple-700 text-sm">Accuratezza Globale</div>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card className="bg-white border-0 shadow-xl rounded-3xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
        <CardTitle className="flex items-center gap-3 text-white">
          <BarChart3 className="w-6 h-6" />
          Risposte Corrette vs Sbagliate
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={timelineData.slice(-10)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="test" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="correct" stackId="a" fill="#10b981" name="Corrette" />
            <Bar dataKey="incorrect" stackId="a" fill="#ef4444" name="Sbagliate" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  </div>
);

// Sezione Tendenze
const TrendsSection = ({ timelineData, stats }) => (
  <div className="space-y-8">
    <Card className="bg-white border-0 shadow-xl rounded-3xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
        <CardTitle className="flex items-center gap-3 text-white">
          <Calendar className="w-6 h-6" />
          Tendenze Temporali
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={timelineData}>
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
              dataKey="chapters" 
              stroke="#10b981" 
              strokeWidth={2}
              name="Capitoli"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>

    {/* Insights e Raccomandazioni */}
    <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200">
      <CardContent className="p-6">
        <h3 className="text-xl font-bold text-yellow-800 mb-4 flex items-center gap-2">
          <Sparkles className="w-6 h-6" />
          Insights e Raccomandazioni
        </h3>
        <div className="space-y-3 text-yellow-700">
          {stats.improvementTrend > 0 ? (
            <p>🎯 <strong>Ottimo lavoro!</strong> Stai migliorando del {stats.improvementTrend}% negli ultimi test.</p>
          ) : (
            <p>💪 <strong>Continua a studiare!</strong> Focalizzati sui capitoli più difficili.</p>
          )}
          
          {stats.lastWeekTests > 0 ? (
            <p>🔥 <strong>Ritmo eccellente!</strong> Hai fatto {stats.lastWeekTests} test questa settimana.</p>
          ) : (
            <p>📅 <strong>Riprendi lo studio!</strong> Non hai fatto test questa settimana.</p>
          )}
          
          {stats.chaptersAnalyzed > 5 ? (
            <p>📚 <strong>Ampia copertura!</strong> Hai studiato {stats.chaptersAnalyzed} capitoli diversi.</p>
          ) : (
            <p>📖 <strong>Espandi gli orizzonti!</strong> Prova ad aggiungere più capitoli.</p>
          )}
        </div>
      </CardContent>
    </Card>
  </div>
);

export default StatsOverview;