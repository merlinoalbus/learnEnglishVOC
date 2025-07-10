// =====================================================
// 📁 src/config/appConfig.ts - Type-Safe Configuration for Vocabulary Master
// =====================================================

import type { 
  ApplicationConfig, 
  ConfigurationStatus, 
  ErrorMessages, 
  SuccessMessages 
} from '../types/config';

/**
 * Type-safe configuration that replaces hardcoded credentials
 */

// Helper for reading environment variables with type safety
const getEnvVar = (key: string, defaultValue?: string): string | undefined => {
  const value = process.env[key];
  
  // Handle boolean strings
  if (value === 'true') return 'true';
  if (value === 'false') return 'false';
  
  // Handle numeric strings - keep as string for flexibility
  if (value && !isNaN(Number(value)) && !isNaN(parseFloat(value))) {
    return value;
  }
  
  return value || defaultValue;
};

// Convert string to number safely
const getEnvNumber = (key: string, defaultValue: number): number => {
  const value = getEnvVar(key);
  if (value === undefined) return defaultValue;
  
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

// Convert string to boolean safely
const getEnvBoolean = (key: string, defaultValue: boolean): boolean => {
  const value = getEnvVar(key);
  if (value === undefined) return defaultValue;
  
  return value === 'true';
};

// ====== MAIN CONFIGURATION ======
export const AppConfig: ApplicationConfig = {
  
  // App Metadata
  app: {
    name: 'Vocabulary Master',
    version: '2.0.0', 
    description: 'La tua app intelligente per imparare l\'inglese',
    environment: (getEnvVar('REACT_APP_ENVIRONMENT', 'development') as 'development' | 'production' | 'test') || 'development'
  },

  // AI Configuration - Type-safe with proper fallbacks
  ai: {
    // SECURE: API key from environment variable instead of hardcoded
    apiKey: getEnvVar('REACT_APP_GEMINI_API_KEY'),
    
    // Same URL as before
    baseUrl: getEnvVar(
      'REACT_APP_GEMINI_API_URL'
    ) || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    
    // Type-safe numeric values
    timeout: getEnvNumber('REACT_APP_AI_TIMEOUT', 15000),
    maxRetries: getEnvNumber('REACT_APP_AI_MAX_RETRIES', 3), 
    retryDelay: getEnvNumber('REACT_APP_AI_RETRY_DELAY', 1000),
    
    // Feature flags with type safety
    enabled: getEnvBoolean('REACT_APP_ENABLE_AI_FEATURES', true),
    mockResponses: getEnvBoolean('REACT_APP_MOCK_AI_RESPONSES', false)
  },

  // Test Configuration
  test: {
    warningThresholds: {
      slow: 25,
      verySlow: 40
    },
    autoAdvanceDelay: 1500,
    hintCooldown: 3000,
    maxHintsPerWord: 1,
    scoring: {
      excellent: 80,
      good: 60,
      victory: 80
    }
  },

  // Statistics Configuration
  stats: {
    performance: {
      excellent: 90,
      good: 75,
      average: 60,
      needsWork: 40
    },
    maxHistorySize: 1000,
    maxRecentTests: 20,
    charts: {
      maxTimelinePoints: 20,
      defaultChartHeight: 300
    }
  },

  // Storage Configuration
  storage: {
    keys: {
      words: 'vocabularyWords',
      stats: 'vocabulary_stats',
      testHistory: 'vocabulary_test_history', 
      settings: 'vocabulary_settings',
      wordPerformance: 'wordPerformance'
    }
  },

  // Word Configuration with type safety
  word: {
    maxWordLength: 100,
    maxTranslationLength: 200,
    maxNotesLength: 1000,
    maxSentenceLength: 300,
    maxChapterLength: 20,
    requiredFields: ['english', 'italian'],
    optionalFields: ['group', 'sentence', 'notes', 'chapter', 'learned', 'difficult']
  },

  // UI Configuration
  ui: {
    animations: {
      fast: 150,
      normal: 300,
      slow: 500,
      cardFlip: 700
    },
    notifications: {
      defaultDuration: 3000,
      maxVisible: 5
    }
  }
};

// ====== ERROR MESSAGES ======
export const ERROR_MESSAGES: ErrorMessages = {
  network: 'Errore di connessione. Controlla la tua connessione internet.',
  ai: 'Servizio AI temporaneamente non disponibile. Riprova più tardi.',
  aiNotConfigured: 'Servizio AI non configurato. Aggiungi REACT_APP_GEMINI_API_KEY in .env.local',
  storage: 'Errore nel salvataggio dei dati. Controlla lo spazio disponibile.',
  validation: 'Dati non validi. Controlla i campi obbligatori.',
  import: 'Errore durante l\'importazione. Verifica il formato del file.',
  export: 'Errore durante l\'esportazione. Riprova.',
  generic: 'Si è verificato un errore imprevisto.',
  wordNotFound: 'Parola non trovata.',
  noWordsAvailable: 'Nessuna parola disponibile per il test.'
};

// ====== SUCCESS MESSAGES ======
export const SUCCESS_MESSAGES: SuccessMessages = {
  wordAdded: 'Parola aggiunta con successo!',
  wordUpdated: 'Parola modificata con successo!',
  wordDeleted: 'Parola eliminata con successo!',
  testCompleted: 'Test completato!',
  dataExported: 'Dati esportati con successo!',
  dataImported: 'Dati importati con successo!',
  settingsSaved: 'Impostazioni salvate!'
};

// ====== UTILITY FUNCTIONS ======

/**
 * Check if AI is available (has API key) - Type-safe
 */
export const isAIAvailable = (): boolean => {
  return AppConfig.ai.enabled && !!AppConfig.ai.apiKey;
};

/**
 * Get configuration status - Type-safe
 */
export const getConfigurationStatus = (): ConfigurationStatus => {
  return {
    isValid: !!AppConfig.ai.apiKey,
    environment: AppConfig.app.environment,
    aiConfigured: !!AppConfig.ai.apiKey,
    features: {
      aiEnabled: isAIAvailable(),
      mockMode: AppConfig.ai.mockResponses
    }
  };
};

// Debug logging in development with type safety
if (AppConfig.app.environment === 'development') {
  const status = getConfigurationStatus();
  console.log('🔧 Vocabulary Master Configuration (TypeScript):', {
    aiConfigured: status.aiConfigured,
    environment: status.environment,
    features: status.features,
    typeChecking: '✅ Active'
  });
  
  if (!status.aiConfigured) {
    console.warn('⚠️ AI Service: API key non configurata. Aggiungi REACT_APP_GEMINI_API_KEY in .env.local');
  }
}

// Default export for compatibility
export default AppConfig;