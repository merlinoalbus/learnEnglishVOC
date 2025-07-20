import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useFirestore } from "../core/useFirestore";
import { useFirebase } from "../../contexts/FirebaseContext";
import { useAuth } from "../integration/useAuth";
import AppConfig from "../../config/appConfig";
import { StatsAnalyticsService } from "../../services/statsAnalyticsService"; // Fixed case sensitivity
import type {
  Statistics,
  DailyProgressAggregated,
  MonthlyStatsAggregated,
  AggregatedCalculatedStatistics,
  LearningTrendsAnalysis,
  WeeklyProgressAnalysis,
  ComprehensiveStatisticsExportData,
  CategoryProgressAggregated,
  DifficultyStatsAggregated,
} from "../../types/entities/Statistics.types";
import type { TestResult } from "../../types/entities/Test.types";
import type { Word } from "../../types/entities/Word.types";
import type {
  WordPerformance,
  PerformanceAttempt,
  WordPerformanceAnalysis,
} from "../../types/entities/Performance.types";
import type {
  CreateInput,
  UpdateInput,
  OperationResult,
} from "../../types/index";
import type { FirestoreError } from "../../types/infrastructure/Firestore.types";

const EMPTY_ARRAY: TestResult[] = [];
const INITIAL_WORD_PERFORMANCE: Record<string, WordPerformance> = {};

// Fixed categoriesProgress - now properly typed as empty object that will be populated
const INITIAL_CATEGORIES_PROGRESS: Record<string, CategoryProgressAggregated> =
  {};

// Fixed difficultyStats with complete structure
const INITIAL_DIFFICULTY_STATS: DifficultyStatsAggregated = {
  wordDifficulty: {
    critical: 0,
    struggling: 0,
    improving: 0,
    consolidated: 0,
    mastered: 0,
  },
  testDifficulty: {
    easy: { testsCompleted: 0, averageScore: 0, averageAccuracy: 0 },
    medium: { testsCompleted: 0, averageScore: 0, averageAccuracy: 0 },
    hard: { testsCompleted: 0, averageScore: 0, averageAccuracy: 0 },
    // Removed 'expert' as it doesn't exist in the type
  },
  difficultyTrends: {
    overallDifficultyRating: 50,
    improvementRate: 0,
    masteryProgression: 0,
  },
};

const INITIAL_STATS: Omit<Statistics, "id"> = {
  totalWords: 0,
  correctAnswers: 0,
  incorrectAnswers: 0,
  hintsUsed: 0,
  averageScore: 0,
  testsCompleted: 0,
  timeSpent: 0,
  categoriesProgress: INITIAL_CATEGORIES_PROGRESS, // Fixed
  dailyProgress: {},
  streakDays: 0,
  lastStudyDate: null,
  difficultyStats: INITIAL_DIFFICULTY_STATS, // Fixed
  monthlyStats: {},
  migrated: false,
};

interface StatsState {
  stats: Statistics;
  testHistory: TestResult[];
  wordPerformance: Record<string, WordPerformance>;
  isInitialized: boolean;
  isLoading: boolean;
  isProcessing: boolean;
  lastSync: Date | null;
  error: FirestoreError | null;
  fromCache: boolean;
}

interface StatsOperations {
  handleTestComplete: (
    testStats: any,
    testWords: Word[],
    wrongWords: Word[],
    detailedSession?: any
  ) => Promise<OperationResult<void>>;
  addTestToHistory: (testResult: TestResult) => Promise<OperationResult<void>>;
  recordWordPerformance: (
    wordId: string,
    attempt: PerformanceAttempt
  ) => Promise<OperationResult<WordPerformance>>;
  refreshData: () => void;
  resetStats: () => Promise<OperationResult<void>>;
  clearHistoryOnly: () => Promise<OperationResult<void>>;
  exportData: () => ComprehensiveStatisticsExportData;
  importData: (
    data: ComprehensiveStatisticsExportData
  ) => Promise<OperationResult<void>>;
  // DetailedTestSession operations
  getDetailedTestSessions: () => Promise<OperationResult<any[]>>;
  getDetailedSessionById: (sessionId: string) => Promise<OperationResult<any>>;
  deleteDetailedSession: (sessionId: string) => Promise<OperationResult<void>>;
  exportDetailedSessions: () => Promise<OperationResult<any[]>>;
}

interface StatsGetters {
  getAllWordsPerformance: () => WordPerformanceAnalysis[];
  getWordAnalysis: (wordId: string) => WordPerformanceAnalysis | null;
  calculatedStats: AggregatedCalculatedStatistics;
  totalTests: number;
  totalAnswers: number;
  accuracyRate: number;
  hintsRate: number;
  weeklyProgress: WeeklyProgressAnalysis | null;
  isMigrated: boolean;
}

interface StatsResult extends StatsState, StatsOperations, StatsGetters {}

const CACHE_TTL = 5 * 60 * 1000;

