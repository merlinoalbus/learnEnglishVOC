// src/contexts/FirebaseAppContext.js
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useFirebaseWords } from '../hooks/useFirebaseWords';
// import { useFirebaseStats } from '../hooks/useFirebaseStats'; // Da implementare dopo
// import { useOptimizedTest } from '../hooks/useOptimizedTest'; // Il tuo hook esistente

const FirebaseAppContext = createContext();

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

export const FirebaseAppContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  // 🔥 Firebase-powered hooks
  const wordsAPI = useFirebaseWords();
  
  // 📊 Stats API - Per ora usiamo uno stub, implementeremo dopo
  const statsAPI = {
    stats: {},
    testHistory: [],
    wordPerformance: {},
    calculatedStats: {},
    handleTestComplete: () => console.log('Stats API not implemented yet'),
    addTestToHistory: () => {},
    clearHistoryOnly: () => {},
    refreshData: () => {},
    resetStats: () => {},
    exportStats: () => {},
    importStats: () => {},
    getAllWordsPerformance: () => [],
    getWordAnalysis: () => null,
    recordWordPerformance: () => {}
  };
  
  // 🧪 Test API - Per ora usiamo uno stub, implementeremo dopo
  const testAPI = {
    currentWord: null,
    showMeaning: false,
    testMode: false,
    stats: {},
    wrongWords: [],
    showHint: false,
    wordTimes: [],
    startTest: () => {},
    handleAnswer: () => {},
    getTestSummary: () => {}
  };

  // Sync editing word with global state
  useEffect(() => {
    if (wordsAPI.setEditingWord) {
      wordsAPI.setEditingWord(state.editingWord);
    }
  }, [state.editingWord, wordsAPI.setEditingWord]);

  const value = {
    // UI State (identico al tuo AppContext originale)
    ...state,
    dispatch,
    
    // 📝 Words API (Firebase-powered ma identica interfaccia)
    words: wordsAPI.words,
    addWord: wordsAPI.addWord,
    removeWord: wordsAPI.removeWord,
    toggleWordLearned: wordsAPI.toggleWordLearned,
    toggleWordDifficult: wordsAPI.toggleWordDifficult,
    clearAllWords: wordsAPI.clearAllWords,
    importWords: wordsAPI.importWords,
    forceRefresh: wordsAPI.forceRefresh,
    getAvailableChapters: wordsAPI.getAvailableChapters,
    getChapterStats: wordsAPI.getChapterStats,
    wordStats: wordsAPI.wordStats,
    
    // 🧪 Test API (identica interfaccia) - STUB per ora
    ...testAPI,
    
    // 📊 Stats API (identica interfaccia) - STUB per ora
    stats: statsAPI.stats,
    testHistory: statsAPI.testHistory,
    wordPerformance: statsAPI.wordPerformance,
    calculatedStats: statsAPI.calculatedStats,
    addTestToHistory: statsAPI.addTestToHistory,
    clearHistoryOnly: statsAPI.clearHistoryOnly,
    refreshData: statsAPI.refreshData,
    resetStats: statsAPI.resetStats,
    exportStats: statsAPI.exportStats,
    importStats: statsAPI.importStats,
    
    // 🎯 Word performance functions (identica interfaccia)
    getAllWordsPerformance: statsAPI.getAllWordsPerformance,
    getWordAnalysis: statsAPI.getWordAnalysis,
    recordWordPerformance: statsAPI.recordWordPerformance,
    
    // 🔥 Firebase-specific additions
    migrateFromLocalStorage: wordsAPI.migrateFromLocalStorage,
    isFirebaseMode: true, // Flag per indicare modalità Firebase
    loading: wordsAPI.loading
  };

  return (
    <FirebaseAppContext.Provider value={value}>
      {children}
    </FirebaseAppContext.Provider>
  );
};

export const useFirebaseAppContext = () => {
  const context = useContext(FirebaseAppContext);
  if (!context) {
    throw new Error('useFirebaseAppContext must be used within FirebaseAppContextProvider');
  }
  return context;
};

// Export per compatibilità con la tua app esistente
export { useFirebaseAppContext as useAppContext };