// ===================================================== 
// 📁 src/components/stats/sections/WordsSection.tsx - REFACTORED Presentation Only
// =====================================================

import React, { useState, useMemo, useEffect } from 'react';
import type { Word } from '../../../types';
import type { WordPerformanceAnalysis } from '../../../types/entities/Performance.types';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'; 
import { Button } from '../../ui/button'; 
import { Input } from '../../ui/input'; 
import { Search, BookOpen, Filter, CheckSquare, Square, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Circle, Eye, Maximize2, Minimize2 } from 'lucide-react'; 
import { useAppContext } from '../../../contexts/AppContext'; 
import { useNotification } from '../../../contexts/NotificationContext'; 
import { getCategoryStyle } from '../../../utils/categoryUtils'; 
import WordDetailSection from '../components/WordDetailSection';
import WordPerformanceService from '../../../services/WordPerformanceService';

interface CollapsedChaptersState {
  [chapter: string]: boolean;
}

interface SeparateCollapsedState {
  tested: CollapsedChaptersState;
  untested: CollapsedChaptersState;
}

interface WordsSectionProps {
  localRefresh: number;
}

interface CompactWordCardProps {
  word: WordPerformanceAnalysis;
  isSelected: boolean;
  onClick: () => void;
  onToggleLearned: () => void;
  onToggleDifficult: () => void;
}

interface WordChapterCardProps {
  chapter: string;
  chapterWords: WordPerformanceAnalysis[];
  isCollapsed: boolean;
  onToggleCollapse: (chapter: string, sectionType: 'tested' | 'untested') => void;
  selectedWordId: string | null;
  onWordSelect: (wordId: string | null) => void;
  onToggleLearned: (wordId: string) => void;
  onToggleDifficult: (wordId: string) => void;
  sectionType: 'tested' | 'untested';
}

