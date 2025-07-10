// =====================================================
// 📁 src/types/global.ts - Global Type Definitions for Vocabulary Master
// =====================================================

/**
 * Core application types shared across the entire application
 */

// ===== BASIC TYPES =====

export type ID = string;
export type Timestamp = string; // ISO string
export type JSONString = string;

// ===== WORD TYPES =====

/**
 * Core word interface - represents a vocabulary word
 */
export interface Word {
  id: ID;
  english: string;
  italian: string;
  group?: string | null;
  sentence?: string | null;
  notes?: string | null;
  chapter?: string | null;
  learned: boolean;
  difficult: boolean;
}

/**
 * Word data for creation (without id)
 */
export interface WordInput {
  english: string;
  italian: string;
  group?: string | null;
  sentence?: string | null;
  notes?: string | null;
  chapter?: string | null;
  learned?: boolean;
  difficult?: boolean;
}

/**
 * Word update data (partial word)
 */
export type WordUpdate = Partial<Omit<Word, 'id'>> & { id: ID };

// ===== STATISTICS TYPES =====

/**
 * Basic test statistics
 */
export interface TestStats {
  correct: number;
  incorrect: number;
  hints: number;
  totalTime?: number;
  avgTimePerWord?: number;
}

/**
 * Enhanced test statistics with timing data
 */
export interface EnhancedTestStats extends TestStats {
  maxTimePerWord?: number;
  minTimePerWord?: number;
  totalRecordedTime?: number;
  wordTimes?: WordTimeRecord[];
}

/**
 * Individual word timing record
 */
export interface WordTimeRecord {
  wordId: ID;
  english: string;
  italian: string;
  chapter?: string;
  timeSpent: number; // milliseconds
  isCorrect: boolean;
  usedHint: boolean;
  timestamp: Timestamp;
}

/**
 * Overall application statistics
 */
export interface AppStats {
  totalWords: number;
  correctAnswers: number;
  incorrectAnswers: number;
  hintsUsed: number;
  averageScore: number;
  testsCompleted: number;
  timeSpent: number;
  categoriesProgress: Record<string, CategoryProgress>;
  dailyProgress: Record<string, DailyProgress>;
  difficultyStats: DifficultyStats;
  monthlyStats: Record<string, MonthlyStats>;
  streakDays: number;
  lastStudyDate: string | null;
  migrated?: boolean;
}

/**
 * Category-specific progress
 */
export interface CategoryProgress {
  correct: number;
  total: number;
  hints: number;
}

/**
 * Daily progress tracking
 */
export interface DailyProgress {
  tests: number;
  correct: number;
  incorrect: number;
  hints: number;
}

/**
 * Difficulty-based statistics
 */
export interface DifficultyStats {
  easy: { correct: number; total: number };
  medium: { correct: number; total: number };
  hard: { correct: number; total: number };
}

/**
 * Monthly statistics
 */
export interface MonthlyStats {
  testsCompleted: number;
  correctAnswers: number;
  incorrectAnswers: number;
  hintsUsed: number;
  timeSpent: number;
}

// ===== TEST TYPES =====

/**
 * Test result record
 */
export interface TestResult {
  id: number;
  timestamp: Date;
  totalWords: number;
  correctWords: number;
  incorrectWords: number;
  hintsUsed: number;
  totalTime: number;
  avgTimePerWord: number;
  percentage: number;
  wrongWords: Word[];
  wordTimes: WordTimeRecord[];
  chapterStats: Record<string, ChapterTestStats>;
  testParameters: TestParameters;
  testType: 'selective' | 'complete';
  difficulty: TestDifficulty;
  difficultyAnalysis?: DifficultyAnalysis;
  legacyDifficulty: 'easy' | 'medium' | 'hard';
}

/**
 * Chapter-specific test statistics
 */
export interface ChapterTestStats {
  totalWords: number;
  correctWords: number;
  incorrectWords: number;
  hintsUsed: number;
  percentage: number;
}

/**
 * Test parameters configuration
 */
export interface TestParameters {
  selectedChapters: string[];
  includeLearnedWords: boolean;
  totalAvailableWords: number;
}

/**
 * Test difficulty levels
 */
export type TestDifficulty = 'easy' | 'medium' | 'hard';

/**
 * Advanced difficulty analysis
 */
export interface DifficultyAnalysis {
  difficulty: TestDifficulty;
  difficultyReason: string;
  totalWords: number;
  weightedScore: number;
  sizeAdjustment: number;
  distribution: {
    hard: { count: number; percentage: number };
    medium: { count: number; percentage: number };
    easy: { count: number; percentage: number };
  };
  statusBreakdown: Record<string, number>;
}

// ===== WORD PERFORMANCE TYPES =====

/**
 * Individual word performance tracking
 */
