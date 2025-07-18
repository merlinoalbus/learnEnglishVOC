import React, { createContext, useContext, useReducer, useEffect } from "react";
import { useWords } from "../hooks/data/useWords";
import { useTest } from "../hooks/data/useTest";
import { useStats } from "../hooks/data/useStats";

const AppContext = createContext();

const initialState = {
  currentView: "main",
  showWordsList: true,
  editingWord: null,
  showChapterSelector: false,
  confirmDelete: null,
  showConfirmClear: false,
};

const appReducer = (state, action) => {
  switch (action.type) {
    case "SET_VIEW":
      return { ...state, currentView: action.payload };
    case "TOGGLE_WORDS_LIST":
      return { ...state, showWordsList: !state.showWordsList };
    case "SET_EDITING_WORD":
      return { ...state, editingWord: action.payload };
    case "SET_SHOW_CHAPTER_SELECTOR":
      return { ...state, showChapterSelector: action.payload };
    case "SET_CONFIRM_DELETE":
      return { ...state, confirmDelete: action.payload };
    case "SET_SHOW_CONFIRM_CLEAR":
      return { ...state, showConfirmClear: action.payload };
    case "RESET_MODALS":
      return {
        ...state,
        confirmDelete: null,
        showConfirmClear: false,
        showChapterSelector: false,
      };
    default:
      return state;
  }
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Listen for reset to main view after login
  useEffect(() => {
    const handleResetToMain = () => {
      dispatch({ type: "SET_VIEW", payload: "main" });
    };
    
    window.addEventListener('resetToMainView', handleResetToMain);
    return () => window.removeEventListener('resetToMainView', handleResetToMain);
  }, []);

  // Usa gli hooks base invece delle versioni "ottimizzate"
  const wordsAPI = useWords();
  const statsAPI = useStats();

  // Callback per completamento test
  const testCompleteCallback = (testStats, testWords, wrongWords) => {
    statsAPI.handleTestComplete(testStats, testWords, wrongWords);
  };

  const testAPI = useTest(testCompleteCallback);

  useEffect(() => {
    if (wordsAPI.setEditingWord) {
      wordsAPI.setEditingWord(state.editingWord);
    }
  }, [state.editingWord, wordsAPI]);

  const value = {
    // State del context
    ...state,
    dispatch,

    // Words API
    words: wordsAPI.words || [],
    addWord: wordsAPI.addWord,
    removeWord: wordsAPI.removeWord,
    updateWord:
      wordsAPI.updateWord || (() => Promise.resolve({ success: false })),
    toggleWordLearned: wordsAPI.toggleWordLearned,
    toggleWordDifficult: wordsAPI.toggleWordDifficult,
    clearAllWords: wordsAPI.clearAllWords,
    importWords: wordsAPI.importWords,
    forceRefresh: wordsAPI.forceRefresh,
    getAvailableChapters: wordsAPI.getAvailableChapters,
    getChapterStats: wordsAPI.getChapterStats,
    wordStats: wordsAPI.wordStats,

    // Test API
    ...testAPI,

    // Stats API
    stats: statsAPI.stats,
    testHistory: statsAPI.testHistory || [],
    wordPerformance: statsAPI.wordPerformance || {},
    calculatedStats: statsAPI.calculatedStats,
    refreshData: statsAPI.refreshData,
    resetStats: statsAPI.resetStats,
    exportStats: statsAPI.exportData,
    importStats: statsAPI.importData,
    handleTestComplete: statsAPI.handleTestComplete,
    clearHistoryOnly: statsAPI.clearHistoryOnly,
    addTestToHistory: statsAPI.addTestToHistory,
    getAllWordsPerformance: statsAPI.getAllWordsPerformance,
    getWordAnalysis: statsAPI.getWordAnalysis,
    recordWordPerformance: statsAPI.recordWordPerformance,

    // Flags di stato
    isProcessing: statsAPI.isLoading || statsAPI.isProcessing || false,
    isInitialized: statsAPI.isInitialized || false,

    // Metriche
    totalTests: statsAPI.totalTests || 0,
    totalAnswers: statsAPI.totalAnswers || 0,
    accuracyRate: statsAPI.accuracyRate || 0,
    hintsRate: statsAPI.hintsRate || 0,
    weeklyProgress: statsAPI.weeklyProgress || [],
    isMigrated: statsAPI.isMigrated || false,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
};
