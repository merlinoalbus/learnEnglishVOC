// =====================================================
// 📁 types/entities/Test.types.ts - Entità Test e Quiz Flow Refactored
// =====================================================

/**
 * Definizione completa dell'entità Test e tutto il flusso quiz
 * REFACTORED: Eliminazione ridondanze e gestione aggregata
 * Basato su: useTest.js hook esistente e TestView.js UI
 */

import { Word } from "./Word.types";

// =====================================================
// 🎯 TEST CORE ENTITY
// =====================================================

/**
 * Entità Test principale per stato test corrente
 * REFACTORED: Gestione centralizzata senza duplicazioni
 */
export interface Test {
  /** ID univoco del test */
  id: string;

  /** ID utente proprietario */
  userId: string;

  /** Configurazione test */
  config: TestConfig;

  /** Stato corrente test */
  state: TestState;

  /** Sessione test corrente */
  session: TestSession;

  /** Timestamp inizio test */
  startedAt: Date;

  /** Timestamp fine test (se completato) */
  completedAt?: Date;

  /** Flag test salvato */
  isSaved: boolean;

  /** Metadata Firestore - usa FirestoreDocMetadata generic */
  firestoreMetadata?: import("../infrastructure/Firestore.types").FirestoreDocMetadata;
}

/**
 * Sessione test - AGGREGATORE CENTRALE di tutto lo stato runtime
 * Sostituisce: testWords, currentWord, stats, progress, wrongWords, wordTimes, etc.
 */
export interface TestSession {
  /** Pool parole per il test */
  wordPool: TestWordPool;

  /** Domanda corrente attiva */
  currentQuestion: TestQuestion | null;

  /** Cronologia risposte date */
  answerHistory: TestAnswer[];

  /** Metriche tempo aggregate */
  timeMetrics: TestTimeMetrics;

  /** Sistema hint centralizzato */
  hintSystem: TestHintSystem;

  /** Calcoli progresso in tempo reale */
  progress: TestProgress;
}

// =====================================================
// 📚 WORD POOL MANAGEMENT
// =====================================================

/**
 * Pool parole gestito centralmente
 * Sostituisce: testWords[], usedWordIds, currentWordIndex
 */
export interface TestWordPool {
  /** Tutte le parole del test */
  allWords: Word[];

  /** Parole già utilizzate */
  usedWords: Word[];

  /** Parole rimanenti */
  remainingWords: Word[];

  /** Parole sbagliate da rivedere */
  incorrectWords: Word[];

  /** Indice parola corrente */
  currentIndex: number;

  /** Strategia selezione prossima parola */
  selectionStrategy: WordSelectionStrategy;
}

/**
 * Strategie per selezione parola successiva
 */
export type WordSelectionStrategy =
  | "sequential" // Ordine sequenziale
  | "random" // Casuale
  | "adaptive" // Basato su performance
  | "review-first"; // Prima le sbagliate

// =====================================================
// 🎯 QUESTION & ANSWER UNIFIED
// =====================================================

/**
 * Domanda test corrente - UNIFICATA
 * Sostituisce: TestQuestion + parti di currentWord state
 */
export interface TestQuestion {
  /** ID univoco domanda */
  id: string;

  /** Parola della domanda */
  word: Word;

  /** Numero domanda nel test (1-based) */
  questionNumber: number;

  /** Timer domanda */
  timer: QuestionTimer;

  /** Stato hint per questa domanda */
  hintState: QuestionHintState;

  /** Stato UI transizione */
  isTransitioning: boolean;
}

/**
 * Timer per singola domanda
 * Sostituisce: timing sparso in più interfacce
 */
export interface QuestionTimer {
  /** Timestamp inizio domanda */
  startedAt: Date;

  /** Timestamp fine domanda */
  endedAt?: Date;

  /** Tempo limite per questa domanda (ms) */
  timeLimit?: number;

  /** Tempo trascorso (ms) */
  elapsed: number;

  /** Tempo rimanente (ms) */
  remaining?: number;

  /** Timer attivo */
  isActive: boolean;
}

