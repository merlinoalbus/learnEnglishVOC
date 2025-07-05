// =====================================================
// 📁 src/constants/appConstants.js - FIXED VERSION with REAL keys
// =====================================================

// App Metadata
export const APP_CONFIG = {
  name: 'Vocabulary Master',
  version: '2.0.0',
  description: 'La tua app intelligente per imparare l\'inglese'
};

// Test Configuration
export const TEST_CONFIG = {
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
};

// Statistics Configuration  
export const STATS_CONFIG = {
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
};

// ⭐ FIXED: Storage Configuration using YOUR REAL keys from localStorage
export const STORAGE_CONFIG = {
  keys: {
    // ✅ REAL keys found in your localStorage
    words: 'vocabularyWords',                    // 84 items - YOUR main words
    stats: 'vocabularyStats',                    // 14 fields - YOUR main stats  
    testHistory: 'vocabulary_test_history',      // 75 items - YOUR main test history
    settings: 'vocabulary_settings',             // Will be created for settings
    wordPerformance: 'wordPerformance',          // 84 items - YOUR performance data
    
    // ⭐ Fallback keys (if main keys are empty, try these)
    fallback: {
      words: ['vocabulary-words', 'vocabulary_words'],           // Your duplicates/old versions
      stats: ['vocabularyStats_v2', 'vocabulary-stats', 'vocabulary_stats'], 
      testHistory: ['testHistory', 'testHistory_v2'],
      wordPerformance: ['vocabulary-words-performance']
    },
    
    // ⭐ Metadata keys (for tracking updates)
    meta: {
      lastUpdate: 'vocabularyWords_lastUpdate',  // Found this in your data
      version: 'vocabulary-version',              // Found this too
      migrationBackup: 'vocabulary-migration-backup', // You have this
      uiPreferences: 'vocabulary-ui-preferences'  // Found this too
    }
  }
};

// Word/Vocabulary Configuration
export const WORD_CONFIG = {
  maxWordLength: 100,
  maxTranslationLength: 200, 
  maxNotesLength: 1000,
  maxSentenceLength: 300,
  maxChapterLength: 20,
  requiredFields: ['english', 'italian'],
  optionalFields: ['group', 'sentence', 'notes', 'chapter', 'learned', 'difficult']
};

// Predefined Categories
export const CATEGORIES = [
  'VERBI', 
  'VERBI_IRREGOLARI', 
  'SOSTANTIVI', 
  'AGGETTIVI',
  'DESCRIZIONI_FISICHE', 
  'POSIZIONE_CORPO', 
  'EMOZIONI',
  'EMOZIONI_POSITIVE', 
  'EMOZIONI_NEGATIVE', 
  'LAVORO',
  'FAMIGLIA', 
  'TECNOLOGIA', 
  'VESTITI'
];

