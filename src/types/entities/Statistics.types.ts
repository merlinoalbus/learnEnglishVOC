// =====================================================
// 📁 types/entities/Statistics.types.ts - REDESIGNED AS AGGREGATOR
// =====================================================

/**
 * REDESIGN PRINCIPI:
 * ✅ COMPONE types esistenti invece di ridefinirli
 * ✅ AGGREGA Test.types.ts + Performance.types.ts + Word.types.ts
 * ✅ MANTIENE allineamento con useStats.js AS-IS
 * ✅ ELIMINA duplicazioni usando imports esistenti
 * ✅ FOCUS su aggregation e analytics cross-domain
 */

// ===== IMPORTS DA TYPES ESISTENTI =====
import { TestResult } from "./Test.types";

import {
  WordPerformanceAnalysis,
  GlobalPerformanceStats,
} from "./Performance.types";

import { Word, WordCategory } from "./Word.types";

// =====================================================
// 📊 STATISTICS CORE - AGGREGATOR ENTITY
// =====================================================

/**
 * Entità Statistics come AGGREGATORE di domini esistenti
 * FONTE: INITIAL_STATS da useStats.js
 * NUOVO APPROCCIO: Compone types esistenti invece di ridefinirli
 */
export interface Statistics {
  /** ID utente proprietario */
  userId?: string;

  // ===== CORE STATS - DA INITIAL_STATS (invariato) =====
  /** Totale parole nel sistema - DERIVED da Word[] */
  totalWords: number;

  /** Totale risposte corrette - AGGREGATED da TestResult[] */
  correctAnswers: number;

  /** Totale risposte sbagliate - AGGREGATED da TestResult[] */
  incorrectAnswers: number;

  /** Totale hint utilizzati - AGGREGATED da TestResult[] */
  hintsUsed: number;

  /** Punteggio medio - CALCULATED da TestResult[] */
  averageScore: number;

  /** Test completati - COUNT da TestResult[] */
  testsCompleted: number;

  /** Tempo totale speso (ms) - AGGREGATED da TestResult[] */
  timeSpent: number;

  // ===== PROGRESS TRACKING - AGGREGA DOMINI =====
  /** Progresso per categoria - COMPONE Word + Performance */
  categoriesProgress: Record<WordCategory, CategoryProgressAggregated>;

  /** Progresso giornaliero - AGGREGATION temporale */
  dailyProgress: Record<string, DailyProgressAggregated>;

  /** Giorni streak consecutivi - CALCULATED */
  streakDays: number;

  /** Data ultimo studio - LATEST da TestResult[] */
  lastStudyDate: string | null;

  // ===== DIFFICULTY STATS - COMPONE Performance + Test =====
  /** Statistiche per difficoltà - AGGREGATED da TestResult.difficulty */
  difficultyStats: DifficultyStatsAggregated;

  /** Statistiche mensili - TEMPORAL AGGREGATION */
  monthlyStats: Record<string, MonthlyStatsAggregated>;

  /** Flag migrazione completata */
  migrated: boolean;

  /** Metadata Firestore */
  firestoreMetadata?: import("../infrastructure/Firestore.types").FirestoreDocMetadata;
}

// =====================================================
// 📊 AGGREGATED PROGRESS TYPES - COMPONE DOMINI ESISTENTI
// =====================================================

/**
 * Progresso categoria AGGREGATO
 * COMPONE: Word.types.ts + Performance.types.ts data
 * DERIVA: Da ChapterStats + GlobalPerformanceStats
 */
export interface CategoryProgressAggregated {
  /** Nome categoria - DA WordCategory type */
  category: WordCategory;

  /** AGGREGATION: Da Word[] con group = category */
  wordStats: {
    totalWords: number; // COUNT Word[] con group = category
    learnedWords: number; // COUNT Word[] con learned = true
    difficultWords: number; // COUNT Word[] con difficult = true
  };

