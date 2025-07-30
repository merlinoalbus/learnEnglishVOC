// =====================================================
// 📊 src/components/stats/components/TrendsVisualizationChart.tsx
// =====================================================

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  Info,
  Zap,
  Target
} from 'lucide-react';
import type { LearningVelocityAnalysis } from '../../../types/entities/Trends.types';

interface TrendsVisualizationChartProps {
  learningVelocity: LearningVelocityAnalysis;
  className?: string;
}

interface DataPoint {
  label: string;
  value: number;
  color: string;
  trend: 'up' | 'down' | 'stable';
}

const TrendsVisualizationChart: React.FC<TrendsVisualizationChartProps> = ({ 
  learningVelocity, 
  className = '' 
}) => {
  const chartData = useMemo(() => {
    const data: DataPoint[] = [
      {
        label: 'Accuracy',
        value: Math.abs(learningVelocity.velocityByMetric.accuracy),
        color: learningVelocity.velocityByMetric.accuracy >= 0 ? '#3b82f6' : '#ef4444',
        trend: learningVelocity.velocityByMetric.accuracy > 2 ? 'up' : learningVelocity.velocityByMetric.accuracy < -2 ? 'down' : 'stable'
      },
      {
        label: 'Efficienza',
        value: Math.abs(learningVelocity.velocityByMetric.efficiency),
        color: learningVelocity.velocityByMetric.efficiency >= 0 ? '#10b981' : '#f59e0b',
        trend: learningVelocity.velocityByMetric.efficiency > 2 ? 'up' : learningVelocity.velocityByMetric.efficiency < -2 ? 'down' : 'stable'
      },
      {
        label: 'Velocità',
        value: Math.abs(learningVelocity.velocityByMetric.speed),
        color: learningVelocity.velocityByMetric.speed >= 0 ? '#8b5cf6' : '#f97316',
        trend: learningVelocity.velocityByMetric.speed > 2 ? 'up' : learningVelocity.velocityByMetric.speed < -2 ? 'down' : 'stable'
      }
    ];

    const maxValue = Math.max(...data.map(d => d.value));
    return data.map(item => ({
      ...item,
      normalizedHeight: maxValue > 0 ? (item.value / maxValue) * 100 : 0
    }));
  }, [learningVelocity]);

  const getDirectionIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'stable': return <Target className="w-4 h-4 text-gray-500" />;
    }
  };

  const getVelocityIndicator = () => {
    const velocity = learningVelocity.currentVelocity;
    if (velocity > 5) return { label: 'Rapido', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' };
    if (velocity > 0) return { label: 'Positivo', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' };
    if (velocity > -5) return { label: 'Stabile', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30' };
    return { label: 'Rallentato', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' };
  };

  const velocityIndicator = getVelocityIndicator();

  return (
    <Card className={`bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20 border-slate-200 dark:border-slate-700 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-slate-800 dark:text-slate-200">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6" />
            Visualizzazione Tendenze AI
          </div>
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Confidenza: {learningVelocity.confidence}%
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Velocity Overview */}
        <div className={`rounded-xl p-4 ${velocityIndicator.bg}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className={`w-5 h-5 ${velocityIndicator.color}`} />
              <h3 className={`font-semibold ${velocityIndicator.color}`}>
                Velocità di Apprendimento: {velocityIndicator.label}
              </h3>
            </div>
            <div className={`text-2xl font-bold ${velocityIndicator.color}`}>
              {learningVelocity.currentVelocity > 0 ? '+' : ''}{learningVelocity.currentVelocity}%
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className={velocityIndicator.color}>
              Accelerazione: {learningVelocity.acceleration > 0 ? '+' : ''}{learningVelocity.acceleration}
            </div>
            <div className={velocityIndicator.color}>
              Stabilità: {Math.round(learningVelocity.stabilityFactor * 100)}%
            </div>
            <div className={velocityIndicator.color}>
              Direzione: {
                learningVelocity.direction === 'accelerating' ? '📈 Accelerazione' :
                learningVelocity.direction === 'decelerating' ? '📉 Decelerazione' :
                '➡️ Stabile'
              }
            </div>
          </div>
        </div>

        {/* Interactive Bar Chart */}
        <div className="bg-white/70 dark:bg-gray-800/70 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Breakdown Performance per Metrica
          </h3>
          
          <div className="space-y-4">
            {chartData.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {item.label}
                    </span>
                    {getDirectionIcon(item.trend)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {learningVelocity.velocityByMetric[item.label.toLowerCase() as keyof typeof learningVelocity.velocityByMetric] > 0 ? '+' : ''}
                      {learningVelocity.velocityByMetric[item.label.toLowerCase() as keyof typeof learningVelocity.velocityByMetric]}%
                    </span>
                  </div>
                </div>
                
                {/* Animated Progress Bar */}
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-6 relative overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-1000 ease-out relative"
                    style={{ 
                      backgroundColor: item.color,
                      width: `${Math.min(item.normalizedHeight, 100)}%`,
                      opacity: 0.8
                    }}
                  >
                    {/* Gradient overlay for better visual */}
                    <div 
                      className="absolute inset-0 rounded-full opacity-20"
                      style={{
                        background: `linear-gradient(90deg, transparent, ${item.color})`
                      }}
                    />
                    
                    {/* Value label inside bar */}
                    {item.normalizedHeight > 30 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-white drop-shadow-sm">
                          {item.value.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Value label outside bar for small values */}
                  {item.normalizedHeight <= 30 && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                        {item.value.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Velocity Trend Line Visualization */}
        <div className="bg-white/70 dark:bg-gray-800/70 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">
            Andamento Velocità di Apprendimento
          </h3>
          
          <div className="relative h-32 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-lg p-4">
            {/* SVG Trend Line */}
            <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
              {/* Grid lines */}
              <defs>
                <pattern id="grid" width="30" height="25" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 25" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" className="text-slate-300 dark:text-slate-600" />
              
              {/* Trend line based on current velocity and acceleration */}
              <path
                d={`M 0 ${50 - learningVelocity.currentVelocity} Q 150 ${50 - learningVelocity.currentVelocity - learningVelocity.acceleration} 300 ${50 - learningVelocity.currentVelocity - learningVelocity.acceleration * 2}`}
                fill="none"
                stroke={learningVelocity.direction === 'accelerating' ? '#10b981' : learningVelocity.direction === 'decelerating' ? '#ef4444' : '#6b7280'}
                strokeWidth="3"
                className="drop-shadow-sm"
              />
              
              {/* Data points */}
              <circle cx="0" cy={50 - learningVelocity.currentVelocity} r="4" fill="#3b82f6" className="drop-shadow-sm" />
              <circle cx="300" cy={50 - learningVelocity.currentVelocity - learningVelocity.acceleration * 2} r="4" fill="#8b5cf6" className="drop-shadow-sm" />
            </svg>
            
            {/* Labels */}
            <div className="absolute bottom-2 left-2 text-xs text-slate-600 dark:text-slate-400">
              Attuale: {learningVelocity.currentVelocity}%
            </div>
            <div className="absolute bottom-2 right-2 text-xs text-slate-600 dark:text-slate-400">
              Proiezione: {learningVelocity.currentVelocity + learningVelocity.acceleration * 2}%
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-sm text-blue-600 dark:text-blue-400">Velocità Base</div>
              <div className="font-bold text-blue-800 dark:text-blue-200">{learningVelocity.currentVelocity}%</div>
            </div>
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-sm text-green-600 dark:text-green-400">Accelerazione</div>
              <div className="font-bold text-green-800 dark:text-green-200">
                {learningVelocity.acceleration > 0 ? '+' : ''}{learningVelocity.acceleration}
              </div>
            </div>
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-sm text-purple-600 dark:text-purple-400">Stabilità</div>
              <div className="font-bold text-purple-800 dark:text-purple-200">
                {Math.round(learningVelocity.stabilityFactor * 100)}%
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Summary */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-indigo-200 dark:border-indigo-700">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-indigo-800 dark:text-indigo-200 mb-2">
                Interpretazione AI dell'Andamento
              </h4>
              <p className="text-sm text-indigo-700 dark:text-indigo-300">
                {learningVelocity.direction === 'accelerating' && learningVelocity.currentVelocity > 0 && 
                  "Il tuo apprendimento sta accelerando positivamente. Continua con questa strategia per ottenere risultati eccellenti."
                }
                {learningVelocity.direction === 'accelerating' && learningVelocity.currentVelocity <= 0 && 
                  "Stai recuperando da un periodo difficile. L'accelerazione positiva indica un miglioramento in corso."
                }
                {learningVelocity.direction === 'steady' && learningVelocity.currentVelocity > 0 && 
                  "Mantieni un ritmo di apprendimento costante e positivo. La stabilità è un punto di forza."
                }
                {learningVelocity.direction === 'steady' && learningVelocity.currentVelocity <= 0 && 
                  "Il tuo apprendimento è stabile ma potrebbe beneficiare di nuove strategie per migliorare."
                }
                {learningVelocity.direction === 'decelerating' && learningVelocity.currentVelocity > 0 && 
                  "Nonostante la decelerazione, mantieni ancora un trend positivo. Considera di rivedere la tua strategia."
                }
                {learningVelocity.direction === 'decelerating' && learningVelocity.currentVelocity <= 0 && 
                  "Periodo di rallentamento nell'apprendimento. È normale e temporaneo. Focalizzati sui fondamentali."
                }
              </p>
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
};

export default TrendsVisualizationChart;