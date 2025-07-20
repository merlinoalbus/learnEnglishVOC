import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { 
  Play, 
  BookOpen, 
  CheckSquare, 
  Square, 
  Target, 
  AlertTriangle, 
  GraduationCap,
  Clock,
  HelpCircle,
  Settings,
  Zap,
  Timer,
  X,
  Check,
  Star,
  Sparkles
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import { Word } from '../types';

// =====================================================
// 🎯 TYPE DEFINITIONS
// =====================================================

interface TestSelectorProps {
  words: Word[];
  onStartTest: (config: TestConfig) => void;
  onClose: () => void;
}

interface TestConfig {
  selectedChapters: string[];
  includeLearnedWords: boolean;
  testMode: 'normal' | 'difficult-only';
  maxTimePerWord?: number;
  maxHintsPerWord?: number;
  maxTotalHints?: number;
  enableTimer: boolean;
  enableHints: boolean;
  enableTotalHintsLimit?: boolean;
  hintsMode?: 'disabled' | 'unlimited' | 'limited';
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

const TestSelector: React.FC<TestSelectorProps> = ({ words, onStartTest, onClose }) => {
  const [selectedChapters, setSelectedChapters] = useState<Set<string>>(new Set());
  const [includeLearnedWords, setIncludeLearnedWords] = useState<boolean>(false);
  const [testMode, setTestMode] = useState<'normal' | 'difficult-only'>('normal');
  
  // Nuove funzionalità
  const [enableTimer, setEnableTimer] = useState<boolean>(false);
  const [maxTimePerWord, setMaxTimePerWord] = useState<number>(30);
  const [hintsMode, setHintsMode] = useState<'disabled' | 'unlimited' | 'limited'>('limited');
  const [maxHintsPerWord, setMaxHintsPerWord] = useState<number>(2);
  const [maxTotalHints, setMaxTotalHints] = useState<number>(10);
  const [enableTotalHintsLimit, setEnableTotalHintsLimit] = useState<boolean>(false);
  const [showOptions, setShowOptions] = useState<boolean>(false);
  
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
    
    let availableForTest = 0;
    if (testMode === 'difficult-only') {
      availableForTest = difficultWords;
    } else {
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
  
  // Calcola la difficoltà del test basata sulla selezione di parole
  const calculateTestDifficulty = (): { level: string; percentage: number; description: string } => {
    let totalSelectedWords = 0;
    let difficultWordsSelected = 0;
    let learnedWordsSelected = 0;
    
    selectedChapters.forEach(chapter => {
      const stats = chapter === 'no-chapter' ? getWordsWithoutChapterStats() : getChapterStats(chapter);
      totalSelectedWords += stats.availableForTest;
      difficultWordsSelected += stats.difficultWords;
      learnedWordsSelected += stats.learnedWords;
    });
    
    if (totalSelectedWords === 0) {
      return { level: 'Nessuna', percentage: 0, description: 'Nessuna parola selezionata' };
    }
    
    // Calcola la difficoltà basata su vari fattori
    let difficultyScore = 0;
    
    // Fattore 1: Percentuale di parole difficili (peso: 40%)
    const difficultPercentage = (difficultWordsSelected / totalSelectedWords) * 100;
    difficultyScore += (difficultPercentage / 100) * 40;
    
    // Fattore 2: Modalità test (peso: 30%)
    if (testMode === 'difficult-only') {
      difficultyScore += 30;
    } else if (!includeLearnedWords) {
      difficultyScore += 15; // Solo parole non apprese
    }
    
    // Fattore 3: Configurazione timer (peso: 15%)
    if (enableTimer) {
      const timeScore = Math.max(0, (60 - maxTimePerWord) / 60) * 15;
      difficultyScore += timeScore;
    }
    
    // Fattore 4: Limitazioni aiuti (peso: 15%)
    if (hintsMode === 'disabled') {
      difficultyScore += 15;
    } else if (hintsMode === 'limited') {
      const hintScore = Math.max(0, (3 - maxHintsPerWord) / 3) * 15;
      difficultyScore += hintScore;
    }
    
    // Determina il livello di difficoltà
    let level: string;
    let description: string;
    
    if (difficultyScore >= 80) {
      level = 'Estrema';
      description = 'Test molto impegnativo per esperti';
    } else if (difficultyScore >= 65) {
      level = 'Difficile';
      description = 'Test impegnativo con sfide significative';
    } else if (difficultyScore >= 45) {
      level = 'Intermedia';
      description = 'Test di livello medio, ben bilanciato';
    } else if (difficultyScore >= 25) {
      level = 'Facile';
      description = 'Test accessibile per principianti';
    } else {
      level = 'Molto Facile';
      description = 'Test di pratica con massimo supporto';
    }
    
    return {
      level,
      percentage: Math.round(difficultyScore),
      description
    };
  };
  
  const testDifficulty = calculateTestDifficulty();

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
      testMode,
      enableTimer,
      maxTimePerWord: enableTimer ? maxTimePerWord : undefined,
      enableHints: hintsMode !== 'disabled',
      hintsMode,
      maxHintsPerWord: hintsMode === 'limited' ? maxHintsPerWord : undefined,
      maxTotalHints: hintsMode === 'limited' && enableTotalHintsLimit ? maxTotalHints : undefined,
      enableTotalHintsLimit: hintsMode === 'limited' ? enableTotalHintsLimit : false
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
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(229, 231, 235, 0.5);
            border-radius: 10px;
            margin: 4px 0;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, #60a5fa 0%, #818cf8 100%);
            border-radius: 10px;
            box-shadow: inset 0 0 3px rgba(0, 0, 0, 0.1);
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(180deg, #3b82f6 0%, #6366f1 100%);
            box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2);
          }
          
          .dark .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(55, 65, 81, 0.5);
          }
          
          .dark .custom-scrollbar::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, #3b82f6 0%, #6366f1 100%);
          }
          
          .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(180deg, #60a5fa 0%, #818cf8 100%);
          }
        `
      }} />
    <div className="fixed inset-0 bg-gradient-to-br from-black/60 via-purple-900/30 to-blue-900/40 dark:from-black/80 dark:via-purple-950/50 dark:to-blue-950/60 flex items-center justify-center p-4 z-50 backdrop-blur-lg animate-fade-in">
      <Card className="w-full max-w-7xl h-[90vh] overflow-hidden bg-gradient-to-br from-white/95 via-blue-50/90 to-purple-50/95 dark:from-gray-900/95 dark:via-blue-950/90 dark:to-purple-950/95 backdrop-blur-xl border-2 border-white/20 dark:border-gray-700/30 rounded-3xl shadow-2xl animate-slide-up">
        {/* Header con gradiente avanzato */}
        <CardHeader className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-700 dark:via-purple-700 dark:to-pink-700 text-white rounded-t-3xl p-6 relative overflow-hidden">
          {/* Effetto sparkle */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
          <div className="relative flex items-center justify-between">
            <CardTitle className="text-2xl font-bold flex items-center gap-3 drop-shadow-lg">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <Target className="w-6 h-6" />
              </div>
              <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                Configurazione Test
              </span>
              <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-3 backdrop-blur-sm transition-all duration-300 hover:scale-110"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        
        <div className="h-[calc(90vh-100px)] max-h-[calc(90vh-100px)] flex flex-col overflow-hidden">
          <CardContent className="p-6 h-full flex flex-col">
            {/* Layout principale con gradients */}
            <div className="flex-1 grid grid-cols-3 gap-8 h-full max-h-full overflow-hidden">
              
              {/* Colonna 1: Modalità e Opzioni - Design elegante */}
              <div className="flex flex-col h-full overflow-hidden">
                {/* Container con altezza che corrisponde alla sezione capitoli */}
                <div className="bg-gradient-to-br from-white/70 to-gray-50/70 dark:from-gray-800/70 dark:to-gray-900/70 backdrop-blur-sm rounded-2xl p-5 border border-white/30 dark:border-gray-700/30 shadow-lg h-full flex flex-col overflow-hidden">
                  <div className="space-y-6 flex-1 overflow-y-auto pr-3 custom-scrollbar"
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: 'rgb(147 197 253) rgb(243 244 246)'
                    }}>
                {/* Modalità Test con design premium */}
                <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/30 dark:to-indigo-900/30 backdrop-blur-sm rounded-xl p-4 border border-blue-200/30 dark:border-blue-700/30">
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg shadow-md">
                      <GraduationCap className="w-4 h-4 text-white" />
                    </div>
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Modalità Test
                    </span>
                  </h3>
                  
                  <div className="space-y-3">
                    <button
                      onClick={() => setTestMode('normal')}
                      className={`group w-full p-4 rounded-xl border-2 transition-all duration-300 text-left transform hover:scale-[1.02] ${
                        testMode === 'normal'
                          ? 'border-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/40 dark:to-indigo-900/40 text-blue-700 dark:text-blue-300 shadow-lg shadow-blue-200/50 dark:shadow-blue-900/30'
                          : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-400 text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-800/50 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg transition-all duration-300 ${
                          testMode === 'normal' 
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-lg' 
                            : 'bg-gray-200 dark:bg-gray-600 group-hover:bg-blue-100 dark:group-hover:bg-blue-800'
                        }`}>
                          <BookOpen className={`w-4 h-4 ${testMode === 'normal' ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`} />
                        </div>
                        <div className="flex-1">
                          <span className="font-semibold">Test Normale</span>
                          {testMode === 'normal' && <Check className="w-4 h-4 ml-auto inline-block text-blue-600" />}
                        </div>
                      </div>
                      <p className="text-xs mt-2 opacity-80 ml-11">Tutte le parole disponibili per un test completo</p>
                    </button>
                    
                    <button
                      onClick={() => setTestMode('difficult-only')}
                      className={`group w-full p-4 rounded-xl border-2 transition-all duration-300 text-left transform hover:scale-[1.02] ${
                        testMode === 'difficult-only'
                          ? 'border-orange-400 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/40 dark:to-red-900/40 text-orange-700 dark:text-orange-300 shadow-lg shadow-orange-200/50 dark:shadow-orange-900/30'
                          : 'border-gray-200 dark:border-gray-600 hover:border-orange-300 dark:hover:border-orange-400 text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-800/50 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg transition-all duration-300 ${
                          testMode === 'difficult-only' 
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 shadow-lg' 
                            : 'bg-gray-200 dark:bg-gray-600 group-hover:bg-orange-100 dark:group-hover:bg-orange-800'
                        }`}>
                          <AlertTriangle className={`w-4 h-4 ${testMode === 'difficult-only' ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`} />
                        </div>
                        <div className="flex-1">
                          <span className="font-semibold">Solo Difficili</span>
                          {testMode === 'difficult-only' && <Check className="w-4 h-4 ml-auto inline-block text-orange-600" />}
                        </div>
                      </div>
                      <p className="text-xs mt-2 opacity-80 ml-11">Focus sulle parole che necessitano più pratica</p>
                    </button>
                  </div>
                </div>

                {/* Opzioni (sempre visibili ma collassabili) */}
                <div className="bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-900/30 dark:to-emerald-900/30 backdrop-blur-sm rounded-xl p-4 border border-green-200/30 dark:border-green-700/30 flex flex-col min-h-0">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg shadow-md">
                        <Settings className="w-4 h-4 text-white" />
                      </div>
                      <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        Opzioni
                      </span>
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowOptions(!showOptions)}
                      className="h-8 px-3 text-xs font-medium bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-700/80 rounded-lg transition-all duration-300"
                    >
                      {showOptions ? 'Nascondi' : 'Mostra'}
                    </Button>
                  </div>

                  {showOptions && (
                    <div className="space-y-4 animate-slide-down">
                      {/* Opzione parole apprese - solo per modalità normale */}
                      {testMode === 'normal' && (
                        <button
                          onClick={() => setIncludeLearnedWords(!includeLearnedWords)}
                          className={`group w-full p-4 rounded-xl border-2 transition-all duration-300 text-left transform hover:scale-[1.02] ${
                            includeLearnedWords 
                              ? 'border-green-400 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/40 dark:to-emerald-900/40 text-green-700 dark:text-green-300 shadow-lg shadow-green-200/50 dark:shadow-green-900/30' 
                              : 'border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-400 text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-800/50 hover:shadow-md'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg transition-all duration-300 ${
                              includeLearnedWords 
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg' 
                                : 'bg-gray-200 dark:bg-gray-600 group-hover:bg-green-100 dark:group-hover:bg-green-800'
                            }`}>
                              {includeLearnedWords ? 
                                <CheckSquare className="w-4 h-4 text-white" /> : 
                                <Square className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                              }
                            </div>
                            <span className="font-semibold">Includi parole apprese</span>
                          </div>
                          <p className="text-xs mt-2 opacity-80 ml-11">Ripassa anche le parole che già conosci</p>
                        </button>
                      )}

                      {/* Sezione Impostazioni Avanzate */}
                      <div className="border-t border-green-200/30 dark:border-green-700/30 pt-4">
                        <div className="mb-3">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <div className="p-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-md">
                              <Sparkles className="w-3 h-3 text-white" />
                            </div>
                            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                              Avanzate
                            </span>
                          </h4>
                        </div>

                        <div className="space-y-3">
                            {/* Timer con design elegante */}
                            <div className="p-3 bg-gradient-to-r from-blue-100/80 to-cyan-100/80 dark:from-blue-900/40 dark:to-cyan-900/40 rounded-lg border border-blue-200/50 dark:border-blue-700/50 shadow-inner">
                              <button
                                onClick={() => setEnableTimer(!enableTimer)}
                                className="w-full flex items-center gap-2 text-left group"
                              >
                                <div className={`p-1.5 rounded-lg transition-all duration-300 ${
                                  enableTimer 
                                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg' 
                                    : 'bg-blue-200 dark:bg-blue-800 group-hover:bg-blue-300 dark:group-hover:bg-blue-700'
                                }`}>
                                  {enableTimer ? 
                                    <CheckSquare className="w-3 h-3 text-white" /> : 
                                    <Square className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                  }
                                </div>
                                <Clock className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                <span className="font-medium text-sm text-blue-800 dark:text-blue-200">
                                  Timer: {maxTimePerWord}s
                                </span>
                              </button>
                              
                              {enableTimer && (
                                <div className="mt-2 animate-slide-down">
                                  <input
                                    type="range"
                                    min="10"
                                    max="120"
                                    step="10"
                                    value={maxTimePerWord}
                                    onChange={(e) => setMaxTimePerWord(parseInt(e.target.value))}
                                    className="w-full h-1.5 bg-gradient-to-r from-blue-200 to-cyan-200 dark:from-blue-700 dark:to-cyan-700 rounded-lg appearance-none cursor-pointer slider"
                                  />
                                  <div className="flex justify-between text-xs text-blue-600 dark:text-blue-400 mt-1">
                                    <span>10s</span>
                                    <span>60s</span>
                                    <span>120s</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Aiuti con design elegante */}
                            <div className="p-3 bg-gradient-to-r from-green-100/80 to-emerald-100/80 dark:from-green-900/40 dark:to-emerald-900/40 rounded-lg border border-green-200/50 dark:border-green-700/50 shadow-inner">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                                  <div className="p-1.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg shadow-md">
                                    <HelpCircle className="w-3 h-3 text-white" />
                                  </div>
                                  <span className="font-medium text-sm">Suggerimenti</span>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-1.5">
                                  {[
                                    { mode: 'disabled', label: 'Nessuno', color: 'red' },
                                    { mode: 'unlimited', label: 'Illimitati', color: 'blue' },
                                    { mode: 'limited', label: 'Limitati', color: 'green' }
                                  ].map(({ mode, label, color }) => (
                                    <button
                                      key={mode}
                                      onClick={() => setHintsMode(mode as any)}
                                      className={`px-2 py-1.5 text-xs font-medium rounded-md transition-all duration-300 transform hover:scale-105 ${
                                        hintsMode === mode
                                          ? `bg-gradient-to-r from-${color}-500 to-${color}-600 text-white shadow-lg shadow-${color}-200/50 dark:shadow-${color}-900/30`
                                          : 'bg-white/70 dark:bg-gray-800/70 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 border border-gray-200/50 dark:border-gray-600/50'
                                      }`}
                                    >
                                      {label}
                                    </button>
                                  ))}
                                </div>

                                {hintsMode === 'limited' && (
                                  <div className="space-y-1.5 animate-slide-down">
                                    <div className="text-xs text-green-700 dark:text-green-300 font-medium">
                                      Max per parola: {maxHintsPerWord}
                                    </div>
                                    <input
                                      type="range"
                                      min="1"
                                      max="3"
                                      step="1"
                                      value={maxHintsPerWord}
                                      onChange={(e) => setMaxHintsPerWord(parseInt(e.target.value))}
                                      className="w-full h-1.5 bg-gradient-to-r from-green-200 to-emerald-200 dark:from-green-700 dark:to-emerald-700 rounded-lg appearance-none cursor-pointer"
                                    />
                                    
                                    {/* Limite totale aiuti per test */}
                                    <div className="pt-2 border-t border-green-200/30">
                                      <button
                                        onClick={() => setEnableTotalHintsLimit(!enableTotalHintsLimit)}
                                        className="w-full flex items-center gap-2 text-left group mb-2"
                                      >
                                        <div className={`p-1 rounded transition-all duration-300 ${
                                          enableTotalHintsLimit 
                                            ? 'bg-green-500 text-white' 
                                            : 'bg-green-200 dark:bg-green-800 text-green-600 dark:text-green-400'
                                        }`}>
                                          {enableTotalHintsLimit ? 
                                            <CheckSquare className="w-2.5 h-2.5" /> : 
                                            <Square className="w-2.5 h-2.5" />
                                          }
                                        </div>
                                        <span className="text-xs font-medium text-green-700 dark:text-green-300">
                                          Limite totale: {maxTotalHints}
                                        </span>
                                      </button>
                                      
                                      {enableTotalHintsLimit && (
                                        <input
                                          type="range"
                                          min="5"
                                          max="20"
                                          step="1"
                                          value={maxTotalHints}
                                          onChange={(e) => setMaxTotalHints(parseInt(e.target.value))}
                                          className="w-full h-1 bg-gradient-to-r from-green-200 to-emerald-200 dark:from-green-700 dark:to-emerald-700 rounded-lg appearance-none cursor-pointer"
                                        />
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                        </div>
                      </div>
                    </div>
                  )}
                </div>
                  </div>
                </div>
              </div>

              {/* Colonna 2-3: Selezione Capitoli con design premium */}
              <div className="col-span-2">
                <div className="h-full flex flex-col bg-gradient-to-br from-white/70 to-indigo-50/70 dark:from-gray-800/70 dark:to-indigo-900/70 backdrop-blur-sm rounded-2xl p-6 border border-white/30 dark:border-gray-700/30 shadow-lg max-h-full overflow-hidden" id="chapters-section">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl shadow-lg">
                        <BookOpen className="w-5 h-5 text-white" />
                      </div>
                      <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        Capitoli ({selectedChapters.size} selezionati)
                      </span>
                    </h3>
                    <div className="flex gap-3">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={selectAllChapters}
                        className="h-8 px-4 text-sm font-medium bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 rounded-lg shadow-md transition-all duration-300 hover:scale-105"
                      >
                        Tutti
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={deselectAllChapters}
                        className="h-8 px-4 text-sm font-medium bg-white/70 dark:bg-gray-800/70 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 rounded-lg border border-gray-200/50 dark:border-gray-600/50 transition-all duration-300"
                      >
                        Nessuno
                      </Button>
                    </div>
                  </div>

                  {/* Grid Capitoli con design elegante */}
                  <div className="flex-1 grid grid-cols-4 gap-3 content-start overflow-y-auto min-h-0">
                    {availableChapters.map(chapter => {
                      const stats = getChapterStats(chapter);
                      const isSelected = selectedChapters.has(chapter);
                      
                      return (
                        <button
                          key={chapter}
                          onClick={() => toggleChapterSelection(chapter)}
                          className={`group relative p-4 rounded-xl border-2 transition-all duration-300 text-left transform hover:scale-[1.02] hover:-translate-y-1 ${
                            isSelected 
                              ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 text-blue-700 dark:text-blue-300 shadow-lg shadow-blue-200/30 dark:shadow-blue-900/20' 
                              : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-400 text-gray-700 dark:text-gray-300 bg-white/60 dark:bg-gray-800/60 hover:bg-white/80 dark:hover:bg-gray-700/80 hover:shadow-md'
                          }`}
                        >
                          {/* Badge selezionato */}
                          {isSelected && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`p-1.5 rounded-lg transition-all duration-300 ${
                              isSelected 
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-md' 
                                : 'bg-gray-200 dark:bg-gray-600 group-hover:bg-blue-100 dark:group-hover:bg-blue-800'
                            }`}>
                              {isSelected ? 
                                <CheckSquare className="w-3 h-3 text-white" /> : 
                                <Square className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                              }
                            </div>
                            <span className="font-bold text-sm">Cap. {chapter}</span>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="text-xs font-medium">
                              {stats.availableForTest} disponibili
                            </div>
                            <div className="flex items-center gap-2 text-xs opacity-75">
                              <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                                {stats.totalWords} tot
                              </span>
                              {stats.difficultWords > 0 && (
                                <span className="bg-gradient-to-r from-orange-400 to-red-400 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Star className="w-2 h-2" />
                                  {stats.difficultWords}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                    
                    {/* Parole senza capitolo con design speciale */}
                    {wordsWithoutChapter.length > 0 && (
                      <button
                        onClick={() => toggleChapterSelection('no-chapter')}
                        className={`group relative p-4 rounded-xl border-2 transition-all duration-300 text-left transform hover:scale-[1.02] hover:-translate-y-1 ${
                          selectedChapters.has('no-chapter') 
                            ? 'border-purple-400 bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 text-purple-700 dark:text-purple-300 shadow-lg shadow-purple-200/30 dark:shadow-purple-900/20' 
                            : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-400 text-gray-700 dark:text-gray-300 bg-white/60 dark:bg-gray-800/60 hover:bg-white/80 dark:hover:bg-gray-700/80 hover:shadow-md'
                        }`}
                      >
                        {selectedChapters.has('no-chapter') && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`p-1.5 rounded-lg transition-all duration-300 ${
                            selectedChapters.has('no-chapter') 
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-md' 
                              : 'bg-gray-200 dark:bg-gray-600 group-hover:bg-purple-100 dark:group-hover:bg-purple-800'
                          }`}>
                            {selectedChapters.has('no-chapter') ? 
                              <CheckSquare className="w-3 h-3 text-white" /> : 
                              <Square className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                            }
                          </div>
                          <span className="font-bold text-sm">Senza Cap.</span>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="text-xs font-medium">
                            {wordsWithoutChapterStats.availableForTest} disponibili
                          </div>
                          <div className="flex items-center gap-2 text-xs opacity-75">
                            <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                              {wordsWithoutChapterStats.totalWords} tot
                            </span>
                            {wordsWithoutChapterStats.difficultWords > 0 && (
                              <span className="bg-gradient-to-r from-orange-400 to-red-400 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Star className="w-2 h-2" />
                                {wordsWithoutChapterStats.difficultWords}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer con design premium */}
            <div className="border-t border-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent pt-6 mt-6">
              <div className="flex items-center justify-between">
                {/* Riepilogo con design elegante */}
                <div className="flex items-center gap-8 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-lg">{totalSelectedWords}</span>
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                        <Sparkles className="w-2 h-2 text-yellow-800" />
                      </div>
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 dark:text-gray-100">Parole</span>
                      <div className="text-xs text-gray-500 dark:text-gray-400">selezionate</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center shadow-md">
                      <span className="text-white font-bold">{selectedChapters.size}</span>
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 dark:text-gray-100">Capitoli</span>
                      <div className="text-xs text-gray-500 dark:text-gray-400">attivi</div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    <div className="flex items-center gap-2">
                      {testMode === 'difficult-only' ? (
                        <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-1 rounded-full">⚡ Solo difficili</span>
                      ) : (
                        <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-2 py-1 rounded-full">📚 Normale</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {enableTimer && <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">⏱️ {maxTimePerWord}s</span>}
                      {hintsMode !== 'disabled' && (
                        <span className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                          💡 {hintsMode === 'unlimited' ? 'Illimitati' : enableTotalHintsLimit ? `Max ${maxTotalHints} totali` : `Max ${maxHintsPerWord}/parola`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pulsanti con design premium */}
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="px-6 py-3 text-sm font-medium bg-white/70 dark:bg-gray-800/70 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 border-2 border-gray-200/50 dark:border-gray-600/50 rounded-xl transition-all duration-300 hover:scale-105"
                  >
                    Annulla
                  </Button>
                  
                  <Button
                    onClick={handleStartTest}
                    disabled={selectedChapters.size === 0 || totalSelectedWords === 0}
                    className="px-8 py-3 text-sm font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white rounded-xl shadow-lg shadow-purple-300/30 dark:shadow-purple-900/30 transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    <span>Inizia Test</span>
                    <Sparkles className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
    </>
  );
};

export default TestSelector;