// Category Styles
export const CATEGORY_STYLES = {
  'VERBI': { 
    color: 'from-red-400 via-red-500 to-red-600', 
    icon: '⚡', 
    bgColor: 'bg-red-500',
    bgGradient: 'bg-gradient-to-br from-red-500 to-orange-600'
  },
  'VERBI_IRREGOLARI': { 
    color: 'from-red-500 via-red-600 to-red-700', 
    icon: '🔄', 
    bgColor: 'bg-red-600',
    bgGradient: 'bg-gradient-to-br from-red-600 to-pink-600'
  },
  'SOSTANTIVI': { 
    color: 'from-blue-400 via-blue-500 to-blue-600', 
    icon: '🏷️', 
    bgColor: 'bg-blue-500',
    bgGradient: 'bg-gradient-to-br from-blue-500 to-indigo-600'
  },
  'AGGETTIVI': { 
    color: 'from-green-400 via-green-500 to-green-600', 
    icon: '🎨', 
    bgColor: 'bg-green-500',
    bgGradient: 'bg-gradient-to-br from-green-500 to-emerald-600'
  },
  'DESCRIZIONI_FISICHE': { 
    color: 'from-teal-400 via-teal-500 to-teal-600', 
    icon: '👤', 
    bgColor: 'bg-teal-500',
    bgGradient: 'bg-gradient-to-br from-teal-500 to-cyan-600'
  },
  'POSIZIONE_CORPO': { 
    color: 'from-purple-400 via-purple-500 to-purple-600', 
    icon: '🧘', 
    bgColor: 'bg-purple-500',
    bgGradient: 'bg-gradient-to-br from-purple-500 to-violet-600'
  },
  'EMOZIONI': { 
    color: 'from-pink-400 via-pink-500 to-pink-600', 
    icon: '❤️', 
    bgColor: 'bg-pink-500',
    bgGradient: 'bg-gradient-to-br from-pink-500 to-rose-600'
  },
  'EMOZIONI_POSITIVE': { 
    color: 'from-yellow-400 via-yellow-500 to-orange-500', 
    icon: '😊', 
    bgColor: 'bg-yellow-500',
    bgGradient: 'bg-gradient-to-br from-yellow-400 to-orange-500'
  },
  'EMOZIONI_NEGATIVE': { 
    color: 'from-gray-400 via-gray-500 to-gray-600', 
    icon: '😔', 
    bgColor: 'bg-gray-500',
    bgGradient: 'bg-gradient-to-br from-gray-500 to-slate-600'
  },
  'LAVORO': { 
    color: 'from-indigo-400 via-indigo-500 to-indigo-600', 
    icon: '💼', 
    bgColor: 'bg-indigo-500',
    bgGradient: 'bg-gradient-to-br from-indigo-500 to-blue-600'
  },
  'FAMIGLIA': { 
    color: 'from-pink-300 via-pink-400 to-rose-500', 
    icon: '👨‍👩‍👧‍👦', 
    bgColor: 'bg-pink-400',
    bgGradient: 'bg-gradient-to-br from-pink-400 to-rose-500'
  },
  'TECNOLOGIA': { 
    color: 'from-cyan-400 via-cyan-500 to-blue-500', 
    icon: '💻', 
    bgColor: 'bg-cyan-500',
    bgGradient: 'bg-gradient-to-br from-cyan-500 to-blue-500'
  },
  'VESTITI': { 
    color: 'from-purple-300 via-purple-400 to-pink-500', 
    icon: '👕', 
    bgColor: 'bg-purple-400',
    bgGradient: 'bg-gradient-to-br from-purple-400 to-pink-500'
  },
  'DEFAULT': { 
    color: 'from-emerald-400 via-emerald-500 to-cyan-500', 
    icon: '📚', 
    bgColor: 'bg-emerald-500',
    bgGradient: 'bg-gradient-to-br from-emerald-500 to-cyan-600'
  }
};

// UI Configuration
export const UI_CONFIG = {
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
};

// Error Messages
export const ERROR_MESSAGES = {
  network: 'Errore di connessione. Controlla la tua connessione internet.',
  ai: 'Servizio AI temporaneamente non disponibile. Riprova più tardi.',
  storage: 'Errore nel salvataggio dei dati. Controlla lo spazio disponibile.',
  validation: 'Dati non validi. Controlla i campi obbligatori.',
  import: 'Errore durante l\'importazione. Verifica il formato del file.',
  export: 'Errore durante l\'esportazione. Riprova.',
  generic: 'Si è verificato un errore imprevisto.',
  wordNotFound: 'Parola non trovata.',
  noWordsAvailable: 'Nessuna parola disponibile per il test.'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  wordAdded: 'Parola aggiunta con successo!',
  wordUpdated: 'Parola modificata con successo!', 
  wordDeleted: 'Parola eliminata con successo!',
  testCompleted: 'Test completato!',
  dataExported: 'Dati esportati con successo!',
  dataImported: 'Dati importati con successo!',
  settingsSaved: 'Impostazioni salvate!'
};