  /** AGGREGATION: Da WordPerformanceAnalysis[] per categoria */
  performanceStats: {
    averageAccuracy: number; // AVG WordPerformanceAnalysis.accuracy
    totalAttempts: number; // SUM WordPerformanceAnalysis.totalAttempts
    masteredWords: number; // COUNT WordPerformanceAnalysis.mastered = true
    needsWorkWords: number; // COUNT WordPerformanceAnalysis.needsWork = true
  };

  /** AGGREGATION: Da TestResult[] per parole di questa categoria */
  testStats: {
    testsIncluding: number; // COUNT TestResult[] che includono parole categoria
    averageTestScore: number; // AVG score test con parole categoria
    lastTestedAt?: Date; // MAX TestResult.timestamp per categoria
  };

  /** COMPUTED: Progress complessivo categoria */
  overallProgress: {
    completionPercentage: number; // (learnedWords + masteredWords) / totalWords
    masteryLevel:
      | "beginner"
      | "learning"
      | "competent"
      | "proficient"
      | "mastered";
    recommendedAction: "practice" | "review" | "maintain" | "advance";
  };

  /** Ultimo aggiornamento aggregazione */
  lastUpdated: Date;
}

/**
 * Progresso giornaliero AGGREGATO
 * COMPONE: TestResult[] + WordPerformanceAnalysis[] per data
 */
export interface DailyProgressAggregated {
  /** Data (YYYY-MM-DD) */
  date: string;

  /** AGGREGATION: Da TestResult[] per data */
  testActivity: {
    testsCompleted: number; // COUNT TestResult[] per data
    averageScore: number; // AVG TestResult.score per data
    totalTime: number; // SUM TestResult.duration per data
    averageAccuracy: number; // AVG TestResult.accuracy per data
    hintsUsed: number; // SUM TestResult.hintsUsed per data
  };

  /** AGGREGATION: Da UpdatePerformanceInput[] per data */
  wordActivity: {
    wordsStudied: number; // COUNT DISTINCT wordId negli UpdatePerformanceInput per data
    newWordsEncountered: number; // COUNT parole con first attempt in data
    wordsImproved: number; // COUNT parole con accuracy migliorata in data
    wordsMastered: number; // COUNT parole diventate mastered in data
  };

  /** COMPUTED: Metriche derivate */
  derivedMetrics: {
    studyEfficiency: number; // averageAccuracy / (hintsUsed / wordsStudied)
    learningVelocity: number; // wordsImproved / wordsStudied
    consistency: number; // 1 se ha studiato, decresce nei giorni gap
  };
}

/**
 * Statistiche difficoltà AGGREGATE
 * COMPONE: TestResult.difficulty + WordPerformanceAnalysis.status
 */
export interface DifficultyStatsAggregated {
  /** AGGREGATION: Da TestResult[] per difficulty */
  testDifficulty: {
    easy: {
      testsCompleted: number;
      averageScore: number;
      averageAccuracy: number;
    };
    medium: {
      testsCompleted: number;
      averageScore: number;
      averageAccuracy: number;
    };
    hard: {
      testsCompleted: number;
      averageScore: number;
      averageAccuracy: number;
    };
  };

  /** AGGREGATION: Da WordPerformanceAnalysis[] per status */
  wordDifficulty: {
    critical: number; // COUNT WordPerformanceAnalysis.status = 'critical'
    struggling: number; // COUNT WordPerformanceAnalysis.status = 'struggling'
    improving: number; // COUNT WordPerformanceAnalysis.status = 'improving'
    consolidated: number; // COUNT WordPerformanceAnalysis.status = 'consolidated'
    mastered: number; // COUNT WordPerformanceAnalysis.mastered = true
  };

  /** COMPUTED: Difficulty trends */
  difficultyTrends: {
    overallDifficultyRating: number; // 0-100 based on word difficulty distribution
    improvementRate: number; // Rate di parole che migliorano status
    masteryProgression: number; // Rate di progressione verso mastery
  };
}

