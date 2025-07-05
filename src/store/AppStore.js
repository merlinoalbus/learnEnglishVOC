// =====================================================
// 📁 src/store/AppStore.js - Optimized State Management
// =====================================================
// Duplica e ottimizza la logica di AppContext.js per dual-system testing

import React, { createContext, useContext, useReducer, useMemo, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { 
  generateId, 
  formatPercentage, 
  memoize
} from '../utils';
import { 
  TEST_CONFIG,
  ERROR_MESSAGES 
} from '../constants/appConstants';

// =====================================================
// Store State Structure (ottimizzata vs AppContext)
// =====================================================

const initialState = {
  // Core data (identico ad AppContext)
  words: [],
  
  // UI State (sync with AppContext defaults)
  currentView: 'main',
  editingWord: null,
  showWordsList: true, // ← Changed to match AppContext default
  
  // Test State (ottimizzato)
  testMode: false,
  showResults: false,
  currentWord: null,
  showMeaning: false,
  testWords: [],
  testIndex: 0,
  wrongWords: [],
  testCounters: { correct: 0, incorrect: 0, hints: 0, totalTime: 0 },
  testStartTime: null,
  showHint: false,
  hintUsed: false,
  currentWordStartTime: null,
  
  // Stats & History (ottimizzato)
  stats: {
    testsCompleted: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    totalWords: 0,
    streakDays: 0,
    lastStudyDate: null,
    timeSpent: 0,
    categoriesProgress: {}
  },
  testHistory: [],
  
  // Modal State
  confirmDelete: null,
  showConfirmClear: false,
  showChapterSelector: false,
  
  // Performance tracking
  forceUpdate: 0,
  isLoading: false,
  error: null
};

// =====================================================
// Action Types (tipizzati per debugging)
// =====================================================

const ActionTypes = {
  // Data actions
  SET_WORDS: 'SET_WORDS',
  ADD_WORD: 'ADD_WORD',
  UPDATE_WORD: 'UPDATE_WORD',
  REMOVE_WORD: 'REMOVE_WORD',
  TOGGLE_WORD_LEARNED: 'TOGGLE_WORD_LEARNED',
  TOGGLE_WORD_DIFFICULT: 'TOGGLE_WORD_DIFFICULT',
  IMPORT_WORDS: 'IMPORT_WORDS',
  CLEAR_ALL_WORDS: 'CLEAR_ALL_WORDS',
  
  // UI actions
  SET_VIEW: 'SET_VIEW',
  SET_EDITING_WORD: 'SET_EDITING_WORD',
  TOGGLE_WORDS_LIST: 'TOGGLE_WORDS_LIST',
  SET_WORDS_LIST_VISIBILITY: 'SET_WORDS_LIST_VISIBILITY',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  FORCE_UPDATE: 'FORCE_UPDATE',
  
  // Test actions
  START_TEST: 'START_TEST',
  END_TEST: 'END_TEST',
  SET_CURRENT_WORD: 'SET_CURRENT_WORD',
  TOGGLE_MEANING: 'TOGGLE_MEANING',
  ANSWER_WORD: 'ANSWER_WORD',
  TOGGLE_HINT: 'TOGGLE_HINT',
  RESET_TEST: 'RESET_TEST',
  
  // Modal actions
  SET_CONFIRM_DELETE: 'SET_CONFIRM_DELETE',
  SET_SHOW_CONFIRM_CLEAR: 'SET_SHOW_CONFIRM_CLEAR',
  SET_SHOW_CHAPTER_SELECTOR: 'SET_SHOW_CHAPTER_SELECTOR',
  
  // Stats actions
  UPDATE_STATS: 'UPDATE_STATS',
  ADD_TEST_HISTORY: 'ADD_TEST_HISTORY',
  CLEAR_HISTORY_ONLY: 'CLEAR_HISTORY_ONLY'
};

// =====================================================
// Reducer (ottimizzato con performance)
// =====================================================

const storeReducer = (state, action) => {
  switch (action.type) {
    // Data mutations
    case ActionTypes.SET_WORDS:
      return { ...state, words: action.payload };
      
    case ActionTypes.ADD_WORD: {
      const newWord = {
        id: generateId(),
        ...action.payload,
        createdAt: Date.now(),
        lastModified: Date.now()
      };
      return { ...state, words: [...state.words, newWord] };
    }
    
    case ActionTypes.UPDATE_WORD: {
      const updatedWords = state.words.map(word =>
        word.id === action.payload.id
          ? { ...word, ...action.payload, lastModified: Date.now() }
          : word
      );
      return { ...state, words: updatedWords };
    }
    
    case ActionTypes.REMOVE_WORD: {
      const filteredWords = state.words.filter(word => word.id !== action.payload);
      return { ...state, words: filteredWords };
    }
    
    case ActionTypes.TOGGLE_WORD_LEARNED: {
      const toggledWords = state.words.map(word =>
        word.id === action.payload
          ? { ...word, learned: !word.learned, lastModified: Date.now() }
          : word
      );
      return { ...state, words: toggledWords };
    }
    
    case ActionTypes.TOGGLE_WORD_DIFFICULT: {
      const toggledWords = state.words.map(word =>
        word.id === action.payload
          ? { ...word, difficult: !word.difficult, lastModified: Date.now() }
          : word
      );
      return { ...state, words: toggledWords };
    }
    
    case ActionTypes.IMPORT_WORDS: {
      return { ...state, words: [...state.words, ...action.payload] };
    }
    
    case ActionTypes.CLEAR_ALL_WORDS:
      return { ...state, words: [] };
    
    // UI mutations
    case ActionTypes.SET_VIEW:
      return { ...state, currentView: action.payload };
      
    case ActionTypes.SET_EDITING_WORD:
      return { ...state, editingWord: action.payload };
      
    case ActionTypes.TOGGLE_WORDS_LIST:
      return { ...state, showWordsList: !state.showWordsList };
      
    case ActionTypes.SET_WORDS_LIST_VISIBILITY:
      return { ...state, showWordsList: action.payload };
      
    case ActionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload };
      
    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload };
      
    case ActionTypes.FORCE_UPDATE:
      return { ...state, forceUpdate: state.forceUpdate + 1 };
    
    // Test mutations
    case ActionTypes.START_TEST: {
      return {
        ...state,
        testMode: true,
        showResults: false,
        testWords: action.payload.words,
        testIndex: 0,
        currentWord: action.payload.words[0] || null,
        wrongWords: [],
        testCounters: { correct: 0, incorrect: 0, hints: 0, totalTime: 0 },
        testStartTime: Date.now(),
        showMeaning: false,
        showHint: false,
        hintUsed: false,
        currentWordStartTime: Date.now()
      };
    }
    
    case ActionTypes.SET_CURRENT_WORD: {
      return {
        ...state,
        currentWord: action.payload,
        showMeaning: false,
        showHint: false,
        hintUsed: false,
        currentWordStartTime: Date.now()
      };
    }
    
    case ActionTypes.TOGGLE_MEANING:
      return { ...state, showMeaning: !state.showMeaning };
      
    case ActionTypes.ANSWER_WORD: {
      const isCorrect = action.payload;
      const newCounters = {
        ...state.testCounters,
        correct: state.testCounters.correct + (isCorrect ? 1 : 0),
        incorrect: state.testCounters.incorrect + (isCorrect ? 0 : 1),
        hints: state.testCounters.hints + (state.hintUsed ? 1 : 0)
      };
      
      // Add to wrong words if incorrect
      const newWrongWords = isCorrect 
        ? state.wrongWords 
        : [...state.wrongWords, { ...state.currentWord, usedHint: state.hintUsed }];
      
      // Calculate word time
      const wordTime = state.currentWordStartTime 
        ? Math.floor((Date.now() - state.currentWordStartTime) / 1000)
        : 0;
      
      newCounters.totalTime = state.testCounters.totalTime + wordTime;
      
      return {
        ...state,
        testCounters: newCounters,
        wrongWords: newWrongWords,
        showMeaning: false,
        showHint: false,
        hintUsed: false
      };
    }
    
    case ActionTypes.TOGGLE_HINT: {
      if (state.hintUsed) return state;
      
      return {
        ...state,
        showHint: !state.showHint,
        hintUsed: !state.showHint ? true : state.hintUsed
      };
    }
    
    case ActionTypes.END_TEST: {
      return {
        ...state,
        testMode: false,
        showResults: true,
        currentWord: null
      };
    }
    
    case ActionTypes.RESET_TEST: {
      return {
        ...state,
        testMode: false,
        showResults: false,
        currentWord: null,
        testWords: [],
        testIndex: 0,
        wrongWords: [],
        testCounters: { correct: 0, incorrect: 0, hints: 0, totalTime: 0 },
        showMeaning: false,
        showHint: false,
        hintUsed: false
      };
    }
    
    // Modal mutations
    case ActionTypes.SET_CONFIRM_DELETE:
      return { ...state, confirmDelete: action.payload };
      
    case ActionTypes.SET_SHOW_CONFIRM_CLEAR:
      return { ...state, showConfirmClear: action.payload };
      
    case ActionTypes.SET_SHOW_CHAPTER_SELECTOR:
      return { ...state, showChapterSelector: action.payload };
    
    // Stats mutations
    case ActionTypes.UPDATE_STATS:
      return { ...state, stats: { ...state.stats, ...action.payload } };
      
    case ActionTypes.ADD_TEST_HISTORY: {
      // Handle both single test and array of tests
      const newTests = Array.isArray(action.payload) ? action.payload : [action.payload];
      return { 
        ...state, 
        testHistory: [...newTests, ...state.testHistory].slice(0, 1000) // Limit history
      };
    }
      
    case ActionTypes.CLEAR_HISTORY_ONLY:
      return { ...state, testHistory: [] };
    
    default:
      return state;
  }
};

// =====================================================
// Store Context
// =====================================================

const AppStoreContext = createContext(null);

// =====================================================
// Store Provider Component
// =====================================================

export const AppStoreProvider = ({ children }) => {
  const [state, dispatch] = useReducer(storeReducer, initialState);

  // =====================================================
  // Data Persistence (ottimizzato con debouncing)
  // =====================================================

  // Load initial data
  useEffect(() => {
    console.log('🔄 AppStore: Loading initial data...');
    try {
      const words = storageService.getWords();
      const stats = storageService.getStats();
      const testHistory = storageService.getTestHistory();
      const settings = storageService.getSettings();
      
      console.log('📊 AppStore: Data loaded from storage:', {
        wordsCount: words.length,
        statsKeys: Object.keys(stats).length,
        historyCount: testHistory.length,
        settingsKeys: Object.keys(settings).length
      });
      
      // Always dispatch words (even if empty array)
      dispatch({ type: ActionTypes.SET_WORDS, payload: words });
      
      // Always dispatch stats (merged with defaults)
      dispatch({ type: ActionTypes.UPDATE_STATS, payload: stats });
      
      // Load UI preferences if available
      if (settings.showWordsList !== undefined) {
        // Set to match the saved preference
        dispatch({ 
          type: ActionTypes.SET_WORDS_LIST_VISIBILITY, 
          payload: settings.showWordsList 
        });
      }
      
      // Always dispatch history (even if empty)
      if (testHistory.length > 0) {
        // Dispatch the entire history array at once
        dispatch({ type: ActionTypes.ADD_TEST_HISTORY, payload: testHistory });
      }
      
      console.log('✅ AppStore: Initial data loaded successfully');
    } catch (error) {
      console.error('❌ AppStore: Error loading initial data:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: ERROR_MESSAGES.storage });
    }
  }, []);

  // Save words when they change (debounced)
  const saveWords = useMemo(
    () => memoize((words) => {
      try {
        storageService.saveWords(words);
      } catch (error) {
        console.error('Error saving words:', error);
        dispatch({ type: ActionTypes.SET_ERROR, payload: ERROR_MESSAGES.storage });
      }
    }),
    []
  );

  useEffect(() => {
    saveWords(state.words);
  }, [state.words, saveWords]);

  // Save stats when they change
  const saveStats = useMemo(
    () => memoize((stats) => {
      try {
        storageService.saveStats(stats);
      } catch (error) {
        console.error('Error saving stats:', error);
      }
    }),
    []
  );

  useEffect(() => {
    saveStats(state.stats);
  }, [state.stats, saveStats]);

  // Save test history when it changes
  const saveTestHistory = useMemo(
    () => memoize((history) => {
      try {
        storageService.saveTestHistory(history);
      } catch (error) {
        console.error('Error saving test history:', error);
      }
    }),
    []
  );

  useEffect(() => {
    saveTestHistory(state.testHistory);
  }, [state.testHistory, saveTestHistory]);

  // =====================================================
  // Memoized Selectors (performance optimization)
  // =====================================================

  const wordStats = useMemo(() => {
    const total = state.words.length;
    const learned = state.words.filter(w => w.learned).length;
    const unlearned = total - learned;
    const difficult = state.words.filter(w => w.difficult).length;
    
    return { total, learned, unlearned, difficult };
  }, [state.words]);

  const availableChapters = useMemo(() => {
    const chapters = new Set();
    state.words.forEach(word => {
      if (word.chapter) chapters.add(word.chapter);
    });
    return Array.from(chapters).sort((a, b) => {
      const aNum = parseInt(a);
      const bNum = parseInt(b);
      return !isNaN(aNum) && !isNaN(bNum) ? aNum - bNum : a.localeCompare(b);
    });
  }, [state.words]);

  const testProgress = useMemo(() => {
    if (!state.testWords.length) return { current: 0, total: 0, percentage: 0 };
    
    const current = state.testIndex + 1;
    const total = state.testWords.length;
    const percentage = Math.round((current / total) * 100);
    
    return { current, total, percentage, hints: state.testCounters.hints };
  }, [state.testWords.length, state.testIndex, state.testCounters.hints]);

  const testSummary = useMemo(() => {
    const { correct, incorrect, totalTime } = state.testCounters;
    const total = correct + incorrect;
    const accuracy = total > 0 ? formatPercentage(correct, total) : 0;
    const avgTimePerWord = total > 0 ? Math.round(totalTime / total) : 0;
    const remaining = state.testWords.length - state.testIndex - 1;
    
    return { 
      correct, 
      incorrect, 
      total, 
      accuracy, 
      remaining,
      totalTime,
      avgTimePerWord
    };
  }, [state.testCounters, state.testWords.length, state.testIndex]);

  // =====================================================
  // Action Creators (memoized for performance)
  // =====================================================

  const actions = useMemo(() => ({
    // Word management
    addWord: (wordData) => {
      dispatch({ type: ActionTypes.ADD_WORD, payload: wordData });
    },
    
    updateWord: (wordData) => {
      dispatch({ type: ActionTypes.UPDATE_WORD, payload: wordData });
    },
    
    removeWord: (id) => {
      dispatch({ type: ActionTypes.REMOVE_WORD, payload: id });
    },
    
    toggleWordLearned: (id) => {
      dispatch({ type: ActionTypes.TOGGLE_WORD_LEARNED, payload: id });
    },
    
    toggleWordDifficult: (id) => {
      dispatch({ type: ActionTypes.TOGGLE_WORD_DIFFICULT, payload: id });
    },
    
    clearAllWords: () => {
      dispatch({ type: ActionTypes.CLEAR_ALL_WORDS });
    },
    
    importWords: (jsonText) => {
      try {
        const data = JSON.parse(jsonText);
        if (!Array.isArray(data)) {
          throw new Error('JSON must contain an array of words');
        }
        
        const validWords = data.filter(word => 
          word.english && word.italian && 
          typeof word.english === 'string' && 
          typeof word.italian === 'string'
        ).map(word => ({
          ...word,
          id: word.id || generateId(),
          learned: Boolean(word.learned),
          difficult: Boolean(word.difficult),
          createdAt: word.createdAt || Date.now(),
          lastModified: Date.now()
        }));
        
        dispatch({ type: ActionTypes.IMPORT_WORDS, payload: validWords });
        return validWords.length;
      } catch (error) {
        throw new Error(`Import failed: ${error.message}`);
      }
    },
    
    // UI management
    setView: (view) => {
      dispatch({ type: ActionTypes.SET_VIEW, payload: view });
    },
    
    setEditingWord: (word) => {
      dispatch({ type: ActionTypes.SET_EDITING_WORD, payload: word });
    },
    
    toggleWordsList: () => {
      dispatch({ type: ActionTypes.TOGGLE_WORDS_LIST });
    },
    
    forceUpdate: () => {
      dispatch({ type: ActionTypes.FORCE_UPDATE });
    },
    
    // Test management
    startTest: (words) => {
      dispatch({ type: ActionTypes.START_TEST, payload: { words } });
    },
    
    nextWord: () => {
      const nextIndex = state.testIndex + 1;
      if (nextIndex < state.testWords.length) {
        dispatch({ type: ActionTypes.SET_CURRENT_WORD, payload: state.testWords[nextIndex] });
        return true;
      } else {
        dispatch({ type: ActionTypes.END_TEST });
        return false;
      }
    },
    
    handleAnswer: (isCorrect) => {
      dispatch({ type: ActionTypes.ANSWER_WORD, payload: isCorrect });
      
      // Auto advance to next word
      setTimeout(() => {
        const nextIndex = state.testIndex + 1;
        if (nextIndex < state.testWords.length) {
          dispatch({ type: ActionTypes.SET_CURRENT_WORD, payload: state.testWords[nextIndex] });
        } else {
          dispatch({ type: ActionTypes.END_TEST });
        }
      }, TEST_CONFIG.autoAdvanceDelay);
    },
    
    toggleHint: () => {
      dispatch({ type: ActionTypes.TOGGLE_HINT });
    },
    
    setShowMeaning: (show) => {
      dispatch({ type: ActionTypes.TOGGLE_MEANING });
    },
    
    resetTest: () => {
      dispatch({ type: ActionTypes.RESET_TEST });
    },
    
    // Modal management
    setConfirmDelete: (word) => {
      dispatch({ type: ActionTypes.SET_CONFIRM_DELETE, payload: word });
    },
    
    setShowConfirmClear: (show) => {
      dispatch({ type: ActionTypes.SET_SHOW_CONFIRM_CLEAR, payload: show });
    },
    
    setShowChapterSelector: (show) => {
      dispatch({ type: ActionTypes.SET_SHOW_CHAPTER_SELECTOR, payload: show });
    }
  }), [state.testIndex, state.testWords]);

  // =====================================================
  // Context Value (memoized for performance)
  // =====================================================

  const contextValue = useMemo(() => ({
    // State
    ...state,
    
    // Computed values
    wordStats,
    availableChapters,
    testProgress,
    testSummary,
    
    // Actions
    ...actions,
    
    // Direct dispatch for complex operations
    dispatch
  }), [state, wordStats, availableChapters, testProgress, testSummary, actions]);

  return (
    <AppStoreContext.Provider value={contextValue}>
      {children}
    </AppStoreContext.Provider>
  );
};

// =====================================================
// Store Hook
// =====================================================

export const useAppStore = () => {
  const context = useContext(AppStoreContext);
  if (!context) {
    throw new Error('useAppStore must be used within an AppStoreProvider');
  }
  return context;
};