export const useStats = (): StatsResult => {
  const analyticsService = useMemo(() => new StatsAnalyticsService(), []);

  const statsFirestore = useFirestore<Statistics & { id: string }>({
    collection: "statistics",
    realtime: true,
    enableCache: true,
    autoFetch: true,
    syncWithLocalStorage: true,
    localStorageKey: "vocabularyStats",
    debug: process.env.NODE_ENV === "development",
  });

  const performanceFirestore = useFirestore<WordPerformance & { id: string }>({
    collection: "performance",
    realtime: false,
    enableCache: true,
    autoFetch: true,
    debug: process.env.NODE_ENV === "development",
  });

  // Dedicated collection for DetailedTestSession analytics
  const detailedSessionFirestore = useFirestore<any>({
    collection: "detailedTestSessions",
    realtime: false,
    enableCache: false,
    autoFetch: false, // Manual fetch only when needed
    debug: process.env.NODE_ENV === "development",
  });

  const { isReady } = useFirebase();
  const { user, authUser } = useAuth();

  const [testHistory, setTestHistory] = useState<TestResult[]>(EMPTY_ARRAY);
  const [wordPerformance, setWordPerformance] = useState<
    Record<string, WordPerformance>
  >(INITIAL_WORD_PERFORMANCE);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const calculatedStatsCache = useRef<{
    stats: AggregatedCalculatedStatistics;
    timestamp: number;
  } | null>(null);

  const currentStats = statsFirestore.data[0] || {
    id: "temp",
    ...INITIAL_STATS,
  };

  const isInitialized = statsFirestore.data.length > 0 && isReady;

  const createCompletePerformanceAttempt = (
    correct: boolean,
    timeSpent: number,
    usedHint: boolean = false
  ): PerformanceAttempt => ({
    correct,
    timeSpent,
    timestamp: new Date().toISOString(),
    usedHint, // Fixed: added missing usedHint property
  });

  const createCompleteWordPerformance = (
    english: string,
    italian: string = "",
    chapter: string = "",
    attempts: PerformanceAttempt[] = []
  ): WordPerformance => ({
    wordId: english, // Fixed: added missing wordId property
    english,
    italian,
    chapter,
    attempts,
  });

  // Helper function per determinare time of day
  const getTimeOfDay = (date: Date): string => {
    const hour = date.getHours();
    if (hour < 6) return 'night';
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  };

  // Helper functions per calcoli statistici
  const calculateTimePercentiles = (times: number[]) => {
    if (times.length === 0) return { p25: 2000, p50: 3000, p75: 4000, p90: 5000 };
    
    const sorted = [...times].sort((a, b) => a - b);
    return {
      p25: sorted[Math.floor(sorted.length * 0.25)] || 0,
      p50: sorted[Math.floor(sorted.length * 0.50)] || 0,
      p75: sorted[Math.floor(sorted.length * 0.75)] || 0,
      p90: sorted[Math.floor(sorted.length * 0.90)] || 0,
    };
  };

  const calculateSpeedTrend = (speedData: number[]): "stable" | "improving" | "declining" => {
    if (speedData.length < 2) return "stable";
    
    const firstHalf = speedData.slice(0, Math.floor(speedData.length / 2));
    const secondHalf = speedData.slice(Math.floor(speedData.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    if (change > 5) return "declining"; // Più lento = declining (negativo per performance)
    if (change < -5) return "improving"; // Più veloce = improving (positivo per performance)
    return "stable";
  };

  const calculateSpeedChangePercentage = (speedData: number[]): number => {
    if (speedData.length < 2) return 0;
    
    const firstHalf = speedData.slice(0, Math.floor(speedData.length / 2));
    const secondHalf = speedData.slice(Math.floor(speedData.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    return Math.round(((secondAvg - firstAvg) / firstAvg) * 100);
  };

  const handleTestComplete = useCallback(
    async (
      testStats: any,
      testWords: Word[],
      wrongWords: Word[],
      detailedSession?: any // DetailedTestSession opzionale per tracking dettagliato
    ): Promise<OperationResult<void>> => {
      const startTime = Date.now();
      try {
        setIsProcessing(true);

        // Get current user ID for security and data isolation
        const currentUserId = authUser?.uid || user?.id || currentStats.id || "anonymous";

        const testResult: TestResult = {
          testId: `test_${Date.now()}`,
          userId: currentUserId,
          completedSession: {
            // TestSession complete structure with all required properties
            currentQuestion: null,
            timeMetrics: detailedSession ? {
              // Usa dati reali dalla detailed session
              totalTestTime: detailedSession.totalTimeSpent || 0,
              averageQuestionTime: detailedSession.averageTimePerWord || 0,
              fastestQuestion: detailedSession.words.length > 0 ? 
                Math.min(...detailedSession.words.map((w: any) => w.totalTime)) : 1000,
              slowestQuestion: detailedSession.words.length > 0 ? 
                Math.max(...detailedSession.words.map((w: any) => w.totalTime)) : 5000,
              timeDistribution: {
                byCategory: {},
                byDifficulty: {},
                percentiles: calculateTimePercentiles(detailedSession.words.map((w: any) => w.totalTime)),
              },
              speedTrend: {
                direction: calculateSpeedTrend(detailedSession.speedTrend),
                changePercentage: calculateSpeedChangePercentage(detailedSession.speedTrend),
                dataPoints: detailedSession.speedTrend || [],
              },
            } : {
              // Fallback ai dati esistenti
              totalTestTime: testStats.timeSpent || 0,
              averageQuestionTime: (testStats.timeSpent || 0) / testWords.length,
              fastestQuestion: 1000,
              slowestQuestion: 5000,
              timeDistribution: {
                byCategory: {},
                byDifficulty: {},
                percentiles: {
                  p25: 2000,
                  p50: 3000,
                  p75: 4000,
                  p90: 5000,
                },
              },
              speedTrend: {
                direction: "stable",
                changePercentage: 0,
                dataPoints: [],
              },
            },
            progress: {
              basic: {
                questionsAnswered: testWords.length,
                questionsRemaining: 0,
                currentQuestion: testWords.length,
                totalQuestions: testWords.length,
                completionPercentage: 100,
              },
              performance: {
                correctAnswers: testStats.correct || 0,
                currentAccuracy:
                  ((testStats.correct || 0) / testWords.length) * 100,
                incorrectAnswers: testStats.incorrect || 0,
                currentStreak: 0,
                bestStreak: 0,
                efficiency: 0,
                currentScore: 0,
              },
              predictions: {
                predictedFinalAccuracy: testStats.score || 0,
                confidence: 0.8,
                estimatedTimeToCompletion: 0,
                predictedFinalScore: testStats.score || 0,
              },
              milestones: [],
            },
            // Added missing properties for TestSession
            wordPool: {
              allWords: testWords,
              usedWords: testWords,
              incorrectWords: wrongWords,
              remainingWords: [],
              currentIndex: testWords.length,
              selectionStrategy: "random",
            },
            answerHistory: detailedSession?.words ? 
              // Usa dati reali dalla detailed session
              detailedSession.words.map((wordSession: any, index: number) => ({
                id: `answer_${index}`,
                questionId: wordSession.wordId,
                wordId: wordSession.wordId,
                result: {
                  isCorrect: wordSession.isCorrect,
                  confidence: wordSession.timeExpired ? 0.3 : (wordSession.isCorrect ? 0.9 : 0.7),
                },
                hintsUsed: wordSession.hintsUsed.map((hint: any) => ({
                  type: hint.type,
                  content: hint.content,
                  usedAt: hint.requestedAt,
                  effective: wordSession.isCorrect && hint.sequenceOrder === 1, // First hint più efficace
                })),
                timing: {
                  startedAt: wordSession.wordShownAt,
                  cardFlippedAt: wordSession.cardFlippedAt || wordSession.answerDeclaredAt,
                  declaredAt: wordSession.answerDeclaredAt || wordSession.wordShownAt,
                  totalTime: wordSession.totalTime,
                  thinkingTime: wordSession.thinkingTime || wordSession.totalTime,
                  declarationTime: wordSession.evaluationTime || 0,
                },
                metadata: {
                  timeOfDay: getTimeOfDay(wordSession.wordShownAt),
                  sessionPosition: wordSession.testPosition,
                  contextFactors: [
                    ...(wordSession.timeExpired ? ['timeout'] : []),
                    ...(wordSession.hintsUsed.length > 0 ? ['hints_used'] : []),
                  ],
                },
              })) :
              // Fallback ai dati esistenti se gameSession non disponibile
              testWords.map((word, index) => ({
                id: `answer_${index}`,
                questionId: word.id!,
                wordId: word.id!,
                result: {
                  isCorrect: !wrongWords.some((w) => w.id === word.id),
                  confidence: 0.8,
                },
                hintsUsed: [],
                timing: {
                  startedAt: new Date(),
                  cardFlippedAt: new Date(),
                  declaredAt: new Date(),
                  totalTime: Math.random() * 5000 + 1000,
                  thinkingTime: Math.random() * 3000 + 500,
                  declarationTime: Math.random() * 1000 + 500,
                },
                metadata: {
                  timeOfDay: "afternoon",
                  sessionPosition: index + 1,
                  contextFactors: [],
                },
              })),
            hintSystem: {
              globalState: {
                totalHintsUsed: testStats.hints || 0,
                hintsRemaining: 5,
                usagePattern: {
                  preferredType: "balanced",
                  frequency: "moderate",
                  effectiveness: {
                    sentence: 0.8,
                    synonym: 0.7,
                  },
                },
              },
              config: {
                enabled: true,
                maxHintsPerQuestion: 2,
                cooldownBetweenHints: 0,
                availableHintTypes: ["sentence", "synonym"],
                hintCosts: {
                  sentence: 1,
                  synonym: 1,
                },
              },
              statistics: {
                usage: {
                  sentence: testStats.hints || 0,
                  synonym: 0,
                },
                accuracyAfterHint: {
                  sentence: 0,
                  synonym: 0,
                  overall: 0,
                },
                averageTimeWithHint: {
                  sentence: 0,
                  synonym: 0,
                  overall: 0,
                },
                averageTimeWithoutHint: 0,
              },
            },
          },
          config: {
            mode: "normal",
            hints: {
              enabled: true,
              maxHintsPerQuestion: 2,
              cooldownBetweenHints: 0,
              availableHintTypes: ["sentence", "synonym"],
              hintCosts: {
                sentence: 1,
                synonym: 1,
              },
            },
            wordSelection: {
              categories: [],
              chapters: [],
              unlearnedOnly: false,
              difficultOnly: false,
              randomOrder: true,
              selectionStrategy: "random",
            },
            timing: {
              autoAdvance: false,
              showTimer: false,
              autoAdvanceDelay: 1000,
              wordTimeLimit: 30000,
              showMeaning: false,
              meaningDisplayDuration: 2000,
            },
            ui: {
              theme: "light" as const,
              animations: true,
              showDetailedProgress: true,
              sounds: false,
              showRealTimeStats: true,
            },
            scoring: {
              accuracyWeight: 0.7,
              speedWeight: 0.3,
              streakBonus: 0.1,
              hintPenalty: 0.1,
              thresholds: {
                excellent: 90,
                good: 80,
                average: 70,
              },
            },
          },
          finalScore: {
            total: testStats.score || 0,
            category:
              testStats.score >= 90
                ? "excellent"
                : testStats.score >= 80
                ? "good"
                : testStats.score >= 70
                ? "average"
                : "poor",
            breakdown: {
              accuracy: ((testStats.correct || 0) / testWords.length) * 100,
              speed: 50,
              efficiency: 50,
              consistency: 50,
              bonus: 0,
              penalties: 0,
            },
          },
          feedback: {
            tone: testStats.score >= 80 ? "celebratory" : "encouraging",
            color: testStats.score >= 80 ? "#22c55e" : "#3b82f6",
            wordsToReview: wrongWords.map((w) => w.english),
            message: "Great job!",
            icon: "check",
            nextGoals: ["Keep practicing", "Review difficult words"],
          },
          analytics: {
            insights: [],
            performancePatterns: {
              timePatterns: {
                totalTestTime: testStats.timeSpent || 0,
                averageQuestionTime:
                  (testStats.timeSpent || 0) / testWords.length,
                fastestQuestion: 1000,
                slowestQuestion: 5000,
                timeDistribution: {
                  byCategory: {},
                  byDifficulty: {},
                  percentiles: {
                    p25: 2000,
                    p50: 3000,
                    p75: 4000,
                    p90: 5000,
                  },
                },
                speedTrend: {
                  direction: "stable",
                  changePercentage: 0,
                  dataPoints: [],
                },
              },
              accuracyPatterns: {
                overallAccuracy:
                  ((testStats.correct || 0) / testWords.length) * 100,
                accuracyByPosition: [],
                accuracyTrend: {
                  direction: "stable",
                  changePercentage: 0,
                  dataPoints: [],
                },
                difficultWordsBias: 0,
              },
              hintPatterns: {
                usage: {
                  sentence: testStats.hints || 0,
                  synonym: 0,
                },
                accuracyAfterHint: {
                  sentence: 0,
                  synonym: 0,
                  overall: 0,
                },
                averageTimeWithHint: {
                  sentence: 0,
                  synonym: 0,
                  overall: 0,
                },
                averageTimeWithoutHint: 0,
              },
              categoryPatterns: [],
            },
            recommendations: [],
          },
          exportData: {
            summary: {
              testId: `test_${Date.now()}`,
              duration: testStats.timeSpent || 0,
              totalQuestions: testWords.length,
              correctAnswers: testStats.correct || 0,
              accuracy: ((testStats.correct || 0) / testWords.length) * 100,
              hintsUsed: testStats.hints || 0,
              averageTime: (testStats.timeSpent || 0) / testWords.length,
              score: testStats.score || 0,
              category:
                testStats.score >= 90
                  ? "excellent"
                  : testStats.score >= 80
                  ? "good"
                  : testStats.score >= 70
                  ? "average"
                  : "poor",
            },
            detailedAnswers: [],
            analytics: {
              insights: [],
              performancePatterns: {
                timePatterns: {
                  totalTestTime: testStats.timeSpent || 0,
                  averageQuestionTime:
                    (testStats.timeSpent || 0) / testWords.length,
                  fastestQuestion: 1000,
                  slowestQuestion: 5000,
                  timeDistribution: {
                    byCategory: {},
                    byDifficulty: {},
                    percentiles: {
                      p25: 2000,
                      p50: 3000,
                      p75: 4000,
                      p90: 5000,
                    },
                  },
                  speedTrend: {
                    direction: "stable",
                    changePercentage: 0,
                    dataPoints: [],
                  },
                },
                accuracyPatterns: {
                  overallAccuracy:
                    ((testStats.correct || 0) / testWords.length) * 100,
                  accuracyByPosition: [],
                  accuracyTrend: {
                    direction: "stable",
                    changePercentage: 0,
                    dataPoints: [],
                  },
                  difficultWordsBias: 0,
                },
                hintPatterns: {
                  usage: {
                    sentence: testStats.hints || 0,
                    synonym: 0,
                  },
                  accuracyAfterHint: {
                    sentence: 0,
                    synonym: 0,
                    overall: 0,
                  },
                  averageTimeWithHint: {
                    sentence: 0,
                    synonym: 0,
                    overall: 0,
                  },
                  averageTimeWithoutHint: 0,
                },
                categoryPatterns: [],
              },
              recommendations: [],
            },
            exportedAt: new Date(),
            format: "json",
          },
        };

        setTestHistory((prev) => [...prev, testResult]);

        for (const word of testWords) {
          const isWrong = wrongWords.some((w) => w.id === word.id);
          const attempt = createCompletePerformanceAttempt(
            !isWrong,
            Math.random() * 5000 + 1000,
            false
          );

          const existingPerf = wordPerformance[word.english];
          if (existingPerf) {
            const updatedPerf: WordPerformance = {
              ...existingPerf,
              attempts: [...existingPerf.attempts, attempt],
            };

            setWordPerformance((prev) => ({
              ...prev,
              [word.english]: updatedPerf,
            }));

            const perfDoc = performanceFirestore.data.find(
              (p) => p.english === word.english
            );
            if (perfDoc) {
              await performanceFirestore.update(perfDoc.id, updatedPerf);
            } else {
              await performanceFirestore.create(updatedPerf);
            }
          } else {
            const newPerf = createCompleteWordPerformance(
              word.english,
              word.italian,
              word.chapter,
              [attempt]
            );

            setWordPerformance((prev) => ({
              ...prev,
              [word.english]: newPerf,
            }));

            await performanceFirestore.create(newPerf);
          }
        }

        // Use detailedSession data if available for accurate statistics
        const correctAnswers = detailedSession?.correctAnswers ?? testStats.correct ?? 0;
        const incorrectAnswers = detailedSession 
          ? (detailedSession.incorrectAnswers + detailedSession.timeoutAnswers) 
          : (testStats.incorrect ?? 0);
        const hintsUsed = detailedSession?.totalHintsUsed ?? testStats.hints ?? 0;
        const timeSpent = detailedSession?.totalTimeSpent ?? testStats.timeSpent ?? 0;
        const totalWordsCount = detailedSession?.totalWords ?? testWords.length;
        const accuracy = detailedSession?.accuracy ?? 
          (((testStats.correct || 0) / testWords.length) * 100);

        const updatedStats = {
          ...currentStats,
          userId: currentUserId, // Ensure consistent user association
          testsCompleted: currentStats.testsCompleted + 1,
          totalWords: currentStats.totalWords + totalWordsCount,
          correctAnswers: currentStats.correctAnswers + correctAnswers,
          incorrectAnswers: currentStats.incorrectAnswers + incorrectAnswers,
          hintsUsed: currentStats.hintsUsed + hintsUsed,
          timeSpent: currentStats.timeSpent + timeSpent,
          averageScore:
            (currentStats.averageScore * currentStats.testsCompleted + accuracy) /
            (currentStats.testsCompleted + 1),
          lastStudyDate: new Date().toISOString(),
        };

        if (statsFirestore.data[0]) {
          await statsFirestore.update(statsFirestore.data[0].id, updatedStats);
        } else {
          await statsFirestore.create(updatedStats);
        }

        // Salva la detailed session se disponibile
        if (detailedSession) {
          try {
            // Complete the detailed session with final metadata and user security
            const completedDetailedSession = {
              ...detailedSession,
              completedAt: new Date(),
              userId: currentUserId, // Use consistent user ID for security
              // Add device/browser info if available
              deviceInfo: navigator.userAgent,
              sessionMetadata: {
                testResultId: testResult.testId,
                totalDuration: detailedSession.totalTimeSpent,
                wordsCompleted: detailedSession.words.length,
                finalAccuracy: detailedSession.accuracy,
                browserTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                screenResolution: `${window.screen.width}x${window.screen.height}`,
                // Additional security metadata
                authStatus: authUser ? 'authenticated' : 'anonymous',
                dataSource: 'learnEnglishVOC_webapp',
              }
            };

            // Save to dedicated DetailedTestSession collection with security
            try {
              // Clean undefined values from the object before saving to Firestore
              const cleanedSession = JSON.parse(JSON.stringify(completedDetailedSession, (key, value) => {
                return value === undefined ? null : value;
              }));
              
              await detailedSessionFirestore.create(cleanedSession);
              
              if (AppConfig.app.environment === "development") {
                console.log("✅ DetailedTestSession saved to Firestore:", {
                  sessionId: completedDetailedSession.sessionId,
                  userId: currentUserId,
                  duration: completedDetailedSession.totalTimeSpent,
                  accuracy: completedDetailedSession.accuracy,
                  totalHints: completedDetailedSession.totalHintsUsed,
                  wordsCount: completedDetailedSession.words.length,
                });
              }
            } catch (saveError) {
              console.error("❌ Failed to save DetailedTestSession to Firestore:", saveError);
              // Don't block main test completion if DetailedTestSession save fails
            }
            
          } catch (detailedSessionError) {
            console.error("❌ Failed to save detailed session:", detailedSessionError);
            // Non bloccare il salvataggio principale se la detailed session fallisce
          }
        }

        calculatedStatsCache.current = null;
        setLastSync(new Date());

        return {
          success: true,
          metadata: {
            operation: "handleTestComplete",
            timestamp: new Date(),
            duration: Date.now() - startTime,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error as FirestoreError,
          metadata: {
            operation: "handleTestComplete",
            timestamp: new Date(),
            duration: Date.now() - startTime,
          },
        };
      } finally {
        setIsProcessing(false);
      }
    },
    [statsFirestore, performanceFirestore, currentStats, wordPerformance]
  );

  const addTestToHistory = useCallback(
    async (testResult: TestResult): Promise<OperationResult<void>> => {
      const startTime = Date.now();
      try {
        setTestHistory((prev) => [...prev, testResult]);
        calculatedStatsCache.current = null;
        setLastSync(new Date());

        return {
          success: true,
          metadata: {
            operation: "addTestToHistory",
            timestamp: new Date(),
            duration: Date.now() - startTime,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error as FirestoreError,
          metadata: {
            operation: "addTestToHistory",
            timestamp: new Date(),
            duration: Date.now() - startTime,
          },
        };
      }
    },
    []
  );

  const recordWordPerformance = useCallback(
    async (
      wordId: string,
      attempt: PerformanceAttempt
    ): Promise<OperationResult<WordPerformance>> => {
      const startTime = Date.now();
      try {
        setIsProcessing(true);

        const existingPerf = wordPerformance[wordId];
        let updatedPerf: WordPerformance;

        if (existingPerf) {
          updatedPerf = {
            ...existingPerf,
            attempts: [...existingPerf.attempts, attempt],
          };
        } else {
          updatedPerf = createCompleteWordPerformance(wordId, "", "", [
            attempt,
          ]);
        }

        setWordPerformance((prev) => ({
          ...prev,
          [wordId]: updatedPerf,
        }));

        const perfDoc = performanceFirestore.data.find(
          (p) => p.english === wordId
        );
        if (perfDoc) {
          await performanceFirestore.update(perfDoc.id, updatedPerf);
        } else {
          await performanceFirestore.create(updatedPerf);
        }

        calculatedStatsCache.current = null;
        setLastSync(new Date());

        return {
          success: true,
          data: updatedPerf,
          metadata: {
            operation: "recordWordPerformance",
            timestamp: new Date(),
            duration: Date.now() - startTime,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error as FirestoreError,
          metadata: {
            operation: "recordWordPerformance",
            timestamp: new Date(),
            duration: Date.now() - startTime,
          },
        };
      } finally {
        setIsProcessing(false);
      }
    },
    [wordPerformance, performanceFirestore]
  );

  const refreshData = useCallback(() => {
    statsFirestore.refresh();
    performanceFirestore.refresh();
    detailedSessionFirestore.refresh();
    calculatedStatsCache.current = null;
    setLastSync(new Date());
  }, [statsFirestore, performanceFirestore, detailedSessionFirestore]);

  const resetStats = useCallback(async (): Promise<OperationResult<void>> => {
    const startTime = Date.now();
    try {
      setIsProcessing(true);

      // Delete performance data
      const deletePerformanceOps = performanceFirestore.data.map((perf) => ({
        type: "delete" as const,
        id: perf.id,
      }));

      if (deletePerformanceOps.length > 0) {
        await performanceFirestore.batchUpdate(deletePerformanceOps);
      }

      // Delete detailed test sessions (optional - user may want to keep analytical data)
      // await detailedSessionFirestore.fetch();
      // const deleteSessionOps = detailedSessionFirestore.data.map((session) => ({
      //   type: "delete" as const,
      //   id: session.id,
      // }));
      // if (deleteSessionOps.length > 0) {
      //   await detailedSessionFirestore.batchUpdate(deleteSessionOps);
      // }

      // Reset main statistics
      if (statsFirestore.data[0]) {
        await statsFirestore.update(statsFirestore.data[0].id, INITIAL_STATS);
      }

      setTestHistory([]);
      setWordPerformance({});
      calculatedStatsCache.current = null;
      setLastSync(new Date());

      return {
        success: true,
        metadata: {
          operation: "resetStats",
          timestamp: new Date(),
          duration: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error as FirestoreError,
        metadata: {
          operation: "resetStats",
          timestamp: new Date(),
          duration: Date.now() - startTime,
        },
      };
    } finally {
      setIsProcessing(false);
    }
  }, [statsFirestore, performanceFirestore, detailedSessionFirestore]);

  const clearHistoryOnly = useCallback(async (): Promise<
    OperationResult<void>
  > => {
    const startTime = Date.now();
    try {
      setTestHistory([]);
      calculatedStatsCache.current = null;
      setLastSync(new Date());

      return {
        success: true,
        metadata: {
          operation: "clearHistoryOnly",
          timestamp: new Date(),
          duration: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error as FirestoreError,
        metadata: {
          operation: "clearHistoryOnly",
          timestamp: new Date(),
          duration: Date.now() - startTime,
        },
      };
    }
  }, []);

  const exportData = useCallback((): ComprehensiveStatisticsExportData => {
    const wordPerformanceAnalyses = getAllWordsPerformance();
    return analyticsService.createComprehensiveExportData(
      currentStats,
      testHistory,
      wordPerformanceAnalyses
    );
  }, [currentStats, testHistory, analyticsService]);

  const importData = useCallback(
    async (
      data: ComprehensiveStatisticsExportData
    ): Promise<OperationResult<void>> => {
      const startTime = Date.now();
      try {
        setIsProcessing(true);

        if (data.statistics) {
          if (statsFirestore.data[0]) {
            await statsFirestore.update(
              statsFirestore.data[0].id,
              data.statistics
            );
          } else {
            await statsFirestore.create(data.statistics);
          }
        }

        if (data.sourceData?.testResults) {
          setTestHistory(data.sourceData.testResults);
        }

        if (data.sourceData?.wordPerformances) {
          const performanceMap: Record<string, WordPerformance> = {};

          const deleteOps = performanceFirestore.data.map((perf) => ({
            type: "delete" as const,
            id: perf.id,
          }));

          if (deleteOps.length > 0) {
            await performanceFirestore.batchUpdate(deleteOps);
          }

          const createOps = data.sourceData.wordPerformances.map(
            (analysis) => ({
              type: "create" as const,
              data: createCompleteWordPerformance(
                analysis.english,
                analysis.italian,
                analysis.chapter,
                analysis.attempts
              ),
            })
          );

          if (createOps.length > 0) {
            await performanceFirestore.batchUpdate(createOps);
          }

          data.sourceData.wordPerformances.forEach((analysis) => {
            performanceMap[analysis.english] = createCompleteWordPerformance(
              analysis.english,
              analysis.italian,
              analysis.chapter,
              analysis.attempts
            );
          });

          setWordPerformance(performanceMap);
        }

        calculatedStatsCache.current = null;
        setLastSync(new Date());

        return {
          success: true,
          metadata: {
            operation: "importData",
            timestamp: new Date(),
            duration: Date.now() - startTime,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error as FirestoreError,
          metadata: {
            operation: "importData",
            timestamp: new Date(),
            duration: Date.now() - startTime,
          },
        };
      } finally {
        setIsProcessing(false);
      }
    },
    [
      statsFirestore.data,
      statsFirestore.update,
      statsFirestore.create,
      performanceFirestore.data,
      performanceFirestore.batchUpdate,
    ]
  );

  // DetailedTestSession operations with user security
  const getDetailedTestSessions = useCallback(async (): Promise<OperationResult<any[]>> => {
    const startTime = Date.now();
    try {
      await detailedSessionFirestore.fetch();
      return {
        success: true,
        data: detailedSessionFirestore.data,
        metadata: {
          operation: "getDetailedTestSessions",
          timestamp: new Date(),
          duration: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error as FirestoreError,
        metadata: {
          operation: "getDetailedTestSessions",
          timestamp: new Date(),
          duration: Date.now() - startTime,
        },
      };
    }
  }, [detailedSessionFirestore]);

  const getDetailedSessionById = useCallback(async (sessionId: string): Promise<OperationResult<any>> => {
    const startTime = Date.now();
    try {
      await detailedSessionFirestore.fetch();
      const session = detailedSessionFirestore.data.find(s => s.sessionId === sessionId);
      
      if (!session) {
        return {
          success: false,
          error: { message: "Session not found", code: "not-found" } as FirestoreError,
          metadata: {
            operation: "getDetailedSessionById",
            timestamp: new Date(),
            duration: Date.now() - startTime,
          },
        };
      }

      return {
        success: true,
        data: session,
        metadata: {
          operation: "getDetailedSessionById",
          timestamp: new Date(),
          duration: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error as FirestoreError,
        metadata: {
          operation: "getDetailedSessionById",
          timestamp: new Date(),
          duration: Date.now() - startTime,
        },
      };
    }
  }, [detailedSessionFirestore]);

  const deleteDetailedSession = useCallback(async (sessionId: string): Promise<OperationResult<void>> => {
    const startTime = Date.now();
    try {
      await detailedSessionFirestore.fetch();
      const session = detailedSessionFirestore.data.find(s => s.sessionId === sessionId);
      
      if (!session) {
        return {
          success: false,
          error: { message: "Session not found", code: "not-found" } as FirestoreError,
          metadata: {
            operation: "deleteDetailedSession",
            timestamp: new Date(),
            duration: Date.now() - startTime,
          },
        };
      }

      await detailedSessionFirestore.remove(session.id);

      return {
        success: true,
        metadata: {
          operation: "deleteDetailedSession",
          timestamp: new Date(),
          duration: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error as FirestoreError,
        metadata: {
          operation: "deleteDetailedSession",
          timestamp: new Date(),
          duration: Date.now() - startTime,
        },
      };
    }
  }, [detailedSessionFirestore]);

  const exportDetailedSessions = useCallback(async (): Promise<OperationResult<any[]>> => {
    const startTime = Date.now();
    try {
      await detailedSessionFirestore.fetch();
      
      // Export only user's own data (security ensured by useFirestore)
      const exportData = detailedSessionFirestore.data.map(session => ({
        ...session,
        // Remove sensitive system information from export
        deviceInfo: undefined,
        firestoreMetadata: undefined,
      }));

      return {
        success: true,
        data: exportData,
        metadata: {
          operation: "exportDetailedSessions",
          timestamp: new Date(),
          duration: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error as FirestoreError,
        metadata: {
          operation: "exportDetailedSessions",
          timestamp: new Date(),
          duration: Date.now() - startTime,
        },
      };
    }
  }, [detailedSessionFirestore]);

  const getAllWordsPerformance = useCallback((): WordPerformanceAnalysis[] => {
    return Object.values(wordPerformance).map((perf) => {
      const totalAttempts = perf.attempts.length;
      const correctAttempts = perf.attempts.filter((a) => a.correct).length;
      const accuracy =
        totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;
      const hintsUsed = perf.attempts.filter((a) => a.usedHint).length;
      const averageTime =
        totalAttempts > 0
          ? perf.attempts.reduce((sum, a) => sum + a.timeSpent, 0) /
            totalAttempts
          : 0;

      return {
        id: `perf_${perf.english}`,
        english: perf.english,
        italian: perf.italian || "",
        chapter: perf.chapter || "",
        group: "",
        sentence: "",
        notes: "",
        learned: false,
        difficult: false,
        status:
          accuracy > 80
            ? "consolidated"
            : accuracy > 60
            ? "improving"
            : "struggling",
        attempts: perf.attempts,
        totalAttempts,
        correctAttempts,
        incorrectAttempts: totalAttempts - correctAttempts,
        accuracy: Math.round(accuracy),
        hintsUsed,
        hintsPercentage:
          totalAttempts > 0 ? Math.round((hintsUsed / totalAttempts) * 100) : 0,
        currentStreak: 0,
        lastAttempt:
          perf.attempts.length > 0
            ? perf.attempts[perf.attempts.length - 1]
            : null, // Fixed: properly return null when no attempts
        recentAccuracy: Math.round(accuracy),
        avgTime: Math.round(averageTime / 1000),
        trend: "stable" as const,
        difficulty: accuracy < 50 ? "hard" : accuracy < 80 ? "medium" : "easy",
        needsWork: accuracy < 70,
        mastered: accuracy >= 90,
        recommendations: [],
      };
    });
  }, [wordPerformance]);

  const getWordAnalysis = useCallback(
    (wordId: string): WordPerformanceAnalysis | null => {
      const perf = wordPerformance[wordId];
      if (!perf) return null;

      const analyses = getAllWordsPerformance();
      return analyses.find((analysis) => analysis.english === wordId) || null;
    },
    [wordPerformance, getAllWordsPerformance]
  );

  const calculatedStats = useMemo<AggregatedCalculatedStatistics>(() => {
    const now = Date.now();
    if (
      calculatedStatsCache.current &&
      now - calculatedStatsCache.current.timestamp < CACHE_TTL
    ) {
      return calculatedStatsCache.current.stats;
    }

    const wordPerformanceAnalyses = getAllWordsPerformance();
    const stats = analyticsService.calculateAggregatedStatistics(
      currentStats,
      testHistory,
      wordPerformanceAnalyses
    );

    calculatedStatsCache.current = { stats, timestamp: now };
    return stats;
  }, [getAllWordsPerformance, testHistory, currentStats, analyticsService]);

  const totalTests = currentStats.testsCompleted;
  const totalAnswers =
    currentStats.correctAnswers + currentStats.incorrectAnswers;
  const accuracyRate =
    totalAnswers > 0 ? (currentStats.correctAnswers / totalAnswers) * 100 : 0;
  const hintsRate =
    totalAnswers > 0 ? (currentStats.hintsUsed / totalAnswers) * 100 : 0;
  const isMigrated = currentStats.migrated || false;

  // Fixed: access weeklyProgress correctly
  const weeklyProgress = useMemo<WeeklyProgressAnalysis | null>(() => {
    return calculatedStats.temporalAnalytics.weeklyProgress;
  }, [calculatedStats]);

  useEffect(() => {
    if (performanceFirestore.data.length > 0) {
      const performanceMap: Record<string, WordPerformance> = {};
      performanceFirestore.data.forEach((perf) => {
        performanceMap[perf.english] = perf;
      });
      setWordPerformance(performanceMap);
    }
  }, [performanceFirestore.data]);

  return {
    stats: currentStats,
    testHistory,
    wordPerformance,
    isInitialized,
    isLoading: statsFirestore.loading || performanceFirestore.loading || detailedSessionFirestore.loading,
    isProcessing,
    lastSync: lastSync || statsFirestore.lastSync,
    error: statsFirestore.error || performanceFirestore.error || detailedSessionFirestore.error,
    fromCache: statsFirestore.fromCache,
    handleTestComplete,
    addTestToHistory,
    recordWordPerformance,
    refreshData,
    resetStats,
    clearHistoryOnly,
    exportData,
    importData,
    // DetailedTestSession operations
    getDetailedTestSessions,
    getDetailedSessionById,
    deleteDetailedSession,
    exportDetailedSessions,
    // Word performance
    getAllWordsPerformance,
    getWordAnalysis,
    calculatedStats,
    totalTests,
    totalAnswers,
    accuracyRate,
    hintsRate,
    weeklyProgress,
    isMigrated,
  };
};

export default useStats;