/**
 * Statistiche mensili AGGREGATE
 * COMPONE: Tutti i domini per aggregazione temporale mensile
 */
export interface MonthlyStatsAggregated {
  /** Mese (YYYY-MM) */
  month: string;

  /** AGGREGATION: TestResult[] per mese */
  testMetrics: {
    testsCompleted: number;
    averageScore: number;
    averageAccuracy: number;
    totalTimeSpent: number;
    bestStreak: number;
    testDifficultyDistribution: Record<"easy" | "medium" | "hard", number>;
  };

  /** AGGREGATION: Word[] changes per mese */
  vocabularyMetrics: {
    wordsAdded: number; // New Word[] created in month
    wordsLearned: number; // Word.learned changed to true in month
    categoriesStudied: number; // DISTINCT WordCategory in tests
  };

  /** AGGREGATION: Performance[] per mese */
  performanceMetrics: {
    wordsImproved: number; // WordPerformanceAnalysis status improved
    wordsMastered: number; // WordPerformanceAnalysis.mastered = true
    averageAttempts: number; // AVG attempts per word
    consistencyScore: number; // Consistency of daily activity
  };

  /** COMPUTED: Monthly insights */
  insights: MonthlyInsight[];
}

/**
 * Insight mensile
 * COMPUTED: Da aggregazioni multiple domini
 */
export interface MonthlyInsight {
  type: "achievement" | "improvement" | "concern" | "milestone";
  title: string;
  description: string;
  metrics: Record<string, number>;
  recommendations?: string[];
}

// =====================================================
// 📈 CALCULATED STATS - MULTI-DOMAIN AGGREGATION
// =====================================================

/**
 * Statistiche calcolate AGGREGATE
 * COMPONE: Statistics + Performance + Test data
 * SOSTITUISCE: CalculatedStatistics precedente con aggregation approach
 */
export interface AggregatedCalculatedStatistics {
  /** Statistiche base aggregate */
  baseStats: Statistics;

  /** COMPUTED: Da TestResult[] + Performance[] */
  performanceAnalytics: {
    globalPerformanceStats: GlobalPerformanceStats;
    wordLevelInsights: WordPerformanceAnalysis[];
    learningTrends: LearningTrendsAnalysis;
  };

  /** COMPUTED: Da TestResult[] temporal analysis */
  temporalAnalytics: {
    weeklyProgress: WeeklyProgressAnalysis;
    monthlyTrends: MonthlyTrendsAnalysis;
    streakAnalysis: StreakAnalysisData;
  };

  /** COMPUTED: Cross-domain predictions */
  predictiveAnalytics: {
    nextSessionPredictions: NextSessionPrediction;
    masteryTimeline: MasteryTimelinePrediction;
    recommendedActions: RecommendedAction[];
  };

  /** Meta informazioni aggregazione */
  aggregationMetadata: {
    lastCalculated: Date;
    dataSourcesIncluded: DataSource[];
    calculationDuration: number;
    isMigrated: boolean;
    isProcessing: boolean;
    forceUpdate: number;
  };
}

/**
 * Learning trends analysis
 * COMPUTED: Da Performance + Test data over time
 */
export interface LearningTrendsAnalysis {
  accuracyTrend: TrendAnalysis;
  speedTrend: TrendAnalysis;
  consistencyTrend: TrendAnalysis;
  vocabularyGrowthTrend: TrendAnalysis;
  difficultyHandlingTrend: TrendAnalysis;
}

/**
 * Trend analysis generico
 */
export interface TrendAnalysis {
  direction: "improving" | "stable" | "declining";
  rate: number; // Rate of change per period
  confidence: number; // 0-1 confidence in trend
  periodAnalyzed: number; // Days analyzed
  significantChanges: Date[]; // Dates of significant changes
}

/**
 * Weekly progress analysis
 * COMPUTED: Da DailyProgressAggregated[]
 */
