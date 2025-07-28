// =====================================================
// 📁 src/components/stats/sections/PerformanceSection.js - SAFE FIX
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
import { useStats } from '../../../hooks/data/useStats';
import type { TestHistoryItem, Word } from '../../../types';

interface PerformanceSectionProps {
  testHistory: TestHistoryItem[];
  words?: Word[];
  localRefresh: number;
  onClearHistory?: () => void;
}

// ⭐ SAFE: Create Performance-specific data processing WITHOUT modifying useStatsData
const usePerformanceData = (testHistory: TestHistoryItem[]) => {
  return useMemo(() => {
    if (testHistory.length === 0) return [];

    return [...testHistory].reverse().slice(-20).map((test, index) => {
      const totalWords = (test.correctWords || 0) + (test.incorrectWords || 0);
      
      // ⭐ PERFORMANCE-SPECIFIC: Calculate realistic time estimates
      let avgTimePerWord = 0;
      if (test.totalTime && totalWords > 0) {
        // Use actual time if available
        avgTimePerWord = Math.round((test.totalTime / totalWords) * 10) / 10;
      } else if (totalWords > 0) {
        // ⭐ ESTIMATE: Based on difficulty and performance (ONLY for Performance section)
        const baseTime = 8; // seconds per word baseline
        const difficultyMultiplier = test.difficulty === 'hard' ? 1.5 : test.difficulty === 'easy' ? 0.7 : 1.0;
        const performanceMultiplier = test.percentage < 50 ? 1.8 : test.percentage < 70 ? 1.3 : test.percentage < 85 ? 1.0 : 0.8;
        const hintsMultiplier = (test.hintsUsed || 0) > 0 ? 1.2 : 1.0;
        
        avgTimePerWord = Math.round(baseTime * difficultyMultiplier * performanceMultiplier * hintsMultiplier * 10) / 10;
      }

      return {
        test: `Test ${index + 1}`,
        percentage: test.percentage || 0,
        correct: test.correctWords || 0,
        incorrect: test.incorrectWords || 0,
        hints: test.hintsUsed || 0, // Real hints data
        avgTime: avgTimePerWord, // Performance-specific time calculation
        date: new Date(test.timestamp).toLocaleDateString('it-IT'),
        time: new Date(test.timestamp).toLocaleTimeString('it-IT', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        chapters: test.testParameters?.selectedChapters?.length || 0,
        difficulty: test.difficulty || 'medium',
        type: test.testType || 'unknown',
        totalWords: totalWords,
        hasRealTime: !!(test.totalTime),
        isEstimated: !test.totalTime // Flag for Performance section
      };
    });
  }, [testHistory]);
};

// ⭐ KEEP: Original helper functions
const calculateBestStreak = (data: any[]) => {
  let currentStreak = 0;
  let bestStreak = 0;
  const threshold = 75;
  
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

const calculateDifficultyHandling = (history: TestHistoryItem[]) => {
  const hardTests = history.filter(test => (test.totalWords || 0) >= 20);
  if (hardTests.length === 0) return 70;
  
  const hardTestsAvg = hardTests.reduce((sum, test) => sum + (test.percentage || 0), 0) / hardTests.length;
  return Math.min(100, hardTestsAvg + 10);
};

const calculateOverallRating = (accuracy: number, consistency: number, hintEff: number, speed: number) => {
  const weighted = (accuracy * 0.4) + (consistency * 0.25) + (hintEff * 0.2) + (speed * 0.15);
  return Math.round(weighted);
};

const PerformanceSection: React.FC<PerformanceSectionProps> = ({ testHistory, localRefresh }) => {
  const { stats, calculatedStats, testHistory: dbTestHistory, getAllWordsPerformance } = useStats();
  const performanceTimelineData = usePerformanceData(dbTestHistory || testHistory);

  // ⭐ PRECISION: Media dei punteggi di tutti i test
  const calculatePrecision = () => {
    if (performanceTimelineData.length === 0) {
      console.log('🎯 PRECISIONE - Nessun test trovato, ritorno 0%');
      return 0;
    }
    
    const totalScore = performanceTimelineData.reduce((sum, test) => sum + test.percentage, 0);
    const precision = Math.round(totalScore / performanceTimelineData.length);
    
    console.log('🎯 PRECISIONE - Calcolo dettagliato:');
    console.log(`• Numero test: ${performanceTimelineData.length}`);
    console.log(`• Punteggi: [${performanceTimelineData.map(t => t.percentage + '%').join(', ')}]`);
    console.log(`• Somma totale: ${totalScore}%`);
    console.log(`• Media: ${totalScore} ÷ ${performanceTimelineData.length} = ${precision}%`);
    
    return precision;
  };

  const precision = calculatePrecision();


  // ⭐ CONSISTENCY: Quanto stabili sono le performance (100 - deviazione standard)
  const calculateConsistency = () => {
    if (performanceTimelineData.length < 2) {
      console.log('🎯 CONSISTENZA - Dati insufficienti (< 2 test), ritorno 100%');
      return 100; // Perfect consistency with limited data
    }
    
    const scores = performanceTimelineData.map(t => t.percentage);
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);
    const consistency = Math.max(0, Math.round(100 - standardDeviation));
    
    console.log('🎯 CONSISTENZA - Calcolo dettagliato:');
    console.log(`• Punteggi test: [${scores.join(', ')}]`);
    console.log(`• Media punteggi: ${mean.toFixed(2)}%`);
    console.log(`• Varianza: ${variance.toFixed(2)}`);
    console.log(`• Deviazione standard: ${standardDeviation.toFixed(2)}`);
    console.log(`• Consistenza finale: 100 - ${standardDeviation.toFixed(2)} = ${consistency}%`);
    
    return consistency;
  };

  // ⭐ EFFICIENCY: Risposte corrette senza aiuti
  const calculateEfficiency = () => {
    const totalQuestions = performanceTimelineData.reduce((sum, t) => sum + t.totalWords, 0);
    const totalHints = performanceTimelineData.reduce((sum, t) => sum + (t.hints || 0), 0);
    
    if (totalQuestions === 0) {
      console.log('🎯 EFFICIENZA - Nessuna domanda trovata, ritorno 100%');
      return 100;
    }
    
    const hintPercentage = (totalHints / totalQuestions) * 100;
    const efficiency = Math.max(0, Math.round(100 - hintPercentage));
    
    console.log('🎯 EFFICIENZA - Calcolo dettagliato:');
    console.log(`• Domande totali: ${totalQuestions}`);
    console.log(`• Aiuti utilizzati: ${totalHints}`);
    console.log(`• Percentuale aiuti: ${hintPercentage.toFixed(2)}%`);
    console.log(`• Efficienza finale: 100 - ${hintPercentage.toFixed(2)} = ${efficiency}%`);
    
    // Log dettaglio per test
    console.log('• Dettaglio per test:');
    performanceTimelineData.forEach((test, index) => {
      console.log(`  Test ${index + 1}: ${test.totalWords} parole, ${test.hints || 0} aiuti (${test.hints && test.totalWords ? ((test.hints / test.totalWords) * 100).toFixed(1) : 0}%)`);
    });
    
    return efficiency;
  };

  // ⭐ SPEED: Score basato sul tempo medio di risposta
  const calculateSpeed = () => {
    if (performanceTimelineData.length === 0) {
      console.log('🎯 VELOCITÀ - Nessun test trovato, ritorno 50%');
      return 50;
    }
    
    const avgResponseTime = performanceTimelineData.reduce((sum, t) => sum + (t.avgTime || 0), 0) / performanceTimelineData.length;
    
    // Score mapping based on average response time
    let speedScore = 30; // Default extremely slow
    if (avgResponseTime <= 5) speedScore = 100;   // Excellent
    else if (avgResponseTime <= 8) speedScore = 90;    // Very good
    else if (avgResponseTime <= 12) speedScore = 80;   // Good
    else if (avgResponseTime <= 16) speedScore = 70;   // Average
    else if (avgResponseTime <= 20) speedScore = 60;   // Below average
    else if (avgResponseTime <= 25) speedScore = 50;   // Slow
    else if (avgResponseTime <= 30) speedScore = 40;   // Very slow
    
    console.log('🎯 VELOCITÀ - Calcolo dettagliato:');
    console.log(`• Tempo medio di risposta: ${avgResponseTime.toFixed(2)} secondi`);
    console.log(`• Score velocità: ${speedScore}%`);
    console.log(`• Classificazione: ${
      speedScore >= 90 ? 'Eccellente (≤8s)' :
      speedScore >= 80 ? 'Buona (≤12s)' :
      speedScore >= 70 ? 'Media (≤16s)' :
      speedScore >= 60 ? 'Sotto la media (≤20s)' :
      speedScore >= 50 ? 'Lenta (≤25s)' :
      speedScore >= 40 ? 'Molto lenta (≤30s)' : 'Estremamente lenta (>30s)'
    }`);
    
    // Log dettaglio per test
    console.log('• Dettaglio tempi per test:');
    performanceTimelineData.forEach((test, index) => {
      console.log(`  Test ${index + 1}: ${test.avgTime || 0}s (${test.hasRealTime ? 'reale' : 'stimato'})`);
    });
    
    return speedScore;
  };

  const performanceMetrics = useMemo(() => {
    if (testHistory.length === 0) return null;

    // Calculate the four main metrics
    const precisionScore = precision;
    const consistencyScore = calculateConsistency();
    const efficiencyScore = calculateEfficiency();
    const speedScore = calculateSpeed();

    // ⭐ PERFORMANCE INDEX FORMULA
    // Index = (Precisione × 40%) + (Consistenza × 25%) + (Efficienza × 20%) + (Velocità × 15%)
    const precisionPoints = Math.round(precisionScore * 0.40);
    const consistencyPoints = Math.round(consistencyScore * 0.25);
    const efficiencyPoints = Math.round(efficiencyScore * 0.20);
    const speedPoints = Math.round(speedScore * 0.15);
    const performanceIndex = precisionPoints + consistencyPoints + efficiencyPoints + speedPoints;

    // ⭐ VALIDATION LOGS for Performance Index calculation
    console.log('\n📊 PERFORMANCE INDEX CALCULATION VALIDATION:');
    console.log('====================================================');
    console.log(`🎯 Precisione: ${precisionScore}% × 40% = ${precisionPoints} punti`);
    console.log(`🎯 Consistenza: ${consistencyScore}% × 25% = ${consistencyPoints} punti`);
    console.log(`🎯 Efficienza: ${efficiencyScore}% × 20% = ${efficiencyPoints} punti`);
    console.log(`🎯 Velocità: ${speedScore}% × 15% = ${speedPoints} punti`);
    console.log(`====================================================`);
    console.log(`🏆 Performance Index Totale: ${performanceIndex} punti`);
    console.log('\n🔍 METRICHE DETTAGLIATE:');
    console.log(`• Precisione (media punteggi test): ${precisionScore}%`);
    console.log(`• Consistenza (100 - std dev): ${consistencyScore}%`);
    console.log(`• Efficienza (100 - % aiuti): ${efficiencyScore}%`);
    console.log(`• Velocità (score tempo medio): ${speedScore}%`);
    
    // Calculate additional metrics for UI
    const recentTests = performanceTimelineData.slice(-10);
    const oldTests = performanceTimelineData.slice(0, Math.min(10, performanceTimelineData.length - 10));
    const recentAvg = recentTests.reduce((sum, t) => sum + t.percentage, 0) / Math.max(1, recentTests.length);
    const oldAvg = oldTests.length > 0 ? oldTests.reduce((sum, t) => sum + t.percentage, 0) / oldTests.length : recentAvg;
    const improvementTrend = recentAvg - oldAvg;
    
    const bestStreak = calculateBestStreak(performanceTimelineData);
    const difficultyScore = calculateDifficultyHandling(testHistory);
    const avgSpeed = performanceTimelineData.reduce((sum, t) => sum + (t.avgTime || 0), 0) / Math.max(1, performanceTimelineData.length);
    
    const learningVelocity = performanceTimelineData.length > 5 ? 
      (performanceTimelineData.slice(-5).reduce((sum, t) => sum + t.percentage, 0) / 5) -
      (performanceTimelineData.slice(0, 5).reduce((sum, t) => sum + t.percentage, 0) / 5) : 0;

    return {
      accuracy: precisionScore,
      consistency: consistencyScore,
      hintEfficiency: efficiencyScore,
      speedScore: speedScore,
      performanceIndex: performanceIndex,
      improvementTrend: Math.round(improvementTrend * 10) / 10,
      learningVelocity: Math.round(learningVelocity * 10) / 10,
      bestStreak,
      difficultyScore: Math.round(difficultyScore),
      avgSpeed: Math.round(avgSpeed * 10) / 10,
      recentPerformance: Math.round(recentAvg),
      overallRating: performanceIndex,
      realTimePercentage: Math.round((performanceTimelineData.filter(t => t.hasRealTime).length / performanceTimelineData.length) * 100),
      // Add breakdown for display
      calculationBreakdown: {
        precision: { value: precisionScore, points: precisionPoints },
        consistency: { value: consistencyScore, points: consistencyPoints },
        efficiency: { value: efficiencyScore, points: efficiencyPoints },
        speed: { value: speedScore, points: speedPoints }
      }
    };
  }, [testHistory, performanceTimelineData, precision]);

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

  // ⭐ FIXED: Use Performance-specific data for trend analysis
  const improvementData = useMemo(() => {
    const windows = [];
    const windowSize = 5;
    
    for (let i = 0; i <= performanceTimelineData.length - windowSize; i += 2) {
      const window = performanceTimelineData.slice(i, i + windowSize);
      const avgScore = window.reduce((sum, t) => sum + t.percentage, 0) / windowSize;
      const avgHints = window.reduce((sum, t) => sum + (t.hints || 0), 0) / windowSize;
      const avgSpeed = window.reduce((sum, t) => sum + (t.avgTime || 0), 0) / windowSize;
      
      windows.push({
        period: `Test ${i + 1}-${i + windowSize}`,
        accuracy: Math.round(avgScore),
        efficiency: Math.max(0, Math.round(avgScore - (avgHints / window.reduce((sum, t) => sum + t.totalWords, 0) * 100))),
        speed: avgSpeed > 0 ? Math.round(Math.max(0, 100 - Math.min(100, avgSpeed * 3))) : 50 // Better speed calculation
      });
    }
    
    return windows;
  }, [performanceTimelineData]);

  const difficultyAnalysis = useMemo(() => {
    const analysis: Record<string, any[]> = { easy: [], medium: [], hard: [] };
    
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

    return Object.entries(analysis).map(([difficulty, tests]: [string, any[]]) => {
      if (tests.length === 0) return null;
      
      const avgPercentage = tests.reduce((sum, t) => sum + t.percentage, 0) / tests.length;
      const avgHints = tests.reduce((sum, t) => sum + t.hints, 0) / tests.length;
      const totalWords = tests.reduce((sum, t) => sum + t.words, 0);
      
      return {
        difficulty: difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
        count: tests.length,
        avgScore: Math.round(avgPercentage),
        avgHints: Math.round(avgHints * 10) / 10,
        efficiency: Math.round(avgPercentage - (avgHints / totalWords * 100 * tests.length))
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
      
      {/* ⭐ KEEP: Same UI as before */}
      <Card className="bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-500 text-white">
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold mb-2">Performance Index</h2>
            <div className="text-6xl font-bold mb-2">{performanceMetrics.performanceIndex}</div>
            <div className="text-sm opacity-75 mb-2">
              📊 Formula: (Precisione × 40%) + (Consistenza × 25%) + (Efficienza × 20%) + (Velocità × 15%)
            </div>
            {/* ⭐ CALCULATION BREAKDOWN DISPLAY */}
            <div className="text-xs opacity-80 bg-white/10 rounded-lg p-3 mb-2">
              <div className="font-semibold mb-1">Il tuo calcolo:</div>
              <div>{performanceMetrics.calculationBreakdown.precision.value}% × 40% = {performanceMetrics.calculationBreakdown.precision.points} punti</div>
              <div>{performanceMetrics.calculationBreakdown.consistency.value}% × 25% = {performanceMetrics.calculationBreakdown.consistency.points} punti</div>
              <div>{performanceMetrics.calculationBreakdown.efficiency.value}% × 20% = {performanceMetrics.calculationBreakdown.efficiency.points} punti</div>
              <div>{performanceMetrics.calculationBreakdown.speed.value}% × 15% = {performanceMetrics.calculationBreakdown.speed.points} punti</div>
              <div className="border-t border-white/20 pt-1 mt-1 font-semibold">Totale = {performanceMetrics.performanceIndex} punti</div>
            </div>
            <div className="text-xl opacity-90">
              {performanceMetrics.performanceIndex >= 90 ? '🏆 Performance Eccezionale!' :
               performanceMetrics.performanceIndex >= 80 ? '🌟 Performance Ottima' :
               performanceMetrics.performanceIndex >= 70 ? '👍 Performance Buona' :
               performanceMetrics.performanceIndex >= 60 ? '📈 Performance Discreta' : '📚 Performance da Migliorare'}
            </div>
            {performanceMetrics.improvementTrend !== 0 && (
              <div className={`mt-2 text-lg flex items-center justify-center gap-2 ${
                performanceMetrics.improvementTrend > 0 ? 'text-green-200' : 'text-orange-200'
              }`}>
                <TrendingUp className={`w-5 h-5 ${performanceMetrics.improvementTrend < 0 ? 'rotate-180' : ''}`} />
                {performanceMetrics.improvementTrend > 0 ? '+' : ''}{performanceMetrics.improvementTrend}% trend
              </div>
            )}
            {/* ⭐ DEBUG: Show data quality info */}
            {performanceMetrics.realTimePercentage < 100 && (
              <div className="mt-2 text-sm text-white/70">
                ⏱️ Tempi stimati per {100 - performanceMetrics.realTimePercentage}% dei test
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-white/20 rounded-xl backdrop-blur-sm" title="Media dei punteggi di tutti i test">
              <Trophy className="w-8 h-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">{performanceMetrics.accuracy}%</div>
              <div className="text-white/80 text-sm">Precisione</div>
              <div className="text-white/60 text-xs mt-1">Media punteggi test</div>
            </div>
            <div className="text-center p-4 bg-white/20 rounded-xl backdrop-blur-sm" title="Quanto stabili sono le tue performance (100 - deviazione standard)">
              <Target className="w-8 h-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">{performanceMetrics.consistency}%</div>
              <div className="text-white/80 text-sm">Consistenza</div>
              <div className="text-white/60 text-xs mt-1">Stabilità performance</div>
            </div>
            <div className="text-center p-4 bg-white/20 rounded-xl backdrop-blur-sm" title="Quanto bene rispondi senza aiuti">
              <Lightbulb className="w-8 h-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">{performanceMetrics.hintEfficiency}%</div>
              <div className="text-white/80 text-sm">Efficienza</div>
              <div className="text-white/60 text-xs mt-1">Risposte senza aiuti</div>
            </div>
            <div className="text-center p-4 bg-white/20 rounded-xl backdrop-blur-sm" title="Score basato sul tempo medio di risposta">
              <Clock className="w-8 h-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">{performanceMetrics.speedScore}%</div>
              <div className="text-white/80 text-sm">Velocità</div>
              <div className="text-white/60 text-xs mt-1">Tempo medio risposta</div>
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
        
        {/* ⭐ KEEP: Same Radar Chart */}
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

        {/* ⭐ FIXED: Performance Trends with realistic data */}
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

      {/* ⭐ KEEP: Rest of the component unchanged */}
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
              {difficultyAnalysis.map((level, index) => level && (
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

      {/* ⭐ KEEP: Detailed Performance Insights - same as before */}
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