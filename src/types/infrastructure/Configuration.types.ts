// =====================================================
// 📁 types/infrastructure/Configuration.types.ts - Types per Configurazione App
// =====================================================

/**
 * Types per configurazione applicazione
 * Separazione: types qui, values concreti in appConfig.ts
 * Integrata con: types entity dal Gruppo 1 per consistency
 */

import {
  ScoreCategory,
  TestMode,
  AuthProvider,
  AuthPersistence,
  AppTheme,
  InterfaceLanguage,
  FontSize,
} from "../index";

// =====================================================
// 🏗️ CONFIGURATION INTERFACES
// =====================================================

/**
 * Interface per configurazione app principale
 * Type-safe wrapper per metadata applicazione
 */
export interface AppMetadata {
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly environment: "development" | "production" | "test";
  readonly buildDate?: Date;
  readonly commitHash?: string;
}

/**
 * Interface per configurazione AI
 * Integrata con provider types e security
 */
export interface AIConfiguration {
  /** API key da environment variable */
  apiKey?: string;

  /** Base URL per API calls */
  baseUrl: string;

  /** Timeout requests (ms) */
  timeout: number;

  /** Max retry tentativi */
  maxRetries: number;

  /** Delay tra retry (ms) */
  retryDelay: number;

  /** Feature AI abilitata */
  enabled: boolean;

  /** Mock responses per development */
  mockResponses: boolean;

  /** Rate limiting configuration */
  rateLimiting: {
    maxRequestsPerMinute: number;
    burstLimit: number;
  };

  /** Model configuration */
  model: {
    name: string;
    maxTokens: number;
    temperature: number;
    topP: number;
  };
}

/**
 * Interface per configurazione test
 * Integrata con Test.types.ts enums e interfaces
 */
export interface TestConfiguration {
  /** Warning thresholds per performance */
  warningThresholds: {
    slow: number;
    verySlow: number;
  };

  /** Auto advance delay (ms) */
  autoAdvanceDelay: number;

  /** Hint cooldown period (ms) */
  hintCooldown: number;

  /** Max hint per parola */
  maxHintsPerWord: number;

  /** Scoring thresholds - integrato con ScoreCategory type */
  scoring: {
    excellent: number; // Threshold per ScoreCategory.excellent
    good: number; // Threshold per ScoreCategory.good
    victory: number; // Threshold per perfect score
    average: number; // Threshold per ScoreCategory.average
  };

  /** Default test modes disponibili */
  defaultModes: TestMode[];

  /** Limiti test */
  limits: {
    maxWordsPerTest: number;
    minWordsPerTest: number;
    maxTestDuration: number; // minutes
  };

  /** Timer configuration */
  timer: {
    showByDefault: boolean;
    warningAtSeconds: number;
    criticalAtSeconds: number;
  };
}

/**
 * Interface per configurazione statistiche
 * Integrata con Statistics.types.ts per thresholds
 */
export interface StatisticsConfiguration {
  /** Performance categories thresholds */
  performance: {
    excellent: number;
    good: number;
    average: number;
    needsWork: number;
  };

  /** Limits per data retention */
  maxHistorySize: number;
  maxRecentTests: number;

  /** Chart configuration */
  charts: {
    maxTimelinePoints: number;
    defaultChartHeight: number;
    animationDuration: number;
    colorScheme: string[];
  };

  /** Analytics configuration */
  analytics: {
    retentionDays: number;
    aggregationIntervals: ("daily" | "weekly" | "monthly")[];
    enablePredictions: boolean;
  };
}

/**
 * Interface per configurazione storage
 * Integrata con Firestore.types.ts per keys e operations
 */
export interface StorageConfiguration {
  /** Storage keys per localStorage/Firestore */
  keys: {
    words: string;
    stats: string;
    testHistory: string;
    settings: string;
    wordPerformance: string;
    userProfile: string;
    cache: string;
  };

  /** Firestore collections */
  collections: {
    words: string;
    users: string;
    tests: string;
    statistics: string;
    performance: string;
  };

  /** Storage limits */
  limits: {
    maxCacheSize: number; // bytes
    maxBackupSize: number; // bytes
    cacheExpiration: number; // ms
  };

  /** Sync configuration */
  sync: {
    enableOfflineMode: boolean;
    syncInterval: number; // ms
    maxPendingOperations: number;
    retryAttempts: number;
  };
}

/**
 * Interface per configurazione words
 * Integrata con Word.types.ts validation rules
 */
export interface WordConfiguration {
  /** Field length limits - integrato con WordValidationRules */
  limits: {
    maxWordLength: number; // Matches WORD_VALIDATION_SCHEMA.englishMaxLength
    maxTranslationLength: number; // Matches WORD_VALIDATION_SCHEMA.italianMaxLength
    maxNotesLength: number; // Matches WORD_VALIDATION_SCHEMA.notesMaxLength
    maxSentenceLength: number; // Matches WORD_VALIDATION_SCHEMA.sentenceMaxLength
    maxChapterLength: number;
  };

  /** Required/optional fields */
  requiredFields: (keyof import("../entities/Word.types").CreateWordInput)[];
  optionalFields: (keyof import("../entities/Word.types").CreateWordInput)[];

  /** Import/Export configuration */
  importExport: {
    maxImportSize: number; // max words per import
    supportedFormats: ("json" | "csv" | "xlsx")[];
    exportIncludeMetadata: boolean;
  };

  /** AI assistance configuration */
  aiAssistance: {
    enableSuggestions: boolean;
    enableValidation: boolean;
    enableTranslation: boolean;
    maxSuggestionsPerRequest: number;
  };
}

/**
 * Interface per configurazione UI
 * Integrata con User.types.ts preferences
 */
export interface UIConfiguration {
  /** Animation durations (ms) */
  animations: {
    fast: number;
    normal: number;
    slow: number;
    cardFlip: number;
    slideTransition: number;
  };

  /** Notification settings */
  notifications: {
    defaultDuration: number;
    maxVisible: number;
    positions: ("top-right" | "top-left" | "bottom-right" | "bottom-left")[];
  };

  /** Theme configuration - integrato con AppTheme type */
  theme: {
    defaultTheme: AppTheme;
    supportedThemes: AppTheme[];
    supportedLanguages: InterfaceLanguage[];
    supportedFontSizes: FontSize[];
  };

  /** Layout configuration */
  layout: {
    maxContentWidth: number; // px
    sidebarWidth: number; // px
    headerHeight: number; // px
    breakpoints: {
      mobile: number;
      tablet: number;
      desktop: number;
    };
  };

  /** Accessibility */
  accessibility: {
    enableHighContrast: boolean;
    enableReducedMotion: boolean;
    enableScreenReader: boolean;
    keyboardNavigation: boolean;
  };
}

/**
 * Interface per configurazione auth
 * Integrata con Auth.types.ts per providers e security
 */
export interface AuthConfiguration {
  /** Provider supportati - integrato con AuthProvider type */
  enabledProviders: AuthProvider[];

  /** Persistenza auth - integrato con AuthPersistence type */
  persistence: AuthPersistence;

  /** Session configuration */
  session: {
    timeout: number; // ms
    extendOnActivity: boolean;
    maxConcurrentSessions: number;
  };

  /** Security settings */
  security: {
    requireEmailVerification: boolean;
    passwordMinLength: number;
    enableTwoFactor: boolean;
    maxLoginAttempts: number;
    lockoutDuration: number; // ms
  };

  /** Token configuration */
  tokens: {
    accessTokenExpiry: number; // ms
    refreshTokenExpiry: number; // ms
    autoRefresh: boolean;
    refreshBuffer: number; // ms
  };
}

// =====================================================
// 🎯 CONFIGURATION STATUS & VALIDATION
// =====================================================

/**
 * Status configurazione per debugging
 * Type-safe status object
 */
export interface ConfigurationStatus {
  isValid: boolean;
  environment: AppMetadata["environment"];
  aiConfigured: boolean;
  features: {
    aiEnabled: boolean;
    mockMode: boolean;
    offlineMode: boolean;
    authEnabled: boolean;
  };
  buildInfo: {
    version: string;
    buildDate: Date;
    commitHash: string;
  };
}

/**
 * Risultato validazione configurazione
 * Per startup validation
 */
export interface ConfigurationValidation {
  isValid: boolean;
  issues: string[];
  warnings: string[];
}

/**
 * Environment variable parser type
 * Per type-safe environment parsing
 */
export type EnvVarParser<T> = (value: string) => T;

/**
 * Environment variable getter signature
 * Per helper getEnvVar type-safe
 */
export interface EnvVarGetter {
  <T = string>(key: string, defaultValue: T, parser?: EnvVarParser<T>): T;
}

// =====================================================
// 🔄 CONFIGURATION AGGREGATES
// =====================================================

/**
 * Configurazione master completa
 * Aggregate di tutte le configurazioni
 */
export interface ApplicationConfiguration {
  readonly app: AppMetadata;
  readonly ai: AIConfiguration;
  readonly test: TestConfiguration;
  readonly stats: StatisticsConfiguration;
  readonly storage: StorageConfiguration;
  readonly word: WordConfiguration;
  readonly ui: UIConfiguration;
  readonly auth: AuthConfiguration;
}

/**
 * Messages configuration type
 * Per messaggi localizzati type-safe
 */
export interface MessagesConfiguration {
  readonly errors: Record<string, string | ((...args: any[]) => string)>;
  readonly success: Record<string, string | ((...args: any[]) => string)>;
  readonly info: Record<string, string>;
  readonly warnings: Record<string, string>;
}

/**
 * Feature flags configuration
 * Per abilitazione/disabilitazione features
 */
export interface FeatureFlags {
  readonly aiAssistance: boolean;
  readonly advancedStats: boolean;
  readonly offlineMode: boolean;
  readonly darkMode: boolean;
  readonly experimentalFeatures: boolean;
  readonly betaFeatures: boolean;
}

// =====================================================
// 🔧 UTILITY TYPES
// =====================================================

/**
 * Deep partial per configurazioni opzionali
 * Per override parziali configurazione
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Configuration override type
 * Per environment-specific overrides
 */
export type ConfigurationOverride = DeepPartial<ApplicationConfiguration>;

/**
 * Environment-specific configuration
 * Per development, production, test configs
 */
export interface EnvironmentConfiguration {
  development: ConfigurationOverride;
  production: ConfigurationOverride;
  test: ConfigurationOverride;
}
