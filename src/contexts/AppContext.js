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
  const testAPI = useOptimizedTest((testStats, testWords, wrongWords) => {
    statsAPI.handleTestComplete(testStats, testWords, wrongWords);
  });

  // Sincronizzazione con editing word globale
  useEffect(() => {
    wordsAPI.setEditingWord(state.editingWord);
  }, [state.editingWord]);

  const value = {
    // Stato UI
    ...state,
    dispatch,
    
    // API Words
    words: wordsAPI.words,
    addWord: wordsAPI.addWord,
    removeWord: wordsAPI.removeWord,
    toggleWordLearned: wordsAPI.toggleWordLearned,
    clearAllWords: wordsAPI.clearAllWords,
    importWords: wordsAPI.importWords,
    getAvailableChapters: wordsAPI.getAvailableChapters,
    getChapterStats: wordsAPI.getChapterStats,
    wordStats: wordsAPI.wordStats,
    
    // API Test
    ...testAPI,
    
    // API Stats
    stats: statsAPI.stats,
    testHistory: statsAPI.testHistory,
    calculatedStats: statsAPI.calculatedStats,
    updateTestStats: statsAPI.updateTestStats,
    addTestToHistory: statsAPI.addTestToHistory,
    clearHistoryOnly: statsAPI.clearHistoryOnly,
    refreshData: statsAPI.refreshData,
    forceUpdate: statsAPI.forceUpdate,
    resetStats: statsAPI.resetStats,
    exportStats: statsAPI.exportStats,
    importStats: statsAPI.importStats
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