/**
 * Stato hint per domanda corrente
 * Sostituisce: hint sparsi in TestQuestion, TestAnswer, etc.
 * SEMPLIFICATO: Solo 2 tipi hint realmente utili
 */
export interface QuestionHintState {
  /** Hint disponibili per questa parola */
  availableHints: AvailableHint[];

  /** Hint già utilizzati */
  usedHints: UsedHint[];

  /** Hint system attivo */
  isEnabled: boolean;

  /** Cooldown attivo (ms) */
  cooldownRemaining: number;
}

/**
 * Hint disponibile
 */
export interface AvailableHint {
  type: HintType;
  content: string;
  cost: number; // Per scoring (sentence=3 punti, synonym=5 punti)
}

/**
 * Hint utilizzato
 */
export interface UsedHint {
  type: HintType;
  content: string;
  usedAt: Date;
  cost: number;
}

/**
 * Tipi hint disponibili - SOLO 2 TIPI UTILI
 */
export type HintType =
  | "sentence" // Mostra una frase random dall'array sentences[]
  | "synonym"; // Mostra i sinonimi dall'array synonyms[]

/**
 * Risposta test - UNIFICATA E COMPLETA
 * Sostituisce: TestAnswer + parti di wrongWords + timing
 */
export interface TestAnswer {
  /** ID univoco risposta */
  id: string;

  /** ID domanda di riferimento */
  questionId: string;

  /** ID parola */
  wordId: string;

  /** Risultato risposta */
  result: AnswerResult;

  /** Timing completo */
  timing: AnswerTiming;

  /** Hint utilizzati per questa risposta */
  hintsUsed: UsedHint[];

  /** Metadata aggiuntivi */
  metadata?: AnswerMetadata;
}

/**
 * Risultato risposta
 * CORRETTO: Sistema self-declaration (utente dichiara se aveva indovinato)
 */
export interface AnswerResult {
  /** Risposta corretta dichiarata dall'utente */
  isCorrect: boolean;

  /** Confidenza nella propria risposta (1-5) - opzionale */
  confidence?: number;
}

/**
 * Timing risposta unificato
 * CORRETTO: Timing per flip card + self-declaration
 */
export interface AnswerTiming {
  /** Inizio visualizzazione parola inglese */
  startedAt: Date;

  /** Momento flip card (visualizzazione traduzione) */
  cardFlippedAt: Date;

  /** Momento dichiarazione risultato */
  declaredAt: Date;

  /** Tempo totale dal show al dichiarato (ms) */
  totalTime: number;

  /** Tempo di riflessione prima del flip (ms) */
  thinkingTime: number;

  /** Tempo tra flip e dichiarazione (ms) */
  declarationTime: number;
}

/**
 * Metadata risposta opzionali
 */
export interface AnswerMetadata {
  /** Dispositivo utilizzato */
  device?: string;

  /** Hora del giorno */
  timeOfDay: "morning" | "afternoon" | "evening" | "night";

  /** Posizione in sessione */
  sessionPosition: number;

  /** Fattori contestuali */
  contextFactors?: string[];
}

// =====================================================
// ⏱️ TIME METRICS CENTRALIZED
// =====================================================

/**
 * Metriche tempo centralizzate
 * Sostituisce: timing sparso in TestStats, TestProgress, WordTimeRecord
 */
export interface TestTimeMetrics {
  /** Tempo totale test (ms) */
  totalTestTime: number;

  /** Tempo medio per domanda (ms) */
  averageQuestionTime: number;

  /** Tempo minimo domanda (ms) */
  fastestQuestion: number;

  /** Tempo massimo domanda (ms) */
  slowestQuestion: number;

  /** Distribuzione tempi */
  timeDistribution: TimeDistribution;

  /** Trend velocità */
  speedTrend: SpeedTrend;
}

/**
 * Distribuzione tempi per analisi
 */
export interface TimeDistribution {
  /** Tempi per categoria parola */
  byCategory: Record<string, number>;

  /** Tempi per difficoltà */
  byDifficulty: Record<string, number>;

  /** Percentili tempi */
  percentiles: {
    p25: number;
    p50: number;
    p75: number;
    p90: number;
  };
}