const WordsSection: React.FC<WordsSectionProps> = ({ localRefresh }) => {
  // ⭐ UI State management only
  const [searchWord, setSearchWord] = useState('');
  const [filterChapter, setFilterChapter] = useState('');
  const [filterLearned, setFilterLearned] = useState('all');
  const [filterDifficult, setFilterDifficult] = useState('all');
  const [filterGroup, setFilterGroup] = useState('');
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const [showFiltersPanel, setShowFiltersPanel] = useState(true);
  const [internalRefresh, setInternalRefresh] = useState(0);
  const [collapsedChapters, setCollapsedChapters] = useState<SeparateCollapsedState>({
    tested: {},
    untested: {}
  });

  // ⭐ REFACTORED: Data from AppContext only
  const {
    words,
    getWordAnalysis,
    testHistory,
    wordPerformance,
    toggleWordLearned,
    toggleWordDifficult
  } = useAppContext();
   
  const { showSuccess } = useNotification();

  // ⭐ NEW: Service instance for business logic
  const wordPerformanceService = useMemo(() => new WordPerformanceService(), []);

  // ⭐ NEW: Listen for force refresh events
  useEffect(() => {       
    const handleForceRefresh = () => {
      setInternalRefresh(prev => prev + 1);
    };
    window.addEventListener('forceStatsRefresh', handleForceRefresh);
    return () => window.removeEventListener('forceStatsRefresh', handleForceRefresh);
  }, []);

  // ⭐ OTTIMIZZATO: Separazione intelligente parole con/senza performance per UI migliorata
  const wordsData = useMemo(() => {
    if (!words || words.length === 0) {
      return {
        allWords: [],
        wordsWithPerformance: [],
        wordsWithoutPerformance: [],
        totalWords: 0
      };
    }

    // ⭐ NUOVO: Usa metodo ottimizzato che separa le parole e usa dati aggregati
    const optimizedData = wordPerformanceService.analyzeWordsPerformanceOptimized(
      words,
      wordPerformance,
      testHistory
    );
    
    // ⭐ DEBUG: Log per verificare come viene classificata la parola "quite"
    const quiteWord = optimizedData.wordsWithPerformance.find(w => w.english === 'quite') || 
                     optimizedData.wordsWithoutPerformance.find(w => w.english === 'quite');
    if (quiteWord) {
      console.log(`🔍 DEBUG [quite] - WordsSection - Parola processata:`, {
        foundIn: optimizedData.wordsWithPerformance.find(w => w.english === 'quite') ? 'wordsWithPerformance' : 'wordsWithoutPerformance',
        wordData: quiteWord,
        rawWordPerformance: wordPerformance ? wordPerformance[quiteWord.id] : null
      });
    }

    return {
      allWords: [...optimizedData.wordsWithPerformance, ...optimizedData.wordsWithoutPerformance],
      wordsWithPerformance: optimizedData.wordsWithPerformance,
      wordsWithoutPerformance: optimizedData.wordsWithoutPerformance,
      totalWords: optimizedData.totalWords
    };
  }, [words, wordPerformance, testHistory, localRefresh, wordPerformanceService]);

  const wordsAnalysis = wordsData.allWords;

  // ⭐ REFACTORED: Use service for filtering
  const filteredWords = useMemo(() => {
    return wordPerformanceService.filterWords(wordsAnalysis, {
      searchWord,
      filterChapter,
      filterLearned,
      filterDifficult,
      filterGroup
    });
  }, [wordsAnalysis, searchWord, filterChapter, filterGroup, filterLearned, filterDifficult, wordPerformanceService]);

  // ⭐ REFACTORED: Use service for filter options
  const filterOptions = useMemo(() => {
    return wordPerformanceService.getFilterOptions(wordsAnalysis);
  }, [wordsAnalysis, wordPerformanceService]);

  const { chapters: availableChapters, groups: availableGroups, wordsWithoutChapter } = filterOptions;

  // ⭐ REFACTORED: Use service for stats calculation
  const stats = useMemo(() => {
    const baseStats = wordPerformanceService.calculateWordStats(wordsAnalysis);
    return {
      ...baseStats,
      filtered: filteredWords.length
    };
  }, [wordsAnalysis, filteredWords.length, wordPerformanceService]);

  // ⭐ NUOVO: Separazione parole testate vs mai testate per UI
  const separatedWords = useMemo(() => {
    const wordsWithAttempts = filteredWords.filter(w => w.hasPerformanceData);
    const wordsWithoutAttempts = filteredWords.filter(w => !w.hasPerformanceData);
    
    return {
      wordsWithAttempts: wordPerformanceService.groupWordsByChapter(wordsWithAttempts),
      wordsWithoutAttempts: wordPerformanceService.groupWordsByChapter(wordsWithoutAttempts),
      totalWithAttempts: wordsWithAttempts.length,
      totalWithoutAttempts: wordsWithoutAttempts.length
    };
  }, [filteredWords, wordPerformanceService]);

  // ⭐ SAME: Clear filters
  const clearFilters = () => {
    setSearchWord('');
    setFilterChapter('');
    setFilterLearned('all');
    setFilterDifficult('all');
    setFilterGroup('');
  };

  // ⭐ SAME: Handle word actions
  const handleToggleLearned = (id: string) => {
    const word = wordsAnalysis.find(w => w.id === id);
    if (word) {
      toggleWordLearned(id);
      showSuccess(
        word.learned 
          ? `📖 "${word.english}" segnata come da studiare`
          : `✅ "${word.english}" segnata come appresa!`
      );
    }
  };

  const handleToggleDifficult = (id: string) => {
    const word = wordsAnalysis.find(w => w.id === id);
    if (word) {
      toggleWordDifficult(id);
      showSuccess(
        word.difficult 
          ? `📚 "${word.english}" rimossa dalle parole difficili`
          : `⭐ "${word.english}" segnata come difficile!`
      );
    }
  };

  // ⭐ FIXED: Handle chapter collapse with separate states for tested/untested
  const toggleChapterCollapse = (chapter: string, sectionType: 'tested' | 'untested') => {
    setCollapsedChapters((prev: SeparateCollapsedState) => ({
      ...prev,
      [sectionType]: {
        ...prev[sectionType],
        [chapter]: !(prev[sectionType][chapter] || false)
      }
    }));
  };

  // ⭐ NEW: Utility functions for bulk operations with separate states
  const testedChapters = Object.keys(separatedWords.wordsWithAttempts);
  const untestedChapters = Object.keys(separatedWords.wordsWithoutAttempts);
  const allChapters = [...testedChapters, ...untestedChapters];
  const uniqueChapters = [...new Set(allChapters)];
  
  const allTestedCollapsed = testedChapters.every(chapter => collapsedChapters.tested[chapter] || false);
  const allTestedExpanded = testedChapters.every(chapter => !(collapsedChapters.tested[chapter] || false));
  const allUntestedCollapsed = untestedChapters.every(chapter => collapsedChapters.untested[chapter] || false);
  const allUntestedExpanded = untestedChapters.every(chapter => !(collapsedChapters.untested[chapter] || false));
  
  const allCollapsed = allTestedCollapsed && allUntestedCollapsed;
  const allExpanded = allTestedExpanded && allUntestedExpanded;

  const expandAllChapters = () => {
    setCollapsedChapters((prev: SeparateCollapsedState) => {
      const newTestedState: CollapsedChaptersState = { ...prev.tested };
      const newUntestedState: CollapsedChaptersState = { ...prev.untested };
      
      testedChapters.forEach(chapter => {
        newTestedState[chapter] = false; // false = expanded
      });
      untestedChapters.forEach(chapter => {
        newUntestedState[chapter] = false; // false = expanded
      });
      
      return {
        tested: newTestedState,
        untested: newUntestedState
      };
    });
  };

  const collapseAllChapters = () => {
    setCollapsedChapters((prev: SeparateCollapsedState) => {
      const newTestedState: CollapsedChaptersState = { ...prev.tested };
      const newUntestedState: CollapsedChaptersState = { ...prev.untested };
      
      testedChapters.forEach(chapter => {
        newTestedState[chapter] = true; // true = collapsed
      });
      untestedChapters.forEach(chapter => {
        newUntestedState[chapter] = true; // true = collapsed
      });
      
      return {
        tested: newTestedState,
        untested: newUntestedState
      };
    });
  };

  return (
    <div className="space-y-8" key={`words-enhanced-${localRefresh}-${internalRefresh}`}>
       
      {/* ⭐ ENHANCED: Header with bulk actions */}
      <Card className="bg-white dark:bg-gray-800 border-0 shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-3 text-white">
                <Search className="w-6 h-6" />
                Analisi Performance Parole ({stats.total} parole)
              </CardTitle>
              <p className="text-indigo-100 text-sm">
                📊 {wordsData.wordsWithPerformance.length} parole testate ({stats.avgAccuracy}% accuratezza media) • 
                📝 {wordsData.wordsWithoutPerformance.length} parole mai testate (senza attempts) • 
                🧪 {testHistory.length} test completati
              </p>
            </div>
             
            {/* ⭐ NEW: Bulk chapter controls */}
            {uniqueChapters.length > 1 && (
              <div className="flex gap-2">
                <Button
                  onClick={expandAllChapters}
                  disabled={allExpanded}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Maximize2 className="w-4 h-4 mr-2" />
                  Espandi Tutti
                </Button>
                <Button
                  onClick={collapseAllChapters}
                  disabled={allCollapsed}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Minimize2 className="w-4 h-4 mr-2" />
                  Collassa Tutti
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* ⭐ SAME: Filtri avanzati */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
        <CardHeader 
          className="cursor-pointer hover:bg-blue-100/50 transition-colors"
          onClick={() => setShowFiltersPanel(!showFiltersPanel)}
        >
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="w-5 h-5 text-blue-600" />
            Filtri Avanzati ({stats.filtered} parole mostrate)
            {showFiltersPanel ? <CheckSquare className="w-4 h-4 ml-auto" /> : <Square className="w-4 h-4 ml-auto" />}
          </CardTitle>
        </CardHeader>
          
        {showFiltersPanel && (
          <CardContent className="animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">🔍 Cerca Parola</label>
                <Input
                  placeholder="Parola inglese..."
                  value={searchWord}
                  onChange={(e) => setSearchWord(e.target.value)}
                  className="border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-colors"
                />
              </div>
               
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">📚 Capitolo</label>
                <select
                  value={filterChapter}
                  onChange={(e) => setFilterChapter(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 dark:focus:border-purple-500 bg-white dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="">Tutti i capitoli</option>
                  {availableChapters.map(chapter => (
                    <option key={chapter as string} value={chapter as string}>{`📖 ${chapter}`}</option>
                  ))}
                  {wordsWithoutChapter.length > 0 && (
                    <option value="no-chapter">📋 Senza capitolo</option>
                  )}
                </select>
              </div>
               
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">🎓 Stato Apprendimento</label>
                <select
                  value={filterLearned}
                  onChange={(e) => setFilterLearned(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 dark:focus:border-purple-500 bg-white dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="all">Tutte le parole</option>
                  <option value="learned">✅ Solo apprese</option>
                  <option value="not_learned">📖 Solo da studiare</option>
                </select>
              </div>
               
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">⭐ Difficoltà</label>
                <select
                  value={filterDifficult}
                  onChange={(e) => setFilterDifficult(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 dark:focus:border-purple-500 bg-white dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="all">Tutte le parole</option>
                  <option value="difficult">⭐ Solo difficili</option>
                  <option value="not_difficult">📚 Solo normali</option>
                </select>
              </div>
               
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">📂 Categoria</label>
                <select
                  value={filterGroup}
                  onChange={(e) => setFilterGroup(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 dark:focus:border-purple-500 bg-white dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="">Tutte le categorie</option>
                  {availableGroups.map(group => (
                    <option key={group as string} value={group as string}>
                      {`${getCategoryStyle(group).icon} ${group}`}
                    </option>
                  ))}
                </select>
              </div>
               
              <div className="flex items-end">
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="w-full"
                >
                  Cancella Filtri
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-2xl border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-blue-700 text-sm">Totale Parole</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-2xl border border-green-200">
                <div className="text-2xl font-bold text-green-600">{stats.learned}</div>
                <div className="text-green-700 text-sm">Apprese</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-2xl border border-orange-200">
                <div className="text-2xl font-bold text-orange-600">{stats.notLearned}</div>
                <div className="text-orange-700 text-sm">Da Studiare</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-2xl border border-red-200">
                <div className="text-2xl font-bold text-red-600">{stats.difficult}</div>
                <div className="text-red-700 text-sm">⭐ Difficili</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-2xl border border-purple-200">
                <div className="text-2xl font-bold text-purple-600">{wordsData.wordsWithPerformance.length}</div>
                <div className="text-purple-700 text-sm">📊 Con Performance</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-2xl border border-gray-200">
                <div className="text-2xl font-bold text-gray-600">{wordsData.wordsWithoutPerformance.length}</div>
                <div className="text-gray-700 text-sm">📝 Senza Attempts</div>
              </div>
            </div>
            
            {/* ⭐ NUOVO: Sezione dedicata accuratezza solo per parole con performance */}
            {wordsData.wordsWithPerformance.length > 0 && (
              <div className="mt-4 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl border border-cyan-200">
                <div className="text-center">
                  <div className="text-3xl font-bold text-cyan-600">{stats.avgAccuracy}%</div>
                  <div className="text-cyan-700 text-sm">📈 Accuratezza Media (solo parole con attempts)</div>
                  <div className="text-xs text-cyan-600 mt-1">
                    Ottimizzata: usa accuracy già calcolata nella collezione performance
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* ⭐ SPOSTATO SOPRA: Word detail section PRIMA della lista delle parole */}
      {selectedWordId && (
        <WordDetailSection 
          wordId={selectedWordId}
          getWordAnalysis={getWordAnalysis}
          testHistory={testHistory}
          wordInfo={wordsAnalysis.find(w => w.id === selectedWordId)}
          localRefresh={`${localRefresh}-${internalRefresh}`}
          wordPerformance={wordPerformance} // ⭐ NUOVO: Passa dati performance
        />
      )}

      {/* ⭐ NUOVO: Due sezioni separate - PAROLE TESTATE vs MAI TESTATE */}
      {filteredWords.length === 0 ? (
        <Card className="bg-white dark:bg-gray-800 border-0 shadow-xl rounded-3xl overflow-hidden">
          <CardContent className="text-center py-16">
            <div className="text-8xl mb-6">🔍</div>
            <h3 className="text-2xl font-bold text-gray-700 mb-4">Nessuna parola trovata</h3>
            <p className="text-gray-600 text-lg mb-8">Modifica i filtri per vedere altre parole</p>
            <Button onClick={clearFilters} className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4">
              Cancella Tutti i Filtri
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          
          {/* ⭐ SEZIONE 1: PAROLE TESTATE (con attempts) */}
          {separatedWords.totalWithAttempts > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-8 bg-gradient-to-b from-green-500 to-emerald-500 rounded"></div>
                <h2 className="text-2xl font-bold text-gray-800">
                  📊 Parole Testate ({separatedWords.totalWithAttempts})
                </h2>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                  Con dati di performance
                </span>
              </div>
              
              {Object.entries(separatedWords.wordsWithAttempts)
                .sort(([a], [b]) => {
                  if (a === 'Senza Capitolo') return 1;
                  if (b === 'Senza Capitolo') return -1;
                  const aNum = parseInt(a);
                  const bNum = parseInt(b);
                  return !isNaN(aNum) && !isNaN(bNum) ? aNum - bNum : a.localeCompare(b);
                })
                .map(([chapter, chapterWords]) => (
                  <WordChapterCard 
                    key={`tested-${chapter}`}
                    chapter={chapter}
                    chapterWords={chapterWords as any}
                    isCollapsed={collapsedChapters.tested[chapter] || false || false}
                    onToggleCollapse={(chapter, sectionType) => toggleChapterCollapse(chapter, sectionType)}
                    selectedWordId={selectedWordId}
                    onWordSelect={setSelectedWordId}
                    onToggleLearned={handleToggleLearned}
                    onToggleDifficult={handleToggleDifficult}
                    sectionType="tested"
                  />
                ))}
            </div>
          )}

          {/* ⭐ SEZIONE 2: PAROLE MAI TESTATE (senza attempts) */}
          {separatedWords.totalWithoutAttempts > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-8 bg-gradient-to-b from-gray-400 to-gray-500 rounded"></div>
                <h2 className="text-2xl font-bold text-gray-800">
                  📝 Parole Mai Testate ({separatedWords.totalWithoutAttempts})
                </h2>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                  Senza tentativi
                </span>
              </div>
              
              {Object.entries(separatedWords.wordsWithoutAttempts)
                .sort(([a], [b]) => {
                  if (a === 'Senza Capitolo') return 1;
                  if (b === 'Senza Capitolo') return -1;
                  const aNum = parseInt(a);
                  const bNum = parseInt(b);
                  return !isNaN(aNum) && !isNaN(bNum) ? aNum - bNum : a.localeCompare(b);
                })
                .map(([chapter, chapterWords]) => (
                  <WordChapterCard 
                    key={`untested-${chapter}`}
                    chapter={chapter}
                    chapterWords={chapterWords as any}
                    isCollapsed={collapsedChapters.untested[chapter] || false || false}
                    onToggleCollapse={(chapter, sectionType) => toggleChapterCollapse(chapter, sectionType)}
                    selectedWordId={selectedWordId}
                    onWordSelect={setSelectedWordId}
                    onToggleLearned={handleToggleLearned}
                    onToggleDifficult={handleToggleDifficult}
                    sectionType="untested"
                  />
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ⭐ SAME: Compact Word Card
const CompactWordCard: React.FC<CompactWordCardProps> = ({ 
  word, 
  isSelected, 
  onClick, 
  onToggleLearned, 
  onToggleDifficult 
}) => {
  const getStatusColor = (status: string): string => {
    const colors = {
      critical: 'bg-red-500',
      inconsistent: 'bg-orange-500', 
      struggling: 'bg-yellow-500',
      promising: 'bg-blue-500',
      improving: 'bg-green-500',
      consolidated: 'bg-emerald-500',
      new: 'bg-gray-500'
    };
    return (colors as any)[status] || 'bg-gray-500';
  };

  const getStatusLabel = (status: string): string => {
    const labels = {
      critical: '🔴',
      inconsistent: '🟠', 
      struggling: '🟡',
      promising: '🔵',
      improving: '🟢',
      consolidated: '🟢',
      new: '⚪'
    };
    return (labels as any)[status] || '⚪';
  };

  return (
    <div className={`p-3 rounded-xl border transition-all duration-200 hover:shadow-md ${
      word.learned 
        ? 'bg-green-50 border-green-200'
        : word.difficult
        ? 'bg-red-50 border-red-200'
        : isSelected
        ? 'border-blue-500 bg-blue-50 shadow-md'
        : 'bg-white border-gray-200 hover:border-gray-300'
    }`}>
      <div className="flex items-center justify-between">
        {/* ⭐ COMPACT: Word info */}
        <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={onClick}>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-bold ${word.learned ? 'text-gray-600' : 'text-gray-800'}`}>
              {word.english}
            </span>
            <span className="text-gray-400">→</span>
            <span className={`text-base ${word.learned ? 'text-gray-500' : 'text-gray-700'}`}>
              {word.italian}
            </span>
          </div>
           
          {/* ⭐ COMPACT: Small badges */}
          <div className="flex items-center gap-1">
            {word.group && (
              <span className={`w-6 h-6 rounded-full text-white text-xs flex items-center justify-center ${getCategoryStyle(word.group).bgColor}`}>
                {getCategoryStyle(word.group).icon}
              </span>
            )}

            {word.hasPerformanceData && (
              <span 
                className={`w-6 h-6 rounded-full text-white text-xs flex items-center justify-center ${getStatusColor(word.status)}`}
                title={`Stato della parola: ${word.status === 'critical' ? 'Critica (accuratezza molto bassa)' : 
                        word.status === 'inconsistent' ? 'Inconsistente (risultati altalenanti)' :
                        word.status === 'struggling' ? 'In difficoltà (pochi tentativi, spesso sbagliati)' :
                        word.status === 'promising' ? 'Promettente (pochi tentativi, ma buoni risultati)' :
                        word.status === 'improving' ? 'In miglioramento (accuratezza decente)' :
                        word.status === 'consolidated' ? 'Consolidata (alta accuratezza e serie)' :
                        'Nuova (mai testata)'}`}
              >
                {getStatusLabel(word.status)}
              </span>
            )}
          </div>
        </div>

        {/* ⭐ COMPACT: Performance stats (only if available) */}
        {word.hasPerformanceData && (
          <div className="flex items-center gap-3 text-sm">
            <div className="text-center" title={`Percentuale di accuratezza: ${word.correctAttempts} risposte corrette su ${word.totalAttempts} tentativi totali`}>
              <div className="font-bold text-blue-600">📊 {word.accuracy}%</div>
              <div className="text-xs text-gray-500">Precisione</div>
            </div>
            <div className="text-center" title={`Serie corrente (Streak): ${word.currentStreak} risposte corrette consecutive dalla fine. Una risposta sbagliata interrompe la serie.`}>
              <div className="font-bold text-green-600">🔥 {word.currentStreak}</div>
              <div className="text-xs text-gray-500">Serie Corrente</div>
            </div>
            <div className="text-center" title={`Tempo medio di risposta: ${word.avgTime} secondi per ogni tentativo di questa parola`}>
              <div className="font-bold text-purple-600">⏱️ {word.avgTime}s</div>
              <div className="text-xs text-gray-500">Tempo Medio</div>
            </div>
            <div className="text-center" title={`Percentuale di aiuti utilizzati: ${word.hintsUsed} suggerimenti su ${word.totalAttempts} tentativi totali (${word.hintsPercentage}%)`}>
              <div className="font-bold text-orange-600">💡 {word.hintsPercentage}%</div>
              <div className="text-xs text-gray-500">Aiuti Usati</div>
            </div>
          </div>
        )}

        {/* ⭐ COMPACT: Only essential actions */}
        <div className="flex items-center gap-2 ml-3">
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
           
          <div 
            onClick={onClick}
            className="cursor-pointer text-blue-500 hover:text-blue-700"
            title="Visualizza andamento temporale"
          >
            <Eye className="w-5 h-5" />
          </div>
        </div>
      </div>
       
      {/* ⭐ COMPACT: Status info */}
      <div className="mt-2 text-center text-xs">
        {isSelected ? (
          <span className="text-blue-600">↑ Clicca per nascondere l'andamento temporale</span>
        ) : word.hasPerformanceData ? (
          <span className="text-gray-500">↑ Clicca per vedere l'andamento temporale</span>
        ) : (
          <span className="text-gray-400">📊 Nessun dato performance disponibile</span>
        )}
      </div>
    </div>
  );
};

// ⭐ NUOVO: Componente per sezioni di capitoli (testate/mai testate)  
const WordChapterCard: React.FC<WordChapterCardProps> = ({
  chapter,
  chapterWords,
  isCollapsed,
  onToggleCollapse,
  selectedWordId,
  onWordSelect,
  onToggleLearned,
  onToggleDifficult,
  sectionType
}) => {
  const sectionStyles = sectionType === 'tested' 
    ? {
        headerBg: 'bg-gradient-to-r from-green-100 to-emerald-100 border-b border-green-200',
        hoverBg: 'hover:from-green-200 hover:to-emerald-200',
        textColor: 'text-green-800',
        iconColor: 'text-green-600',
        badgeColors: {
          total: 'bg-green-200 text-green-700',
          learned: 'bg-emerald-200 text-emerald-700', 
          difficult: 'bg-red-200 text-red-700',
          performance: 'bg-blue-200 text-blue-700'
        }
      }
    : {
        headerBg: 'bg-gradient-to-r from-gray-100 to-slate-100 border-b border-gray-200',
        hoverBg: 'hover:from-gray-200 hover:to-slate-200',
        textColor: 'text-gray-800',
        iconColor: 'text-gray-600',
        badgeColors: {
          total: 'bg-gray-200 text-gray-700',
          learned: 'bg-green-200 text-green-700',
          difficult: 'bg-red-200 text-red-700', 
          performance: 'bg-gray-300 text-gray-600'
        }
      };

  return (
    <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
      <CardHeader 
        className={`${sectionStyles.headerBg} cursor-pointer ${sectionStyles.hoverBg} transition-colors`}
        onClick={() => onToggleCollapse(chapter, sectionType)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {isCollapsed ? (
                <ChevronDown className={`w-5 h-5 ${sectionStyles.iconColor}`} />
              ) : (
                <ChevronUp className={`w-5 h-5 ${sectionStyles.iconColor}`} />
              )}
              <BookOpen className={`w-6 h-6 ${sectionStyles.iconColor}`} />
            </div>
            <CardTitle className={`${sectionStyles.textColor} text-lg`}>
              {chapter === 'Senza Capitolo' ? '📋 Senza Capitolo' : `📖 Capitolo ${chapter}`}
            </CardTitle>
            {isCollapsed && (
              <span className={`text-xs px-2 py-1 rounded-full ${sectionStyles.badgeColors.performance}`}>
                Clicca per espandere
              </span>
            )}
          </div>
          <div className="flex gap-2 text-sm">
            <span className={`px-3 py-1 rounded-full ${sectionStyles.badgeColors.total}`}>
              {chapterWords.length} parole
            </span>
            <span className={`px-3 py-1 rounded-full ${sectionStyles.badgeColors.learned}`}>
              {chapterWords.filter(w => w.learned).length} apprese
            </span>
            <span className={`px-3 py-1 rounded-full ${sectionStyles.badgeColors.difficult}`}>
              {chapterWords.filter(w => w.difficult).length} difficili
            </span>
            {sectionType === 'tested' && (
              <span className={`px-3 py-1 rounded-full ${sectionStyles.badgeColors.performance}`}>
                {chapterWords.filter(w => w.hasPerformanceData).length} con performance
              </span>
            )}
          </div>
        </div>
      </CardHeader>
       
      {!isCollapsed && (
        <CardContent className="p-4">
          <div className="max-h-80 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {chapterWords.map((word) => (
              <CompactWordCard
                key={word.id}
                word={word}
                isSelected={selectedWordId === word.id}
                onClick={() => onWordSelect(selectedWordId === word.id ? null : word.id)}
                onToggleLearned={() => onToggleLearned(word.id)}
                onToggleDifficult={() => onToggleDifficult(word.id)}
              />
            ))}
          </div>
           
          {chapterWords.length > 5 && (
            <div className="mt-3 text-center text-sm text-gray-500">
              📊 {chapterWords.length} parole totali • Scorri per vedere tutte
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default WordsSection;