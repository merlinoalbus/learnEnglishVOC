// =====================================================
// 📁 src/constants/appConstants.js - Centralized Configuration
// =====================================================

// App Metadata
export const APP_CONFIG = {
  name: 'Vocabulary Master',
  version: '2.0.0',
  description: 'La tua app intelligente per imparare l\'inglese'
};

// AI Configuration (estratto da AddWordForm.js)
export const AI_CONFIG = {
  apiKey: 'AIzaSyCHftv0ACPTtX7unUKg6y_eqb09mBobTAM',
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
  timeout: 30000,
  maxRetries: 3,
  retryDelay: 1000
};

// Test Configuration (estratto da vari componenti)
export const TEST_CONFIG = {
  // Timer settings (da TestView.js)
  warningThresholds: {
    slow: 25,      // seconds - quando mostrare warning "tempo lungo"
    verySlow: 40   // seconds - quando mostrare "molto lento"
  },
  
  // Test flow settings
  autoAdvanceDelay: 1500, // ms after answer before next question
  hintCooldown: 3000,     // ms between hint requests
  maxHintsPerWord: 1,     // limite aiuti per parola
  
  // Scoring thresholds (da TestResults.js)
  scoring: {
    excellent: 80,  // % for "excellent" result  
    good: 60,      // % for "good" result
    victory: 80    // % for victory message
  },
  
  // Limits
  maxWordsPerTest: 200,
  minWordsPerTest: 1
};

// Statistics Configuration (da StatsOverview.js e useOptimizedStats.js)
export const STATS_CONFIG = {
  // Performance thresholds
  performance: {
    excellent: 90,    // %
    good: 75,        // %
    average: 60,     // %
    needsWork: 40    // %
  },
  
  // Streak requirements
  streak: {
    minAccuracy: 80,      // % minimum for streak
    consecutiveDays: 1    // days required for streak
  },
  
  // History limits
  maxHistorySize: 1000,   // max test history entries
  maxRecentTests: 20,     // tests shown in timeline
  
  // Chart settings
  charts: {
    maxTimelinePoints: 20,
    defaultChartHeight: 300
  }
};

// Storage Configuration (da vari punti dell'app)
export const STORAGE_CONFIG = {
  keys: {
    words: 'vocabulary_words',
    stats: 'vocabulary_stats', 
    testHistory: 'vocabulary_test_history',
    settings: 'vocabulary_settings',
    lastBackup: 'vocabulary_last_backup'
  },
  
  // Backup settings
  backup: {
    autoInterval: 24 * 60 * 60 * 1000, // 24 hours in ms
    maxBackups: 10,
    compressionLevel: 1
  }
};

// Word/Vocabulary Configuration (da AddWordForm.js e validazioni)
export const WORD_CONFIG = {
  // Field lengths
  maxWordLength: 100,
  maxTranslationLength: 200, 
  maxNotesLength: 1000,
  maxSentenceLength: 300,
  maxChapterLength: 20,
  
  // Required fields
  requiredFields: ['english', 'italian'],
  optionalFields: ['group', 'sentence', 'notes', 'chapter', 'learned', 'difficult'],
  
  // Validation patterns
  validation: {
    englishPattern: /^[a-zA-Z\s\-'.,!?]+$/,
    chapterPattern: /^[a-zA-Z0-9\s]*$/
  }
};

// Predefined Categories (da categoryUtils.js)
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

// Category Styles (estratto da categoryUtils.js)
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
  // Animation durations
  animations: {
    fast: 150,
    normal: 300,
    slow: 500,
    cardFlip: 700
  },
  
  // Toast notification settings
  notifications: {
    defaultDuration: 3000,
    maxVisible: 5,
    position: 'top-right'
  },
  
  // Breakpoints (Tailwind-based)
  breakpoints: {
    sm: 640,
    md: 768, 
    lg: 1024,
    xl: 1280
  }
};

// Error Messages (centralizzati per consistency)
export const ERROR_MESSAGES = {
  network: 'Errore di connessione. Controlla la tua connessione internet.',
  ai: 'Servizio AI temporaneamente non disponibile. Riprova più tardi.',
  storage: 'Errore nel salvataggio dei dati. Controlla lo spazio disponibile.',
  validation: 'Dati non validi. Controlla i campi obbligatori.',
  import: 'Errore durante l\'importazione. Verifica il formato del file.',
  export: 'Errore durante l\'esportazione. Riprova.',
  generic: 'Si è verificato un errore imprevisto.',
  wordNotFound: 'Parola non trovata.',
  testInProgress: 'Test già in corso.',
  noWordsAvailable: 'Nessuna parola disponibile per il test.'
};

// Success Messages (per consistency UI)
export const SUCCESS_MESSAGES = {
  wordAdded: 'Parola aggiunta con successo!',
  wordUpdated: 'Parola modificata con successo!', 
  wordDeleted: 'Parola eliminata con successo!',
  testCompleted: 'Test completato!',
  dataExported: 'Dati esportati con successo!',
  dataImported: 'Dati importati con successo!',
  settingsSaved: 'Impostazioni salvate!'
};

// Feature Flags (per future features o A/B testing)
export const FEATURE_FLAGS = {
  enableAdvancedStats: true,
  enableWordPerformanceTracking: true,
  enableAIAssistant: true,
  enableDifficultWords: true,
  enableChapterTests: true,
  enableTimedTests: true,
  enableHints: true
};