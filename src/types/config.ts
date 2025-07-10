// =====================================================
// 📁 src/types/config.ts - Configuration Type Definitions
// =====================================================

/**
 * Application configuration types for type-safe configuration management
 */

// ===== APP CONFIGURATION =====

export interface AppConfiguration {
  name: string;
  version: string;
  description: string;
  environment: 'development' | 'production' | 'test';
}

// ===== AI CONFIGURATION =====

export interface AIConfiguration {
  apiKey?: string;
  baseUrl: string;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
  enabled: boolean;
  mockResponses: boolean;
}

// ===== TEST CONFIGURATION =====

export interface TestConfiguration {
  warningThresholds: {
    slow: number;
    verySlow: number;
  };
  autoAdvanceDelay: number;
  hintCooldown: number;
  maxHintsPerWord: number;
  scoring: {
    excellent: number;
    good: number;
    victory: number;
  };
}

// ===== STATISTICS CONFIGURATION =====

export interface StatsConfiguration {
  performance: {
    excellent: number;
    good: number;
    average: number;
    needsWork: number;
  };
  maxHistorySize: number;
  maxRecentTests: number;
  charts: {
    maxTimelinePoints: number;
    defaultChartHeight: number;
  };
}

// ===== STORAGE CONFIGURATION =====

export interface StorageConfiguration {
  keys: {
    words: string;
    stats: string;
    testHistory: string;
    settings: string;
    wordPerformance: string;
  };
}

// ===== WORD CONFIGURATION =====

export interface WordConfiguration {
  maxWordLength: number;
  maxTranslationLength: number;
  maxNotesLength: number;
  maxSentenceLength: number;
  maxChapterLength: number;
  requiredFields: (keyof import('./global').Word)[];
  optionalFields: (keyof import('./global').Word)[];
}

// ===== UI CONFIGURATION =====

export interface UIConfiguration {
  animations: {
    fast: number;
    normal: number;
    slow: number;
    cardFlip: number;
  };
  notifications: {
    defaultDuration: number;
    maxVisible: number;
  };
}

// ===== COMBINED CONFIGURATION =====

export interface ApplicationConfig {
  app: AppConfiguration;
  ai: AIConfiguration;
  test: TestConfiguration;
  stats: StatsConfiguration;
  storage: StorageConfiguration;
  word: WordConfiguration;
  ui: UIConfiguration;
}

// ===== CONFIGURATION STATUS =====

export interface ConfigurationStatus {
  isValid: boolean;
  environment: string;
  aiConfigured: boolean;
  features: {
    aiEnabled: boolean;
    mockMode: boolean;
  };
}

// ===== ERROR MESSAGES =====

export interface ErrorMessages {
  network: string;
  ai: string;
  aiNotConfigured: string;
  storage: string;
  validation: string;
  import: string;
  export: string;
  generic: string;
  wordNotFound: string;
  noWordsAvailable: string;
}

// ===== SUCCESS MESSAGES =====

export interface SuccessMessages {
  wordAdded: string;
  wordUpdated: string;
  wordDeleted: string;
  testCompleted: string;
  dataExported: string;
  dataImported: string;
  settingsSaved: string;
}