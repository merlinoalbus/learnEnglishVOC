// =====================================================
// 📁 src/components/stats/components/WordPerformanceCard.tsx - ENHANCED
// =====================================================

import React from 'react';
import type { WordPerformanceAnalysis } from '../../../types/entities/Performance.types';
import { Button } from '../../ui/button';
import { BookOpen, TrendingUp, Clock, Lightbulb, Target, AlertTriangle, CheckCircle, Circle, Edit3, Eye } from 'lucide-react';
import { getCategoryStyle } from '../../../utils/categoryUtils';

interface WordPerformanceCardProps {
  word: WordPerformanceAnalysis;
  isSelected: boolean;
  onClick: () => void;
  onToggleLearned: () => void;
  onToggleDifficult: () => void;
  onEdit: () => void;
  showActions?: boolean;
}

const WordPerformanceCard: React.FC<WordPerformanceCardProps> = ({ word, isSelected, onClick, onToggleLearned, onToggleDifficult, onEdit, showActions = false }) => {
  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      critical: 'bg-red-500',
      inconsistent: 'bg-orange-500',
      struggling: 'bg-yellow-500',
      promising: 'bg-blue-500',
      improving: 'bg-green-500',
      consolidated: 'bg-emerald-500',
      new: 'bg-gray-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      critical: '🔴 Critica',
      inconsistent: '🟠 Instabile',
      struggling: '🟡 In difficoltà',
      promising: '🔵 Promettente',
      improving: '🟢 Migliorando',
      consolidated: '🟢 Consolidata',
      new: '⚪ Nuova'
    };
    return labels[status] || '⚪ Sconosciuto';
  };

  const getPerformanceInsight = (word: WordPerformanceAnalysis) => {
    if (!word.totalAttempts || word.totalAttempts === 0) {
      return { text: 'Nessun test completato', color: 'text-gray-500', icon: '📊' };
    }
    
    if (word.accuracy >= 90 && word.currentStreak >= 3) {
      return { text: 'Performance eccellente!', color: 'text-green-600', icon: '🏆' };
    }
    
    if (word.accuracy >= 70 && word.hintsPercentage <= 30) {
      return { text: 'Buona padronanza', color: 'text-blue-600', icon: '👍' };
    }
    
    if (word.hintsPercentage > 50) {
      return { text: 'Troppi aiuti utilizzati', color: 'text-orange-600', icon: '💡' };
    }
    
    if (word.accuracy < 50) {
      return { text: 'Necessita più studio', color: 'text-red-600', icon: '📚' };
    }
    
    return { text: 'In fase di apprendimento', color: 'text-blue-500', icon: '📈' };
  };

  const insight = getPerformanceInsight(word);

  return (
    <div
      onClick={onClick}
      className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg ${
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-lg'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        {/* ⭐ ENHANCED: Word info with actions */}
        <div className="flex items-center gap-4 flex-1">
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-1">
              <div className="font-bold text-xl text-gray-800">{word.english}</div>
              <span className="text-gray-400">→</span>
              <div className="text-lg text-gray-600">{word.italian}</div>
            </div>
            
            {/* ⭐ NEW: Word meta info */}
            <div className="flex flex-wrap gap-2 text-sm">
              {word.chapter && (
                <span className="flex items-center gap-1 text-blue-600">
                  <BookOpen className="w-3 h-3" />
                  Cap. {word.chapter}
                </span>
              )}
              
              {word.group && (
                <span className="flex items-center gap-1 text-purple-600">
                  {getCategoryStyle(word.group).icon}
                  {word.group}
                </span>
              )}
              
              {word.learned && (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="w-3 h-3" />
                  Appresa
                </span>
              )}
              
              {word.difficult && (
                <span className="flex items-center gap-1 text-red-600">
                  <AlertTriangle className="w-3 h-3" />
                  Difficile
                </span>
              )}
            </div>
          </div>

          {/* ⭐ NEW: Quick actions se abilitati */}
          {showActions && (onToggleLearned || onToggleDifficult || onEdit) && (
            <div className="flex items-center gap-2">
              {onToggleLearned && (
                <div 
                  onClick={(e) => { e.stopPropagation(); onToggleLearned(); }}
                  className="cursor-pointer"
                  title={word.learned ? "Segna come non appresa" : "Segna come appresa"}
                >
                  {word.learned ? (
                    <CheckCircle className="w-5 h-5 text-green-500 hover:text-green-600 transition-colors" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-400 hover:text-green-500 transition-colors" />
                  )}
                </div>
              )}
              
              {onToggleDifficult && (
                <div 
                  onClick={(e) => { e.stopPropagation(); onToggleDifficult(); }}
                  className="cursor-pointer"
                  title={word.difficult ? "Rimuovi da parole difficili" : "Segna come difficile"}
                >
                  {word.difficult ? (
                    <AlertTriangle className="w-5 h-5 text-red-500 hover:text-red-600 transition-colors fill-current" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-gray-400 hover:text-red-500 transition-colors" />
                  )}
                </div>
              )}

              {onEdit && (
                <Button
                  onClick={(e) => { e.stopPropagation(); onEdit(); }}
                  variant="ghost"
                  size="sm"
                  className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1"
                  title="Modifica parola"
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* ⭐ ENHANCED: Performance overview */}
        <div className="flex items-center gap-6">
          {/* Performance stats */}
          {word.totalAttempts > 0 ? (
            <>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{word.accuracy}%</div>
                <div className="text-blue-700 text-xs">Precisione</div>
              </div>

              <div className="text-center">
                <div className="text-lg font-bold text-orange-600">{word.hintsPercentage}%</div>
                <div className="text-orange-700 text-xs">Aiuti</div>
              </div>

              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{word.currentStreak}</div>
                <div className="text-green-700 text-xs">Streak</div>
              </div>

              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">{word.avgTime}s</div>
                <div className="text-purple-700 text-xs">Tempo Medio</div>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500">
              <TrendingUp className="w-8 h-8 mx-auto mb-1 opacity-50" />
              <div className="text-sm">Nessun dato</div>
            </div>
          )}

          {/* Status badge */}
          {word.totalAttempts > 0 && (
            <div className={`px-3 py-1 rounded-full text-white text-sm font-medium ${getStatusColor(word.status)}`}>
              {getStatusLabel(word.status)}
            </div>
          )}

          {/* View details indicator */}
          <div className="text-gray-400 hover:text-blue-500 transition-colors">
            <Eye className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ⭐ NEW: Performance insight */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{insight.icon}</span>
          <span className={`text-sm font-medium ${insight.color}`}>
            {insight.text}
          </span>
        </div>

        {/* ⭐ NEW: Additional info */}
        <div className="text-sm text-gray-500">
          {word.totalAttempts > 0 ? (
            <>
              {word.totalAttempts} {word.totalAttempts === 1 ? 'tentativo' : 'tentativi'}
              {word.lastAttempt && (
                <span className="ml-2">
                  • Ultimo: {new Date(word.lastAttempt.timestamp).toLocaleDateString('it-IT')}
                </span>
              )}
            </>
          ) : (
            <span>Nessun test completato</span>
          )}
        </div>
      </div>

      {/* ⭐ NEW: Quick performance indicators */}
      {word.totalAttempts > 0 && (
        <div className="mt-4 grid grid-cols-4 gap-2">
          {/* Accuracy indicator */}
          <div className="text-center p-2 bg-blue-50 rounded-lg">
            <div className={`w-full h-2 rounded-full bg-gray-200`}>
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  word.accuracy >= 80 ? 'bg-green-500' : 
                  word.accuracy >= 60 ? 'bg-blue-500' : 
                  word.accuracy >= 40 ? 'bg-orange-500' : 'bg-red-500'
                }`}
                style={{ width: `${word.accuracy}%` }}
              />
            </div>
            <div className="text-xs text-blue-600 mt-1">Precisione</div>
          </div>

          {/* Hints indicator */}
          <div className="text-center p-2 bg-orange-50 rounded-lg">
            <div className="w-full h-2 rounded-full bg-gray-200">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  word.hintsPercentage <= 20 ? 'bg-green-500' : 
                  word.hintsPercentage <= 40 ? 'bg-blue-500' : 
                  word.hintsPercentage <= 60 ? 'bg-orange-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(100, word.hintsPercentage)}%` }}
              />
            </div>
            <div className="text-xs text-orange-600 mt-1">Aiuti</div>
          </div>

          {/* Streak indicator */}
          <div className="text-center p-2 bg-green-50 rounded-lg">
            <div className="flex justify-center">
              {[...Array(Math.min(5, word.currentStreak))].map((_, i) => (
                <div key={i} className="w-1 h-2 bg-green-500 rounded-full mx-0.5" />
              ))}
              {word.currentStreak > 5 && (
                <span className="text-xs text-green-600 ml-1">+{word.currentStreak - 5}</span>
              )}
            </div>
            <div className="text-xs text-green-600 mt-1">Streak</div>
          </div>

          {/* Speed indicator */}
          <div className="text-center p-2 bg-purple-50 rounded-lg">
            <div className="flex justify-center items-center h-2">
              <Clock className={`w-3 h-3 ${
                word.avgTime <= 10 ? 'text-green-500' : 
                word.avgTime <= 20 ? 'text-blue-500' : 
                word.avgTime <= 30 ? 'text-orange-500' : 'text-red-500'
              }`} />
            </div>
            <div className="text-xs text-purple-600 mt-1">Velocità</div>
          </div>
        </div>
      )}

      {/* ⭐ NEW: Click hint */}
      {isSelected ? (
        <div className="mt-3 text-center text-blue-600 text-sm font-medium">
          ↑ Clicca per nascondere dettagli
        </div>
      ) : (
        <div className="mt-3 text-center text-gray-500 text-sm">
          ↓ Clicca per vedere l'andamento temporale dettagliato
        </div>
      )}
    </div>
  );
};

export default WordPerformanceCard;