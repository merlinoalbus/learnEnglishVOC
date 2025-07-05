// =====================================================
// 📁 src/components/stats/sections/OverviewSection.js - FIXED Multi-Metric Chart
// =====================================================

import React, { useMemo } from 'react';
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
import { TrendingUp, Target, Clock, Lightbulb, Zap, Award } from 'lucide-react';
import { useStatsData } from '../hooks/useStatsData';

const OverviewSection = ({ testHistory, localRefresh }) => {
  const { advancedStats, timelineData } = useStatsData(testHistory);

  // ⭐ ENHANCED: Analisi Performance Avanzata
  const performanceAnalysis = useMemo(() => {
    if (testHistory.length === 0) return null;

    // Calcolo velocità di apprendimento (miglioramento nel tempo)
    const learningVelocity = timelineData.length > 5 ? 
      timelineData[timelineData.length - 1].percentage - timelineData[0].percentage : 0;

    // Consistenza (variazione standard dei risultati)
    const scores = timelineData.map(t => t.percentage);
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / scores.length;
    const consistency = Math.max(0, 100 - Math.sqrt(variance));

    // Efficienza negli aiuti
    const totalHints = timelineData.reduce((sum, t) => sum + (t.hints || 0), 0);
    const totalAnswers = advancedStats.totalWordsStudied;
    const hintEfficiency = totalAnswers > 0 ? Math.max(0, 100 - (totalHints / totalAnswers * 100)) : 100;

    // Analisi velocità di risposta
    const avgResponseTime = timelineData.reduce((sum, t) => sum + (t.avgTime || 0), 0) / Math.max(1, timelineData.length);
    const speedRating = avgResponseTime <= 10 ? 'Veloce' : avgResponseTime <= 20 ? 'Normale' : 'Lento';
    const speedScore = avgResponseTime <= 10 ? 100 : avgResponseTime <= 20 ? 75 : 50;

    // Performance Index (metrica combinata)
    const performanceIndex = Math.round(
      (advancedStats.averageScore * 0.4) + 
      (consistency * 0.25) + 
      (hintEfficiency * 0.2) + 
      (speedScore * 0.15)
    );

    return {
      learningVelocity: Math.round(learningVelocity * 10) / 10,
      consistency: Math.round(consistency),
      hintEfficiency: Math.round(hintEfficiency),
      avgResponseTime: Math.round(avgResponseTime * 10) / 10,
      speedRating,
      speedScore: Math.round(speedScore),
      performanceIndex,
      trend: learningVelocity > 0 ? 'Miglioramento' : learningVelocity < 0 ? 'Calo' : 'Stabile'
    };
  }, [testHistory, timelineData, advancedStats]);

  // ⭐ FIXED: Dati per grafico performance multi-metrica con aiuti corretti
  const multiMetricData = useMemo(() => {
    return timelineData.map(item => ({
      ...item,
      efficiency: Math.max(0, item.percentage - (item.hints || 0)),
      speed: item.avgTime ? Math.max(0, 100 - Math.min(100, item.avgTime * 2)) : 50,
      consistency: item.percentage,
      // ⭐ CRITICAL: Keep hints as raw number for proper display
      hintsCount: item.hints || 0  // Raw number of hints used in this test
    }));
  }, [timelineData]);

  // ⭐ NEW: Distribuzione performance
  const performanceDistribution = useMemo(() => {
    const ranges = { excellent: 0, good: 0, average: 0, poor: 0 };
    timelineData.forEach(test => {
      if (test.percentage >= 90) ranges.excellent++;
      else if (test.percentage >= 75) ranges.good++;
      else if (test.percentage >= 60) ranges.average++;
      else ranges.poor++;
    });

    return [
      { name: 'Eccellente (90%+)', value: ranges.excellent, color: '#10B981' },
      { name: 'Buono (75-89%)', value: ranges.good, color: '#3B82F6' },
      { name: 'Medio (60-74%)', value: ranges.average, color: '#F59E0B' },
      { name: 'Da migliorare (<60%)', value: ranges.poor, color: '#EF4444' }
    ].filter(item => item.value > 0);
  }, [timelineData]);

  // ⭐ NEW: Analisi pattern settimanali/temporali
  const weeklyPattern = useMemo(() => {
    const pattern = {};
    testHistory.forEach(test => {
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
  }, [testHistory]);

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
      
      {/* ⭐ ENHANCED: Performance Index Overview */}
      <Card className="bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 text-white">
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold mb-2">Performance Index</h2>
            <div className="text-6xl font-bold mb-2">{performanceAnalysis.performanceIndex}</div>
            <div className="text-xl opacity-90">
              {performanceAnalysis.performanceIndex >= 85 ? '🏆 Eccellente!' :
               performanceAnalysis.performanceIndex >= 70 ? '👍 Molto Buono' :
               performanceAnalysis.performanceIndex >= 55 ? '📈 In Crescita' : '📚 Da Migliorare'}
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white/20 rounded-xl backdrop-blur-sm">
              <div className="text-2xl font-bold">{advancedStats.averageScore}%</div>
              <div className="text-white/80 text-sm">Precisione Media</div>
            </div>
            <div className="text-center p-4 bg-white/20 rounded-xl backdrop-blur-sm">
              <div className="text-2xl font-bold">{performanceAnalysis.consistency}%</div>
              <div className="text-white/80 text-sm">Consistenza</div>
            </div>
            <div className="text-center p-4 bg-white/20 rounded-xl backdrop-blur-sm">
              <div className="text-2xl font-bold">{performanceAnalysis.hintEfficiency}%</div>
              <div className="text-white/80 text-sm">Efficienza Aiuti</div>
            </div>
            <div className="text-center p-4 bg-white/20 rounded-xl backdrop-blur-sm">
              <div className="text-2xl font-bold">{performanceAnalysis.speedScore}%</div>
              <div className="text-white/80 text-sm">Velocità Risposta</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ⭐ FIXED: Multi-Metric Performance Chart with line for hints */}
      <Card className="bg-white border-0 shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <CardTitle className="flex items-center gap-3 text-white">
            <TrendingUp className="w-6 h-6" />
            Andamento Multi-Metrica (Ultimi 20 Test)
          </CardTitle>
          <p className="text-blue-100 text-sm">
            Monitoraggio di precisione, efficienza, velocità e aiuti nel tempo
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={multiMetricData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e4e7" />
              <XAxis dataKey="test" tick={{ fontSize: 12 }} />
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
                    name === 'speed' ? 'Velocità' : name
                  ];
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
              {/* Line for speed */}
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
              <span>Velocità (%)</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-yellow-500 bg-white rounded"></div>
              <span>Aiuti (linea tratteggiata)</span>
            </div>
          </div>
          
          {/* ⭐ NEW: Detailed explanation of metrics */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
              <Target className="w-5 h-5" />
              📊 Spiegazione delle Metriche
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
              <div>
                <h5 className="font-bold mb-2">📈 Metriche Principali (Asse Sinistro 0-100%):</h5>
                <ul className="space-y-1 text-xs">
                  <li><strong>🎯 Precisione:</strong> % di risposte corrette nel test</li>
                  <li><strong>⚡ Efficienza:</strong> Precisione - Aiuti utilizzati (indica autonomia)</li>
                  <li><strong>🚀 Velocità:</strong> Score basato su tempo medio di risposta<br/>
                      <span className="text-blue-600">• ≤10s = 100% • ≤20s = 75% • +20s = 50%</span></li>
                </ul>
              </div>
              <div>
                <h5 className="font-bold mb-2">💡 Aiuti (Asse Destro - Linea Tratteggiata):</h5>
                <ul className="space-y-1 text-xs">
                  <li><strong>Numero assoluto</strong> di aiuti utilizzati nel test</li>
                  <li><strong>Obiettivo:</strong> Diminuzione nel tempo = maggiore autonomia</li>
                  <li><strong>Ideale:</strong> Uso saltuario e strategico degli aiuti</li>
                </ul>
              </div>
            </div>
            <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200">
              <p className="text-xs text-blue-700">
                <strong>💡 Come interpretare:</strong> Un trend positivo mostra precisione in aumento, 
                aiuti in diminuzione ed efficienza crescente. La velocità migliora con l'esperienza.
              </p>
            </div>
          </div>
          
          {/* ⭐ NEW: Hints analysis summary */}
          <div className="mt-6 p-4 bg-orange-50 rounded-xl border border-orange-200">
            <h4 className="font-bold text-orange-800 mb-2 flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Analisi Utilizzo Aiuti
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-lg font-bold text-orange-600">{advancedStats.totalHints}</div>
                <div className="text-orange-700">Aiuti Totali</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-orange-600">{advancedStats.hintsPercentage}%</div>
                <div className="text-orange-700">% Risposte con Aiuto</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-orange-600">
                  {timelineData.length > 0 ? Math.round(advancedStats.totalHints / timelineData.length * 10) / 10 : 0}
                </div>
                <div className="text-orange-700">Media Aiuti/Test</div>
              </div>
            </div>
            <div className="mt-3 text-xs text-orange-600">
              💡 <strong>Suggerimento:</strong> Un uso efficiente degli aiuti è sotto il 20% delle risposte. 
              Gli aiuti dovrebbero diminuire con l'esperienza.
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* ⭐ NEW: Performance Distribution */}
        <Card className="bg-white border-0 shadow-xl rounded-3xl overflow-hidden">
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
                      label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {performanceDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {performanceDistribution.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span>{item.name}</span>
                      </div>
                      <span className="font-bold">{item.value} test</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Dati insufficienti per la distribuzione</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ⭐ NEW: Advanced Metrics Breakdown */}
        <Card className="bg-white border-0 shadow-xl rounded-3xl overflow-hidden">
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
                  <span className="font-medium text-gray-700">Velocità di Apprendimento</span>
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
                    style={{ width: `${Math.min(100, Math.abs(performanceAnalysis.learningVelocity) * 10)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {performanceAnalysis.trend} rispetto ai primi test
                </div>
              </div>

              {/* Consistency Score */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">Consistenza</span>
                  <span className="font-bold text-blue-600">{performanceAnalysis.consistency}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-blue-500"
                    style={{ width: `${performanceAnalysis.consistency}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {performanceAnalysis.consistency >= 80 ? 'Molto stabile' :
                   performanceAnalysis.consistency >= 60 ? 'Abbastanza costante' : 'Variabile'}
                </div>
              </div>

              {/* Response Speed */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">Velocità Risposta</span>
                  <span className="font-bold text-purple-600">
                    {performanceAnalysis.avgResponseTime}s ({performanceAnalysis.speedRating})
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      performanceAnalysis.speedRating === 'Veloce' ? 'bg-green-500' :
                      performanceAnalysis.speedRating === 'Normale' ? 'bg-blue-500' : 'bg-orange-500'
                    }`}
                    style={{ width: `${performanceAnalysis.speedScore}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Tempo medio per risposta
                </div>
              </div>

              {/* Hint Efficiency */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">Efficienza Aiuti</span>
                  <span className="font-bold text-orange-600">{performanceAnalysis.hintEfficiency}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-orange-500"
                    style={{ width: `${performanceAnalysis.hintEfficiency}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {advancedStats.hintsPercentage}% aiuti utilizzati di media
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

      {/* ⭐ NEW: Weekly Pattern Analysis */}
      {weeklyPattern.length > 0 && (
        <Card className="bg-white border-0 shadow-xl rounded-3xl overflow-hidden">
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
              <BarChart data={weeklyPattern}>
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
              </BarChart>
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