export interface WeeklyProgressAnalysis {
  currentWeek: DailyProgressAggregated[];
  previousWeek: DailyProgressAggregated[];
  weekOverWeekChange: {
    testsChange: number;
    accuracyChange: number;
    timeChange: number;
    wordsStudiedChange: number;
  };
  weeklyConsistency: number; // 0-1 score
  recommendedSchedule: StudyScheduleRecommendation[];
}

/**
 * Raccomandazione schedule
 */
export interface StudyScheduleRecommendation {
  dayOfWeek: string;
  recommendedTime: string;
  suggestedDuration: number;
  focusAreas: WordCategory[];
  reasoning: string;
}

/**
 * Monthly trends analysis
 * COMPUTED: Da MonthlyStatsAggregated[]
 */
export interface MonthlyTrendsAnalysis {
  last3Months: MonthlyStatsAggregated[];
  trendDirection: "improving" | "stable" | "declining";
  keyMetricChanges: {
    accuracyChange: number;
    vocabularyGrowthChange: number;
    consistencyChange: number;
  };
  seasonalPatterns: SeasonalPattern[];
}

/**
 * Pattern stagionale
 */
export interface SeasonalPattern {
  period: string; // e.g., "January", "Weekends", "Evenings"
  pattern: "high-activity" | "low-activity" | "inconsistent";
  metrics: Record<string, number>;
  recommendations: string[];
}

/**
 * Streak analysis data
 * COMPUTED: Da DailyProgressAggregated[] temporal continuity
 */
export interface StreakAnalysisData {
  currentStreak: number;
  longestStreak: number;
  streakBreakingPatterns: StreakBreakPattern[];
  streakMotivation: StreakMotivationInsight[];
}

/**
 * Pattern rottura streak
 */
export interface StreakBreakPattern {
  commonDay: string; // Most common day for breaks
  commonDuration: number; // Most common break duration
  recoveryTime: number; // Average time to restart
  triggers: string[]; // Common reasons for breaks
}

/**
 * Insight motivazione streak
 */
export interface StreakMotivationInsight {
  streakLength: number;
  motivationLevel: "high" | "medium" | "low";
  sustainabilityFactors: string[];
  riskFactors: string[];
}

// =====================================================
// 🔮 PREDICTIVE ANALYTICS - CROSS-DOMAIN
// =====================================================

/**
 * Predizione prossima sessione
 * COMPUTED: Da patterns Performance + Test
 */
export interface NextSessionPrediction {
  optimalTime: Date;
  suggestedDuration: number;
  recommendedWords: string[]; // wordIds
  predictedAccuracy: number;
  challengeLevel: "easy" | "medium" | "hard";
  focusAreas: {
    reviewWords: string[]; // Words needing review
    newWords: string[]; // Suggested new words
    masteryWords: string[]; // Words close to mastery
  };
}

/**
 * Predizione timeline mastery
 * COMPUTED: Da WordPerformanceAnalysis trends
 */
export interface MasteryTimelinePrediction {
  totalWordsToMaster: number;
  currentMasteryRate: number; // Words mastered per week
  estimatedTimeToComplete: number; // Days
  milestones: MasteryMilestone[];
  accelerationOpportunities: AccelerationOpportunity[];
}

/**
 * Milestone mastery
 */
export interface MasteryMilestone {
  date: Date;
  wordsExpectedMastered: number;
  cumulativeProgress: number; // Percentage
  confidence: number; // Prediction confidence
}

/**
 * Opportunità accelerazione
 */
export interface AccelerationOpportunity {
  category: WordCategory;
  potentialTimeReduction: number; // Days saved
  recommendedApproach: string;
  effortRequired: "low" | "medium" | "high";
  expectedBoost: number; // Percentage improvement
}

/**
 * Azione raccomandata
 * COMPUTED: Da multiple domain analysis
 */
