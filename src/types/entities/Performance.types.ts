// =====================================================
// 📁 types/entities/Performance.types.ts - FIXED & ALIGNED WITH AS-IS
// =====================================================

/**
 * CORREZIONI PRINCIPALI:
 * ✅ ELIMINA duplicazioni con Test.types.ts (TestTimeMetrics ritorna lì)
 * ✅ ALLINEA con useStats.js struttura wordPerformance reale
 * ✅ RIMUOVE over-engineering e mantiene semplicità AS-IS
 * ✅ FOCUS su word-specific performance tracking come da codice esistente
 */

import { Word } from "./Word.types";

// =====================================================
// 📈 WORD PERFORMANCE CORE - ALIGNED WITH AS-IS
// =====================================================

/**
 * Performance per singola parola - ALLINEATA con useStats.js
 * FONTE: wordPerformance[wordId] structure da useStats.js
 * CORREZIONE: Struttura semplificata come nel codice reale
 */
export interface WordPerformance {
  /** ID parola */
  wordId: string;

  /** Termine inglese - da word data */
  english: string;

  /** Traduzione italiana - da word data */
  italian: string;

  /** Capitolo - opzionale da word data */
  chapter?: string;

  /** Array tentativi - CORE del sistema performance AS-IS */
  attempts: PerformanceAttempt[];

  /** FIXED: Dati cumulativi calcolati */
  totalAttempts?: number;
  correctAttempts?: number;
  accuracy?: number;
  averageResponseTime?: number;
  lastAttemptAt?: Date;
  createdAt?: Date;

  /** Timestamp ultimo aggiornamento */
  updatedAt?: Date;

  /** Metadata Firestore - usa FirestoreDocMetadata generic */
  firestoreMetadata?: import("../infrastructure/Firestore.types").FirestoreDocMetadata;
}

/**
 * Singolo tentativo performance
 * FONTE: attempts structure da recordWordPerformance in useStats.js
 * CORREZIONE: Allineata ESATTAMENTE con struttura AS-IS
 */
export interface PerformanceAttempt {
  /** Timestamp tentativo - ISO string come da codice */
  timestamp: string;

  /** Risposta corretta */
  correct: boolean;

  /** Hint utilizzato */
  usedHint: boolean;

  /** ⭐ NUOVO: Numero di hint utilizzati per questo tentativo */
  hintsCount?: number;

  /** Tempo speso (ms) */
  timeSpent: number;
}

// =====================================================
// 📊 PERFORMANCE ANALYSIS - ALIGNED WITH AS-IS
// =====================================================

/**
 * Analisi performance parola
 * FONTE: getWordAnalysis function da useStats.js
 * CORREZIONE: Rispecchia ESATTAMENTE i calcoli del codice esistente
 */
export interface WordPerformanceAnalysis {
  /** ID parola analizzata */
  id: string;

  /** Dati word base */
  english: string;
  italian: string;
  chapter: string;
  group: string;
  sentence: string;
  notes: string;
  learned: boolean;
  difficult: boolean;

  /** Statistiche performance - COME DA useStats.js */
  totalAttempts: number;
  correctAttempts: number;
  incorrectAttempts: number;
  accuracy: number; // Math.round((correctAttempts / totalAttempts) * 100)
  recentAccuracy: number; // Last 5 attempts accuracy
  avgTime: number; // Average time from attempts
  hintsUsed: number; // Count of usedHint=true
  hintsPercentage: number; // Math.round((hintsUsed / totalAttempts) * 100)
  currentStreak: number; // Current consecutive correct

  /** Status classificazione - COME DA getWordAnalysis logic */
  status: WordPerformanceStatus;

  /** Metadata analisi */
  lastAttempt: PerformanceAttempt | null;
  trend: "improving" | "stable" | "declining";
  difficulty: "easy" | "medium" | "hard" | "unknown";
  needsWork: boolean; // accuracy < 70
  mastered: boolean; // accuracy >= 90 && currentStreak >= 3

  /** Array tentativi per trend analysis */
  attempts: PerformanceAttempt[];

  /** Flag che indica se ci sono dati di performance */
  hasPerformanceData: boolean;

  /** Raccomandazioni */
  recommendations: string[];
}

/**
 * Status performance parola
 * FONTE: status logic da getWordAnalysis in useStats.js
 * CORREZIONE: Enum allineato con logic AS-IS
 */
export type WordPerformanceStatus =
  | "new" // totalAttempts === 0
  | "promising" // totalAttempts < 3 && currentStreak > 0
  | "struggling" // totalAttempts < 3 && currentStreak === 0
  | "consolidated" // totalAttempts >= 3 && currentStreak >= 3
  | "improving" // totalAttempts >= 3 && accuracy >= 70%
  | "critical" // totalAttempts >= 3 && accuracy <= 30%
  | "inconsistent"; // totalAttempts >= 3 && accuracy 31-69%

