import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useOptimizedWords } from '../hooks/useOptimizedWords';
import { useOptimizedTest } from '../hooks/useOptimizedTest';
import { useOptimizedStats } from '../hooks/useOptimizedStats';

const AppContext = createContext();

const initialState = {
  currentView: 'main',
  showWordsList: true,
  editingWord: null,
  showChapterSelector: false,
  confirmDelete: null,
  showConfirmClear: false
};

const appReducer = (state, action) => {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, currentView: action.payload };
    case 'TOGGLE_WORDS_LIST':
      return { ...state, showWordsList: !state.showWordsList };
    case 'SET_EDITING_WORD':
      return { ...state, editingWord: action.payload };
    case 'SET_SHOW_CHAPTER_SELECTOR':
      return { ...state, showChapterSelector: action.payload };
    case 'SET_CONFIRM_DELETE':
      return { ...state, confirmDelete: action.payload };
    case 'SET_SHOW_CONFIRM_CLEAR':
      return { ...state, showConfirmClear: action.payload };
    case 'RESET_MODALS':
      return {
        ...state,
        confirmDelete: null,
        showConfirmClear: false,
        showChapterSelector: false
      };
    default:
      return state;
  }
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  // Hook centralizzati
  const wordsAPI = useOptimizedWords();
  const statsAPI = useOptimizedStats();
  
  // ⭐ ENHANCED: Test API with proper stats callback
  const testAPI = useOptimizedTest((testStats, testWords, wrongWords) => {
    console.log('🔗 AppContext: Test completed, calling handleTestComplete with:', {
      testStats,
      testWordsCount: testWords.length,
      wrongWordsCount: wrongWords.length
    });
    
    // ⭐ CRITICAL: Pass enhanced stats including hints and timing
    statsAPI.handleTestComplete(testStats, testWords, wrongWords);
  });

  // Sincronizzazione con editing word globale
  useEffect(() => {
    wordsAPI.setEditingWord(state.editingWord);
  }, [state.editingWord]);

  // ⭐ DEBUG: Log quando le funzioni stats sono disponibili
  useEffect(() => {
    console.log('📊 StatsAPI functions available:', {
      getAllWordsPerformance: !!statsAPI.getAllWordsPerformance,
      getWordAnalysis: !!statsAPI.getWordAnalysis,
      wordPerformance: !!statsAPI.wordPerformance
    });
  }, [statsAPI.getAllWordsPerformance, statsAPI.getWordAnalysis, statsAPI.wordPerformance]);

  const value = {
    // Stato UI
    ...state,
    dispatch,
    
    // API Words - ⭐ ENHANCED: Added difficult toggle and forceRefresh
    words: wordsAPI.words,
    addWord: wordsAPI.addWord,
    removeWord: wordsAPI.removeWord,
    toggleWordLearned: wordsAPI.toggleWordLearned,
    toggleWordDifficult: wordsAPI.toggleWordDifficult,
    clearAllWords: wordsAPI.clearAllWords,
    importWords: wordsAPI.importWords,
    forceRefresh: wordsAPI.forceRefresh, // ⭐ NEW: Expose force refresh
    getAvailableChapters: wordsAPI.getAvailableChapters,
    getChapterStats: wordsAPI.getChapterStats,
    wordStats: wordsAPI.wordStats,
    
    // API Test - ⭐ ENHANCED: With timer and hints
    ...testAPI,
    
    // API Stats - ⭐ FIXED: Properly expose word performance functions
    stats: statsAPI.stats,
    testHistory: statsAPI.testHistory,
    wordPerformance: statsAPI.wordPerformance,
    calculatedStats: statsAPI.calculatedStats,
    updateTestStats: statsAPI.updateTestStats,
    addTestToHistory: statsAPI.addTestToHistory,
    clearHistoryOnly: statsAPI.clearHistoryOnly,
    refreshData: statsAPI.refreshData,
    forceUpdate: statsAPI.forceUpdate,
    resetStats: statsAPI.resetStats,
    exportStats: statsAPI.exportStats,
    importStats: statsAPI.importStats,
    
    // ⭐ CRITICAL: Word performance functions
    getAllWordsPerformance: statsAPI.getAllWordsPerformance,
    getWordAnalysis: statsAPI.getWordAnalysis,
    recordWordPerformance: statsAPI.recordWordPerformance
  };

  // ⭐ DEBUG: Final context value check
  console.log('🔗 AppContext value includes word functions:', {
    getAllWordsPerformance: !!value.getAllWordsPerformance,
    getWordAnalysis: !!value.getWordAnalysis,
    wordPerformance: !!value.wordPerformance,
    forceRefresh: !!value.forceRefresh // ⭐ NEW
  });

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};