import React from 'react';
import { Card, CardContent, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Play, RefreshCw, BookOpen, AlertTriangle } from 'lucide-react';

export const ControlPanel = React.memo(({ 
  onStartTest, 
  onClearAllWords, 
  words, 
  wordStats,
  getAvailableChapters, 
  getChapterStats 
}) => {
  const availableWords = words.filter(word => !word.learned);
  const chapters = getAvailableChapters();
  
  return (
    <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-2xl rounded-3xl overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-1">
        <div className="bg-white rounded-3xl p-6">
          <CardTitle className="flex items-center gap-3 text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            <Play className="w-6 h-6 text-blue-600" />
            Controlli di Studio
          </CardTitle>
          
          {/* ⭐ ENHANCED: Statistiche con parole difficili */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-2xl border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{wordStats.total}</div>
              <div className="text-blue-700 text-sm">Totale Parole</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-2xl border border-green-200">
              <div className="text-2xl font-bold text-green-600">{wordStats.learned}</div>
              <div className="text-green-700 text-sm">Apprese</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-2xl border border-orange-200">
              <div className="text-2xl font-bold text-orange-600">{wordStats.unlearned}</div>
              <div className="text-orange-700 text-sm">Da Studiare</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-2xl border border-red-200">
              <div className="text-2xl font-bold text-red-600">{wordStats.difficult}</div>
              <div className="text-red-700 text-sm">⭐ Difficili</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-2xl border border-purple-200">
              <div className="text-2xl font-bold text-purple-600">{chapters.length}</div>
              <div className="text-purple-700 text-sm">Capitoli</div>
            </div>
          </div>

          {/* ⭐ NEW: Info box per parole difficili */}
          {wordStats.difficult > 0 && (
            <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl">
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <h4 className="font-bold text-red-800">Parole Difficili Disponibili</h4>
              </div>
              <p className="text-red-700 text-sm">
                Hai {wordStats.difficult} parole marcate come difficili. 
                Usa la modalità "Solo Parole Difficili" per concentrarti su di esse!
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={onStartTest} 
              disabled={availableWords.length === 0}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white p-6 h-auto rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <div className="flex flex-col items-center gap-2">
                <BookOpen className="w-8 h-8" />
                <span className="font-bold">Inizia Test</span>
                <span className="text-sm opacity-90">
                  ({availableWords.length} disponibili
                  {wordStats.difficult > 0 && `, ${wordStats.difficult} difficili`})
                </span>
              </div>
            </Button>

            <Button 
              onClick={onClearAllWords} 
              variant="outline" 
              disabled={words.length === 0}
              className="border-2 border-red-300 hover:border-red-400 p-6 h-auto rounded-2xl bg-red-50 hover:bg-red-100 transition-all duration-200 disabled:opacity-50"
            >
              <div className="flex flex-col items-center gap-2 text-red-600">
                <RefreshCw className="w-8 h-8" />
                <span className="font-bold">Pulisci Vocabolario</span>
                <span className="text-sm">Elimina tutte le parole</span>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
});
