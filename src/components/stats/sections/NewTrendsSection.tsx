// =====================================================
// 📈 src/components/stats/sections/NewTrendsSection.tsx - Professional Trends Analysis
// =====================================================

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { 
  TrendingUp, 
  Brain, 
  Zap, 
  Target, 
  AlertCircle,
  Lightbulb,
  Activity,
  BarChart3,
  LineChart,
  PieChart,
  Clock,
  RefreshCw
} from 'lucide-react';
import { useTrends } from '../../../hooks/data/useTrends';
import FutureProjectionsCard from '../components/FutureProjectionsCard';
import IntelligentRecommendationsCard from '../components/IntelligentRecommendationsCard';
import ComprehensiveTrendsChart from '../components/ComprehensiveTrendsChart';
import type { ProjectionTimeframe } from '../../../types/entities/Trends.types';

interface NewTrendsSectionProps {
  localRefresh: number;
  className?: string;
}

const NewTrendsSection: React.FC<NewTrendsSectionProps> = ({ 
  localRefresh, 
  className = '' 
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<ProjectionTimeframe>('7_days');
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<'velocity' | 'patterns' | 'insights'>('velocity');
  
  const { 
    trendsAnalysis, 
    isLoading, 
    isProcessing, 
    error, 
    lastCalculated,
    calculateTrends,
    refreshTrends 
  } = useTrends();

  // Memoized data processing
  const analysisData = useMemo(() => {
    if (!trendsAnalysis) return null;

    return {
      learningVelocity: trendsAnalysis.learningVelocity,
      futureProjections: trendsAnalysis.futureProjections,
      patternAnalysis: trendsAnalysis.patternAnalysis,
      recommendationSystem: trendsAnalysis.recommendationSystem,
      metadata: trendsAnalysis.analysisMetadata
    };
  }, [trendsAnalysis]);

  // Update analysis when timeframe changes
  React.useEffect(() => {
    if (analysisData && !isProcessing) {
      calculateTrends(selectedTimeframe);
    }
  }, [selectedTimeframe]);

  // Loading state
  if (isLoading || isProcessing) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200 dark:border-indigo-700">
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center">
              <RefreshCw className="w-12 h-12 mx-auto mb-4 text-indigo-500 animate-spin" />
              <h3 className="text-lg font-semibold text-indigo-800 dark:text-indigo-200 mb-2">
                Analisi Tendenze AI in Corso
              </h3>
              <p className="text-indigo-600 dark:text-indigo-400">
                {isProcessing ? 'Elaborazione algoritmi predittivi...' : 'Caricamento dati di analisi...'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-700">
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                Errore Analisi Tendenze
              </h3>
              <p className="text-red-600 dark:text-red-400 mb-4">{error.message}</p>
              {error.recoverable && (
                <button
                  onClick={() => calculateTrends(selectedTimeframe)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Riprova Analisi
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No data state
  if (!analysisData) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 border-gray-200 dark:border-gray-700">
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center">
              <Brain className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Analisi Tendenze Non Disponibile
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Completa almeno 5 test per abilitare l'analisi predittiva avanzata
              </p>
              <div className="text-sm text-gray-500 dark:text-gray-500">
                Sistema AI pronto per analizzare i tuoi pattern di apprendimento
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const timeframeOptions: { value: ProjectionTimeframe; label: string }[] = [
    { value: '7_days', label: '7 giorni' },
    { value: '30_days', label: '30 giorni' },
    { value: '60_days', label: '60 giorni' },
    { value: '90_days', label: '90 giorni' }
  ];

  const analysisTabOptions = [
    { id: 'velocity', label: 'Velocità', icon: Zap },
    { id: 'patterns', label: 'Pattern', icon: BarChart3 },
    { id: 'insights', label: 'Insights', icon: Lightbulb }
  ];

  return (
    <div className={`space-y-8 ${className}`} key={`trends-${localRefresh}`}>
      
      {/* Header with Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <TrendingUp className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Analisi Tendenze e Proiezioni AI
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Intelligence artificiale applicata al tuo percorso di apprendimento
          </p>
        </div>
        
      </div>

      {/* Metadata Info */}
      {lastCalculated && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4 text-indigo-700 dark:text-indigo-300">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>Ultimo aggiornamento: {lastCalculated.toLocaleString('it-IT')}</span>
              </div>
              <div className="flex items-center gap-1">
                <Activity className="w-4 h-4" />
                <span>Confidenza: {analysisData.metadata.overallConfidence}%</span>
              </div>
            </div>
            <div className="text-indigo-600 dark:text-indigo-400">
              Algoritmo v{analysisData.metadata.algorithmVersion}
            </div>
          </div>
        </div>
      )}

      {/* Future Projections - Main Feature */}
      <FutureProjectionsCard 
        projections={analysisData.futureProjections}
        className="shadow-lg"
      />

      {/* Comprehensive Trends Visualization */}
      {trendsAnalysis && (
        <div className="space-y-3">
          {/* Timeframe Selector */}
          <div className="flex items-center justify-end gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Proiezione:
            </label>
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value as ProjectionTimeframe)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {timeframeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <ComprehensiveTrendsChart 
            trendsAnalysis={trendsAnalysis}
            selectedProjection={analysisData.futureProjections.find(p => p.timeframe === selectedTimeframe) || analysisData.futureProjections[0]}
            className="shadow-lg"
          />
        </div>
      )}

      {/* Intelligent Recommendations - Secondary Feature */}
      <IntelligentRecommendationsCard 
        recommendationSystem={analysisData.recommendationSystem}
        className="shadow-lg"
      />

      {/* Advanced Analytics Tabs */}
      <Card className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20 border-slate-200 dark:border-slate-700 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-slate-800 dark:text-slate-200">
            <Brain className="w-6 h-6" />
            Analisi Avanzate del Comportamento di Apprendimento
          </CardTitle>
          
          {/* Tab Navigation */}
          <div className="flex gap-2 mt-4">
            {analysisTabOptions.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveAnalysisTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeAnalysisTab === tab.id
                    ? 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
                    : 'bg-white/70 text-slate-600 hover:bg-slate-100 dark:bg-gray-800/70 dark:text-slate-400 dark:hover:bg-slate-700/30'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          
          {/* Learning Velocity Analysis */}
          {activeAnalysisTab === 'velocity' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Current Velocity */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-blue-800 dark:text-blue-200">Velocità Attuale</h3>
                    <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-3xl font-bold text-blue-700 dark:text-blue-300 mb-2">
                    {analysisData.learningVelocity.currentVelocity > 0 ? '+' : ''}{analysisData.learningVelocity.currentVelocity}%
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">
                    per test completato
                  </div>
                  <div className="mt-3 text-xs text-blue-500 dark:text-blue-400">
                    Confidenza: {analysisData.learningVelocity.confidence}%
                  </div>
                </div>

                {/* Acceleration */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-green-800 dark:text-green-200">Accelerazione</h3>
                    <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-3xl font-bold text-green-700 dark:text-green-300 mb-2">
                    {analysisData.learningVelocity.acceleration > 0 ? '+' : ''}{analysisData.learningVelocity.acceleration}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">
                    {analysisData.learningVelocity.direction === 'accelerating' ? 'In accelerazione' : 
                     analysisData.learningVelocity.direction === 'decelerating' ? 'In decelerazione' : 'Stabile'}
                  </div>
                  <div className="mt-3 text-xs text-green-500 dark:text-green-400">
                    Stabilità: {Math.round(analysisData.learningVelocity.stabilityFactor * 100)}%
                  </div>
                </div>

                {/* Velocity by Metric */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-purple-800 dark:text-purple-200">Breakdown Metriche</h3>
                    <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-purple-700 dark:text-purple-300">Accuracy:</span>
                      <span className="font-medium">{analysisData.learningVelocity.velocityByMetric.accuracy > 0 ? '+' : ''}{analysisData.learningVelocity.velocityByMetric.accuracy.toFixed(4)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-purple-700 dark:text-purple-300">Efficienza:</span>
                      <span className="font-medium">{analysisData.learningVelocity.velocityByMetric.efficiency > 0 ? '+' : ''}{analysisData.learningVelocity.velocityByMetric.efficiency.toFixed(4)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-purple-700 dark:text-purple-300">Velocità:</span>
                      <span className="font-medium">{analysisData.learningVelocity.velocityByMetric.speed > 0 ? '+' : ''}{analysisData.learningVelocity.velocityByMetric.speed.toFixed(4)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pattern Analysis */}
          {activeAnalysisTab === 'patterns' && (
            <div className="space-y-6">
              
              {/* Temporal Patterns */}
              {analysisData.patternAnalysis.temporalPatterns.length > 0 && (
                <div className="bg-white/70 dark:bg-gray-800/70 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Pattern Temporali Identificati
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {analysisData.patternAnalysis.temporalPatterns.map((pattern, index) => (
                      <div key={index} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-slate-700 dark:text-slate-300">
                            {pattern.type === 'hourly' ? 'Variazione Oraria' : 'Variazione Settimanale'}
                          </h4>
                          <span className="text-sm text-slate-500 dark:text-slate-400">
                            Forza: {Math.round(pattern.strength * 100)}%
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {pattern.data.slice(0, 6).map((dataPoint, dataIndex) => (
                            <div key={dataIndex} className="text-center p-2 bg-slate-100 dark:bg-slate-700 rounded">
                              <div className="text-xs text-slate-600 dark:text-slate-400">{dataPoint.timeLabel}</div>
                              <div className="font-medium text-slate-800 dark:text-slate-200">{dataPoint.value}%</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Performance Patterns */}
              {analysisData.patternAnalysis.performancePatterns.length > 0 && (
                <div className="bg-white/70 dark:bg-gray-800/70 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <LineChart className="w-5 h-5" />
                    Pattern di Performance
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {analysisData.patternAnalysis.performancePatterns.map((pattern, index) => (
                      <div key={index} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-3 h-3 rounded-full ${
                            pattern.impact === 'positive' ? 'bg-green-500' : 
                            pattern.impact === 'negative' ? 'bg-red-500' : 'bg-gray-400'
                          }`} />
                          <h4 className="font-medium text-slate-800 dark:text-slate-200">{pattern.name}</h4>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{pattern.description}</p>
                        <div className="text-xs text-slate-500 dark:text-slate-500">
                          Frequenza: {Math.round(pattern.frequency * 100)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Correlations */}
              {analysisData.patternAnalysis.correlations.length > 0 && (
                <div className="bg-white/70 dark:bg-gray-800/70 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Correlazioni Statistiche
                  </h3>
                  <div className="space-y-4">
                    {analysisData.patternAnalysis.correlations.map((correlation, index) => (
                      <div key={index} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-slate-800 dark:text-slate-200">
                            {correlation.patterns[0]} ↔ {correlation.patterns[1]}
                          </h4>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${
                              Math.abs(correlation.strength) > 0.5 ? 'text-green-600 dark:text-green-400' :
                              Math.abs(correlation.strength) > 0.3 ? 'text-yellow-600 dark:text-yellow-400' :
                              'text-gray-600 dark:text-gray-400'
                            }`}>
                              {correlation.direction === 'positive' ? '+' : '-'}{Math.abs(correlation.strength).toFixed(2)}
                            </span>
                            <span className="text-xs text-slate-500">
                              ({correlation.significance === 'high' ? '90+' : correlation.significance === 'medium' ? '60-90' : '< 60'}% sicurezza)
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{correlation.interpretation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI Insights */}
          {activeAnalysisTab === 'insights' && (
            <div className="space-y-6">
              {analysisData.patternAnalysis.insights.length > 0 ? (
                <div className="space-y-4">
                  {analysisData.patternAnalysis.insights.map((insight, index) => (
                    <div key={index} className={`p-6 rounded-xl border-l-4 ${
                      insight.type === 'opportunity' ? 'bg-green-50 dark:bg-green-900/20 border-green-500' :
                      insight.type === 'strength' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500' :
                      insight.type === 'weakness' ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-500' :
                      'bg-red-50 dark:bg-red-900/20 border-red-500'
                    }`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            insight.type === 'opportunity' ? 'bg-green-100 dark:bg-green-800' :
                            insight.type === 'strength' ? 'bg-blue-100 dark:bg-blue-800' :
                            insight.type === 'weakness' ? 'bg-orange-100 dark:bg-orange-800' :
                            'bg-red-100 dark:bg-red-800'
                          }`}>
                            {insight.type === 'opportunity' && <Target className="w-5 h-5 text-green-600 dark:text-green-400" />}
                            {insight.type === 'strength' && <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                            {insight.type === 'weakness' && <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />}
                            {insight.type === 'risk' && <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />}
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-800 dark:text-slate-200">{insight.title}</h3>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-sm text-slate-600 dark:text-slate-400">
                                Importanza: {insight.importance}/5
                              </span>
                              <span className="text-sm text-slate-600 dark:text-slate-400">
                                Impatto: +{insight.estimatedImpact}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 mb-4">{insight.description}</p>
                      {insight.suggestedActions.length > 0 && (
                        <div>
                          <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-2">Azioni Consigliate:</h4>
                          <ul className="space-y-1">
                            {insight.suggestedActions.map((action, actionIndex) => (
                              <li key={actionIndex} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                                <span className="text-slate-400 mt-1">•</span>
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                  <Lightbulb className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Nessun insight specifico identificato al momento</p>
                  <p className="text-sm mt-2">Continua a completare test per insights più dettagliati</p>
                </div>
              )}
            </div>
          )}

        </CardContent>
      </Card>

      {/* Algorithm Limitations */}
      {analysisData.metadata.limitations.length > 0 && (
        <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                  Limitazioni Analisi
                </h3>
                <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                  {analysisData.metadata.limitations.map((limitation, index) => (
                    <li key={index}>• {limitation}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
};

export default NewTrendsSection;