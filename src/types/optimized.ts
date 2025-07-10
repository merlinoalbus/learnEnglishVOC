// =====================================================
// 📁 src/types/optimized.ts - STRUTTURA DATI OTTIMIZZATA PER STATISTICHE CORRETTE
// =====================================================

export type ID = string;
export type Timestamp = string; // ISO string

// ===== ENHANCED WORD STRUCTURE =====

/**
 * Struttura ottimizzata per le parole del vocabolario
 */
export interface OptimizedWord {
  id: ID;
  english: string;
  italian: string;
  group?: string | null;
  sentence?: string | string[] | null; // ⭐ UPDATED: Supporta sia singola frase che array
  notes?: string | null;
  chapter?: string | null;
  learned: boolean;
  difficult: boolean;
  // ⭐ NUOVI CAMPI come richiesto
  synonyms: string[];      // Sinonimi in inglese
  antonyms: string[];      // Contrari in inglese
  createdAt: Timestamp;    // Data creazione
  updatedAt: Timestamp;    // Ultima modifica
}

/**
 * Input per creazione/modifica parola
 */
export interface OptimizedWordInput {
  english: string;
  italian: string;
  group?: string | null;
  sentence?: string | string[] | null; // ⭐ UPDATED: Supporta sia singola frase che array
  notes?: string | null;
  chapter?: string | null;
  learned?: boolean;
  difficult?: boolean;
  synonyms?: string[];
  antonyms?: string[];
}

// ===== ENHANCED TEST STRUCTURE =====

/**
 * Risposta dettagliata per una singola parola durante il test
 * ⭐ CRITICAL: Contiene TUTTI i dati necessari per calcoli statistici precisi
 */
export interface DetailedWordResponse {
  wordId: ID;
  timeResponse: number;        // Tempo di risposta in millisecondi
  hintsUsed: number;          // Numero di aiuti utilizzati per questa specifica parola
  currentDifficulty: TestDifficulty; // Difficoltà percepita per questa parola nel momento del test
  isCorrect: boolean;         // Se la risposta è corretta o sbagliata
  timestamp: Timestamp;       // Momento esatto della risposta
  // ⭐ METADATA ADDIZIONALI per analisi avanzate
  attemptNumber?: number;     // Numero del tentativo (per retry)
  confidence?: 'low' | 'medium' | 'high'; // Fiducia dell'utente nella risposta
}

/**
 * Risultato di un test completo - STRUTTURA OTTIMIZZATA
 * ⭐ CRITICAL: Questa struttura deve contenere TUTTI i dati per calcoli statistici accurati
 */
export interface OptimizedTestResult {
  // ⭐ IDENTIFICAZIONE
  id: ID;
  timestamp: Timestamp;
  
  // ⭐ DATI GLOBALI TEST (calcolati dai dati dettagliati)
  totalWords: number;
  correctWords: number;
  incorrectWords: number;
  totalTime: number;           // Tempo totale in millisecondi
  avgTimePerWord: number;      // Tempo medio per parola in millisecondi
  percentage: number;          // Percentuale di successo (0-100)
  difficulty: TestDifficulty;  // Difficoltà calcolata del test
  hintsUsed: number;          // Totale aiuti utilizzati nel test
  
  // ⭐ CONFIGURAZIONE TEST
  selectedChapters: string[];  // Capitoli selezionati per il test
  testType: TestType;         // Tipo di test
  
  // ⭐ RISPOSTE DETTAGLIATE - QUI STANNO I DATI REALI
  wrongWords: DetailedWordResponse[];  // Array delle parole sbagliate con dati completi
  rightWords: DetailedWordResponse[];  // Array delle parole corrette con dati completi
  
  // ⭐ METADATI
  version: string;            // Versione della struttura dati (per future migrazioni)
  deviceInfo?: {              // Info del dispositivo (opzionale)
    platform: string;
    userAgent: string;
  };
}

/**
 * Tipi di test disponibili
 */
export type TestType = 
  | 'complete'      // Test completo di tutto il vocabolario
  | 'selective'     // Test selettivo per capitoli
  | 'difficult'     // Test solo parole difficili
  | 'learned'       // Test solo parole apprese
  | 'mixed'         // Test misto
  | 'review'        // Test di ripasso
  | 'quick';        // Test veloce

/**
 * Livelli di difficoltà
 */
export type TestDifficulty = 'easy' | 'medium' | 'hard';

// ===== STATISTICHE AGGREGATE CALCOLATE DAI DATI REALI =====

/**
 * Statistiche globali calcolate dai test effettivi
 */
export interface ComputedGlobalStats {
  // ⭐ CONTATORI GLOBALI (calcolati da OptimizedTestResult[])
  totalTests: number;
  totalWordsAnswered: number;      // Totale parole risposte (correct + incorrect)
  totalCorrectAnswers: number;     // Totale risposte corrette
  totalIncorrectAnswers: number;   // Totale risposte sbagliate
  totalHintsUsed: number;         // Totale aiuti utilizzati
  totalTimeSpent: number;         // Tempo totale speso in millisecondi
  
