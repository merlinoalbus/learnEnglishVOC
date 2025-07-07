import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useOptimizedWords } from '../hooks/useOptimizedWords';
import { useOptimizedTest } from '../hooks/useOptimizedTest';
import { useEnhancedStats } from '../hooks/useEnhancedStats';

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
  const statsAPI = useEnhancedStats();
  
  // ⭐ ENHANCED: Test API with proper stats callback
  const testAPI = useOptimizedTest((testStats, testWords, wrongWords) => {
    // ⭐ CRITICAL: Pass enhanced stats including hints and timing
    statsAPI.handleTestComplete(testStats, testWords, wrongWords);
  });

  // Sincronizzazione con editing word globale
  useEffect(() => {
    wordsAPI.setEditingWord(state.editingWord);
  }, [state.editingWord, wordsAPI]);

  // ⭐ DEBUG: Log quando le funzioni stats sono disponibili
  useEffect(() => {
    console.log('🔍 statsAPI functions available:', {
      exportData: typeof statsAPI.exportData,
      importData: typeof statsAPI.importData,
      clearTestHistory: typeof statsAPI.clearTestHistory,
      clearHistoryOnly: typeof statsAPI.clearHistoryOnly,
      refreshData: typeof statsAPI.refreshData,
      getAllWordsPerformance: typeof statsAPI.getAllWordsPerformance,
      getWordAnalysis: typeof statsAPI.getWordAnalysis,
      recordWordPerformance: typeof statsAPI.recordWordPerformance
    });
  }, [statsAPI]);

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
    
    // ⭐ FIXED: API Stats - Properly mapped to useEnhancedStats functions
    stats: statsAPI.stats,
    testHistory: statsAPI.testHistory,
    wordPerformance: statsAPI.wordPerformance,
    calculatedStats: statsAPI.calculatedStats,
    
    // ⭐ FIXED: Core functions mapped correctly
    refreshData: statsAPI.refreshData,
    resetStats: statsAPI.resetStats,              // ✅ Maps to resetStats (clears everything)
    exportStats: statsAPI.exportData,             // ✅ Maps to exportData
    importStats: statsAPI.importData,             // ✅ Maps to importData (accepts JSON string)
    
    // ⭐ FIXED: Additional stats functions
    handleTestComplete: statsAPI.handleTestComplete,
    clearHistoryOnly: statsAPI.clearHistoryOnly,  // ✅ Clear only test history
    addTestToHistory: statsAPI.addTestToHistory,
    
    // ⭐ CRITICAL: Word performance functions properly exposed
    getAllWordsPerformance: statsAPI.getAllWordsPerformance,
    getWordAnalysis: statsAPI.getWordAnalysis,
    recordWordPerformance: statsAPI.recordWordPerformance,
    
    // ⭐ NEW: Loading and processing states
    isProcessing: statsAPI.isLoading || statsAPI.isProcessing || false,
    isInitialized: statsAPI.isInitialized,
    
    // ⭐ NEW: Enhanced computed stats
    totalTests: statsAPI.totalTests || 0,
    totalAnswers: statsAPI.totalAnswers || 0,
    accuracyRate: statsAPI.accuracyRate || 0,
    hintsRate: statsAPI.hintsRate || 0,
    weeklyProgress: statsAPI.weeklyProgress || [],
    isMigrated: statsAPI.isMigrated || false
  };

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