export interface RecommendedAction {
  id: string;
  priority: "critical" | "high" | "medium" | "low";
  type: "review" | "practice" | "new-words" | "consistency" | "challenge";
  title: string;
  description: string;
  estimatedTime: number; // Minutes
  expectedBenefit: string;
  targetWords?: string[]; // Specific wordIds if applicable
  deadline?: Date;

  /** AGGREGATED: Metrics che supportano raccomandazione */
  supportingMetrics: {
    source: "test-results" | "performance-analysis" | "temporal-patterns";
    values: Record<string, number>;
    threshold: number;
  }[];
}

// =====================================================
// 🔄 AGGREGATION OPERATIONS - COORDINATION LAYER
// =====================================================

/**
 * Input per aggregazione statistics
 * COORDINATION: Tutti i domini in input
 */
export interface StatisticsAggregationInput {
  /** Test results per aggregazione - DA Test domain */
  testResults: TestResult[];

  /** Word performances per aggregazione - DA Performance domain */
  wordPerformances: WordPerformanceAnalysis[];

  /** Words per aggregazione - DA Word domain */
  words: Word[];

  /** Periodo per aggregazione temporale */
  aggregationPeriod: {
    startDate: Date;
    endDate: Date;
    granularity: "daily" | "weekly" | "monthly";
  };

  /** Configurazione aggregazione */
  config: AggregationConfig;
}

/**
 * Configurazione aggregazione
 */
export interface AggregationConfig {
  includeAdvancedAnalytics: boolean;
  includePredictiveAnalytics: boolean;
  includeRecommendations: boolean;
  calculationDepth: "fast" | "standard" | "deep";
  cacheResults: boolean;
}

/**
 * Risultato aggregazione statistics
 * OUTPUT: Statistics complete aggregate
 */
export interface StatisticsAggregationResult {
  /** Statistics aggregate finali */
  aggregatedStatistics: Statistics;

  /** Analytics calcolati */
  calculatedStatistics: AggregatedCalculatedStatistics;

  /** Metadata operazione */
  aggregationMetadata: {
    inputDataSources: DataSource[];
    calculationTime: number;
    dataQuality: number; // 0-1 score
    missingDataPercentage: number;
    lastDataPoint: Date;
    nextRecommendedAggregation: Date;
  };

  /** Warning e issues */
  qualityIssues: DataQualityIssue[];
}

/**
 * Fonte dati per aggregazione
 */
export interface DataSource {
  type: "test-results" | "word-performance" | "words" | "user-activity";
  recordCount: number;
  dateRange: { start: Date; end: Date };
  completeness: number; // 0-1 score
  lastUpdated: Date;
}

/**
 * Issue qualità dati
 */
export interface DataQualityIssue {
  type:
    | "missing-data"
    | "inconsistent-data"
    | "stale-data"
    | "incomplete-aggregation";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  affectedMetrics: string[];
  recommendation: string;
  autoFixable: boolean;
}

// =====================================================
// 📤 EXPORT INTEGRATION - MULTI-DOMAIN
// =====================================================

/**
 * Export data COMPREHENSIVE
 * INCLUDE: Tutti i domini in export unificato
 */
export interface ComprehensiveStatisticsExportData {
  /** Metadata export */
  exportMetadata: {
    exportDate: Date;
    appVersion: string;
    dataVersion: string;
    userId: string;
    exportType: "complete" | "statistics-only" | "analytics-only";
  };

  /** CORE: Statistics aggregate */
  statistics: Statistics;

  /** DETAILED: Calculated analytics */
  analytics: AggregatedCalculatedStatistics;

  /** RAW DATA: Source domains (opzionale) */
  sourceData?: {
    testResults: TestResult[];
    wordPerformances: WordPerformanceAnalysis[];
    words: Word[];
  };

  /** INSIGHTS: Human-readable insights */
  insights: {
    summary: string;
    keyAchievements: string[];
    areasForImprovement: string[];
    recommendations: RecommendedAction[];
  };
}
