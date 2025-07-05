// =====================================================
// 📁 src/components/stats/sections/TrendsSection.js - ENHANCED
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
  ComposedChart
} from 'recharts';
import { Clock, Sparkles, TrendingUp, TrendingDown, Target, Lightbulb } from 'lucide-react';
import { useStatsData } from '../hooks/useStatsData';

const TrendsSection = ({ testHistory, localRefresh }) => {
  const { advancedStats, timelineData } = useStatsData(testHistory);

  // ⭐ ENHANCED: Analisi trend dettagliata
  const trendAnalysis = useMemo(() => {
    if (timelineData.length < 3) return null;

    // Dividi i dati in periodi per analizzare i trend
    const recent = timelineData.slice(-5); // Ultimi 5 test
    const previous = timelineData.slice(-10, -5); // 5 test precedenti
    const early = timelineData.slice(0, 5); // Primi 5 test

    const calculateAverage = (data, field) => {
      const values = data.map(item => item[field] || 0).filter(v => v > 0);
      return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
    };

    const recentAvg = {
      accuracy: calculateAverage(recent, 'percentage'),
      hints: calculateAverage(recent, 'hints'),
      speed: calculateAverage(recent, 'avgTime')
    };

    const previousAvg = {
      accuracy: calculateAverage(previous, 'percentage'),
      hints: calculateAverage(previous, 'hints'),
      speed: calculateAverage(previous, 'avgTime')
    };

    const earlyAvg = {
      accuracy: calculateAverage(early, 'percentage'),
      hints: calculateAverage(early, 'hints'),
      speed: calculateAverage(early, 'avgTime')
    };

    // Calcola trend (miglioramento/peggioramento)
    const accuracyTrend = previous.length > 0 ? recentAvg.accuracy - previousAvg.accuracy : 0;
    const hintsTrend = previous.length > 0 ? recentAvg.hints - previousAvg.hints : 0;
    const speedTrend = previous.length > 0 ? previousAvg.speed - recentAvg.speed : 0; // Inverso: meno tempo = meglio

    // Trend a lungo termine (dai primi test a oggi)
    const longTermAccuracyTrend = early.length > 0 ? recentAvg.accuracy - earlyAvg.accuracy : 0;
    const longTermHintsTrend = early.length > 0 ? earlyAvg.hints - recentAvg.hints : 0; // Inverso: meno aiuti = meglio
    const longTermSpeedTrend = early.length > 0 ? earlyAvg.speed - recentAvg.speed : 0; // Inverso: meno tempo = meglio

    return {
      recent: recentAvg,
      previous: previousAvg,
      early: earlyAvg,
      shortTerm: {
        accuracy: accuracyTrend,
        hints: hintsTrend,
        speed: speedTrend
      },
      longTerm: {
        accuracy: longTermAccuracyTrend,
        hints: longTermHintsTrend,
        speed: longTermSpeedTrend
      }
    };
  }, [timelineData]);

  // ⭐ ENHANCED: Dati per analisi mensile
  const monthlyTrends = useMemo(() => {
    const monthlyData = {};
    
    testHistory.forEach(test => {
      const date = new Date(test.timestamp);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          tests: 0,
          totalAccuracy: 0,
          totalHints: 0,
          totalTime: 0
        };
      }
      
      monthlyData[monthKey].tests++;
      monthlyData[monthKey].totalAccuracy += test.percentage || 0;
      monthlyData[monthKey].totalHints += test.hintsUsed || 0;
      monthlyData[monthKey].totalTime += test.avgTimePerWord || 0;
    });

    return Object.values(monthlyData).map(month => ({
      ...month,
      avgAccuracy: Math.round(month.totalAccuracy / month.tests),
      avgHints: Math.round((month.totalHints / month.tests) * 10) / 10,
      avgTime: Math.round((month.totalTime / month.tests) * 10) / 10,
      efficiency: Math.round((month.totalAccuracy / month.tests) - (month.totalHints / month.tests))
    })).sort((a, b) => a.month.localeCompare(b.month));
  }, [testHistory]);

  // ⭐ NEW: Analisi prestazioni per fascia oraria
  const hourlyPattern = useMemo(() => {
    const hourlyData = {};
    
    testHistory.forEach(test => {
      const hour = new Date(test.timestamp).getHours();
      const timeSlot = hour < 6 ? 'Notte (0-6)' :
                     hour < 12 ? 'Mattina (6-12)' :
                     hour < 18 ? 'Pomeriggio (12-18)' : 'Sera (18-24)';
      
      if (!hourlyData[timeSlot]) {
        hourlyData[timeSlot] = {
          timeSlot,
          tests: 0,
          totalAccuracy: 0,
          totalHints: 0
        };
      }
      
      hourlyData[timeSlot].tests++;
      hourlyData[timeSlot].totalAccuracy += test.percentage || 0;
      hourlyData[timeSlot].totalHints += test.hintsUsed || 0;
    });

    return Object.values(hourlyData).map(slot => ({
      ...slot,
      avgAccuracy: Math.round(slot.totalAccuracy / slot.tests),
      avgHints: Math.round((slot.totalHints / slot.tests) * 10) / 10
    })).sort((a, b) => {
      const order = ['Mattina (6-12)', 'Pomeriggio (12-18)', 'Sera (18-24)', 'Notte (0-6)'];
      return order.indexOf(a.timeSlot) - order.indexOf(b.timeSlot);
    });
  }, [testHistory]);

  if (timelineData.length < 3) {
    return (
      <div className="text-center py-16 text-gray-500">
        <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p>Completa almeno 3 test per vedere le analisi delle tendenze</p>
      </div>
    );
  }

  return (
    <div className="space-y-8" key={`trends-${localRefresh}`}>
      
      {/* ⭐ ENHANCED: Main Timeline Chart */}
      <Card className="bg-white border-0 shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
          <CardTitle className="flex items-center gap-3 text-white">
            <Clock className="w-6 h-6" />
            Tendenze Temporali e Performance Dettagliate
          </CardTitle>
          <p className="text-indigo-100 text-sm">
            Analisi dell'andamento di precisione, aiuti utilizzati e velocità di risposta nel tempo
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={timelineData} key={`trends-line-${localRefresh}`}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="left" domain={[0, 100]} label={{ value: 'Percentuale', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" label={{ value: 'Aiuti/Tempo', angle: 90, position: 'insideRight' }} />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'hints') return [`${value} aiuti`, 'Aiuti Utilizzati'];
                  if (name === 'avgTime') return [`${value}s`, 'Tempo Medio'];
                  return [`${value}%`, name === 'percentage' ? 'Precisione' : name];
                }}
              />
              {/* Area per precisione */}
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="percentage"
                fill="#8b5cf6"
                fillOpacity={0.3}
                stroke="#8b5cf6"
                strokeWidth={3}
                name="percentage"
              />
              {/* Barre per aiuti */}
              <Bar
                yAxisId="right"
                dataKey="hints"
                fill="#f59e0b"
                fillOpacity={0.7}
                name="hints"
              />
              {/* Linea per tempo medio */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="avgTime"
                stroke="#06b6d4"
                strokeWidth={2}
                name="avgTime"
                strokeDasharray="5 5"
              />
            </ComposedChart>
          </ResponsiveContainer>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-center text-sm">
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 bg-purple-500 rounded"></div>
              <span>Precisione (%)</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span>Aiuti (numero)</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-cyan-500 bg-white rounded"></div>
              <span>Tempo Medio (secondi)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ⭐ NEW: Trend Analysis Summary */}
      {trendAnalysis && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Short-term trends */}
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
              <CardTitle className="flex items-center gap-3">
                <TrendingUp className="w-6 h-6" />
                Tendenze Recenti (Ultimi 5 vs 5 Precedenti)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-white rounded-xl">
                  <span className="font-medium">Precisione</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{Math.round(trendAnalysis.recent.accuracy)}%</span>
                    <span className={`text-sm font-bold ${
                      trendAnalysis.shortTerm.accuracy > 2 ? 'text-green-600' :
                      trendAnalysis.shortTerm.accuracy < -2 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {trendAnalysis.shortTerm.accuracy > 0 ? '↗' : trendAnalysis.shortTerm.accuracy < 0 ? '↘' : '→'}
                      {Math.abs(Math.round(trendAnalysis.shortTerm.accuracy * 10) / 10)}%
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-white rounded-xl">
                  <span className="font-medium">Aiuti per Test</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{Math.round(trendAnalysis.recent.hints * 10) / 10}</span>
                    <span className={`text-sm font-bold ${
                      trendAnalysis.shortTerm.hints < -0.5 ? 'text-green-600' :
                      trendAnalysis.shortTerm.hints > 0.5 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {trendAnalysis.shortTerm.hints < 0 ? '↘' : trendAnalysis.shortTerm.hints > 0 ? '↗' : '→'}
                      {Math.abs(Math.round(trendAnalysis.shortTerm.hints * 10) / 10)}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-white rounded-xl">
                  <span className="font-medium">Velocità Media</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{Math.round(trendAnalysis.recent.speed * 10) / 10}s</span>
                    <span className={`text-sm font-bold ${
                      trendAnalysis.shortTerm.speed > 1 ? 'text-green-600' :
                      trendAnalysis.shortTerm.speed < -1 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {trendAnalysis.shortTerm.speed > 0 ? '↗' : trendAnalysis.shortTerm.speed < 0 ? '↘' : '→'}
                      {Math.abs(Math.round(trendAnalysis.shortTerm.speed * 10) / 10)}s
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Long-term trends */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
            <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
              <CardTitle className="flex items-center gap-3">
                <Target className="w-6 h-6" />
                Progressi a Lungo Termine (Inizio vs Ora)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-white rounded-xl">
                  <span className="font-medium">Miglioramento Precisione</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-lg ${
                      trendAnalysis.longTerm.accuracy > 10 ? 'text-green-600' :
                      trendAnalysis.longTerm.accuracy > 0 ? 'text-blue-600' : 'text-red-600'
                    }`}>
                      {trendAnalysis.longTerm.accuracy > 0 ? '+' : ''}{Math.round(trendAnalysis.longTerm.accuracy)}%
                    </span>
                    <span className="text-sm text-gray-500">
                      {Math.round(trendAnalysis.early.accuracy)}% → {Math.round(trendAnalysis.recent.accuracy)}%
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-white rounded-xl">
                  <span className="font-medium">Riduzione Aiuti</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-lg ${
                      trendAnalysis.longTerm.hints > 1 ? 'text-green-600' :
                      trendAnalysis.longTerm.hints > 0 ? 'text-blue-600' : 'text-red-600'
                    }`}>
                      {trendAnalysis.longTerm.hints > 0 ? '-' : '+'}{Math.abs(Math.round(trendAnalysis.longTerm.hints * 10) / 10)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {Math.round(trendAnalysis.early.hints * 10) / 10} → {Math.round(trendAnalysis.recent.hints * 10) / 10}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-white rounded-xl">
                  <span className="font-medium">Miglioramento Velocità</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-lg ${
                      trendAnalysis.longTerm.speed > 2 ? 'text-green-600' :
                      trendAnalysis.longTerm.speed > 0 ? 'text-blue-600' : 'text-red-600'
                    }`}>
                      {trendAnalysis.longTerm.speed > 0 ? '-' : '+'}{Math.abs(Math.round(trendAnalysis.longTerm.speed * 10) / 10)}s
                    </span>
                    <span className="text-sm text-gray-500">
                      {Math.round(trendAnalysis.early.speed * 10) / 10}s → {Math.round(trendAnalysis.recent.speed * 10) / 10}s
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ⭐ NEW: Monthly Trends (if enough data) */}
      {monthlyTrends.length > 1 && (
        <Card className="bg-white border-0 shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <CardTitle className="flex items-center gap-3 text-white">
              <TrendingUp className="w-6 h-6" />
              Tendenze Mensili
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="avgAccuracy" stroke="#8b5cf6" strokeWidth={3} name="Precisione Media %" />
                <Line type="monotone" dataKey="efficiency" stroke="#10b981" strokeWidth={2} name="Efficienza %" />
                <Line type="monotone" dataKey="avgHints" stroke="#f59e0b" strokeWidth={2} name="Aiuti Medi" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ⭐ NEW: Hourly Pattern Analysis */}
      {hourlyPattern.length > 1 && (
        <Card className="bg-white border-0 shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
            <CardTitle className="flex items-center gap-3 text-white">
              <Clock className="w-6 h-6" />
              Performance per Fascia Oraria
            </CardTitle>
            <p className="text-orange-100 text-sm">
              Analisi delle prestazioni in base all'orario di studio
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={hourlyPattern}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timeSlot" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="avgAccuracy" fill="#3b82f6" name="Precisione Media %" />
                <Bar dataKey="avgHints" fill="#f59e0b" name="Aiuti Medi" />
              </BarChart>
            </ResponsiveContainer>
            
            <div className="mt-4 text-center">
              <div className="text-lg font-bold text-gray-800 mb-2">
                🏆 Fascia oraria migliore: {hourlyPattern.reduce((best, slot) => 
                  slot.avgAccuracy > best.avgAccuracy ? slot : best, hourlyPattern[0]
                ).timeSlot}
              </div>
              <div className="text-sm text-gray-600">
                Precision media: {hourlyPattern.reduce((best, slot) => 
                  slot.avgAccuracy > best.avgAccuracy ? slot : best, hourlyPattern[0]
                ).avgAccuracy}%
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ⭐ ENHANCED: Insights e Raccomandazioni Avanzate */}
      <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold text-yellow-800 mb-4 flex items-center gap-2">
            <Sparkles className="w-6 h-6" />
            Insights e Raccomandazioni Avanzate
          </h3>
          <div className="space-y-3 text-yellow-700">
            <p>🎯 <strong>Precisione attuale:</strong> {advancedStats.averageScore}% (target: 80%+)</p>
            <p>💡 <strong>Uso aiuti:</strong> {advancedStats.hintsPercentage}% (ideale: sotto 20%)</p>
            <p>⚡ <strong>Efficienza netta:</strong> {Math.max(0, advancedStats.averageScore - advancedStats.hintsPercentage)}%</p>
            
            {/* Dynamic recommendations based on trends */}
            {trendAnalysis && (
              <div className="mt-4 space-y-2">
                {trendAnalysis.shortTerm.accuracy < -5 && (
                  <div className="p-3 bg-red-100 rounded-lg border border-red-300">
                    <p>📉 <strong>Attenzione:</strong> La precisione è in calo negli ultimi test. Rivedi il materiale di studio.</p>
                  </div>
                )}
                
                {trendAnalysis.shortTerm.hints > 1 && (
                  <div className="p-3 bg-orange-100 rounded-lg border border-orange-300">
                    <p>💡 <strong>Suggerimento:</strong> Stai usando più aiuti ultimamente. Prova a riflettere di più prima di chiedere aiuto.</p>
                  </div>
                )}
                
                {trendAnalysis.longTerm.accuracy > 15 && trendAnalysis.longTerm.hints > 1 && (
                  <div className="p-3 bg-green-100 rounded-lg border border-green-300">
                    <p>🏆 <strong>Ottimo progresso!</strong> Hai migliorato sia la precisione che l'autonomia. Continua così!</p>
                  </div>
                )}
                
                {trendAnalysis.shortTerm.speed < -3 && (
                  <div className="p-3 bg-blue-100 rounded-lg border border-blue-300">
                    <p>⚡ <strong>Velocità migliorata!</strong> Stai rispondendo più velocemente. Ottimo sviluppo della confidenza.</p>
                  </div>
                )}
              </div>
            )}
            
            <div className="mt-4 p-4 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl border border-indigo-300">
              <h4 className="font-bold text-indigo-800 mb-2">📊 Stato attuale del tuo apprendimento:</h4>
              <p className="text-indigo-700 text-sm">
                Hai completato <strong>{advancedStats.totalTests} test</strong> studiando <strong>{advancedStats.totalWordsStudied} parole</strong> con <strong>{advancedStats.totalHints} aiuti utilizzati</strong>.
                {trendAnalysis && trendAnalysis.longTerm.accuracy > 10 && 
                  ` Il tuo miglioramento di ${Math.round(trendAnalysis.longTerm.accuracy)}% dall'inizio mostra eccellenti progressi!`
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrendsSection;