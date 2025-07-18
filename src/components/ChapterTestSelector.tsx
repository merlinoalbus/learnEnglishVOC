import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Play, BookOpen, CheckSquare, Square, Target, AlertTriangle, GraduationCap } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import { Word } from '../types';

// =====================================================
// 🎯 TYPE DEFINITIONS
// =====================================================

interface ChapterTestSelectorProps {
  words: Word[];
  onStartTest: (config: TestConfig) => void;
  onClose: () => void;
}

interface TestConfig {
  selectedChapters: string[];
  includeLearnedWords: boolean;
  testMode: 'normal' | 'difficult-only';
}

interface ChapterStats {
  totalWords: number;
  learnedWords: number;
  difficultWords: number;
  availableForTest: number;
}

// =====================================================
// 🧩 MAIN COMPONENT
// =====================================================

const ChapterTestSelector: React.FC<ChapterTestSelectorProps> = ({ words, onStartTest, onClose }) => {
  const [selectedChapters, setSelectedChapters] = useState<Set<string>>(new Set());
  const [includeLearnedWords, setIncludeLearnedWords] = useState<boolean>(false);
  const [testMode, setTestMode] = useState<'normal' | 'difficult-only'>('normal');
  
  const { showWarning } = useNotification();
  
  // Ottieni tutti i capitoli disponibili dalle parole
  const getAvailableChapters = (): string[] => {
    const chapters = new Set<string>();
    words.forEach(word => {
      if (word.chapter) {
        chapters.add(word.chapter);
      }
    });
    return Array.from(chapters).sort((a, b) => {
      const aNum = parseInt(a);
      const bNum = parseInt(b);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return aNum - bNum;
      }
      return a.localeCompare(b);
    });
  };

  const availableChapters = getAvailableChapters();
  const wordsWithoutChapter = words.filter(word => !word.chapter);

  // Calcola statistiche per ogni capitolo includendo parole difficili
  const getChapterStats = (chapter: string): ChapterStats => {
    const chapterWords = words.filter(word => word.chapter === chapter);
    const totalWords = chapterWords.length;
    const learnedWords = chapterWords.filter(word => word.learned).length;
    const difficultWords = chapterWords.filter(word => word.difficult).length;
    
    // Calcola parole disponibili in base al modo di test
    let availableForTest = 0;
    if (testMode === 'difficult-only') {
      // Solo parole difficili (indipendentemente da includeLearnedWords)
      availableForTest = difficultWords;
    } else {
      // Modo normale: considera includeLearnedWords
      if (includeLearnedWords) {
        availableForTest = totalWords;
      } else {
        availableForTest = chapterWords.filter(word => !word.learned).length;
      }
    }
    
    return {
      totalWords,
      learnedWords,
      difficultWords,
      availableForTest
    };
  };

  // Calcola statistiche per parole senza capitolo
  const getWordsWithoutChapterStats = (): ChapterStats => {
    const totalWords = wordsWithoutChapter.length;
    const learnedWords = wordsWithoutChapter.filter(word => word.learned).length;
    const difficultWords = wordsWithoutChapter.filter(word => word.difficult).length;
    
    let availableForTest = 0;
    if (testMode === 'difficult-only') {
      availableForTest = difficultWords;
    } else {
      if (includeLearnedWords) {
        availableForTest = totalWords;
      } else {
        availableForTest = wordsWithoutChapter.filter(word => !word.learned).length;
      }
    }
    
    return {
      totalWords,
      learnedWords,
      difficultWords,
      availableForTest
    };
  };

  const wordsWithoutChapterStats = getWordsWithoutChapterStats();

  // Toggle selezione capitolo
  const toggleChapterSelection = (chapter: string) => {
    const newSelection = new Set(selectedChapters);
    if (newSelection.has(chapter)) {
      newSelection.delete(chapter);
    } else {
      newSelection.add(chapter);
    }
    setSelectedChapters(newSelection);
  };

  // Seleziona tutti i capitoli
  const selectAllChapters = () => {
    const allChapters = new Set([...availableChapters]);
    if (wordsWithoutChapter.length > 0) {
      allChapters.add('no-chapter');
    }
    setSelectedChapters(allChapters);
  };

  // Deseleziona tutti i capitoli
  const deselectAllChapters = () => {
    setSelectedChapters(new Set());
  };

  // Calcola il totale delle parole selezionate
  const getTotalSelectedWords = (): number => {
    let total = 0;
    
    selectedChapters.forEach(chapter => {
      if (chapter === 'no-chapter') {
        total += wordsWithoutChapterStats.availableForTest;
      } else {
        total += getChapterStats(chapter).availableForTest;
      }
    });
    
    return total;
  };

  const totalSelectedWords = getTotalSelectedWords();

  // Gestisci avvio del test
  const handleStartTest = () => {
    if (selectedChapters.size === 0) {
      showWarning('⚠️ Seleziona almeno un capitolo per il test!');
      return;
    }

    if (totalSelectedWords === 0) {
      if (testMode === 'difficult-only') {
        showWarning('⚠️ Nessuna parola difficile trovata nei capitoli selezionati!');
      } else {
        showWarning('⚠️ Nessuna parola disponibile nei capitoli selezionati!');
      }
      return;
    }

    const config: TestConfig = {
      selectedChapters: Array.from(selectedChapters),
      includeLearnedWords,
      testMode
    };

    onStartTest(config);
  };

  // Auto-seleziona tutti i capitoli al primo caricamento
  useEffect(() => {
    if (availableChapters.length > 0) {
      selectAllChapters();
    }
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-2xl">
          <CardTitle className="text-2xl font-bold flex items-center gap-3">
            <Target className="w-8 h-8" />
            Seleziona Capitoli per il Test
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {/* Modalità Test */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              Modalità Test
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card 
                className={`cursor-pointer transition-all duration-300 ${
                  testMode === 'normal' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setTestMode('normal')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">Test Normale</p>
                      <p className="text-sm text-gray-600">Tutte le parole (escluse quelle apprese)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card 
                className={`cursor-pointer transition-all duration-300 ${
                  testMode === 'difficult-only' 
                    ? 'border-orange-500 bg-orange-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setTestMode('difficult-only')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="font-medium text-gray-900">Solo Difficili</p>
                      <p className="text-sm text-gray-600">Solo parole marcate come difficili</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Opzioni */}
          {testMode === 'normal' && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-800">Opzioni</h3>
              
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIncludeLearnedWords(!includeLearnedWords)}
                  className={`flex items-center gap-2 ${
                    includeLearnedWords 
                      ? 'bg-green-50 border-green-300 text-green-700' 
                      : 'bg-gray-50 border-gray-300 text-gray-700'
                  }`}
                >
                  {includeLearnedWords ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  Includi parole già apprese
                </Button>
              </div>
            </div>
          )}

          {/* Selezione Capitoli */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Capitoli Disponibili</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAllChapters}>
                  Seleziona Tutti
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAllChapters}>
                  Deseleziona Tutti
                </Button>
              </div>
            </div>

            {/* Lista Capitoli */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
              {availableChapters.map(chapter => {
                const stats = getChapterStats(chapter);
                const isSelected = selectedChapters.has(chapter);
                
                return (
                  <Card 
                    key={chapter}
                    className={`cursor-pointer transition-all duration-300 ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleChapterSelection(chapter)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isSelected ? <CheckSquare className="w-5 h-5 text-blue-600" /> : <Square className="w-5 h-5 text-gray-400" />}
                          <div>
                            <p className="font-medium text-gray-900">Capitolo {chapter}</p>
                            <p className="text-sm text-gray-600">
                              {stats.availableForTest} parole disponibili
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{stats.totalWords} totali</p>
                          {stats.difficultWords > 0 && (
                            <p className="text-xs text-orange-600">
                              {stats.difficultWords} difficili
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              
              {/* Parole senza capitolo */}
              {wordsWithoutChapter.length > 0 && (
                <Card 
                  className={`cursor-pointer transition-all duration-300 ${
                    selectedChapters.has('no-chapter') 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleChapterSelection('no-chapter')}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {selectedChapters.has('no-chapter') ? <CheckSquare className="w-5 h-5 text-blue-600" /> : <Square className="w-5 h-5 text-gray-400" />}
                        <div>
                          <p className="font-medium text-gray-900">Senza Capitolo</p>
                          <p className="text-sm text-gray-600">
                            {wordsWithoutChapterStats.availableForTest} parole disponibili
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{wordsWithoutChapterStats.totalWords} totali</p>
                        {wordsWithoutChapterStats.difficultWords > 0 && (
                          <p className="text-xs text-orange-600">
                            {wordsWithoutChapterStats.difficultWords} difficili
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Riepilogo */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Parole selezionate per il test</p>
                <p className="text-2xl font-bold text-blue-600">{totalSelectedWords}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Capitoli selezionati</p>
                <p className="text-2xl font-bold text-purple-600">{selectedChapters.size}</p>
              </div>
            </div>
          </div>

          {/* Pulsanti */}
          <div className="flex gap-4 pt-4">
            <Button
              onClick={handleStartTest}
              disabled={selectedChapters.size === 0 || totalSelectedWords === 0}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 text-lg font-semibold rounded-xl transition-all duration-300 transform hover:scale-105"
            >
              <Play className="w-5 h-5 mr-2" />
              Inizia Test ({totalSelectedWords} parole)
            </Button>
            
            <Button
              variant="outline"
              onClick={onClose}
              className="px-6 py-3 text-gray-700 border-gray-300 hover:bg-gray-50 rounded-xl transition-all duration-300"
            >
              Annulla
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChapterTestSelector;