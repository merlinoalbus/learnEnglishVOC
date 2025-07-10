// =====================================================
// 📁 src/types/hooks.ts - Hooks Type Definitions
// =====================================================

import { 
  Word, 
  WordInput, 
  WordStats, 
  ChapterStats, 
  TestStats, 
  EnhancedTestStats,
  WordTimeRecord,
  AppStats,
  TestResult,
  WordPerformance,
  WordAnalysis,
  LoadingState,
  LoadingOptions
} from './global';

// ===== WORDS HOOK TYPES =====

export interface OptimizedWordsReturn {
  // Data
  words: Word[];
  editingWord: Word | null;
  wordStats: WordStats;
  
  // Actions
  setEditingWord: (word: Word | null) => void;
  addWord: (wordData: WordInput) => Promise<void>;
  removeWord: (id: string) => void;
  toggleWordLearned: (id: string) => void;
  toggleWordDifficult: (id: string) => void;
  clearAllWords: () => void;
  importWords: (jsonText: string) => number;
  forceRefresh: () => void;
  
  // Getters
  getWordsByChapter: (chapter: string) => Word[];
  getDifficultWordsByChapter: (chapter: string) => Word[];
  getAvailableChapters: () => string[];
  getChapterStats: (chapter: string) => ChapterStats;
}

// ===== TEST HOOK TYPES =====

export interface TestProgress {
  current: number;
  total: number;
  percentage: number;
  hints: number;
}

export interface TestSummary extends TestProgress {
  answered: number;
  remaining: number;
  accuracy: number;
  correct: number;
  incorrect: number;
  hints: number;
  totalTime: number;
  avgTimePerWord: number;
  maxTimePerWord: number;
  minTimePerWord: number;
  totalRecordedTime: number;
  wordTimes: WordTimeRecord[];
  testStartTime: number | null;
  hintsPercentage: number;
  efficiency: number;
}

export type TestCompleteCallback = (
  testStats: EnhancedTestStats,
  testWords: Word[],
  wrongWords: Word[]
) => void;

export interface OptimizedTestReturn {
  // State
  currentWord: Word | null;
  usedWordIds: Set<string>;
  showMeaning: boolean;
  testMode: boolean;
  showResults: boolean;
  stats: TestStats;
  wrongWords: Word[];
  testWords: Word[];
  isTransitioning: boolean;
  
  // Hint functionality
  showHint: boolean;
  hintUsed: boolean;
  
  // Timer functionality
  wordTimes: WordTimeRecord[];
  
  // Actions
  setShowMeaning: (show: boolean) => void;
  toggleHint: () => void;
  startTest: (filteredWords: Word[]) => void;
  handleAnswer: (isCorrect: boolean) => void;
  resetTest: () => void;
  startNewTest: () => void;
  
  // Getters
  getTestProgress: () => TestProgress;
  getTestSummary: () => TestSummary;
}

// ===== STATS HOOK TYPES =====

export interface StatsSelectors {
  totalTests: number;
  totalAnswers: number;
  totalHints: number;
  accuracyRate: number;
  hintsRate: number;
  isActiveToday: boolean;
  avgTimePerTest: number;
}

export interface WeeklyProgressItem {
  date: string;
  tests: number;
  correct: number;
  incorrect: number;
  hints: number;
}

export interface ComputedStats extends StatsSelectors {
  weeklyProgress: WeeklyProgressItem[];
  isMigrated: boolean;
  isProcessing: boolean;
  forceUpdate: number;
}

export interface EnhancedStatsReturn {
  // Data
  stats: AppStats;
  testHistory: TestResult[];
  wordPerformance: Record<string, WordPerformance>;
  calculatedStats: ComputedStats;
  
  // State
  isInitialized: boolean;
  isLoading: boolean;
  error: Error | null;
  lastSync: number | null;
  
  // Core functions
  handleTestComplete: TestCompleteCallback;
  exportData: () => void;
  importData: (jsonString: string) => void;
  clearTestHistory: () => void;
  refreshData: () => void;
  
  // Word performance functions
  getAllWordsPerformance: () => any[];
  getWordAnalysis: (wordId: string) => WordAnalysis | null;
  recordWordPerformance: (
    word: Word, 
    isCorrect: boolean, 
    usedHint: boolean, 
    timeSpent: number
  ) => void;
  
  // Additional functions
  addTestToHistory: (testResult: TestResult) => void;
  resetStats: () => void;
  clearHistoryOnly: () => void;
  
  // Computed values
  totalTests: number;
  totalAnswers: number;
  accuracyRate: number;
  hintsRate: number;
  weeklyProgress: WeeklyProgressItem[];
  isMigrated: boolean;
}

// ===== LOADING HOOKS TYPES =====

export interface LoadingStateReturn extends LoadingState {
  startLoading: (operationName?: string) => void;
  stopLoading: (successMessage?: string) => void;
  setError: (error: Error, canRetry?: boolean) => void;
  retry: (operation: () => Promise<any>) => Promise<any>;
  canRetry: boolean;
  duration: number;
}

export interface AILoadingReturn extends LoadingStateReturn {
  executeAIOperation: (
    operation: () => Promise<any>,
    operationName?: string
  ) => Promise<any>;
}

export interface StorageLoadingReturn extends LoadingStateReturn {
  executeStorageOperation: (
    operation: () => Promise<any>,
    operationName?: string
  ) => Promise<any>;
}

export interface NetworkLoadingReturn extends LoadingStateReturn {
  executeNetworkOperation: (
    operation: () => Promise<any>,
    operationName?: string
  ) => Promise<any>;
}

// ===== LOCAL STORAGE HOOK TYPES =====

export type LocalStorageValue<T> = T | undefined;

export interface UseLocalStorageReturn<T> {
  0: T;
  1: (value: T | ((prevValue: T) => T)) => void;
}

// ===== NOTIFICATION HOOK TYPES =====

export interface NotificationContextValue {
  notifications: import('./global').Notification[];
  showNotification: (
    message: string, 
    type?: import('./global').NotificationType, 
    duration?: number
  ) => number;
  showError: (error: Error, context?: string) => number;
  showSuccess: (message: string) => number;
  showWarning: (message: string) => number;
  clearAllNotifications: () => void;
}