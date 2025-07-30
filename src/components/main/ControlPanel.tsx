// =====================================================
// 📁 src/components/main/ControlPanel.tsx - TypeScript Migration
// =====================================================

import React from 'react';
import { Card, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Play, BookOpen, AlertTriangle } from 'lucide-react';
import { Word, WordStats } from '../../types/entities/Word.types';

// =====================================================
// 🔧 TYPES & INTERFACES
// =====================================================

interface ControlPanelProps {
  onStartTest: () => void;
  words: Word[];
  wordStats: WordStats;
  getAvailableChapters: () => string[];
}

// =====================================================
// 🎯 MAIN COMPONENT
// =====================================================

export const ControlPanel: React.FC<ControlPanelProps> = React.memo(({ 
  onStartTest, 
  words, 
  wordStats,
  getAvailableChapters
}) => {
  const availableWords = words.filter(word => !word.learned);
  const chapters = getAvailableChapters();
  
  return (
    <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border-0 shadow-2xl rounded-3xl overflow-hidden">
      <div className="control-panel-container">
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6">
          <CardTitle className="control-panel-title">
            <Play className="w-6 h-6 text-blue-600" />
            Controlli di Studio
          </CardTitle>
          
          {/* ⭐ ENHANCED: Statistiche con parole difficili */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-2xl border border-blue-200 dark:border-blue-700">
              <div className="text-2xl font-bold text-blue-600">{wordStats.total}</div>
              <div className="text-blue-700 dark:text-blue-300 text-sm">Totale Parole</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/30 rounded-2xl border border-green-200 dark:border-green-700">
              <div className="text-2xl font-bold text-green-600">{wordStats.learned}</div>
              <div className="text-green-700 dark:text-green-300 text-sm">Apprese</div>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/30 rounded-2xl border border-orange-200 dark:border-orange-700">
              <div className="text-2xl font-bold text-orange-600">{wordStats.unlearned}</div>
              <div className="text-orange-700 dark:text-orange-300 text-sm">Da Studiare</div>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/30 rounded-2xl border border-red-200 dark:border-red-700">
              <div className="text-2xl font-bold text-red-600">{wordStats.difficult}</div>
              <div className="text-red-700 dark:text-red-300 text-sm">⭐ Difficili</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/30 rounded-2xl border border-purple-200 dark:border-purple-700">
              <div className="text-2xl font-bold text-purple-600">{chapters.length}</div>
              <div className="text-purple-700 dark:text-purple-300 text-sm">Capitoli</div>
            </div>
          </div>

          {/* ⭐ NEW: Info box per parole difficili */}
          {wordStats.difficult > 0 && (
            <div className="control-panel-alert">
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <h4 className="font-bold text-red-800 dark:text-red-200">Parole Difficili Disponibili</h4>
              </div>
              <p className="text-red-700 dark:text-red-300 text-sm">
                Hai {wordStats.difficult} parole marcate come difficili. 
                Usa la modalità "Solo Parole Difficili" per concentrarti su di esse!
              </p>
            </div>
          )}
          
          <div className="flex justify-center">
            <Button 
              onClick={onStartTest} 
              disabled={availableWords.length === 0}
              variant="outline"
              className="control-panel-start-button"
            >
              <div className="flex flex-col items-center gap-2 text-blue-600 dark:text-blue-400">
                <BookOpen className="w-8 h-8" />
                <span className="font-bold">Inizia Test</span>
                <span className="text-sm opacity-90">
                  ({availableWords.length} disponibili
                  {wordStats.difficult > 0 && `, ${wordStats.difficult} difficili`})
                </span>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
});

ControlPanel.displayName = 'ControlPanel';