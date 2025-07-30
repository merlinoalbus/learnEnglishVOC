// =====================================================
// 🔮 src/components/stats/components/FutureProjectionsCard.tsx
// =====================================================

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { 
  TrendingUp, 
  Target, 
  Calendar, 
  Brain,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import type { PerformanceProjection } from '../../../types/entities/Trends.types';

interface FutureProjectionsCardProps {
  projections: PerformanceProjection[];
  className?: string;
}

const FutureProjectionsCard: React.FC<FutureProjectionsCardProps> = ({ 
  projections, 
  className = '' 
}) => {
  if (projections.length === 0) {
    return (
      <Card className={`bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-700 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-purple-800 dark:text-purple-200">
            <TrendingUp className="w-6 h-6" />
            Proiezioni Future
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <Brain className="w-16 h-16 mx-auto mb-4 text-purple-300 dark:text-purple-600" />
          <p className="text-purple-600 dark:text-purple-400">
            Completa almeno 5 test per vedere le proiezioni future intelligenti
          </p>
        </CardContent>
      </Card>
    );
  }

  const primaryProjection = projections.find(p => p.timeframe === '60_days') || projections[0];
  
  const getTimeframeLabel = (timeframe: string) => {
    switch (timeframe) {
      case '7_days': return '7 giorni';
      case '30_days': return '30 giorni';  
      case '60_days': return '60 giorni';
      case '90_days': return '90 giorni';
      default: return timeframe;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 dark:text-green-400';
    if (confidence >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 80) return <CheckCircle2 className="w-4 h-4" />;
    if (confidence >= 60) return <AlertCircle className="w-4 h-4" />;
    return <AlertCircle className="w-4 h-4" />;
  };

  const getTrendIcon = (current: number, projected: number) => {
    const diff = projected - current;
    if (diff > 2) return <ArrowUpRight className="w-4 h-4 text-green-500" />;
    if (diff < -2) return <ArrowDownRight className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  return (
    <Card className={`bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-700 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-purple-800 dark:text-purple-200">
          <TrendingUp className="w-6 h-6" />
          Proiezioni Future AI-Powered
        </CardTitle>
        <p className="text-sm text-purple-600 dark:text-purple-400">
          Analisi predittiva basata sui tuoi pattern di apprendimento
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Proiezione Principale */}
        <div className="bg-white/70 dark:bg-gray-800/70 rounded-xl p-4 border border-purple-200 dark:border-purple-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 className="font-semibold text-purple-800 dark:text-purple-200">
                Proiezione {getTimeframeLabel(primaryProjection.timeframe)}
              </h3>
            </div>
            <div className={`flex items-center gap-1 text-sm ${getConfidenceColor(primaryProjection.confidence)}`}>
              {getConfidenceIcon(primaryProjection.confidence)}
              <span>{primaryProjection.confidence}% sicurezza</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* Accuracy */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-blue-700 dark:text-blue-300">Precision</span>
                {getTrendIcon(70, primaryProjection.projectedMetrics.expectedAccuracy)}
              </div>
              <div className="text-xl font-bold text-blue-800 dark:text-blue-200">
                {primaryProjection.projectedMetrics.expectedAccuracy}%
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400">
                Range: {primaryProjection.uncertaintyRange.pessimistic.expectedAccuracy}%-{primaryProjection.uncertaintyRange.optimistic.expectedAccuracy}%
              </div>
            </div>

            {/* Efficiency */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-green-700 dark:text-green-300">Efficienza</span>
                {getTrendIcon(60, primaryProjection.projectedMetrics.expectedEfficiency)}
              </div>
              <div className="text-xl font-bold text-green-800 dark:text-green-200">
                {primaryProjection.projectedMetrics.expectedEfficiency}%
              </div>
              <div className="text-xs text-green-600 dark:text-green-400">
                Range: {primaryProjection.uncertaintyRange.pessimistic.expectedEfficiency}%-{primaryProjection.uncertaintyRange.optimistic.expectedEfficiency}%
              </div>
            </div>

            {/* Speed */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-orange-700 dark:text-orange-300">Velocità</span>
                {getTrendIcon(50, primaryProjection.projectedMetrics.expectedSpeed)}
              </div>
              <div className="text-xl font-bold text-orange-800 dark:text-orange-200">
                {primaryProjection.projectedMetrics.expectedSpeed}%
              </div>
              <div className="text-xs text-orange-600 dark:text-orange-400">
                Range: {primaryProjection.uncertaintyRange.pessimistic.expectedSpeed}%-{primaryProjection.uncertaintyRange.optimistic.expectedSpeed}%
              </div>
            </div>
          </div>
        </div>

        {/* Milestone Previsti */}
        {primaryProjection.expectedMilestones.length > 0 && (
          <div className="bg-white/70 dark:bg-gray-800/70 rounded-xl p-4 border border-purple-200 dark:border-purple-700">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 className="font-semibold text-purple-800 dark:text-purple-200">
                Traguardi Previsti
              </h3>
            </div>
            <div className="space-y-3">
              {primaryProjection.expectedMilestones.map((milestone, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gradient-to-r from-purple-100/50 to-indigo-100/50 dark:from-purple-800/30 dark:to-indigo-800/30 rounded-lg">
                  <div className="flex items-center justify-center w-8 h-8 bg-purple-200 dark:bg-purple-700 rounded-full text-sm font-bold text-purple-800 dark:text-purple-200">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-purple-800 dark:text-purple-200">{milestone.name}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        milestone.probability >= 80 
                          ? 'bg-green-100 text-green-700 dark:bg-green-800/30 dark:text-green-300'
                          : milestone.probability >= 60
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-800/30 dark:text-yellow-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-800/30 dark:text-red-300'
                      }`}>
                        {milestone.probability}% probabilità
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 mb-2">
                      <Clock className="w-4 h-4" />
                      <span>Previsto per {new Date(milestone.estimatedDate).toLocaleDateString('it-IT')}</span>
                    </div>
                    <div className="text-xs text-purple-700 dark:text-purple-300">
                      <strong>Requisiti:</strong> {milestone.requirements.join(', ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fattori Influenzanti */}
        {primaryProjection.factors.length > 0 && (
          <div className="bg-white/70 dark:bg-gray-800/70 rounded-xl p-4 border border-purple-200 dark:border-purple-700">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 className="font-semibold text-purple-800 dark:text-purple-200">
                Fattori Analizzati
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {primaryProjection.factors.map((factor, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg">
                  <div className={`w-3 h-3 rounded-full mt-1 ${
                    factor.trend === 'positive' 
                      ? 'bg-green-500' 
                      : factor.trend === 'negative' 
                      ? 'bg-red-500' 
                      : 'bg-gray-400'
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200">{factor.name}</h4>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{Math.round(factor.weight * 100)}%</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{factor.impact}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tutte le Proiezioni */}
        {projections.length > 1 && (
          <div className="bg-white/70 dark:bg-gray-800/70 rounded-xl p-4 border border-purple-200 dark:border-purple-700">
            <h3 className="font-semibold text-purple-800 dark:text-purple-200 mb-3">
              Proiezioni Multiple
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {projections.map((projection) => (
                <div key={projection.timeframe} className="text-center p-3 bg-gradient-to-br from-purple-100/50 to-indigo-100/50 dark:from-purple-800/30 dark:to-indigo-800/30 rounded-lg">
                  <div className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-1">
                    {getTimeframeLabel(projection.timeframe)}
                  </div>
                  <div className="text-lg font-bold text-purple-700 dark:text-purple-300">
                    {projection.projectedMetrics.expectedAccuracy}%
                  </div>
                  <div className="text-xs text-purple-600 dark:text-purple-400">
                    {projection.confidence}% sicurezza
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
};

export default FutureProjectionsCard;