export interface WordPerformance {
  english: string;
  italian: string;
  chapter?: string;
  attempts: WordAttempt[];
}

/**
 * Single word attempt record
 */
export interface WordAttempt {
  timestamp: Timestamp;
  correct: boolean;
  usedHint: boolean;
  timeSpent: number;
}

/**
 * Word analysis results
 */
export interface WordAnalysis {
  id: ID;
  english: string;
  italian: string;
  chapter: string;
  group: string;
  sentence: string;
  notes: string;
  learned: boolean;
  difficult: boolean;
  totalAttempts: number;
  correctAttempts: number;
  incorrectAttempts: number;
  accuracy: number;
  recentAccuracy: number;
  avgTime: number;
  hintsUsed: number;
  hintsPercentage: number;
  currentStreak: number;
  lastAttempt: WordAttempt | null;
  status: WordStatus;
  trend: 'stable' | 'improving' | 'declining';
  difficulty: 'easy' | 'medium' | 'hard' | 'unknown';
  needsWork: boolean;
  mastered: boolean;
  attempts: WordAttempt[];
  recommendations: string[];
}

/**
 * Word learning status
 */
export type WordStatus = 
  | 'new' 
  | 'promising' 
  | 'struggling' 
  | 'improving' 
  | 'inconsistent' 
  | 'consolidated' 
  | 'critical';

// ===== WORD STATISTICS =====

/**
 * Word collection statistics
 */
export interface WordStats {
  total: number;
  learned: number;
  unlearned: number;
  difficult: number;
  normal: number;
  chapters: string[];
  groups: string[];
}

/**
 * Chapter-specific word statistics
 */
export interface ChapterStats {
  total: number;
  learned: number;
  unlearned: number;
  difficult: number;
  normal: number;
}

// ===== UI TYPES =====

/**
 * Notification types
 */
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

/**
 * Notification object
 */
export interface Notification {
  id: number;
  message: string;
  type: NotificationType;
  timestamp: number;
}

/**
 * Loading states
 */
export interface LoadingState {
  isLoading: boolean;
  error: Error | null;
  retryCount: number;
  startTime: number | null;
  operation: string | null;
}

/**
 * Loading options
 */
export interface LoadingOptions {
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  showTimeoutWarning?: boolean;
  showRetryNotifications?: boolean;
}

// ===== SERVICE TYPES =====

/**
 * AI service response
 */
export interface AIAnalysisResult {
  italian: string;
  group: string;
  sentence: string;
  notes: string;
  chapter: string;
  _aiError?: boolean;
  _fallbackUsed?: boolean;
}

/**
 * Service health status
 */
export type ServiceHealth = 'healthy' | 'degraded' | 'down' | 'unknown';

/**
 * AI service status
 */
export interface AIServiceStatus {
  configured: boolean;
  health: ServiceHealth;
  consecutiveFailures: number;
  lastSuccessTime: number | null;
  lastHealthCheck: number | null;
  circuitBreaker?: any;
  apiUrl: string;
  timeout: number;
  canUseAI: boolean;
  degradedMode: boolean;
  recommendations: string[];
}

/**
 * Storage service status
 */
export interface StorageServiceStatus {
  available: boolean;
  health: ServiceHealth;
  usage: StorageUsageStats;
  lastHealthCheck: number | null;
  recommendations: string[];
}

/**
 * Storage usage statistics
 */
export interface StorageUsageStats {
  used: number;
  available: number;
  total: number;
  usedMB: string;
  availableMB: string;
  usagePercentage: string;
  critical: boolean;
  warning: boolean;
  healthStatus: ServiceHealth;
  lastHealthCheck: number | null;
  error?: string;
}

// ===== ERROR TYPES =====

/**
 * Application error with context
 */
export interface AppError extends Error {
  context?: string;
  code?: string;
  retryable?: boolean;
}

// ===== UTILITY TYPES =====

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
  timestamp: Timestamp;
}

/**
 * Generic operation result
 */
export interface OperationResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// ===== CATEGORY TYPES =====

/**
 * Predefined word categories
 */
export type WordCategory = 
  | 'VERBI'
  | 'VERBI_IRREGOLARI'
  | 'SOSTANTIVI'
  | 'AGGETTIVI'
  | 'DESCRIZIONI_FISICHE'
  | 'POSIZIONE_CORPO'
  | 'EMOZIONI'
  | 'EMOZIONI_POSITIVE'
  | 'EMOZIONI_NEGATIVE'
  | 'LAVORO'
  | 'FAMIGLIA'
  | 'TECNOLOGIA'
  | 'VESTITI';

/**
 * Category styling information
 */
export interface CategoryStyle {
  color: string;
  icon: string;
  bgColor: string;
  bgGradient: string;
}

// ===== EXPORT ALL =====
export * from './config';
export * from './hooks';
export * from './components';