  // ⭐ PERCENTUALI E MEDIE CALCOLATE
  globalAccuracy: number;         // Precisione globale (%)
  avgTestAccuracy: number;        // Media delle percentuali dei singoli test
  avgTimePerWord: number;         // Tempo medio per parola globale (millisecondi)
  avgTimePerTest: number;         // Tempo medio per test (millisecondi)
  avgHintsPerTest: number;        // Media aiuti per test
  avgHintsPerWord: number;        // Media aiuti per parola
  hintsEfficiency: number;        // Efficienza nell'uso degli aiuti (%)
  
  // ⭐ TENDENZE TEMPORALI
  currentStreak: number;          // Giorni consecutivi di studio
  bestStreak: number;            // Miglior streak mai raggiunto
  lastStudyDate: string | null;  // Ultima data di studio (YYYY-MM-DD)
  studyFrequency: number;        // Frequenza di studio (test/settimana)
  improvementTrend: number;      // Trend di miglioramento (% variazione)
  
  // ⭐ DISTRIBUZIONE DIFFICOLTÀ
  difficultyDistribution: {
    easy: { count: number; avgAccuracy: number; avgTime: number; };
    medium: { count: number; avgAccuracy: number; avgTime: number; };
    hard: { count: number; avgAccuracy: number; avgTime: number; };
  };
  
  // ⭐ PERFORMANCE PER TIPO TEST
  testTypeStats: Record<TestType, {
    count: number;
    avgAccuracy: number;
    avgTime: number;
    avgHints: number;
  }>;
  
  // ⭐ METADATI
  lastCalculated: Timestamp;
  dataVersion: string;
}

/**
 * Statistiche dettagliate per capitolo
 */
export interface ComputedChapterStats {
  chapter: string;
  
  // ⭐ CONTATORI PAROLE
  totalWordsInChapter: number;    // Parole totali nel capitolo
  testedWords: number;           // Parole effettivamente testate
  uniqueWordsTested: number;     // Parole uniche testate
  
  // ⭐ PERFORMANCE AGGREGATA
  totalAttempts: number;         // Tentativi totali su parole del capitolo
  correctAttempts: number;       // Tentativi corretti
  incorrectAttempts: number;     // Tentativi sbagliati
  accuracy: number;              // Accuratezza del capitolo (%)
  
  // ⭐ TIMING E AIUTI
  totalTimeSpent: number;        // Tempo totale speso sul capitolo (millisecondi)
  avgTimePerWord: number;        // Tempo medio per parola del capitolo
  totalHintsUsed: number;        // Aiuti totali utilizzati nel capitolo
  hintsPerWord: number;          // Media aiuti per parola
  hintsEfficiency: number;       // Efficienza aiuti (%)
  
  // ⭐ PROGRESSI TEMPORALI
  firstTestDate: Timestamp | null;  // Prima volta che il capitolo è stato testato
  lastTestDate: Timestamp | null;   // Ultima volta che il capitolo è stato testato
  improvementTrend: number;          // Trend di miglioramento
  
  // ⭐ DISTRIBUZIONE DIFFICOLTÀ PAROLE
  wordsDistribution: {
    learned: number;              // Parole apprese nel capitolo
    difficult: number;           // Parole difficili nel capitolo
    mastered: number;            // Parole completamente padroneggiate
    struggling: number;          // Parole con cui si ha difficoltà
  };
}

/**
 * Analisi dettagliata di una singola parola
 */
export interface ComputedWordAnalysis {
  // ⭐ IDENTIFICAZIONE
  wordId: ID;
  english: string;
  italian: string;
  chapter: string | null;
  group: string | null;
  
  // ⭐ CONTATORI TOTALI
  totalAttempts: number;         // Tentativi totali su questa parola
  correctAttempts: number;       // Tentativi corretti
  incorrectAttempts: number;     // Tentativi sbagliati
  
  // ⭐ PERFORMANCE METRICS
  accuracy: number;              // Accuratezza (%)
  recentAccuracy: number;        // Accuratezza degli ultimi 5 tentativi
  consistencyScore: number;      // Score di consistenza
  
  // ⭐ TIMING ANALYSIS
  totalTimeSpent: number;        // Tempo totale speso su questa parola
  avgTimePerAttempt: number;     // Tempo medio per tentativo
  fastestTime: number;           // Tempo più veloce
  slowestTime: number;           // Tempo più lento
  timeImprovement: number;       // Miglioramento dei tempi (%)
  
  // ⭐ HINTS ANALYSIS
  totalHintsUsed: number;        // Aiuti totali utilizzati
  hintsPerAttempt: number;       // Media aiuti per tentativo
  hintsDecreasingTrend: number;  // Trend di diminuzione aiuti
  independence: number;          // Score di indipendenza (%)
  
