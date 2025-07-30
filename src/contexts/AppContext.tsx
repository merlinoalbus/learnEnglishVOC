import React, { createContext, useContext, useReducer, useEffect, ReactNode } from "react";
import { useWords } from "../hooks/data/useWords";
import { useTest } from "../hooks/data/useTest";
import { useStats } from "../hooks/data/useStats";
import { Word, TestHistoryItem, Statistics, WordPerformance, TestStats } from "../types";

// =====================================================
// 🎯 TYPE DEFINITIONS
// =====================================================

type AppView = "main" | "test" | "results" | "stats" | "auth" | "settings" | "profile" | "admin" | "privacy" | "terms";

interface AppState {
  currentView: AppView;
  previousView: AppView | null;
  authReturnContext: { view: AppView; data?: any; source?: string; formData?: any } | null;
  showWordsList: boolean;
  editingWord: Word | null;
  showChapterSelector: boolean;
  confirmDelete: Word | null;
  showConfirmClear: boolean;
}

type AppAction = 
  | { type: "SET_VIEW"; payload: AppView; authContext?: { view: AppView; data?: any; source?: string; formData?: any } }
  | { type: "GO_BACK" }
  | { type: "CLEAR_AUTH_CONTEXT" }
  | { type: "TOGGLE_WORDS_LIST" }
  | { type: "SET_EDITING_WORD"; payload: Word | null }
  | { type: "SET_SHOW_CHAPTER_SELECTOR"; payload: boolean }
  | { type: "SET_CONFIRM_DELETE"; payload: Word | null }
  | { type: "SET_SHOW_CONFIRM_CLEAR"; payload: boolean }
  | { type: "RESET_MODALS" };

interface AppContextType extends AppState {
  dispatch: React.Dispatch<AppAction>;
  
  // Words API
  words: Word[];
  addWord: (word: any) => Promise<any>;
  removeWord: (id: string) => Promise<any>;
  updateWord: (id: string, updates: any) => Promise<any>;
  toggleWordLearned: (id: string) => Promise<any>;
  toggleWordDifficult: (id: string) => Promise<any>;
  clearAllWords: () => Promise<any>;
  importWords: (words: any) => Promise<any>;
  forceRefresh: () => void;
  getAvailableChapters: () => string[];
  getChapterStats: (chapter: string) => { total: number; learned: number; difficult: number };
  wordStats: { total: number; learned: number; difficult: number };

  // Test API
  currentTest: any;
  testWords: Word[];
  currentWordIndex: number;
  showAnswer: boolean;
  testSettings: any;
  testResults: TestHistoryItem | null;
  isTestActive: boolean;
  testMode: boolean;
  showResults: boolean;
  startTest: (settings: any) => void;
  nextWord: () => void;
  submitAnswer: (answer: string) => void;
  endTest: () => void;
  resetTest: () => void;
  
  // Additional Test Properties
  currentWord: any;
  showMeaning: boolean;
  setShowMeaning: (show: boolean) => void;
  handleAnswer: (isCorrect: boolean, isTimeout?: boolean) => void;
  getTestProgress: () => any;
  getTestSummary: () => any;
  showHint: boolean;
  toggleHint: () => void;
  hintUsed: boolean;
  isTransitioning: boolean;
  wrongWords: any[];
  startNewTest: () => void;

  // Game mode hints
  gameHints: any;
  totalHintsUsed: number;
  testConfig: any;
  handleGameHintRequest: (type: 'synonym' | 'antonym' | 'context') => void;

  // Enhanced tracking per tutti i test
  currentWordSession: any;
  detailedSession: any;
  currentWordStartTime: Date | null;
  hintSequenceCounter: number;

