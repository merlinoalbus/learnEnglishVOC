// =====================================================
// 📁 src/components/stats/sections/PerformanceSection.js - FIXED
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  ComposedChart,
  ScatterChart,
  Scatter
} from 'recharts';
import { Trophy, Lightbulb, Zap, Clock, Target, TrendingUp } from 'lucide-react';
import { useStatsData } from '../hooks/useStatsData';

// ⭐ FIXED: Move helper functions BEFORE their usage
const calculateBestStreak = (data) => {
  let currentStreak = 0;
  let bestStreak = 0;
  const threshold = 75; // Soglia per considerare un test "buono"
  
  data.forEach(test => {
    if (test.percentage >= threshold) {
      currentStreak++;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  });
  
  return bestStreak;
};

const calculateDifficultyHandling = (history) => {
  const hardTests = history.filter(test => (test.totalWords || 0) >= 20);
  if (hardTests.length === 0) return 70; // Default se non ci sono test difficili
  
  const hardTestsAvg = hardTests.reduce((sum, test) => sum + (test.percentage || 0), 0) / hardTests.length;
  return Math.min(100, hardTestsAvg + 10); // Bonus per affrontare test difficili
};

const calculateOverallRating = (accuracy, consistency, hintEff, speed) => {
  const weighted = (accuracy * 0.4) + (consistency * 0.25) + (hintEff * 0.2) + (speed * 0.15);
  return Math.round(weighted);
};

const PerformanceSection = ({ testHistory, localRefresh }) => {
  const { advancedStats, timelineData } = useStatsData(testHistory);

  // ⭐ FIXED: Now functions are available before usage
  const performanceMetrics = useMemo(() => {
    if (testHistory.length === 0) return null;

    // Calcolo metriche avanzate
    const recentTests = timelineData.slice(-10);
    const oldTests = timelineData.slice(0, Math.min(10, timelineData.length - 10));
    
    // Trend di miglioramento
    const recentAvg = recentTests.reduce((sum, t) => sum + t.percentage, 0) / Math.max(1, recentTests.length);
    const oldAvg = oldTests.length > 0 ? oldTests.reduce((sum, t) => sum + t.percentage, 0) / oldTests.length : recentAvg;
    const improvementTrend = recentAvg - oldAvg;

    // Consistenza (standard deviation)
    const scores = timelineData.map(t => t.percentage);
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const consistency = Math.max(0, 100 - Math.sqrt(variance));

    // Efficienza aiuti
    const totalHints = timelineData.reduce((sum, t) => sum + (t.hints || 0), 0);
    const totalQuestions = timelineData.reduce((sum, t) => sum + (t.correct || 0) + (t.incorrect || 0), 0);
    const hintEfficiency = totalQuestions > 0 ? Math.max(0, 100 - (totalHints / totalQuestions * 100)) : 100;

    // Velocità di risposta
    const avgSpeed = timelineData.reduce((sum, t) => sum + (t.avgTime || 0), 0) / Math.max(1, timelineData.length);
    const speedScore = avgSpeed <= 8 ? 100 : avgSpeed <= 15 ? 80 : avgSpeed <= 25 ? 60 : 40;

    // Peak performance (miglior periodo) - ⭐ FIXED: Function now available
    const bestStreak = calculateBestStreak(timelineData);
    
    // Learning velocity (velocità di apprendimento)
    const learningVelocity = timelineData.length > 5 ? 
      (timelineData.slice(-5).reduce((sum, t) => sum + t.percentage, 0) / 5) -
      (timelineData.slice(0, 5).reduce((sum, t) => sum + t.percentage, 0) / 5) : 0;

    // Difficulty handling (gestione difficoltà) - ⭐ FIXED: Function now available
    const difficultyScore = calculateDifficultyHandling(testHistory);

    return {
      accuracy: Math.round(advancedStats.averageScore),
      consistency: Math.round(consistency),
      hintEfficiency: Math.round(hintEfficiency),
      speedScore: Math.round(speedScore),
      improvementTrend: Math.round(improvementTrend * 10) / 10,
      learningVelocity: Math.round(learningVelocity * 10) / 10,
      bestStreak,
      difficultyScore: Math.round(difficultyScore),
      avgSpeed: Math.round(avgSpeed * 10) / 10,
      recentPerformance: Math.round(recentAvg),
      overallRating: calculateOverallRating(advancedStats.averageScore, consistency, hintEfficiency, speedScore) // ⭐ FIXED: Function now available
    };
  }, [testHistory, timelineData, advancedStats]);

  // ⭐ FIXED: Dati per radar chart
  const radarData = useMemo(() => {
    if (!performanceMetrics) return [];
    
    return [
      {
        metric: 'Precisione',
        value: performanceMetrics.accuracy,
        fullMark: 100
      },
      {
        metric: 'Consistenza',
        value: performanceMetrics.consistency,
        fullMark: 100
      },
      {
        metric: 'Efficienza',
        value: performanceMetrics.hintEfficiency,
        fullMark: 100
      },
      {
        metric: 'Velocità',
        value: performanceMetrics.speedScore,
        fullMark: 100
      },
      {
        metric: 'Gestione Difficoltà',
        value: performanceMetrics.difficultyScore,
        fullMark: 100
      }
    ];
  }, [performanceMetrics]);

  // ⭐ FIXED: Dati per trend miglioramento
  const improvementData = useMemo(() => {
    const windows = [];
    const windowSize = 5;
    
    for (let i = 0; i <= timelineData.length - windowSize; i += 2) {
      const window = timelineData.slice(i, i + windowSize);
      const avgScore = window.reduce((sum, t) => sum + t.percentage, 0) / windowSize;
      const avgHints = window.reduce((sum, t) => sum + (t.hints || 0), 0) / windowSize;
      const avgSpeed = window.reduce((sum, t) => sum + (t.avgTime || 0), 0) / windowSize;
      
      windows.push({
        period: `Test ${i + 1}-${i + windowSize}`,
        accuracy: Math.round(avgScore),
        efficiency: Math.max(0, Math.round(avgScore - avgHints)),
        speed: avgSpeed > 0 ? Math.round(100 - Math.min(100, avgSpeed * 2)) : 50
      });
    }
    
    return windows;
  }, [timelineData]);

  // ⭐ FIXED: Analisi performance per difficoltà
  const difficultyAnalysis = useMemo(() => {
    const analysis = { easy: [], medium: [], hard: [] };
    
    testHistory.forEach(test => {
      const totalWords = test.totalWords || 0;
      let category = 'easy';
      
      if (totalWords >= 30) category = 'hard';
      else if (totalWords >= 15) category = 'medium';
      
      analysis[category].push({
        percentage: test.percentage || 0,
        hints: test.hintsUsed || 0,
        words: totalWords
      });
    });

    return Object.entries(analysis).map(([difficulty, tests]) => {
      if (tests.length === 0) return null;
      
      const avgPercentage = tests.reduce((sum, t) => sum + t.percentage, 0) / tests.length;
      const avgHints = tests.reduce((sum, t) => sum + t.hints, 0) / tests.length;
      
      return {
        difficulty: difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
        count: tests.length,
        avgScore: Math.round(avgPercentage),
        avgHints: Math.round(avgHints * 10) / 10,
        efficiency: Math.round(avgPercentage - (avgHints / tests.reduce((sum, t) => sum + t.words, 0) * 100))
      };
    }).filter(Boolean);
  }, [testHistory]);

  if (!performanceMetrics) {
    return (
      <div className="text-center py-16 text-gray-500">
        <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p>Completa alcuni test per vedere l'analisi performance</p>
      </div>
    );
  }

  return (
    <div className="space-y-8" key={`performance-${localRefresh}`}>
      
      {/* ⭐ ENHANCED: Performance Overview */}
      <Card className="bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-500 text-white">
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold mb-2">Performance Score</h2>
            <div className="text-6xl font-bold mb-2">{performanceMetrics.overallRating}/100</div>
            <div className="text-xl opacity-90">
              {performanceMetrics.overallRating >= 90 ? '🏆 Performance Eccezionale!' :
               performanceMetrics.overallRating >= 80 ? '🌟 Performance Ottima' :
               performanceMetrics.overallRating >= 70 ? '👍 Performance Buona' :
               performanceMetrics.overallRating >= 60 ? '📈 Performance Discreta' : '📚 Performance da Migliorare'}
            </div>
            {performanceMetrics.improvementTrend !== 0 && (
              <div className={`mt-2 text-lg flex items-center justify-center gap-2 ${
                performanceMetrics.improvementTrend > 0 ? 'text-green-200' : 'text-orange-200'
              }`}>
                <TrendingUp className={`w-5 h-5 ${performanceMetrics.improvementTrend < 0 ? 'rotate-180' : ''}`} />
                {performanceMetrics.improvementTrend > 0 ? '+' : ''}{performanceMetrics.improvementTrend}% trend
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-white/20 rounded-xl backdrop-blur-sm">
              <Trophy className="w-8 h-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">{performanceMetrics.accuracy}%</div>
              <div className="text-white/80 text-sm">Precisione</div>
            </div>
            <div className="text-center p-4 bg-white/20 rounded-xl backdrop-blur-sm">
              <Target className="w-8 h-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">{performanceMetrics.consistency}%</div>
              <div className="text-white/80 text-sm">Consistenza</div>
            </div>
            <div className="text-center p-4 bg-white/20 rounded-xl backdrop-blur-sm">
              <Lightbulb className="w-8 h-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">{performanceMetrics.hintEfficiency}%</div>
              <div className="text-white/80 text-sm">Efficienza</div>
            </div>
            <div className="text-center p-4 bg-white/20 rounded-xl backdrop-blur-sm">
              <Clock className="w-8 h-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">{performanceMetrics.speedScore}%</div>
              <div className="text-white/80 text-sm">Velocità</div>
            </div>
            <div className="text-center p-4 bg-white/20 rounded-xl backdrop-blur-sm">
              <Zap className="w-8 h-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">{performanceMetrics.bestStreak}</div>
              <div className="text-white/80 text-sm">Best Streak</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* ⭐ FIXED: Radar Chart Performance */}
        <Card className="bg-white border-0 shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <CardTitle className="flex items-center gap-3 text-white">
              <Target className="w-6 h-6" />
              Analisi Multi-Dimensionale
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar 
                  name="Performance" 
                  dataKey="value" 
                  stroke="#8b5cf6" 
                  fill="#8b5cf6" 
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
            
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              {radarData.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-gray-600">{item.metric}:</span>
                  <span className={`font-bold ${
                    item.value >= 80 ? 'text-green-600' : 
                    item.value >= 60 ? 'text-blue-600' : 'text-orange-600'
                  }`}>
                    {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ⭐ FIXED: Performance Trends */}
        <Card className="bg-white border-0 shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
            <CardTitle className="flex items-center gap-3 text-white">
              <TrendingUp className="w-6 h-6" />
              Trend di Miglioramento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {improvementData.length > 1 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={improvementData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="accuracy" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      name="Precisione"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="efficiency" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="Efficienza"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="speed" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      name="Velocità"
                    />
                  </LineChart>
                </ResponsiveContainer>
                
                <div className="mt-4 text-center">
                  <div className={`text-lg font-bold ${
                    performanceMetrics.learningVelocity > 0 ? 'text-green-600' : 
                    performanceMetrics.learningVelocity < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    Velocità di Apprendimento: {performanceMetrics.learningVelocity > 0 ? '+' : ''}{performanceMetrics.learningVelocity}%
                  </div>
                  <div className="text-sm text-gray-600">
                    {performanceMetrics.learningVelocity > 5 ? '🚀 Progressi rapidi!' :
                     performanceMetrics.learningVelocity > 0 ? '📈 In miglioramento' :
                     performanceMetrics.learningVelocity === 0 ? '➖ Stabile' : '📉 In calo'}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Completa più test per vedere i trend</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ⭐ FIXED: Performance by Difficulty */}
      {difficultyAnalysis.length > 0 && (
        <Card className="bg-white border-0 shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
            <CardTitle className="flex items-center gap-3 text-white">
              <Zap className="w-6 h-6" />
              Performance per Livello di Difficoltà
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={difficultyAnalysis}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="difficulty" />
                <YAxis yAxisId="left" orientation="left" domain={[0, 100]} />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Bar yAxisId="left" dataKey="avgScore" fill="#3b82f6" name="Punteggio Medio %" />
                <Bar yAxisId="left" dataKey="efficiency" fill="#10b981" name="Efficienza %" />
                <Line yAxisId="right" type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={3} name="Numero Test" />
              </ComposedChart>
            </ResponsiveContainer>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              {difficultyAnalysis.map((level, index) => (
                <div key={index} className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="font-bold text-lg text-gray-800">{level.difficulty}</div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Test: {level.count}</div>
                    <div>Punteggio: {level.avgScore}%</div>
                    <div>Aiuti: {level.avgHints}/test</div>
                    <div className={`font-bold ${
                      level.efficiency >= 70 ? 'text-green-600' : 
                      level.efficiency >= 50 ? 'text-blue-600' : 'text-orange-600'
                    }`}>
                      Efficienza: {level.efficiency}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ⭐ FIXED: Detailed Performance Insights */}
      <Card className="bg-gradient-to-r from-cyan-50 to-blue-50 border-2 border-cyan-200">
        <CardHeader className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white">
          <CardTitle className="flex items-center gap-3">
            <Trophy className="w-6 h-6" />
            📊 Insights Performance Dettagliati
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Strengths */}
            <div>
              <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                🏆 Punti di Forza
              </h4>
              <div className="space-y-2 text-sm">
                {performanceMetrics.accuracy >= 80 && (
                  <p className="text-green-700">✅ Ottima precisione nelle risposte ({performanceMetrics.accuracy}%)</p>
                )}
                {performanceMetrics.consistency >= 75 && (
                  <p className="text-green-700">✅ Performance molto consistenti</p>
                )}
                {performanceMetrics.hintEfficiency >= 80 && (
                  <p className="text-green-700">✅ Uso efficiente degli aiuti</p>
                )}
                {performanceMetrics.speedScore >= 80 && (
                  <p className="text-green-700">✅ Tempi di risposta ottimi</p>
                )}
                {performanceMetrics.bestStreak >= 5 && (
                  <p className="text-green-700">✅ Streak impressionante di {performanceMetrics.bestStreak} test consecutivi</p>
                )}
                {performanceMetrics.improvementTrend > 2 && (
                  <p className="text-green-700">✅ Trend di miglioramento costante (+{performanceMetrics.improvementTrend}%)</p>
                )}
              </div>
            </div>

            {/* Areas for Improvement */}
            <div>
              <h4 className="font-bold text-orange-800 mb-3 flex items-center gap-2">
                📈 Aree di Miglioramento
              </h4>
              <div className="space-y-2 text-sm">
                {performanceMetrics.accuracy < 70 && (
                  <p className="text-orange-700">⚠️ Precisione da migliorare ({performanceMetrics.accuracy}%)</p>
                )}
                {performanceMetrics.consistency < 60 && (
                  <p className="text-orange-700">⚠️ Performance troppo variabili - punta alla consistenza</p>
                )}
                {performanceMetrics.hintEfficiency < 70 && (
                  <p className="text-orange-700">⚠️ Uso eccessivo degli aiuti - prova a rispondere autonomamente</p>
                )}
                {performanceMetrics.speedScore < 60 && (
                  <p className="text-orange-700">⚠️ Tempi di risposta lenti - pratica per migliorare la velocità</p>
                )}
                {performanceMetrics.improvementTrend < -2 && (
                  <p className="text-orange-700">⚠️ Trend in calo ({performanceMetrics.improvementTrend}%) - rivedi la strategia di studio</p>
                )}
                {performanceMetrics.bestStreak < 3 && (
                  <p className="text-orange-700">⚠️ Mancanza di consistenza - concentrati sui fondamentali</p>
                )}
              </div>
            </div>
          </div>

          {/* Overall Recommendation */}
          <div className="mt-6 p-4 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl border border-indigo-300">
            <h4 className="font-bold text-indigo-800 mb-2">🎯 Raccomandazione Personalizzata</h4>
            <p className="text-indigo-700 text-sm">
              {performanceMetrics.overallRating >= 85 ? 
                `🏆 Performance eccezionali! Considera di aumentare la difficoltà o di aiutare altri studenti. Il tuo approccio allo studio è molto efficace.` :
               performanceMetrics.overallRating >= 75 ?
                `🌟 Ottime performance! Lavora sulla ${performanceMetrics.consistency < 75 ? 'consistenza' : performanceMetrics.speedScore < 75 ? 'velocità' : 'precisione'} per raggiungere l'eccellenza.` :
               performanceMetrics.overallRating >= 65 ?
                `👍 Buone performance! Concentrati su ${performanceMetrics.accuracy < 70 ? 'migliorare la precisione studiando di più' : performanceMetrics.hintEfficiency < 70 ? 'ridurre la dipendenza dagli aiuti' : 'aumentare la consistenza'}.` :
                `📚 C'è spazio per migliorare. Suggerimento: ${performanceMetrics.accuracy < 60 ? 'dedica più tempo allo studio prima dei test' : 'pratica più regolarmente per sviluppare consistenza'}.`
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceSection;