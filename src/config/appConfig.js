// =====================================================
// 📁 src/config/appConfig.js - Secure Configuration per Vocabulary Master
// =====================================================

/**
 * Configurazione sicura che sostituisce le credenziali hardcodate
 */

// Helper per leggere environment variables
const getEnvVar = (key, defaultValue = undefined) => {
  const value = process.env[key];

  // Handle boolean strings
  if (value === "true") return true;
  if (value === "false") return false;

  // Handle numeric strings
  if (value && !isNaN(value) && !isNaN(parseFloat(value))) {
    return parseFloat(value);
  }

  return value || defaultValue;
};

// ====== MAIN CONFIGURATION ======
export const AppConfig = {
  // App Metadata (identico al tuo APP_CONFIG)
  app: {
    name: "Vocabulary Master",
    version: "2.0.0",
    description: "La tua app intelligente per imparare l'inglese",
    environment: getEnvVar("REACT_APP_ENVIRONMENT", "development"),
  },

  // AI Configuration (sostituisce il tuo AI_CONFIG hardcodato)
  ai: {
    // SICURO: la chiamata passa dal backend-proxy del frontend (/api/ai/generate),
    // così la GEMINI_API_KEY resta lato server e non finisce mai nel bundle.
    proxyUrl: getEnvVar("REACT_APP_AI_PROXY_URL", "/api/ai/generate"),

    // URL Gemini (solo a scopo informativo nello status; la chiamata reale
    // la fa il backend). Mantenuto per retro-compatibilità della UI di stato.
    baseUrl: getEnvVar(
      "REACT_APP_GEMINI_API_URL",
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
    ),

    // Stessi valori che avevi prima
    timeout: getEnvVar("REACT_APP_AI_TIMEOUT", 15000),
    maxRetries: getEnvVar("REACT_APP_AI_MAX_RETRIES", 3),
    retryDelay: getEnvVar("REACT_APP_AI_RETRY_DELAY", 1000),

    // Feature flags
    enabled: getEnvVar("REACT_APP_ENABLE_AI_FEATURES", true),
    mockResponses: getEnvVar("REACT_APP_MOCK_AI_RESPONSES", false),
  },

  // Test Configuration (identico al tuo TEST_CONFIG)
  test: {
    warningThresholds: {
      slow: 25,
      verySlow: 40,
    },
    autoAdvanceDelay: 1500,
    hintCooldown: 3000,
    maxHintsPerWord: 1,
    scoring: {
      excellent: 80,
      good: 60,
      victory: 80,
    },
  },

  // Statistics Configuration (identico al tuo STATS_CONFIG)
  stats: {
    performance: {
      excellent: 90,
      good: 75,
      average: 60,
      needsWork: 40,
    },
    maxHistorySize: 1000,
    maxRecentTests: 20,
    charts: {
      maxTimelinePoints: 20,
      defaultChartHeight: 300,
    },
  },

  // Word Configuration (identico al tuo WORD_CONFIG)
  word: {
    maxWordLength: 100,
    maxTranslationLength: 200,
    maxNotesLength: 1000,
    maxSentenceLength: 300,
    maxChapterLength: 20,
    requiredFields: ["english", "italian"],
    optionalFields: [
      "group",
      "sentence",
      "notes",
      "chapter",
      "learned",
      "difficult",
    ],
  },

  // UI Configuration (identico al tuo UI_CONFIG)
  ui: {
    animations: {
      fast: 150,
      normal: 300,
      slow: 500,
      cardFlip: 700,
    },
    notifications: {
      defaultDuration: 3000,
      maxVisible: 5,
    },
  },
  // Storage Configuration (identico al tuo STORAGE_CONFIG)
  storage: {
    collections: {
      words: "words",
      statistics: "statistics",
      tests: "tests",
      performance: "performance",
      users: "users",
    },
  },
};

// ====== ERROR MESSAGES (identici ai tuoi) ======
export const ERROR_MESSAGES = {
  network: "Errore di connessione. Controlla la tua connessione internet.",
  ai: "Servizio AI temporaneamente non disponibile. Riprova più tardi.",
  aiNotConfigured:
    "Servizio AI non configurato. Contatta l'amministratore del servizio.",
  storage: "Errore nel salvataggio dei dati. Controlla lo spazio disponibile.",
  validation: "Dati non validi. Controlla i campi obbligatori.",
  import: "Errore durante l'importazione. Verifica il formato del file.",
  export: "Errore durante l'esportazione. Riprova.",
  generic: "Si è verificato un errore imprevisto.",
  wordNotFound: "Parola non trovata.",
  noWordsAvailable: "Nessuna parola disponibile per il test.",
};

// ====== SUCCESS MESSAGES (identici ai tuoi) ======
export const SUCCESS_MESSAGES = {
  wordAdded: "Parola aggiunta con successo!",
  wordUpdated: "Parola modificata con successo!",
  wordDeleted: "Parola eliminata con successo!",
  testCompleted: "Test completato!",
  dataExported: "Dati esportati con successo!",
  dataImported: "Dati importati con successo!",
  settingsSaved: "Impostazioni salvate!",
};

// ====== UTILITY FUNCTIONS ======

/**
 * Check if AI is available.
 * La presenza/validità della key è verificata lato backend; qui basta il
 * feature flag. Se il backend non ha la key, le chiamate falliscono in modo
 * gestito (503 -> fallback) senza esporre nulla al client.
 */
export const isAIAvailable = () => {
  return !!AppConfig.ai.enabled;
};

/**
 * Get configuration status
 */
export const getConfigurationStatus = () => {
  return {
    isValid: AppConfig.ai.enabled,
    environment: AppConfig.app.environment,
    aiConfigured: AppConfig.ai.enabled,
    features: {
      aiEnabled: isAIAvailable(),
      mockMode: AppConfig.ai.mockResponses,
    },
  };
};
export default AppConfig;