// =====================================================
// 📊 PERFORMANCE METRICS AGGREGATE - SIMPLIFIED
// =====================================================

/**
 * Metriche performance aggregate
 * FONTE: getAllWordsPerformance da useStats.js
 * CORREZIONE: Struttura semplificata per aggregazione parole
 */
export interface PerformanceMetrics {
  /** ID utente proprietario */
  userId: string;

  /** Lista performance tutte le parole */
  wordPerformances: WordPerformanceAnalysis[];

  /** Statistiche aggregate */
  globalStats: GlobalPerformanceStats;

  /** Timestamp ultimo calcolo */
  calculatedAt: Date;
}

/**
 * Statistiche performance globali
 * FONTE: Logic da useStats per aggregazioni
 * CORREZIONE: Metriche semplici e utili
 */
export interface GlobalPerformanceStats {
  /** Totale parole con performance data */
  totalWordsTracked: number;

  /** Parole per status */
  statusDistribution: Record<WordPerformanceStatus, number>;

  /** Accuratezza media globale */
  averageAccuracy: number;

  /** Tempo medio globale */
  averageResponseTime: number;

  /** Percentuale hint globale */
  averageHintUsage: number;

  /** Parole che necessitano lavoro */
  wordsNeedingWork: number;

  /** Parole masterizzate */
  masteredWords: number;
}

// =====================================================
// 🔄 PERFORMANCE OPERATIONS - SIMPLIFIED
// =====================================================

/**
 * Input per aggiornamento performance
 * FONTE: recordWordPerformance signature da useStats.js
 * CORREZIONE: Allineata con function signature esistente
 */
export interface UpdatePerformanceInput {
  /** Word object - come da recordWordPerformance(word, ...) */
  word: Pick<Word, "id" | "english" | "italian" | "chapter">;

  /** Risposta corretta */
  isCorrect: boolean;

  /** Hint utilizzato */
  usedHint: boolean;

  /** Tempo speso (ms) */
  timeSpent: number;
}

/**
 * Risultato aggiornamento performance
 * CORREZIONE: Semplificato per feedback operazione
 */
export interface UpdatePerformanceResult {
  /** Aggiornamento riuscito */
  success: boolean;

  /** Performance aggiornata */
  updatedPerformance?: WordPerformance;

  /** Nuova analisi */
  analysis?: WordPerformanceAnalysis;

  /** Errori durante aggiornamento */
  error?: string;
}

// =====================================================
// 🎯 DIFFICULTY ANALYSIS - SIMPLIFIED FROM AS-IS
// =====================================================

/**
 * Analisi difficoltà test
 * FONTE: calculateSmartTestDifficulty da useStats.js
 * CORREZIONE: Struttura allineata con logic esistente per test difficulty
 */
export interface TestDifficultyAnalysis {
  /** Difficoltà calcolata */
  difficulty: "easy" | "medium" | "hard";

  /** Motivo classificazione */
  difficultyReason: string;

  /** Totale parole analizzate */
  totalWords: number;

  /** Score pesato */
  weightedScore: number;

  /** Aggiustamento dimensione */
  sizeAdjustment: number;

  /** Distribuzione per difficoltà */
  distribution: {
    hard: { count: number; percentage: number };
    medium: { count: number; percentage: number };
    easy: { count: number; percentage: number };
  };

  /** Breakdown per status */
  statusBreakdown: Record<WordPerformanceStatus, number>;
}

/**
 * Categoria performance per test difficulty
 * FONTE: categories logic da calculateSmartTestDifficulty
 * CORREZIONE: Structure per classificazione parole nel test
 */
export interface PerformanceCategory {
  /** Parola */
  word: Word;

  /** Status performance */
  status: WordPerformanceStatus;

  /** Analisi performance */
  analysis: WordPerformanceAnalysis;
}

// =====================================================
// 📈 TREND ANALYSIS - SIMPLIFIED
// =====================================================

/**
 * Trend direction semplificato
 * CORREZIONE: Rimosso l'over-engineering, mantiene basics
 */
export interface SimpleTrend {
  /** Direzione trend */
  direction: "improving" | "stable" | "declining";

  /** Confidence trend (0-1) */
  confidence: number;

  /** Numero campioni analizzati */
  sampleSize: number;
}

/**
 * Performance trends per parola
 * CORREZIONE: Struttura semplificata per trending
 */
export interface WordPerformanceTrends {
  /** Trend accuratezza */
  accuracyTrend: SimpleTrend;

  /** Trend velocità */
  speedTrend: SimpleTrend;

  /** Trend utilizzo hint */
  hintTrend: SimpleTrend;

  /** Periodo analisi (giorni) */
  analysisperiod: number;
}
