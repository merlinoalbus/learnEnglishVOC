// =====================================================
// 🎯 src/components/stats/components/IntelligentRecommendationsCard.tsx
// =====================================================

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { 
  Lightbulb, 
  Target, 
  AlertTriangle, 
  Clock, 
  Brain,
  ChevronRight,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Calendar,
  Star,
  Zap,
  BookOpen,
  Timer
} from 'lucide-react';
import type { IntelligentRecommendationSystem } from '../../../types/entities/Trends.types';

interface IntelligentRecommendationsCardProps {
  recommendationSystem: IntelligentRecommendationSystem;
  className?: string;
}

const IntelligentRecommendationsCard: React.FC<IntelligentRecommendationsCardProps> = ({ 
  recommendationSystem, 
  className = '' 
}) => {
  const [activeTab, setActiveTab] = useState<'goals' | 'weaknesses' | 'timing' | 'strategy'>('goals');
  const [expandedRecommendation, setExpandedRecommendation] = useState<number | null>(null);

  const { 
    goalBasedRecommendations, 
    weaknessBasedRecommendations, 
    timingRecommendations, 
    strategicRecommendations,
    personalizationScore 
  } = recommendationSystem;

  const hasRecommendations = 
    goalBasedRecommendations.length > 0 || 
    weaknessBasedRecommendations.length > 0 || 
    timingRecommendations.length > 0 || 
    strategicRecommendations.length > 0;

  if (!hasRecommendations) {
    return (
      <Card className={`bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-700 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-amber-800 dark:text-amber-200">
            <Lightbulb className="w-6 h-6" />
            Raccomandazioni Intelligenti
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <Brain className="w-16 h-16 mx-auto mb-4 text-amber-300 dark:text-amber-600" />
          <p className="text-amber-600 dark:text-amber-400">
            Completa più test per ricevere raccomandazioni personalizzate basate sui tuoi pattern di apprendimento
          </p>
        </CardContent>
      </Card>
    );
  }

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700';
    if (priority >= 3) return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700';
    return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700';
  };

  const getPriorityLabel = (priority: number) => {
    if (priority >= 4) return 'Alta';
    if (priority >= 3) return 'Media';
    return 'Bassa';
  };

  const getSeverityColor = (severity: number) => {
    if (severity >= 4) return 'text-red-600 dark:text-red-400';
    if (severity >= 3) return 'text-orange-600 dark:text-orange-400';
    return 'text-yellow-600 dark:text-yellow-400';
  };

  const getPersonalizationColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const tabs = [
    { id: 'goals', label: 'Obiettivi', icon: Target, count: goalBasedRecommendations.length },
    { id: 'weaknesses', label: 'Debolezze', icon: AlertTriangle, count: weaknessBasedRecommendations.length },
    { id: 'timing', label: 'Timing', icon: Clock, count: timingRecommendations.length },
    { id: 'strategy', label: 'Strategia', icon: Brain, count: strategicRecommendations.length }
  ];

  return (
    <Card className={`bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-700 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-amber-800 dark:text-amber-200">
          <Lightbulb className="w-6 h-6" />
          Raccomandazioni AI Personalizzate
        </CardTitle>
        <div className="flex items-center justify-between">
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Suggerimenti intelligenti basati sui tuoi pattern di apprendimento
          </p>
          <div className={`flex items-center gap-1 text-sm ${getPersonalizationColor(personalizationScore)}`}>
            <Star className="w-4 h-4" />
            <span>{personalizationScore}% personalizzato</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-amber-200 text-amber-800 dark:bg-amber-700 dark:text-amber-200'
                  : 'bg-white/70 text-amber-700 hover:bg-amber-100 dark:bg-gray-800/70 dark:text-amber-300 dark:hover:bg-amber-800/30'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className="bg-amber-600 text-white text-xs px-2 py-1 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Goal-Based Recommendations */}
        {activeTab === 'goals' && (
          <div className="space-y-4">
            {goalBasedRecommendations.length === 0 ? (
              <div className="text-center py-8 text-amber-600 dark:text-amber-400">
                <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nessun obiettivo specifico identificato al momento</p>
              </div>
            ) : (
              goalBasedRecommendations.map((recommendation, index) => (
                <div key={index} className="bg-white/70 dark:bg-gray-800/70 rounded-xl p-4 border border-amber-200 dark:border-amber-700">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Target className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                          {recommendation.targetGoal.name}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(recommendation.priority)}`}>
                          Priorità {getPriorityLabel(recommendation.priority)}
                        </span>
                      </div>
                      <p className="text-sm text-amber-700 dark:text-amber-300 mb-2">
                        {recommendation.targetGoal.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-amber-600 dark:text-amber-400">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          <span>{recommendation.targetGoal.currentValue}% → {recommendation.targetGoal.targetValue}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{recommendation.estimatedTimeToGoal} giorni</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{recommendation.successProbability}% successo</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setExpandedRecommendation(expandedRecommendation === index ? null : index)}
                      className="p-2 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-800/30 transition-colors"
                    >
                      <ChevronRight className={`w-4 h-4 text-amber-600 transition-transform ${
                        expandedRecommendation === index ? 'rotate-90' : ''
                      }`} />
                    </button>
                  </div>

                  {expandedRecommendation === index && (
                    <div className="border-t border-amber-200 dark:border-amber-700 pt-4 mt-4">
                      <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-3">Piano d'Azione:</h4>
                      <div className="space-y-3">
                        {recommendation.actionPlan.map((step, stepIndex) => (
                          <div key={stepIndex} className="flex items-start gap-3 p-3 bg-amber-100/50 dark:bg-amber-800/20 rounded-lg">
                            <div className="flex items-center justify-center w-6 h-6 bg-amber-200 dark:bg-amber-700 rounded-full text-xs font-bold text-amber-800 dark:text-amber-200">
                              {step.order}
                            </div>
                            <div className="flex-1">
                              <h5 className="font-medium text-amber-800 dark:text-amber-200 mb-1">{step.title}</h5>
                              <p className="text-sm text-amber-700 dark:text-amber-300 mb-2">{step.description}</p>
                              <div className="flex items-center gap-4 text-xs text-amber-600 dark:text-amber-400">
                                <div className="flex items-center gap-1">
                                  <Timer className="w-3 h-3" />
                                  <span>{step.estimatedTime} min</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3" />
                                  <span>Difficoltà {step.difficulty}/5</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Weakness-Based Recommendations */}
        {activeTab === 'weaknesses' && (
          <div className="space-y-4">
            {weaknessBasedRecommendations.length === 0 ? (
              <div className="text-center py-8 text-amber-600 dark:text-amber-400">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
                <p>Ottimo! Nessuna debolezza critica identificata</p>
              </div>
            ) : (
              weaknessBasedRecommendations.map((recommendation, index) => (
                <div key={index} className="bg-white/70 dark:bg-gray-800/70 rounded-xl p-4 border border-amber-200 dark:border-amber-700">
                  <div className="flex items-start gap-3 mb-3">
                    <AlertTriangle className={`w-5 h-5 mt-1 ${getSeverityColor(recommendation.severity)}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                          {recommendation.weakness.area.charAt(0).toUpperCase() + recommendation.weakness.area.slice(1)}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          recommendation.severity >= 4 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                          recommendation.severity >= 3 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                          'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                        }`}>
                          Severità {recommendation.severity}/5
                        </span>
                      </div>
                      <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                        {recommendation.weakness.description}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                          <TrendingUp className="w-4 h-4" />
                          <span>Impatto: +{recommendation.estimatedImprovementImpact}%</span>
                        </div>
                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                          <Clock className="w-4 h-4" />
                          <span>Risultati in {recommendation.timeToResults} giorni</span>
                        </div>
                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                          <BookOpen className="w-4 h-4" />
                          <span>Trend: {recommendation.weakness.trend === 'improving' ? '📈' : recommendation.weakness.trend === 'worsening' ? '📉' : '➡️'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Evidence */}
                  {recommendation.weakness.evidence.length > 0 && (
                    <div className="bg-amber-100/30 dark:bg-amber-800/20 rounded-lg p-3 mt-3">
                      <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">Evidenze:</h4>
                      <div className="space-y-1">
                        {recommendation.weakness.evidence.map((evidence, evidenceIndex) => (
                          <div key={evidenceIndex} className="text-sm text-amber-700 dark:text-amber-300">
                            • {evidence.description} (confidenza: {Math.round(evidence.confidence * 100)}%)
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Timing Recommendations */}
        {activeTab === 'timing' && (
          <div className="space-y-4">
            {timingRecommendations.length === 0 ? (
              <div className="text-center py-8 text-amber-600 dark:text-amber-400">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Servono più dati per raccomandazioni temporali personalizzate</p>
              </div>
            ) : (
              timingRecommendations.map((recommendation, index) => (
                <div key={index} className="bg-white/70 dark:bg-gray-800/70 rounded-xl p-4 border border-amber-200 dark:border-amber-700">
                  <div className="flex items-center gap-3 mb-4">
                    <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                      Ottimizzazione Timing Studio
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Orario Ottimale */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg p-4">
                      <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Orario Migliore</h4>
                      <div className="text-xl font-bold text-blue-700 dark:text-blue-300 mb-1">
                        {recommendation.optimalStudyTime.startHour}:00 - {recommendation.optimalStudyTime.endHour}:00
                      </div>
                      <div className="text-sm text-blue-600 dark:text-blue-400">
                        Performance media: {Math.round(recommendation.optimalStudyTime.averagePerformance)}%
                      </div>
                      <div className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                        Confidenza: {Math.round(recommendation.optimalStudyTime.confidence * 100)}%
                      </div>
                    </div>

                    {/* Frequenza e Durata */}
                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-lg p-4">
                      <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">Frequenza Ottimale</h4>
                      <div className="text-xl font-bold text-green-700 dark:text-green-300 mb-1">
                        {recommendation.optimalFrequency.sessionsPerWeek}x/settimana
                      </div>
                      <div className="text-sm text-green-600 dark:text-green-400">
                        Durata: {recommendation.recommendedSessionDuration} minuti
                      </div>
                      <div className="text-xs text-green-500 dark:text-green-400 mt-1">
                        Distribuzione: {recommendation.optimalFrequency.distribution}
                      </div>
                    </div>
                  </div>

                  {/* Break Pattern */}
                  <div className="bg-amber-100/30 dark:bg-amber-800/20 rounded-lg p-4 mt-4">
                    <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">Pattern Pause Consigliato</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-amber-700 dark:text-amber-300">Pause brevi:</span>
                        <div className="font-medium">{recommendation.recommendedBreakPattern.shortBreakDuration} min ogni {recommendation.recommendedBreakPattern.shortBreakFrequency} min</div>
                      </div>
                      <div>
                        <span className="text-amber-700 dark:text-amber-300">Pause lunghe:</span>
                        <div className="font-medium">{recommendation.recommendedBreakPattern.longBreakDuration} min ogni {recommendation.recommendedBreakPattern.longBreakFrequency} min</div>
                      </div>
                    </div>
                  </div>

                  {/* Supporting Evidence */}
                  <div className="mt-4">
                    <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">Evidenze di Supporto:</h4>
                    <div className="space-y-1">
                      {recommendation.supportingEvidence.map((evidence, evidenceIndex) => (
                        <div key={evidenceIndex} className="text-sm text-amber-700 dark:text-amber-300">
                          • {evidence}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Strategic Recommendations */}
        {activeTab === 'strategy' && (
          <div className="space-y-4">
            {strategicRecommendations.length === 0 ? (
              <div className="text-center py-8 text-amber-600 dark:text-amber-400">
                <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Raccomandazioni strategiche in sviluppo...</p>
              </div>
            ) : (
              strategicRecommendations.map((recommendation, index) => (
                <div key={index} className="bg-white/70 dark:bg-gray-800/70 rounded-xl p-4 border border-amber-200 dark:border-amber-700">
                  <div className="flex items-center gap-3 mb-3">
                    <Brain className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                      {typeof recommendation.strategy === 'string' ? recommendation.title : recommendation.strategy.name}
                    </h3>
                  </div>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                    {typeof recommendation.strategy === 'string' ? recommendation.description : recommendation.strategy.description}
                  </p>
                  {/* Implementation details would go here */}
                </div>
              ))
            )}
          </div>
        )}

      </CardContent>
    </Card>
  );
};

export default IntelligentRecommendationsCard;