/**
 * Trend velocità nel tempo
 */
export interface SpeedTrend {
  /** Direzione trend */
  direction: "improving" | "stable" | "declining";

  /** Cambiamento percentuale */
  changePercentage: number;

  /** Punti dati trend */
  dataPoints: Array<{
    questionNumber: number;
    time: number;
  }>;
}

// =====================================================
// 🔗 HINT SYSTEM CENTRALIZED
// =====================================================

/**
 * Sistema hint centralizzato
 * Sostituisce: TestHint + hint sparsi
 */
export interface TestHintSystem {
  /** Configurazione hint */
  config: HintSystemConfig;

  /** Stato globale hint */
  globalState: HintGlobalState;

  /** Statistiche hint */
  statistics: HintStatistics;
}

/**
 * Configurazione sistema hint - SEMPLIFICATA per 2 soli tipi
 */
export interface HintSystemConfig {
  /** Hint abilitati */
  enabled: boolean;

  /** Max hint per domanda (max 2: sentence + synonym) */
  maxHintsPerQuestion: number;

  /** Cooldown tra hint (ms) */
  cooldownBetweenHints: number;

  /** Costo hint in punti - sentence costa meno di synonym */
  hintCosts: {
    sentence: number; // Es: 3 punti (meno invasivo)
    synonym: number; // Es: 5 punti (più rivelatorio)
  };

  /** Hint disponibili - sempre entrambi se presenti nei dati Word */
  availableHintTypes: HintType[];
}

/**
 * Stato globale hint
 */
export interface HintGlobalState {
  /** Totale hint utilizzati nel test */
  totalHintsUsed: number;

  /** Hint rimanenti (se limitati) */
  hintsRemaining?: number;

  /** Cooldown globale attivo */
  globalCooldownUntil?: Date;

  /** Pattern utilizzo hint */
  usagePattern: HintUsagePattern;
}

/**
 * Pattern utilizzo hint - SEMPLIFICATO
 */
export interface HintUsagePattern {
  /** Frequenza utilizzo */
  frequency: "low" | "moderate" | "high";

  /** Preferenza tra sentence vs synonym */
  preferredType: HintType | "balanced";

  /** Efficacia hint - accuracy dopo sentence vs synonym */
  effectiveness: {
    sentence: number; // % successo dopo hint sentence
    synonym: number; // % successo dopo hint synonym
  };
}

/**
 * Statistiche hint - SEMPLIFICATO
 */
export interface HintStatistics {
  /** Utilizzo per tipo */
  usage: {
    sentence: number; // Quante volte usato hint sentence
    synonym: number; // Quante volte usato hint synonym
  };

  /** Accuratezza post-hint */
  accuracyAfterHint: {
    sentence: number; // % successo dopo sentence hint
    synonym: number; // % successo dopo synonym hint
    overall: number; // % successo generale con hint
  };

  /** Tempo medio con hint */
  averageTimeWithHint: {
    sentence: number; // Tempo medio con sentence hint
    synonym: number; // Tempo medio con synonym hint
    overall: number; // Tempo medio generale con hint
  };

  /** Tempo medio senza hint */
  averageTimeWithoutHint: number;
}

// =====================================================
// 📊 PROGRESS CENTRALIZED
// =====================================================

/**
 * Progresso test centralizzato
 * Sostituisce: TestProgress + calcoli sparsi
 */
export interface TestProgress {
  /** Progresso base */
  basic: BasicProgress;

  /** Metriche performance */
  performance: PerformanceMetrics;

  /** Predizioni */
  predictions: ProgressPredictions;

  /** Milestone raggiunti */
  milestones: ProgressMilestone[];
}

/**
 * Progresso base
 */
export interface BasicProgress {
  /** Domanda corrente (1-based) */
  currentQuestion: number;

  /** Totale domande */
  totalQuestions: number;

  /** Percentuale completamento */
  completionPercentage: number;

  /** Domande risposte */
  questionsAnswered: number;

  /** Domande rimanenti */
  questionsRemaining: number;
}

/**
 * Metriche performance in tempo reale
 */
