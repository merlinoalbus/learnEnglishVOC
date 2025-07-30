// =====================================================
// 📁 src/components/stats/sections/PerformanceSection.tsx - REFACTORED Presentation Only
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
import { Trophy, Lightbulb, Zap, Clock, Target, TrendingUp, Info } from 'lucide-react';
import { useStats } from '../../../hooks/data/useStats';
import type { TestHistoryItem, Word } from '../../../types';
import PerformanceAnalyticsService from '../../../services/PerformanceAnalyticsService';

interface PerformanceSectionProps {
  testHistory: TestHistoryItem[];
  words?: Word[];
  localRefresh: number;
  onClearHistory?: () => void;
}

const PerformanceSection: React.FC<PerformanceSectionProps> = ({ testHistory, words, localRefresh }) => {
  const { stats, calculatedStats, testHistory: dbTestHistory, getDetailedTestSessions } = useStats();
  const [showFormulaDetails, setShowFormulaDetails] = React.useState(false);
  
  // ⭐ NEW: Service instance for business logic
  const performanceAnalyticsService = useMemo(() => new PerformanceAnalyticsService(), []);
  
  // ⭐ REFACTORED: Use service for data processing
  const performanceTimelineData = useMemo(() => {
    return performanceAnalyticsService.processPerformanceTimelineData(dbTestHistory || testHistory);
  }, [dbTestHistory, testHistory, performanceAnalyticsService]);

  // ⭐ Get detailed sessions for difficulty analysis
  const [detailedSessions, setDetailedSessions] = React.useState<any[]>([]);
  
  React.useEffect(() => {
    if (getDetailedTestSessions) {
      const loadSessions = async () => {
        try {
          const result = await getDetailedTestSessions();
          if (result.success && result.data) {
            setDetailedSessions(result.data);
          }
        } catch (error) {
          console.error('Error loading detailed sessions:', error);
        }
      };
      loadSessions();
    }
  }, [getDetailedTestSessions]);

  // ⭐ REFACTORED: Use service for all calculations
  const performanceMetrics = useMemo(() => {
    return performanceAnalyticsService.calculatePerformanceMetrics(performanceTimelineData, dbTestHistory || testHistory, detailedSessions);
  }, [performanceTimelineData, dbTestHistory, testHistory, detailedSessions, performanceAnalyticsService]);

  // ⭐ REFACTORED: Use service for radar data
  const radarData = useMemo(() => {
    if (!performanceMetrics) return [];
    return performanceAnalyticsService.prepareRadarData(performanceMetrics);
  }, [performanceMetrics, performanceAnalyticsService]);

  // ⭐ REFACTORED: Use service for improvement analysis with detailed sessions
  const improvementData = useMemo(() => {
    return performanceAnalyticsService.calculateImprovementData(performanceTimelineData, detailedSessions);
  }, [performanceTimelineData, detailedSessions, performanceAnalyticsService]);

  // ⭐ REFACTORED: Use service for difficulty analysis with detailed sessions and words database
  const difficultyAnalysis = useMemo(() => {
    return performanceAnalyticsService.analyzeDifficultyPerformance(dbTestHistory || testHistory, detailedSessions, words);
  }, [dbTestHistory, testHistory, detailedSessions, words, performanceAnalyticsService]);

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
            <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
              Valutazione Personale
              <button 
                onClick={() => setShowFormulaDetails(!showFormulaDetails)}
                className="text-lg bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
                title="Mostra dettagli formula"
              >
                <Info className="w-5 h-5" />
              </button>
            </h2>
            <div className="text-6xl font-bold mb-2">{performanceMetrics.performanceIndex}</div>
            <div className="text-xs opacity-70">
              💡 La tua valutazione personale basata su 5 metriche di performance
            </div>
            
            {/* ⭐ COLLAPSIBLE FORMULA DETAILS */}
            {showFormulaDetails && (
              <div className="mt-4 space-y-3">
                <div className="text-sm opacity-75">
                  📊 Formula: (Precisione × 30%) + (Consistenza × 25%) + (Efficienza × 20%) + (Velocità × 15%) + (Gestione Difficoltà × 10%)
                </div>
                <div className="text-xs opacity-80 bg-white/10 rounded-lg p-3">
                  <div className="font-semibold mb-1">Il tuo calcolo:</div>
                  <div>{performanceMetrics.calculationBreakdown.precision.value}% × 30% = {performanceMetrics.calculationBreakdown.precision.points} punti</div>
                  <div>{performanceMetrics.calculationBreakdown.consistency.value}% × 25% = {performanceMetrics.calculationBreakdown.consistency.points} punti</div>
                  <div>{performanceMetrics.calculationBreakdown.efficiency.value}% × 20% = {performanceMetrics.calculationBreakdown.efficiency.points} punti</div>
                  <div>{performanceMetrics.calculationBreakdown.speed.value}% × 15% = {performanceMetrics.calculationBreakdown.speed.points} punti</div>
                  <div>{performanceMetrics.calculationBreakdown.difficulty.value}% × 10% = {performanceMetrics.calculationBreakdown.difficulty.points} punti</div>
                  <div className="border-t border-white/20 pt-1 mt-1 font-semibold">Totale = {performanceMetrics.performanceIndex} punti</div>
                </div>
              </div>
            )}
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
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
            <div className="text-center p-4 bg-white/20 rounded-xl backdrop-blur-sm" title="Gestione di test difficili e complessi">
              <Zap className="w-8 h-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">{performanceMetrics.difficultyScore}%</div>
              <div className="text-white/80 text-sm">Gestione Difficoltà</div>
              <div className="text-white/60 text-xs mt-1">Performance test complessi</div>
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
            {improvementData.length > 0 ? (
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
                <p>Completa almeno 3 test per vedere i trend di miglioramento</p>
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
            {/* ⭐ Explanatory note for difficulty calculation */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                📋 Come viene calcolata la difficoltà dei test
              </h4>
              <div className="text-sm text-blue-700 space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-3 rounded border">
                    <div className="font-semibold text-red-600">🔴 Difficile</div>
                    <div className="text-xs mt-1">
                      • &ge; 70% parole marcate come difficili nel DB<br/>
                      • O media &ge; 2 aiuti per parola<br/>
                      • O score integrato difficoltà &ge; 0.5
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <div className="font-semibold text-orange-600">🟡 Normale</div>
                    <div className="text-xs mt-1">
                      • Mix bilanciato di parole facili/difficili<br/>
                      • Performance miste dell'utente<br/>
                      • Score integrato intermedio
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <div className="font-semibold text-green-600">🟢 Facile</div>
                    <div className="text-xs mt-1">
                      • &ge; 70% parole già apprese nel DB<br/>
                      • O media &lt; 0.3 aiuti e tempo &lt; 5 sec<br/>
                      • O score integrato facilità &ge; 0.6
                    </div>
                  </div>
                </div>
                <div className="mt-3 p-2 bg-white rounded text-xs">
                  <strong>Formula integrata:</strong> Difficoltà oggettiva parole (50%) + Performance soggettiva utente (50%). Considera sia le caratteristiche intrinseche delle parole nel database che il comportamento dell'utente durante il test.
                </div>
              </div>
            </div>
            
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

      {/* ⭐ REFACTORED: Performance Insights from service */}
      {performanceMetrics && (
        <PerformanceInsightsCard 
          insights={performanceAnalyticsService.generateInsights(performanceMetrics)}
        />
      )}
    </div>
  );
};

// ⭐ NEW: Pure presentational component for insights
interface PerformanceInsightsCardProps {
  insights: {
    strengths: string[];
    improvements: string[];
    recommendation: string;
  };
}

const PerformanceInsightsCard: React.FC<PerformanceInsightsCardProps> = ({ insights }) => {
  const { strengths, improvements, recommendation } = insights;

  return (
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
              {strengths.map((strength, index) => (
                <p key={index} className="text-green-700">{strength}</p>
              ))}
              {strengths.length === 0 && (
                <p className="text-gray-500 italic">Continua a praticare per sviluppare i tuoi punti di forza!</p>
              )}
            </div>
          </div>

          {/* Areas for Improvement */}
          <div>
            <h4 className="font-bold text-orange-800 mb-3 flex items-center gap-2">
              📈 Aree di Miglioramento
            </h4>
            <div className="space-y-2 text-sm">
              {improvements.map((improvement, index) => (
                <p key={index} className="text-orange-700">{improvement}</p>
              ))}
              {improvements.length === 0 && (
                <p className="text-green-600">🎉 Performance eccellenti in tutte le aree!</p>
              )}
            </div>
          </div>
        </div>

        {/* Overall Recommendation */}
        <div className="mt-6 p-4 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl border border-indigo-300">
          <h4 className="font-bold text-indigo-800 mb-2">🎯 Raccomandazione Personalizzata</h4>
          <p className="text-indigo-700 text-sm">{recommendation}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceSection;