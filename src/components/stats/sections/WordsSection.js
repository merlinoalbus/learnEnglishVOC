// ===================================================== 
// 📁 src/components/stats/sections/WordsSection.js - REFACTORED Clean Data Flow
// =====================================================  

import React, { useState, useMemo, useEffect } from 'react'; 
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'; 
import { Button } from '../../ui/button'; 
import { Input } from '../../ui/input'; 
import { Search, BookOpen, Filter, CheckSquare, Square, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Circle, Eye, Maximize2, Minimize2 } from 'lucide-react'; 
import { useAppContext } from '../../../contexts/AppContext'; 
import { useNotification } from '../../../contexts/NotificationContext'; 
import { getCategoryStyle } from '../../../utils/categoryUtils'; 
import WordDetailSection from '../components/WordDetailSection';

const WordsSection = ({ localRefresh }) => {
  // ⭐ ENHANCED: State management
  const [searchWord, setSearchWord] = useState('');
  const [filterChapter, setFilterChapter] = useState('');
  const [filterLearned, setFilterLearned] = useState('all');
  const [filterDifficult, setFilterDifficult] = useState('all');
  const [filterGroup, setFilterGroup] = useState('');
  const [selectedWordId, setSelectedWordId] = useState(null);
  const [showFiltersPanel, setShowFiltersPanel] = useState(true);
  const [internalRefresh, setInternalRefresh] = useState(0);
   
  // ⭐ FIXED: Stato per capitoli collassabili - NESSUNA RESTRIZIONE
  const [collapsedChapters, setCollapsedChapters] = useState({});

  // ⭐ REFACTORED: Clean data flow from AppContext - single source of truth
  const {
    words,
    getAllWordsPerformance,
    getWordAnalysis,
    testHistory, // ⭐ CRITICAL: Get testHistory from AppContext instead of localStorage
    wordPerformance,
    toggleWordLearned,
    toggleWordDifficult
  } = useAppContext();
   
  const { showSuccess } = useNotification();

  // ⭐ NEW: Listen for force refresh events
  useEffect(() => {       
    const handleForceRefresh = () => {
      setInternalRefresh(prev => prev + 1);
    };
    window.addEventListener('forceStatsRefresh', handleForceRefresh);
    return () => window.removeEventListener('forceStatsRefresh', handleForceRefresh);
  }, []);

  // ⭐ REFACTORED: Enhanced word performance data using ONLY AppContext data
  const enhancedWordsData = useMemo(() => {
    if (!getAllWordsPerformance || !words) {
      return [];
    }
     
    const performanceData = getAllWordsPerformance();
     
    // ⭐ CRITICAL: Better debugging of the mapping process
    const performanceMap = new Map(performanceData.map(p => [p.wordId, p]));
     
    // ⭐ ENHANCED: Better word merging with detailed logging
    const enhanced = words.map((word, index) => {
      const performance = performanceMap.get(word.id);
       
      // ⭐ CRITICAL: Multiple ways to detect if word has performance data
      const hasAttempts = performance && performance.attempts && performance.attempts.length > 0;
      const hasTotalAttempts = performance && performance.totalAttempts > 0;
      const hasAccuracy = performance && typeof performance.accuracy === 'number';
      const hasData = hasAttempts || hasTotalAttempts || hasAccuracy;
               
      return {
        ...word,
        totalAttempts: performance?.totalAttempts || performance?.attempts?.length || 0,
        accuracy: performance?.accuracy || 0,
        hintsPercentage: performance?.hintsPercentage || 0,
        currentStreak: performance?.currentStreak || 0,
        status: performance?.status || 'new',
        avgTime: performance?.avgTime || 0,
        hasPerformanceData: hasData,
        // ⭐ DEBUG: Include raw performance for debugging
        _rawPerformance: performance
      };
    });
     
    const withData = enhanced.filter(w => w.hasPerformanceData).length;
             
    // ⭐ FALLBACK: If getAllWordsPerformance is broken, use raw wordPerformance
    if (withData === 0 && wordPerformance && Object.keys(wordPerformance).length > 0) {
           
      const enhancedFallback = words.map(word => {
        const rawPerformance = wordPerformance[word.id];
        const hasRawData = rawPerformance && rawPerformance.attempts && rawPerformance.attempts.length > 0;
                
        if (hasRawData) {
          const attempts = rawPerformance.attempts;
          const totalAttempts = attempts.length;
          const correctAttempts = attempts.filter(a => a.correct).length;
          const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;
                   
          return {
            ...word,
            totalAttempts,
            accuracy,
            hintsPercentage: 0, // We don't have this in raw data
            currentStreak: 0, // We don't have this in raw data
            status: accuracy >= 70 ? 'improving' : accuracy >= 50 ? 'inconsistent' : 'struggling',
            avgTime: 0, // We don't have this in raw data
            hasPerformanceData: true
          };
        }
                
        return {
          ...word,
          totalAttempts: 0,
          accuracy: 0,
          hintsPercentage: 0,
          currentStreak: 0,
          status: 'new',
          avgTime: 0,
          hasPerformanceData: false
        };
      });
       
      const fallbackWithData = enhancedFallback.filter(w => w.hasPerformanceData).length;
      return enhancedFallback;
    }
     
    return enhanced;
  }, [getAllWordsPerformance, words, wordPerformance, localRefresh]);

  // ⭐ SAME: Filtering logic
  const filteredWords = useMemo(() => {
    return enhancedWordsData.filter(word => {
      if (searchWord && !word.english.toLowerCase().includes(searchWord.toLowerCase())) {
        return false;
      }
       
      if (filterChapter !== '') {
        if (filterChapter === 'no-chapter') {
          if (word.chapter) return false;
        } else {
          if (word.chapter !== filterChapter) return false;
        }
      }
       
      if (filterGroup && word.group !== filterGroup) return false;
      if (filterLearned === 'learned' && !word.learned) return false;
      if (filterLearned === 'not_learned' && word.learned) return false;
      if (filterDifficult === 'difficult' && !word.difficult) return false;
      if (filterDifficult === 'not_difficult' && word.difficult) return false;
       
      return true;
    });
  }, [enhancedWordsData, searchWord, filterChapter, filterGroup, filterLearned, filterDifficult]);

  // ⭐ SAME: Available options
  const availableChapters = useMemo(() => {
    const chapters = new Set();
    enhancedWordsData.forEach(word => {
      if (word.chapter) chapters.add(word.chapter);
    });
    return Array.from(chapters).sort((a, b) => {
      const aNum = parseInt(a);
      const bNum = parseInt(b);
      return !isNaN(aNum) && !isNaN(bNum) ? aNum - bNum : a.localeCompare(b);
    });
  }, [enhancedWordsData]);

  const availableGroups = useMemo(() => {
    const groups = new Set();
    enhancedWordsData.forEach(word => {
      if (word.group) groups.add(word.group);
    });
    return Array.from(groups).sort();
  }, [enhancedWordsData]);

  const wordsWithoutChapter = useMemo(() => {
    return enhancedWordsData.filter(word => !word.chapter);
  }, [enhancedWordsData]);

  // ⭐ FIXED: Better stats calculation
  const stats = useMemo(() => {
    const withPerformance = enhancedWordsData.filter(w => w.hasPerformanceData);
    return {
      total: enhancedWordsData.length,
      learned: enhancedWordsData.filter(w => w.learned).length,
      notLearned: enhancedWordsData.filter(w => !w.learned).length,
      difficult: enhancedWordsData.filter(w => w.difficult).length,
      withChapter: enhancedWordsData.filter(w => w.chapter).length,
      withPerformance: withPerformance.length,
      filtered: filteredWords.length,
      avgAccuracy: withPerformance.length > 0 
        ? Math.round(withPerformance.reduce((sum, w) => sum + w.accuracy, 0) / withPerformance.length)
        : 0
    };
  }, [enhancedWordsData, filteredWords.length]);

  // ⭐ SAME: Grouped words
  const groupedWords = useMemo(() => {
    return filteredWords.reduce((groups, word) => {
      const chapter = word.chapter || 'Senza Capitolo';
      if (!groups[chapter]) groups[chapter] = [];
      groups[chapter].push(word);
      return groups;
    }, {});
  }, [filteredWords]);

  // ⭐ SAME: Clear filters
  const clearFilters = () => {
    setSearchWord('');
    setFilterChapter('');
    setFilterLearned('all');
    setFilterDifficult('all');
    setFilterGroup('');
  };

  // ⭐ SAME: Handle word actions
  const handleToggleLearned = (id) => {
    const word = enhancedWordsData.find(w => w.id === id);
    if (word) {
      toggleWordLearned(id);
      showSuccess(
        word.learned 
          ? `📖 "${word.english}" segnata come da studiare`
          : `✅ "${word.english}" segnata come appresa!`
      );
    }
  };

  const handleToggleDifficult = (id) => {
    const word = enhancedWordsData.find(w => w.id === id);
    if (word) {
      toggleWordDifficult(id);
      showSuccess(
        word.difficult 
          ? `📚 "${word.english}" rimossa dalle parole difficili`
          : `⭐ "${word.english}" segnata come difficile!`
      );
    }
  };

  // ⭐ FIXED: Handle chapter collapse - NESSUNA RESTRIZIONE
  const toggleChapterCollapse = (chapter) => {
    setCollapsedChapters(prev => ({
      ...prev,
      [chapter]: !prev[chapter]
    }));
  };

  // ⭐ NEW: Utility functions for bulk operations
  const allChapters = Object.keys(groupedWords);
  const allCollapsed = allChapters.every(chapter => collapsedChapters[chapter]);
  const allExpanded = allChapters.every(chapter => !collapsedChapters[chapter]);

  const expandAllChapters = () => {
    const newState = {};
    allChapters.forEach(chapter => {
      newState[chapter] = false; // false = expanded
    });
    setCollapsedChapters(newState);
  };

  const collapseAllChapters = () => {
    const newState = {};
    allChapters.forEach(chapter => {
      newState[chapter] = true; // true = collapsed
    });
    setCollapsedChapters(newState);
  };

  return (
    <div className="space-y-8" key={`words-enhanced-${localRefresh}-${internalRefresh}`}>
       
      {/* ⭐ ENHANCED: Header with bulk actions */}
      <Card className="bg-white border-0 shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-3 text-white">
                <Search className="w-6 h-6" />
                Analisi Performance Parole ({stats.total} parole)
              </CardTitle>
              <p className="text-indigo-100 text-sm">
                {stats.withPerformance} parole con dati performance • Accuratezza media: {stats.avgAccuracy}% • Test totali: {testHistory.length}
              </p>
            </div>
             
            {/* ⭐ NEW: Bulk chapter controls */}
            {allChapters.length > 1 && (
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
                <label className="text-sm font-medium text-gray-700 mb-2 block">🔍 Cerca Parola</label>
                <Input
                  placeholder="Parola inglese..."
                  value={searchWord}
                  onChange={(e) => setSearchWord(e.target.value)}
                  className="border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-colors"
                />
              </div>
               
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">📚 Capitolo</label>
                <select
                  value={filterChapter}
                  onChange={(e) => setFilterChapter(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 bg-white"
                >
                  <option value="">Tutti i capitoli</option>
                  {availableChapters.map(chapter => (
                    <option key={chapter} value={chapter}>📖 {chapter}</option>
                  ))}
                  {wordsWithoutChapter.length > 0 && (
                    <option value="no-chapter">📋 Senza capitolo</option>
                  )}
                </select>
              </div>
               
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">🎓 Stato Apprendimento</label>
                <select
                  value={filterLearned}
                  onChange={(e) => setFilterLearned(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 bg-white"
                >
                  <option value="all">Tutte le parole</option>
                  <option value="learned">✅ Solo apprese</option>
                  <option value="not_learned">📖 Solo da studiare</option>
                </select>
              </div>
               
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">⭐ Difficoltà</label>
                <select
                  value={filterDifficult}
                  onChange={(e) => setFilterDifficult(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 bg-white"
                >
                  <option value="all">Tutte le parole</option>
                  <option value="difficult">⭐ Solo difficili</option>
                  <option value="not_difficult">📚 Solo normali</option>
                </select>
              </div>
               
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">📂 Categoria</label>
                <select
                  value={filterGroup}
                  onChange={(e) => setFilterGroup(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 bg-white"
                >
                  <option value="">Tutte le categorie</option>
                  {availableGroups.map(group => (
                    <option key={group} value={group}>
                      {getCategoryStyle(group).icon} {group}
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
                <div className="text-2xl font-bold text-purple-600">{stats.withPerformance}</div>
                <div className="text-purple-700 text-sm">Con Performance</div>
              </div>
              <div className="text-center p-4 bg-cyan-50 rounded-2xl border border-cyan-200">
                <div className="text-2xl font-bold text-cyan-600">{stats.avgAccuracy}%</div>
                <div className="text-cyan-700 text-sm">Accuratezza Media</div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* ⭐ REFACTORED: Word detail section with clean props from AppContext */}
      {selectedWordId && (
        <WordDetailSection 
          wordId={selectedWordId}
          getWordAnalysis={getWordAnalysis}
          testHistory={testHistory} // ⭐ CRITICAL: Pass testHistory from AppContext
          wordInfo={enhancedWordsData.find(w => w.id === selectedWordId)}
          localRefresh={`${localRefresh}-${internalRefresh}`}
        />
      )}

      {/* ⭐ FIXED: Lista parole con capitoli collassabili SENZA RESTRIZIONI */}
      {filteredWords.length === 0 ? (
        <Card className="bg-white border-0 shadow-xl rounded-3xl overflow-hidden">
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
        <div className="space-y-4">
          {Object.entries(groupedWords)
            .sort(([a], [b]) => {
              if (a === 'Senza Capitolo') return 1;
              if (b === 'Senza Capitolo') return -1;
              const aNum = parseInt(a);
              const bNum = parseInt(b);
              return !isNaN(aNum) && !isNaN(bNum) ? aNum - bNum : a.localeCompare(b);
            })
            .map(([chapter, chapterWords]) => {
              const isCollapsed = collapsedChapters[chapter];
               
              return (
                <Card key={chapter} className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
                  {/* ⭐ FIXED: Collapsible chapter header - NESSUNA RESTRIZIONE */}
                  <CardHeader 
                    className="bg-gradient-to-r from-indigo-100 to-purple-100 border-b border-indigo-200 cursor-pointer hover:from-indigo-200 hover:to-purple-200 transition-colors"
                    onClick={() => toggleChapterCollapse(chapter)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {isCollapsed ? (
                            <ChevronDown className="w-5 h-5 text-indigo-600" />
                          ) : (
                            <ChevronUp className="w-5 h-5 text-indigo-600" />
                          )}
                          <BookOpen className="w-6 h-6 text-indigo-600" />
                        </div>
                        <CardTitle className="text-indigo-800 text-lg">
                          {chapter === 'Senza Capitolo' ? '📋 Senza Capitolo' : `📖 Capitolo ${chapter}`}
                        </CardTitle>
                        {isCollapsed && (
                          <span className="text-xs text-indigo-600 bg-indigo-200 px-2 py-1 rounded-full">
                            Clicca per espandere
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 text-sm">
                        <span className="bg-indigo-200 text-indigo-700 px-3 py-1 rounded-full">
                          {chapterWords.length} parole
                        </span>
                        <span className="bg-green-200 text-green-700 px-3 py-1 rounded-full">
                          {chapterWords.filter(w => w.learned).length} apprese
                        </span>
                        <span className="bg-red-200 text-red-700 px-3 py-1 rounded-full">
                          {chapterWords.filter(w => w.difficult).length} difficili
                        </span>
                        <span className="bg-purple-200 text-purple-700 px-3 py-1 rounded-full">
                          {chapterWords.filter(w => w.hasPerformanceData).length} con performance
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                   
                  {/* ⭐ FIXED: Collapsible content */}
                  {!isCollapsed && (
                    <CardContent className="p-4">
                      {/* ⭐ FIXED: Scrollable word list */}
                      <div className="max-h-80 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-indigo-300 scrollbar-track-gray-100">
                        {chapterWords.map((word) => (
                          <CompactWordCard
                            key={word.id}
                            word={word}
                            isSelected={selectedWordId === word.id}
                            onClick={() => setSelectedWordId(selectedWordId === word.id ? null : word.id)}
                            onToggleLearned={() => handleToggleLearned(word.id)}
                            onToggleDifficult={() => handleToggleDifficult(word.id)}
                          />
                        ))}
                      </div>
                       
                      {/* ⭐ FIXED: Info parole nel capitolo */}
                      {chapterWords.length > 5 && (
                        <div className="mt-3 text-center text-sm text-gray-500">
                          📊 {chapterWords.length} parole totali • Scorri per vedere tutte
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}
        </div>
      )}
    </div>
  );
};

// ⭐ SAME: Compact Word Card
const CompactWordCard = ({ 
  word, 
  isSelected, 
  onClick, 
  onToggleLearned, 
  onToggleDifficult 
}) => {
  const getStatusColor = (status) => {
    const colors = {
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

  const getStatusLabel = (status) => {
    const labels = {
      critical: '🔴',
      inconsistent: '🟠', 
      struggling: '🟡',
      promising: '🔵',
      improving: '🟢',
      consolidated: '🟢',
      new: '⚪'
    };
    return labels[status] || '⚪';
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
             
            {word.chapter && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                {word.chapter}
              </span>
            )}

            {word.hasPerformanceData && (
              <span className={`w-6 h-6 rounded-full text-white text-xs flex items-center justify-center ${getStatusColor(word.status)}`}>
                {getStatusLabel(word.status)}
              </span>
            )}
          </div>
        </div>

        {/* ⭐ COMPACT: Performance stats (only if available) */}
        {word.hasPerformanceData && (
          <div className="flex items-center gap-3 text-sm">
            <div className="text-center">
              <div className="font-bold text-blue-600">{word.accuracy}%</div>
              <div className="text-xs text-gray-500">Precisione</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-green-600">{word.currentStreak}</div>
              <div className="text-xs text-gray-500">Streak</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-purple-600">{word.avgTime}s</div>
              <div className="text-xs text-gray-500">Tempo</div>
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

export default WordsSection;