export interface PerformanceMetrics {
  /** Accuratezza corrente */
  currentAccuracy: number;

  /** Risposte corrette */
  correctAnswers: number;

  /** Risposte sbagliate */
  incorrectAnswers: number;

  /** Streak corrente */
  currentStreak: number;

  /** Miglior streak */
  bestStreak: number;

  /** Efficienza (accuracy - hint penalty) */
  efficiency: number;

  /** Score corrente */
  currentScore: number;
}

/**
 * Predizioni progresso
 */
export interface ProgressPredictions {
  /** Tempo stimato completamento */
  estimatedTimeToCompletion: number;

  /** Accuratezza finale prevista */
  predictedFinalAccuracy: number;

  /** Score finale previsto */
  predictedFinalScore: number;

  /** Confidence predizioni */
  confidence: number;
}

/**
 * Milestone progresso
 */
export interface ProgressMilestone {
  id: string;
  name: string;
  description: string;
  achieved: boolean;
  achievedAt?: Date;
  progress: number; // 0-100
}

// =====================================================
// ⚙️ TEST CONFIGURATION
// =====================================================

/**
 * Configurazione test
 */
export interface TestConfig {
  /** Modalità test */
  mode: TestMode;

  /** Selezione parole */
  wordSelection: WordSelectionConfig;

  /** Configurazione timing */
  timing: TimingConfig;

  /** Configurazione UI */
  ui: UIConfig;

  /** Configurazione hint */
  hints: HintSystemConfig;

  /** Configurazione scoring */
  scoring: ScoringConfig;
}

/**
 * Configurazione selezione parole
 */
export interface WordSelectionConfig {
  /** Capitoli inclusi */
  chapters: string[];

  /** Categorie incluse */
  categories: string[];

  /** Solo parole difficili */
  difficultOnly: boolean;

  /** Solo parole non apprese */
  unlearnedOnly: boolean;

  /** Numero massimo parole */
  maxWords?: number;

  /** Ordine randomizzato */
  randomOrder: boolean;

  /** Strategia selezione */
  selectionStrategy: WordSelectionStrategy;
}

/**
 * Configurazione timing
 */
export interface TimingConfig {
  /** Timer visibile */
  showTimer: boolean;

  /** Auto advance dopo risposta */
  autoAdvance: boolean;

  /** Delay auto advance (ms) */
  autoAdvanceDelay: number;

  /** Limite tempo per parola (ms) */
  wordTimeLimit?: number;

  /** Limite tempo totale test (ms) */
  totalTimeLimit?: number;

  /** Mostra significato dopo risposta */
  showMeaning: boolean;

  /** Durata mostra significato (ms) */
  meaningDisplayDuration: number;
}

/**
 * Configurazione UI
 */
export interface UIConfig {
  /** Tema interfaccia */
  theme: "light" | "dark" | "auto";

  /** Animazioni abilitate */
  animations: boolean;

  /** Suoni abilitati */
  sounds: boolean;

  /** Mostra progresso dettagliato */
  showDetailedProgress: boolean;

  /** Mostra statistiche real-time */
  showRealTimeStats: boolean;
}

/**
 * Configurazione scoring
 */
export interface ScoringConfig {
  /** Peso accuratezza */
  accuracyWeight: number;

  /** Peso velocità */
  speedWeight: number;

  /** Penalità hint */
  hintPenalty: number;

  /** Bonus streak */
  streakBonus: number;

  /** Soglie punteggio */
  thresholds: {
    excellent: number;
    good: number;
    average: number;
  };
}

/**
 * Modalità test disponibili
 */
export type TestMode =
  | "normal"
  | "difficult-only"
  | "chapter"
  | "custom"
  | "review"
  | "timed"
  | "endless"
  | "adaptive";

// =====================================================
// 🔄 TEST STATE MACHINE
// =====================================================

/**
 * Stati possibili del test
 */
export type TestState =
  | "idle"
  | "ready"
  | "running"
  | "paused"
  | "transitioning"
  | "completed"
  | "aborted"
  | "reviewing";

/**
 * Azioni possibili nel test
 */