  // Stats API
  stats: Statistics;
  testHistory: TestHistoryItem[];
  wordPerformance: any;
  calculatedStats: any;
  refreshData: () => void;
  resetStats: () => Promise<any>;
  exportStats: () => any;
  importStats: (data: any) => Promise<any>;
  handleTestComplete: (testStats: any, testWords: Word[], wrongWords: Word[], detailedSession?: any) => void;
  clearHistoryOnly: () => Promise<any>;
  clearAllStatistics: () => Promise<any>; // ⭐ NEW: Clear all statistics function
  addTestToHistory: (testResult: TestHistoryItem) => void;
  getAllWordsPerformance: () => any;
  getWordAnalysis: (wordId: string) => any;
  recordWordPerformance: (wordId: string, performance: any) => void;

  // Flags di stato
  isProcessing: boolean;
  isInitialized: boolean;

  // Metriche
  totalTests: number;
  totalAnswers: number;
  accuracyRate: number;
  hintsRate: number;
  weeklyProgress: any[];
  isMigrated: boolean;
}

// =====================================================
// 🏗️ CONTEXT SETUP
// =====================================================

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialState: AppState = {
  currentView: "main",
  previousView: null,
  authReturnContext: null,
  showWordsList: true,
  editingWord: null,
  showChapterSelector: false,
  confirmDelete: null,
  showConfirmClear: false,
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case "SET_VIEW":
      return { 
        ...state, 
        previousView: state.currentView,
        currentView: action.payload,
        authReturnContext: action.authContext || state.authReturnContext
      };
    case "GO_BACK":
      return {
        ...state,
        currentView: state.previousView || "main",
        previousView: null
      };
    case "CLEAR_AUTH_CONTEXT":
      return {
        ...state,
        authReturnContext: null
      };
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

// =====================================================
// 🎁 PROVIDER COMPONENT
// =====================================================

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
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
  const testCompleteCallback = async (testStats: any, testWords: Word[], wrongWords: Word[], detailedSession?: any) => {
    await statsAPI.handleTestComplete(testStats, testWords, wrongWords, detailedSession);
    // ⭐ FIX: Force refresh per aggiornare subito testHistory nel navigation
    statsAPI.refreshData();
  };

  const testAPI = useTest(testCompleteCallback);

  useEffect(() => {
    if (wordsAPI.setEditingWord) {
      wordsAPI.setEditingWord(state.editingWord);
    }
  }, [state.editingWord, wordsAPI]);

  const value: AppContextType = {
    // State del context
    ...state,
    dispatch,

    // Words API
    words: wordsAPI.words || [],
    addWord: wordsAPI.addWord,
    removeWord: wordsAPI.removeWord,
    updateWord: wordsAPI.updateWord as any,
    toggleWordLearned: wordsAPI.toggleWordLearned,
    toggleWordDifficult: wordsAPI.toggleWordDifficult,
    clearAllWords: wordsAPI.clearAllWords,
    importWords: wordsAPI.importWords,
    forceRefresh: wordsAPI.forceRefresh,
    getAvailableChapters: wordsAPI.getAvailableChapters,
    getChapterStats: wordsAPI.getChapterStats,
    wordStats: wordsAPI.wordStats,

    // Test API  
    currentTest: null,
    currentWordIndex: 0,
    showAnswer: false,
    testSettings: {},
    testResults: null,
    isTestActive: false,
    nextWord: () => {},
    submitAnswer: () => {},
    endTest: () => {},
    
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
    clearAllStatistics: statsAPI.clearAllStatistics, // ⭐ NEW: Clear all statistics function
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
    weeklyProgress: (statsAPI.weeklyProgress || []) as any[],
    isMigrated: statsAPI.isMigrated || false,

    // Game mode hints properties
    gameHints: testAPI.gameHints || {},
    totalHintsUsed: testAPI.totalHintsUsed || 0,
    testConfig: testAPI.testConfig || null,
    handleGameHintRequest: testAPI.handleGameHintRequest || (() => {}),

    // Aggiungo le proprietà mancanti
    hintUsed: testAPI.hintUsed || false,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// =====================================================
// 🪝 CUSTOM HOOK
// =====================================================

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
};