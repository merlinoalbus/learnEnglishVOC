import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Play, BookOpen, CheckSquare, Square, Target } from 'lucide-react';

const ChapterTestSelector = ({ words, onStartTest, onClose, showNotification }) => {
  const [selectedChapters, setSelectedChapters] = useState(new Set());
  const [includeLearnedWords, setIncludeLearnedWords] = useState(false);
  
  // Ottieni tutti i capitoli disponibili dalle parole
  const getAvailableChapters = () => {
    const chapters = new Set();
    words.forEach(word => {
      if (word.chapter) {
        chapters.add(word.chapter);
      }
    });
    return Array.from(chapters).sort((a, b) => {
      // Ordina numericamente se sono numeri, altrimenti alfabeticamente
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

  // Calcola statistiche per ogni capitolo
  const getChapterStats = (chapter) => {
    const chapterWords = words.filter(word => word.chapter === chapter);
    const totalWords = chapterWords.length;
    const learnedWords = chapterWords.filter(word => word.learned).length;
    const availableForTest = chapterWords.filter(word => includeLearnedWords || !word.learned).length;
    
    return { totalWords, learnedWords, availableForTest };
  };

  const getWordsWithoutChapterStats = () => {
    const totalWords = wordsWithoutChapter.length;
    const learnedWords = wordsWithoutChapter.filter(word => word.learned).length;
    const availableForTest = wordsWithoutChapter.filter(word => includeLearnedWords || !word.learned).length;
    
    return { totalWords, learnedWords, availableForTest };
  };

  // Gestione selezione capitoli
  const toggleChapter = (chapter) => {
    const newSelected = new Set(selectedChapters);
    if (newSelected.has(chapter)) {
      newSelected.delete(chapter);
    } else {
      newSelected.add(chapter);
    }
    setSelectedChapters(newSelected);
  };

  const selectAllChapters = () => {
    const allOptions = [...availableChapters];
    if (wordsWithoutChapter.length > 0) {
      allOptions.push('SENZA_CAPITOLO');
    }
    setSelectedChapters(new Set(allOptions));
  };

  const clearSelection = () => {
    setSelectedChapters(new Set());
  };

  // Calcola il totale delle parole selezionate
  const getTotalSelectedWords = () => {
    let total = 0;
    
    selectedChapters.forEach(chapter => {
      if (chapter === 'SENZA_CAPITOLO') {
        total += getWordsWithoutChapterStats().availableForTest;
      } else {
        total += getChapterStats(chapter).availableForTest;
      }
    });
    
    return total;
  };

  const handleStartTest = () => {
    const totalWords = getTotalSelectedWords();
    
    if (totalWords === 0) {
      showNotification?.('⚠️ Seleziona almeno un capitolo con parole disponibili!');
      return;
    }

    // Filtra le parole in base ai capitoli selezionati
    const filteredWords = words.filter(word => {
      // Filtra per stato appreso
      if (!includeLearnedWords && word.learned) {
        return false;
      }
      
      // Filtra per capitolo
      if (word.chapter) {
        return selectedChapters.has(word.chapter);
      } else {
        return selectedChapters.has('SENZA_CAPITOLO');
      }
    });

    if (filteredWords.length === 0) {
      showNotification?.('⚠️ Nessuna parola disponibile per i capitoli selezionati!');
      return;
    }

    onStartTest(filteredWords);
    onClose();
  };

  // Seleziona tutti i capitoli all'apertura se non ce ne sono già selezionati
  useEffect(() => {
    if (selectedChapters.size === 0) {
      const allOptions = [...availableChapters];
      if (wordsWithoutChapter.length > 0) {
        allOptions.push('SENZA_CAPITOLO');
      }
      setSelectedChapters(new Set(allOptions));
    }
  }, [availableChapters, wordsWithoutChapter.length, selectedChapters.size]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center p-4">
        <Card className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <BookOpen className="w-8 h-8" />
              Seleziona Capitoli per il Test
            </CardTitle>
            <p className="text-blue-100 mt-2">
              Scegli quali capitoli includere nel test e se includere le parole già apprese
            </p>
          </CardHeader>
          
          <CardContent className="p-6 space-y-6">
            {/* Opzioni globali */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-2xl border-2 border-indigo-200">
              <h3 className="font-bold text-indigo-800 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Opzioni Test
              </h3>
              
              <div className="flex items-center gap-4 mb-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div 
                    onClick={() => setIncludeLearnedWords(!includeLearnedWords)}
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                      includeLearnedWords 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {includeLearnedWords && <span className="text-sm">✓</span>}
                  </div>
                  <span className="text-gray-700 font-medium">
                    Includi parole già apprese nel test
                  </span>
                </label>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  onClick={selectAllChapters}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                >
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Seleziona Tutti
                </Button>
                <Button 
                  onClick={clearSelection}
                  variant="outline"
                  className="border-gray-300"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Deseleziona Tutti
                </Button>
              </div>
            </div>

            {/* Lista Capitoli */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <h3 className="font-bold text-gray-800 text-lg">Capitoli Disponibili:</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableChapters.map(chapter => {
                  const stats = getChapterStats(chapter);
                  const isSelected = selectedChapters.has(chapter);
                  
                  return (
                    <div
                      key={chapter}
                      onClick={() => toggleChapter(chapter)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50 shadow-lg' 
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                            isSelected 
                              ? 'bg-blue-500 border-blue-500 text-white' 
                              : 'border-gray-300 bg-white'
                          }`}>
                            {isSelected && <span className="text-sm">✓</span>}
                          </div>
                          <span className="font-bold text-lg">📖 Capitolo {chapter}</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="text-center p-2 bg-blue-100 rounded-xl">
                          <div className="font-bold text-blue-600">{stats.totalWords}</div>
                          <div className="text-blue-700 text-xs">Totale</div>
                        </div>
                        <div className="text-center p-2 bg-green-100 rounded-xl">
                          <div className="font-bold text-green-600">{stats.learnedWords}</div>
                          <div className="text-green-700 text-xs">Apprese</div>
                        </div>
                        <div className="text-center p-2 bg-orange-100 rounded-xl">
                          <div className="font-bold text-orange-600">{stats.availableForTest}</div>
                          <div className="text-orange-700 text-xs">Per Test</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Parole senza capitolo */}
                {wordsWithoutChapter.length > 0 && (
                  <div
                    onClick={() => toggleChapter('SENZA_CAPITOLO')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                      selectedChapters.has('SENZA_CAPITOLO')
                        ? 'border-purple-500 bg-purple-50 shadow-lg' 
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                          selectedChapters.has('SENZA_CAPITOLO')
                            ? 'bg-purple-500 border-purple-500 text-white' 
                            : 'border-gray-300 bg-white'
                        }`}>
                          {selectedChapters.has('SENZA_CAPITOLO') && <span className="text-sm">✓</span>}
                        </div>
                        <span className="font-bold text-lg">📋 Senza Capitolo</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-center p-2 bg-blue-100 rounded-xl">
                        <div className="font-bold text-blue-600">{getWordsWithoutChapterStats().totalWords}</div>
                        <div className="text-blue-700 text-xs">Totale</div>
                      </div>
                      <div className="text-center p-2 bg-green-100 rounded-xl">
                        <div className="font-bold text-green-600">{getWordsWithoutChapterStats().learnedWords}</div>
                        <div className="text-green-700 text-xs">Apprese</div>
                      </div>
                      <div className="text-center p-2 bg-orange-100 rounded-xl">
                        <div className="font-bold text-orange-600">{getWordsWithoutChapterStats().availableForTest}</div>
                        <div className="text-orange-700 text-xs">Per Test</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Riepilogo e azioni */}
            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <div className="text-lg font-bold text-gray-800">
                  Parole selezionate per il test: 
                  <span className="text-2xl text-blue-600 ml-2">{getTotalSelectedWords()}</span>
                </div>
              </div>
              
              <div className="flex justify-end gap-4">
                <Button 
                  onClick={onClose}
                  variant="outline"
                  className="px-8 py-3 text-lg"
                >
                  Annulla
                </Button>
                <Button 
                  onClick={handleStartTest}
                  disabled={getTotalSelectedWords() === 0}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-3 text-lg shadow-xl disabled:opacity-50"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Inizia Test ({getTotalSelectedWords()} parole)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChapterTestSelector;