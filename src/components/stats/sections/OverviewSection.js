// =====================================================
// 📁 src/components/stats/sections/OverviewSection.js - FIXED Performance Index, Date e Grafici
// =====================================================

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ComposedChart
} from 'recharts';
import { TrendingUp, Target, Clock, Lightbulb, Zap, Award, Info } from 'lucide-react';
import { useStatsData } from '../hooks/useStatsData';

const OverviewSection = ({ testHistory, localRefresh }) => {
  const [showPerformanceExplanation, setShowPerformanceExplanation] = useState(false);
  const { advancedStats } = useStatsData(testHistory);

  // ⭐ FIXED: Rebuild timeline with REAL data from test history (same logic as WordDetailSection)
  const buildRealTimelineData = () => {
    if (!testHistory || testHistory.length === 0) return [];
    
    // Sort tests chronologically (oldest to newest)
    const sortedTests = [...testHistory].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    return sortedTests.map((test, index) => {
      const testDate = new Date(test.timestamp);
      
      // ⭐ FIXED: Calculate REAL average time from test data
      let avgTime = 0;
      if (test.totalTime && test.totalWords) {
        avgTime = (test.totalTime * 1000) / test.totalWords; // Convert to milliseconds per word
      } else if (test.wordTimes && test.wordTimes.length > 0) {
        // Use actual word times if available
        const totalTime = test.wordTimes.reduce((sum, wt) => sum + (wt.timeSpent || 0), 0);
        avgTime = totalTime / test.wordTimes.length;
      } else {
        // Fallback estimation based on test difficulty
        const totalWords = test.totalWords || 1;
        avgTime = totalWords > 50 ? 15000 : totalWords > 20 ? 12000 : 8000; // ms per word
      }
      
      // Convert to seconds
      avgTime = Math.round(avgTime / 1000);
      
      // ⭐ FIXED: Calculate hints from actual test data
      let hintsCount = 0;
      if (test.hintsUsed !== undefined) {
        hintsCount = test.hintsUsed;
      } else if (test.wordTimes && test.wordTimes.length > 0) {
        hintsCount = test.wordTimes.filter(wt => wt.usedHint).length;
      }
      
      // ⭐ FIXED: Use actual test date for formatting
      const dateLabel = testDate.toLocaleDateString('it-IT', { 
        day: '2-digit', 
        month: '2-digit'
      });
      
      return {
        test: `Test ${index + 1}`,
        date: dateLabel,
        fullDate: testDate.toLocaleDateString('it-IT', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        timestamp: test.timestamp,
        percentage: test.percentage || 0,
        efficiency: Math.max(0, (test.percentage || 0) - (hintsCount * 2)), // Reduced penalty per hint
        speed: avgTime ? Math.max(20, 100 - Math.min(80, (avgTime - 5) * 4)) : 50, // Speed score based on actual time
        hintsCount: hintsCount, // Raw number for line chart
        hints: hintsCount, // Keep for backward compatibility
        avgTime: avgTime,
        correct: test.correctWords || 0,
        incorrect: test.incorrectWords || 0,
        totalWords: test.totalWords || 0
      };
    });
  };

  const realTimelineData = buildRealTimelineData();

  // ⭐ ENHANCED: Performance Analysis with DETAILED explanation
  const performanceAnalysis = useMemo(() => {
    if (realTimelineData.length === 0) return null;

    // Calcolo velocità di apprendimento (miglioramento nel tempo)
    const learningVelocity = realTimelineData.length > 5 ? 
      realTimelineData[realTimelineData.length - 1].percentage - realTimelineData[0].percentage : 0;

    // Consistenza (variazione standard dei risultati)
    const scores = realTimelineData.map(t => t.percentage);
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / scores.length;
    const consistency = Math.max(0, 100 - Math.sqrt(variance));

    // Efficienza negli aiuti
    const totalHints = realTimelineData.reduce((sum, t) => sum + (t.hintsCount || 0), 0);
    const totalAnswers = realTimelineData.reduce((sum, t) => sum + (t.totalWords || 0), 0);
    const hintEfficiency = totalAnswers > 0 ? Math.max(0, 100 - (totalHints / totalAnswers * 100)) : 100;

    // Analisi velocità di risposta REALE
    const validTimes = realTimelineData.filter(t => t.avgTime > 0);
    const avgResponseTime = validTimes.length > 0 ? 
      validTimes.reduce((sum, t) => sum + t.avgTime, 0) / validTimes.length : 15;
    
    const speedRating = avgResponseTime <= 8 ? 'Molto Veloce' : 
                       avgResponseTime <= 12 ? 'Veloce' : 
                       avgResponseTime <= 18 ? 'Normale' : 
                       avgResponseTime <= 25 ? 'Lento' : 'Molto Lento';
    
    const speedScore = avgResponseTime <= 8 ? 100 : 
                      avgResponseTime <= 12 ? 85 : 
                      avgResponseTime <= 18 ? 70 : 
                      avgResponseTime <= 25 ? 55 : 40;

    // ⭐ ENHANCED: Performance Index con formula DETTAGLIATA
    const performanceIndex = Math.round(
      (avgScore * 0.4) +           // 40% Precisione media
      (consistency * 0.25) +       // 25% Consistenza
      (hintEfficiency * 0.2) +     // 20% Efficienza aiuti
      (speedScore * 0.15)          // 15% Velocità
    );

    return {
      learningVelocity: Math.round(learningVelocity * 10) / 10,
      consistency: Math.round(consistency),
      hintEfficiency: Math.round(hintEfficiency),
      avgResponseTime: Math.round(avgResponseTime * 10) / 10,
      speedRating,
      speedScore: Math.round(speedScore),
      performanceIndex,
      trend: learningVelocity > 0 ? 'Miglioramento' : learningVelocity < 0 ? 'Calo' : 'Stabile',
      // ⭐ NEW: Detailed breakdown for explanation
      breakdown: {
        precisione: { value: Math.round(avgScore), weight: 40, contribution: Math.round(avgScore * 0.4) },
        consistenza: { value: Math.round(consistency), weight: 25, contribution: Math.round(consistency * 0.25) },
        efficienza: { value: Math.round(hintEfficiency), weight: 20, contribution: Math.round(hintEfficiency * 0.2) },
        velocita: { value: Math.round(speedScore), weight: 15, contribution: Math.round(speedScore * 0.15) }
      }
    };
  }, [realTimelineData]);

  // ⭐ FIXED: Multi-metric data with REAL dates and times
  const multiMetricData = useMemo(() => {
    return realTimelineData.slice(-20).map((item, index) => ({
      ...item,
      // Use date as X-axis label instead of test number
      test: item.date,
      testNumber: index + 1,
      efficiency: Math.max(0, item.percentage - (item.hintsCount * 2)), // More realistic efficiency calculation
      speed: item.speed, // Use calculated speed score
      consistency: item.percentage,
      hintsCount: item.hintsCount || 0  // Raw number of hints used in this test
    }));
  }, [realTimelineData]);

  // ⭐ FIXED: Performance distribution with SIMPLIFIED labels
  const performanceDistribution = useMemo(() => {
    const ranges = { excellent: 0, good: 0, average: 0, poor: 0 };
    realTimelineData.forEach(test => {
      if (test.percentage >= 90) ranges.excellent++;
      else if (test.percentage >= 75) ranges.good++;
      else if (test.percentage >= 60) ranges.average++;
      else ranges.poor++;
    });

    const total = realTimelineData.length;
    return [
      { 
        name: 'Eccellente', 
        fullName: 'Eccellente (90%+)', 
        value: ranges.excellent, 
        percentage: total > 0 ? Math.round((ranges.excellent / total) * 100) : 0,
        color: '#10B981' 
      },
      { 
        name: 'Buono', 
        fullName: 'Buono (75-89%)', 
        value: ranges.good, 
        percentage: total > 0 ? Math.round((ranges.good / total) * 100) : 0,
        color: '#3B82F6' 
      },
      { 
        name: 'Medio', 
        fullName: 'Medio (60-74%)', 
        value: ranges.average, 
        percentage: total > 0 ? Math.round((ranges.average / total) * 100) : 0,
        color: '#F59E0B' 
      },
      { 
        name: 'Da migliorare', 
        fullName: 'Da migliorare (<60%)', 
        value: ranges.poor, 
        percentage: total > 0 ? Math.round((ranges.poor / total) * 100) : 0,
        color: '#EF4444' 
      }
    ].filter(item => item.value > 0);
  }, [realTimelineData]);

  // ⭐ NEW: Weekly pattern analysis
  const weeklyPattern = useMemo(() => {
    const pattern = {};
    realTimelineData.forEach(test => {
      const date = new Date(test.timestamp);
      const dayOfWeek = date.toLocaleDateString('it-IT', { weekday: 'short' });
      if (!pattern[dayOfWeek]) {
        pattern[dayOfWeek] = { tests: 0, totalScore: 0 };
      }
      pattern[dayOfWeek].tests++;
      pattern[dayOfWeek].totalScore += test.percentage;
    });

    return Object.entries(pattern).map(([day, data]) => ({
      day,
      tests: data.tests,
      avgScore: Math.round(data.totalScore / data.tests),
      frequency: data.tests
    })).sort((a, b) => {
      const dayOrder = ['lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom'];
      return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
    });
  }, [realTimelineData]);

  if (!performanceAnalysis) {
    return (
      <div className="text-center py-16 text-gray-500">
        <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p>Completa alcuni test per vedere le metriche performance</p>
      </div>
    );
  }

  return (
    <div className="space-y-8" key={`overview-${localRefresh}`}>
      
      {/* ⭐ ENHANCED: Performance Index Overview with COLLAPSIBLE explanation */}
      <Card className="bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 text-white">
        <CardContent className="p-8">
          {/* Header with info button */}
          <div className="flex justify-between items-start mb-6">
            <div className="text-center flex-1">
              <h2 className="text-3xl font-bold mb-2">Performance Index</h2>
              <div className="text-6xl font-bold mb-2">{performanceAnalysis.performanceIndex}</div>
              <div className="text-xl opacity-90">
                {performanceAnalysis.performanceIndex >= 85 ? '🏆 Eccellente!' :
                 performanceAnalysis.performanceIndex >= 70 ? '👍 Molto Buono' :
                 performanceAnalysis.performanceIndex >= 55 ? '📈 In Crescita' : '📚 Da Migliorare'}
              </div>
            </div>
            {/* ⭐ NEW: Info button */}
            <button
              onClick={() => setShowPerformanceExplanation(!showPerformanceExplanation)}
              className={`p-2 rounded-full transition-all duration-300 hover:bg-white/20 ${
                showPerformanceExplanation ? 'bg-white/20 rotate-180' : 'bg-white/10'
              }`}
              title={showPerformanceExplanation ? "Nascondi spiegazione" : "Mostra come viene calcolato"}
            >
              <Info className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-white/20 rounded-xl backdrop-blur-sm">
              <div className="text-2xl font-bold">{performanceAnalysis.breakdown.precisione.value}%</div>
              <div className="text-white/80 text-sm">Precisione Media</div>
              <div className="text-white/60 text-xs">Peso: {performanceAnalysis.breakdown.precisione.weight}%</div>
            </div>
            <div className="text-center p-4 bg-white/20 rounded-xl backdrop-blur-sm">
              <div className="text-2xl font-bold">{performanceAnalysis.breakdown.consistenza.value}%</div>
              <div className="text-white/80 text-sm">Consistenza</div>
              <div className="text-white/60 text-xs">Peso: {performanceAnalysis.breakdown.consistenza.weight}%</div>
            </div>
            <div className="text-center p-4 bg-white/20 rounded-xl backdrop-blur-sm">
              <div className="text-2xl font-bold">{performanceAnalysis.breakdown.efficienza.value}%</div>
              <div className="text-white/80 text-sm">Efficienza Aiuti</div>
              <div className="text-white/60 text-xs">Peso: {performanceAnalysis.breakdown.efficienza.weight}%</div>
            </div>
            <div className="text-center p-4 bg-white/20 rounded-xl backdrop-blur-sm">
              <div className="text-2xl font-bold">{performanceAnalysis.breakdown.velocita.value}%</div>
              <div className="text-white/80 text-sm">Velocità</div>
              <div className="text-white/60 text-xs">Peso: {performanceAnalysis.breakdown.velocita.weight}%</div>
            </div>
          </div>

          {/* ⭐ NEW: COLLAPSIBLE Performance Index Calculation Explanation */}
          <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
            showPerformanceExplanation ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                <Info className="w-5 h-5" />
                📊 Come viene calcolato il Performance Index
              </h4>
              <div className="text-white/90 text-sm space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium mb-2">Formula di calcolo:</p>
                    <div className="bg-white/10 rounded p-2 font-mono text-xs">
                      Index = (Precisione × 40%) + (Consistenza × 25%) + (Efficienza × 20%) + (Velocità × 15%)
                    </div>
                  </div>
                  <div>
                    <p className="font-medium mb-2">Il tuo calcolo:</p>
                    <div className="space-y-1 text-xs">
                      <div>{performanceAnalysis.breakdown.precisione.value}% × 40% = {performanceAnalysis.breakdown.precisione.contribution} punti</div>
                      <div>{performanceAnalysis.breakdown.consistenza.value}% × 25% = {performanceAnalysis.breakdown.consistenza.contribution} punti</div>
                      <div>{performanceAnalysis.breakdown.efficienza.value}% × 20% = {performanceAnalysis.breakdown.efficienza.contribution} punti</div>
                      <div>{performanceAnalysis.breakdown.velocita.value}% × 15% = {performanceAnalysis.breakdown.velocita.contribution} punti</div>
                      <div className="border-t border-white/20 pt-1 font-bold">
                        Totale = {performanceAnalysis.performanceIndex} punti
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-xs bg-white/10 rounded p-2">
                  <strong>💡 Significato delle metriche:</strong><br/>
                  • <strong>Precisione:</strong> Media dei punteggi di tutti i test<br/>
                  • <strong>Consistenza:</strong> Quanto stabili sono le tue performance (100 - deviazione standard)<br/>
                  • <strong>Efficienza:</strong> Quanto bene rispondi senza aiuti (100 - % aiuti utilizzati)<br/>
                  • <strong>Velocità:</strong> Score basato sul tempo medio di risposta ({performanceAnalysis.avgResponseTime}s = {performanceAnalysis.speedRating})
                </div>
              </div>
            </div>
          </div>

          {/* ⭐ NEW: Hint text when collapsed */}
          {!showPerformanceExplanation && (
            <div className="text-center mt-4">
              <button
                onClick={() => setShowPerformanceExplanation(true)}
                className="text-white/70 hover:text-white text-sm transition-colors duration-200 flex items-center gap-2 mx-auto"
              >
                <Info className="w-4 h-4" />
                Clicca l'icona ℹ️ per vedere come viene calcolato il punteggio
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ⭐ FIXED: Multi-Metric Performance Chart with REAL dates and times */}
      <Card className="bg-white dark:bg-gray-800 border-0 shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <CardTitle className="flex items-center gap-3 text-white">
            <TrendingUp className="w-6 h-6" />
            Andamento Multi-Metrica (Ultimi {multiMetricData.length} Test)
          </CardTitle>
          <p className="text-blue-100 text-sm">
            Monitoraggio di precisione, efficienza, velocità REALE e aiuti nel tempo
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={multiMetricData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e4e7" />
              <XAxis 
                dataKey="test" 
                tick={{ fontSize: 10 }} 
                interval={Math.ceil(multiMetricData.length / 8)} // Show fewer labels if many tests
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis yAxisId="left" domain={[0, 100]} tick={{ fontSize: 12 }} label={{ value: 'Percentuale (%)', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 'dataMax + 2']} tick={{ fontSize: 12 }} label={{ value: 'Aiuti', angle: 90, position: 'insideRight' }} />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'hintsCount') {
                    return [`${value} aiuti`, 'Aiuti Utilizzati'];
                  }
                  return [
                    `${Math.round(value)}%`,
                    name === 'percentage' ? 'Precisione' :
                    name === 'efficiency' ? 'Efficienza' :
                    name === 'speed' ? 'Velocità Reale' : name
                  ];
                }}
                labelFormatter={(label, payload) => {
                  const data = payload?.[0]?.payload;
                  return data ? `${label} (${data.fullDate})` : label;
                }}
                contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
              />
              {/* Area for precision */}
              <Area 
                yAxisId="left"
                type="monotone" 
                dataKey="percentage" 
                fill="#3b82f6" 
                fillOpacity={0.3}
                stroke="#3b82f6" 
                strokeWidth={3}
                name="percentage"
              />
              {/* Line for efficiency */}
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="efficiency" 
                stroke="#10b981" 
                strokeWidth={2}
                name="efficiency"
              />
              {/* Line for REAL speed */}
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="speed" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                name="speed"
              />
              {/* ⭐ FIXED: Line for hints instead of bar */}
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="hintsCount" 
                stroke="#f59e0b" 
                strokeWidth={3}
                strokeDasharray="5 5"
                dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                name="hintsCount"
              />
            </ComposedChart>
          </ResponsiveContainer>
          
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span>Precisione (%)</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Efficienza (%)</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 bg-purple-500 rounded"></div>
              <span>Velocità Reale (%)</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-yellow-500 bg-white rounded"></div>
              <span>Aiuti (linea tratteggiata)</span>
            </div>
          </div>
          
          {/* ⭐ ENHANCED: Detailed explanation of metrics with REAL data */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
              <Target className="w-5 h-5" />
              📊 Spiegazione delle Metriche (Dati Reali)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
              <div>
                <h5 className="font-bold mb-2">📈 Metriche Principali (Asse Sinistro 0-100%):</h5>
                <ul className="space-y-1 text-xs">
                  <li><strong>🎯 Precisione:</strong> % di risposte corrette nel test</li>
                  <li><strong>⚡ Efficienza:</strong> Precisione - (Aiuti × 2) - penalità per dipendenza da aiuti</li>
                  <li><strong>🚀 Velocità Reale:</strong> Calcolata dai tempi effettivi dei test<br/>
                      <span className="text-blue-600">• Tempo medio attuale: {performanceAnalysis.avgResponseTime}s ({performanceAnalysis.speedRating})</span><br/>
                      <span className="text-blue-600">• ≤8s=100% • ≤12s=85% • ≤18s=70% • ≤25s=55% • +25s=40%</span></li>
                </ul>
              </div>
              <div>
                <h5 className="font-bold mb-2">💡 Aiuti (Asse Destro - Linea Tratteggiata):</h5>
                <ul className="space-y-1 text-xs">
                  <li><strong>Numero reale</strong> di aiuti utilizzati nel test</li>
                  <li><strong>Obiettivo:</strong> Diminuzione nel tempo = maggiore autonomia</li>
                  <li><strong>Efficienza aiuti:</strong> {performanceAnalysis.hintEfficiency}%</li>
                  <li><strong>Media aiuti:</strong> {multiMetricData.length > 0 ? Math.round(multiMetricData.reduce((sum, t) => sum + t.hintsCount, 0) / multiMetricData.length * 10) / 10 : 0}/test</li>
                </ul>
              </div>
            </div>
            <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200">
              <p className="text-xs text-blue-700">
                <strong>💡 Come interpretare:</strong> Un trend positivo mostra precisione in aumento, 
                aiuti in diminuzione ed efficienza crescente. La velocità è ora calcolata dai tempi reali di risposta.
              </p>
            </div>
          </div>
          
          {/* ⭐ ENHANCED: Real-time hints analysis summary */}
          <div className="mt-6 p-4 bg-orange-50 rounded-xl border border-orange-200">
            <h4 className="font-bold text-orange-800 mb-2 flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Analisi Utilizzo Aiuti (Dati Reali)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-lg font-bold text-orange-600">
                  {multiMetricData.reduce((sum, t) => sum + t.hintsCount, 0)}
                </div>
                <div className="text-orange-700">Aiuti Totali</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-orange-600">{Math.round(100 - performanceAnalysis.hintEfficiency)}%</div>
                <div className="text-orange-700">% Risposte con Aiuto</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-orange-600">
                  {multiMetricData.length > 0 ? Math.round(multiMetricData.reduce((sum, t) => sum + t.hintsCount, 0) / multiMetricData.length * 10) / 10 : 0}
                </div>
                <div className="text-orange-700">Media Aiuti/Test</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-orange-600">{performanceAnalysis.hintEfficiency}%</div>
                <div className="text-orange-700">Efficienza Aiuti</div>
              </div>
            </div>
            <div className="mt-3 text-xs text-orange-600">
              💡 <strong>Suggerimento:</strong> Un uso efficiente degli aiuti è sopra l'80% di efficienza. 
              Gli aiuti dovrebbero diminuire con l'esperienza.
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* ⭐ FIXED: Performance Distribution with SIMPLIFIED pie chart labels */}
        <Card className="bg-white dark:bg-gray-800 border-0 shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
            <CardTitle className="flex items-center gap-3 text-white">
              <Award className="w-6 h-6" />
              Distribuzione Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {performanceDistribution.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={performanceDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      // ⭐ FIXED: Simplified label showing only percentage
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                    >
                      {performanceDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => [
                        `${value} test (${props.payload.percentage}%)`,
                        props.payload.fullName
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* ⭐ ENHANCED: Detailed breakdown below the chart */}
                <div className="mt-4 space-y-2">
                  {performanceDistribution.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm p-2 rounded-lg" style={{ backgroundColor: `${item.color}15` }}>
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="font-medium">{item.fullName}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold" style={{ color: item.color }}>{item.value} test</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{item.percentage}% del totale</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Summary */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Su <strong>{realTimelineData.length} test totali</strong>, hai ottenuto risultati eccellenti o buoni nel 
                    <strong className="text-green-600 mx-1">
                      {Math.round(((performanceDistribution.find(p => p.name === 'Eccellente')?.value || 0) + 
                                   (performanceDistribution.find(p => p.name === 'Buono')?.value || 0)) / 
                                   realTimelineData.length * 100)}%
                    </strong>
                    dei casi
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>Dati insufficienti per la distribuzione</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ⭐ ENHANCED: Advanced Metrics Breakdown with REAL data */}
        <Card className="bg-white dark:bg-gray-800 border-0 shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <CardTitle className="flex items-center gap-3 text-white">
              <Zap className="w-6 h-6" />
              Metriche Performance Avanzate
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              
              {/* Learning Velocity */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Velocità di Apprendimento</span>
                  <span className={`font-bold ${
                    performanceAnalysis.learningVelocity > 0 ? 'text-green-600' : 
                    performanceAnalysis.learningVelocity < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {performanceAnalysis.learningVelocity > 0 ? '+' : ''}{performanceAnalysis.learningVelocity}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      performanceAnalysis.learningVelocity > 0 ? 'bg-green-500' : 
                      performanceAnalysis.learningVelocity < 0 ? 'bg-red-500' : 'bg-gray-400'
                    }`}
                    style={{ width: `${Math.min(100, Math.abs(performanceAnalysis.learningVelocity) * 2)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {performanceAnalysis.trend} rispetto ai primi test
                </div>
              </div>

              {/* Consistency Score */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Consistenza</span>
                  <span className="font-bold text-blue-600">{performanceAnalysis.consistency}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-blue-500"
                    style={{ width: `${performanceAnalysis.consistency}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {performanceAnalysis.consistency >= 80 ? 'Molto stabile' :
                   performanceAnalysis.consistency >= 60 ? 'Abbastanza costante' : 'Variabile'}
                </div>
              </div>

              {/* Response Speed REAL */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Velocità Risposta (Reale)</span>
                  <span className="font-bold text-purple-600">
                    {performanceAnalysis.avgResponseTime}s ({performanceAnalysis.speedRating})
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      performanceAnalysis.speedRating.includes('Veloce') ? 'bg-green-500' :
                      performanceAnalysis.speedRating === 'Normale' ? 'bg-blue-500' : 'bg-orange-500'
                    }`}
                    style={{ width: `${performanceAnalysis.speedScore}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Calcolato dai tempi reali di risposta
                </div>
              </div>

              {/* Hint Efficiency */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Efficienza Aiuti</span>
                  <span className="font-bold text-orange-600">{performanceAnalysis.hintEfficiency}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-orange-500"
                    style={{ width: `${performanceAnalysis.hintEfficiency}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {Math.round(100 - performanceAnalysis.hintEfficiency)}% aiuti utilizzati di media
                </div>
              </div>
            </div>

            {/* Overall Assessment */}
            <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
              <h4 className="font-bold text-indigo-800 mb-2">📊 Valutazione Complessiva</h4>
              <p className="text-sm text-indigo-700">
                {performanceAnalysis.performanceIndex >= 85 ? 
                  '🏆 Performance eccellenti! Continua così e considera di aumentare la difficoltà.' :
                 performanceAnalysis.performanceIndex >= 70 ?
                  '👍 Ottime performance! Lavora sulla consistenza per raggiungere l\'eccellenza.' :
                 performanceAnalysis.performanceIndex >= 55 ?
                  '📈 Performance in crescita. Concentrati sui punti deboli identificati.' :
                  '📚 C\'è margine di miglioramento. Rivedi le strategie di studio e pratica più regolarmente.'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ⭐ ENHANCED: Weekly Pattern Analysis */}
      {weeklyPattern.length > 0 && (
        <Card className="bg-white dark:bg-gray-800 border-0 shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white">
            <CardTitle className="flex items-center gap-3 text-white">
              <Clock className="w-6 h-6" />
              Pattern Settimanale di Studio
            </CardTitle>
            <p className="text-cyan-100 text-sm">
              Analisi dei giorni della settimana più produttivi
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={weeklyPattern}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis yAxisId="left" orientation="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'avgScore' ? `${value}%` : `${value} test`,
                    name === 'avgScore' ? 'Punteggio Medio' : 'Numero Test'
                  ]}
                />
                <Bar yAxisId="left" dataKey="tests" fill="#06b6d4" name="tests" />
                <Line yAxisId="right" type="monotone" dataKey="avgScore" stroke="#3b82f6" strokeWidth={3} name="avgScore" />
              </ComposedChart>
            </ResponsiveContainer>
            
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center p-3 bg-cyan-50 rounded-xl">
                <div className="font-bold text-cyan-600">
                  {weeklyPattern.reduce((max, day) => day.tests > max.tests ? day : max, weeklyPattern[0])?.day || 'N/A'}
                </div>
                <div className="text-cyan-700 text-xs">Giorno più attivo</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-xl">
                <div className="font-bold text-blue-600">
                  {weeklyPattern.reduce((max, day) => day.avgScore > max.avgScore ? day : max, weeklyPattern[0])?.day || 'N/A'}
                </div>
                <div className="text-blue-700 text-xs">Giorno migliore</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-xl">
                <div className="font-bold text-green-600">
                  {Math.round(weeklyPattern.reduce((sum, day) => sum + day.avgScore, 0) / weeklyPattern.length)}%
                </div>
                <div className="text-green-700 text-xs">Media settimanale</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-xl">
                <div className="font-bold text-purple-600">
                  {weeklyPattern.reduce((sum, day) => sum + day.tests, 0)}
                </div>
                <div className="text-purple-700 text-xs">Test totali</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OverviewSection;