export type TestAction =
  | "start"
  | "pause"
  | "resume"
  | "answer"
  | "skip"
  | "hint"
  | "next"
  | "complete"
  | "abort"
  | "reset"
  | "review";

/**
 * Evento test per state machine
 */
export interface TestEvent {
  action: TestAction;
  payload?: any;
  timestamp: Date;
}

// =====================================================
// 🏆 TEST RESULTS UNIFIED
// =====================================================

/**
 * Risultati test finali unificati
 * Sostituisce: TestResult + TestScore + TestFeedback
 */
export interface TestResult {
  /** ID test */
  testId: string;

  /** ID utente */
  userId: string;

  /** Configurazione utilizzata */
  config: TestConfig;

  /** Sessione completa */
  completedSession: TestSession;

  /** Score finale */
  finalScore: FinalScore;

  /** Analytics completi */
  analytics: TestAnalytics;

  /** Feedback e raccomandazioni */
  feedback: TestFeedback;

  /** Export data */
  exportData: TestExportData;
}

/**
 * Score finale calcolato
 */
export interface FinalScore {
  /** Punteggio totale (0-100) */
  total: number;

  /** Categoria performance */
  category: ScoreCategory;

  /** Breakdown dettagliato */
  breakdown: ScoreBreakdown;

  /** Confronto con test precedenti */
  comparison?: ScoreComparison;
}

/**
 * Breakdown punteggio
 */
export interface ScoreBreakdown {
  accuracy: number;
  speed: number;
  efficiency: number;
  consistency: number;
  bonus: number;
  penalties: number;
}

/**
 * Confronto score
 */
export interface ScoreComparison {
  improvement: number;
  trend: "improving" | "stable" | "declining";
  percentileRank: number;
}

/**
 * Categorie punteggio
 */
export type ScoreCategory =
  | "excellent"
  | "good"
  | "average"
  | "poor"
  | "perfect";

/**
 * Analytics test completi
 */
export interface TestAnalytics {
  /** Pattern performance */
  performancePatterns: PerformancePatterns;

  /** Insights personalizzati */
  insights: TestInsight[];

  /** Raccomandazioni */
  recommendations: TestRecommendation[];
}

/**
 * Pattern performance
 */
export interface PerformancePatterns {
  timePatterns: TestTimeMetrics;
  accuracyPatterns: AccuracyPatterns;
  hintPatterns: HintStatistics;
  categoryPatterns: CategoryPerformance[];
}

/**
 * Pattern accuratezza
 */
export interface AccuracyPatterns {
  overallAccuracy: number;
  accuracyByPosition: number[];
  accuracyTrend: SpeedTrend;
  difficultWordsBias: number;
}

/**
 * Performance per categoria
 */
export interface CategoryPerformance {
  category: string;
  accuracy: number;
  averageTime: number;
  hintsUsed: number;
  difficultyRating: number;
}

/**
 * Insight test
 */
export interface TestInsight {
  type: "strength" | "weakness" | "improvement" | "pattern";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  actionable: boolean;
  data?: any;
}

/**
 * Raccomandazione test
 */
export interface TestRecommendation {
  type: "study" | "practice" | "strategy" | "configuration";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  expectedBenefit: string;
  effort: "easy" | "medium" | "hard";
}

/**
 * Feedback test
 */
export interface TestFeedback {
  /** Messaggio principale */
  message: string;

  /** Tone emotivo */
  tone: "celebratory" | "encouraging" | "constructive" | "motivational";

  /** Icona rappresentativa */
  icon: string;

  /** Colore tema */
  color: string;

  /** Prossimi obiettivi */
  nextGoals: string[];

  /** Parole da rivedere */
  wordsToReview: string[];
}

/**
 * Dati export test
 */
export interface TestExportData {
  summary: TestSummary;
  detailedAnswers: TestAnswer[];
  analytics: TestAnalytics;
  exportedAt: Date;
  format: "json" | "csv" | "pdf";
}

/**
 * Summary test per export
 */
export interface TestSummary {
  testId: string;
  duration: number;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  hintsUsed: number;
  averageTime: number;
  score: number;
  category: ScoreCategory;
}