  // ⭐ LEARNING PATTERNS
  currentStreak: number;         // Streak corrente
  bestStreak: number;           // Miglior streak
  learningVelocity: number;     // Velocità di apprendimento
  retentionScore: number;       // Score di ritenzione
  
  // ⭐ TEMPORAL DATA
  firstAttempt: Timestamp | null;  // Primo tentativo
  lastAttempt: Timestamp | null;   // Ultimo tentativo
  daysSinceFirst: number;          // Giorni dal primo tentativo
  daysSinceLast: number;           // Giorni dall'ultimo tentativo
  
  // ⭐ CLASSIFICATION
  proficiencyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  needsWork: boolean;              // Se la parola ha bisogno di lavoro
  isWellMastered: boolean;         // Se la parola è ben padroneggiata
  recommendedAction: 'study_more' | 'practice_speed' | 'review_occasionally' | 'maintain';
  
  // ⭐ RECENT ATTEMPTS (per analisi dettagliata)
  recentAttempts: DetailedWordResponse[];  // Ultimi 10 tentativi
}

// ===== HOOK INTERFACES =====

/**
 * Return type per il nuovo hook di statistiche ottimizzato
 */
export interface OptimizedStatsReturn {
  // ⭐ DATI CALCOLATI
  globalStats: ComputedGlobalStats;
  chapterStats: ComputedChapterStats[];
  wordAnalyses: ComputedWordAnalysis[];
  
  // ⭐ DATI RAW (per debug e analisi avanzate)
  allTests: OptimizedTestResult[];
  allWords: OptimizedWord[];
  
  // ⭐ STATO
  isLoading: boolean;
  error: Error | null;
  lastCalculated: Timestamp | null;
  dataVersion: string;
  
  // ⭐ FUNZIONI DI CALCOLO
  recalculateStats: () => void;
  getWordAnalysis: (wordId: ID) => ComputedWordAnalysis | null;
  getChapterStats: (chapter: string) => ComputedChapterStats | null;
  
  // ⭐ FUNZIONI DI GESTIONE TEST
  addTestResult: (testResult: OptimizedTestResult) => void;
  removeTestResult: (testId: ID) => void;
  
  // ⭐ FUNZIONI DI FILTRAGGIO
  getStatsByDateRange: (startDate: string, endDate: string) => ComputedGlobalStats;
  getStatsByTestType: (testType: TestType) => ComputedGlobalStats;
  getStatsByDifficulty: (difficulty: TestDifficulty) => ComputedGlobalStats;
  
  // ⭐ EXPORT/IMPORT
  exportOptimizedData: () => string;  // JSON string
  importOptimizedData: (jsonString: string) => void;
}

/**
 * Configurazione per il calcolo delle statistiche
 */
export interface StatsCalculationConfig {
  // ⭐ SOGLIE PER CLASSIFICAZIONI
  masteryThreshold: number;      // Soglia per considerare una parola "masterizzata" (default: 90%)
  consistencyWindow: number;     // Finestra per calcolo consistenza (default: 10 tentativi)
  recentWindow: number;          // Finestra per "recenti" (default: 5 tentativi)
  
  // ⭐ PESI PER CALCOLI
  accuracyWeight: number;        // Peso per accuratezza nel calcolo finale
  speedWeight: number;           // Peso per velocità nel calcolo finale
  consistencyWeight: number;     // Peso per consistenza nel calcolo finale
  independenceWeight: number;    // Peso per indipendenza (meno aiuti) nel calcolo finale
  
  // ⭐ OPZIONI DI CALCOLO
  includeIncompleteTests: boolean;  // Include test non completati
  normalizeByChapter: boolean;      // Normalizza per capitolo
  useWeightedAverages: boolean;     // Usa medie pesate per tempo
}

// ===== EXPORT TYPES =====
export type {
  ComputedChapterStats as ChapterStats, OptimizedStatsReturn as EnhancedStatsReturn, ComputedGlobalStats as GlobalStats, OptimizedTestResult as TestResult, OptimizedWord as Word, ComputedWordAnalysis as WordAnalysis, OptimizedWordInput as WordInput, DetailedWordResponse as WordResponse
};

// ===== CONSTANTS =====
export const DEFAULT_STATS_CONFIG: StatsCalculationConfig = {
  masteryThreshold: 90,
  consistencyWindow: 10,
  recentWindow: 5,
  accuracyWeight: 0.4,
  speedWeight: 0.2,
  consistencyWeight: 0.25,
  independenceWeight: 0.15,
  includeIncompleteTests: false,
  normalizeByChapter: true,
  useWeightedAverages: true
};

export const DATA_VERSION = '3.0.0';
export const STORAGE_KEYS = {
  optimizedTests: 'vocabulary_optimized_tests',
  optimizedWords: 'vocabulary_optimized_words',
  globalStats: 'vocabulary_global_stats',
  chapterStats: 'vocabulary_chapter_stats',
  wordAnalyses: 'vocabulary_word_analyses',
  lastCalculated: 'vocabulary_last_calculated'
} as const;