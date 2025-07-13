import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useFirestore } from "../core/useFirestore";
import { useFirebase } from "../../contexts/FirebaseContext";
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
    wrongWords: Word[]
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

  const { isReady } = useFirebase();

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

  const handleTestComplete = useCallback(
    async (
      testStats: any,
      testWords: Word[],
      wrongWords: Word[]
    ): Promise<OperationResult<void>> => {
      const startTime = Date.now();
      try {
        setIsProcessing(true);

        const testResult: TestResult = {
          testId: `test_${Date.now()}`,
          userId: currentStats.id || "temp",
          completedSession: {
            // TestSession complete structure with all required properties
            currentQuestion: null,
            timeMetrics: {
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
            answerHistory: testWords.map((word, index) => ({
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

        const updatedStats = {
          ...currentStats,
          testsCompleted: currentStats.testsCompleted + 1,
          totalWords: currentStats.totalWords + testWords.length,
          correctAnswers:
            currentStats.correctAnswers + (testStats.correct || 0),
          incorrectAnswers:
            currentStats.incorrectAnswers + (testStats.incorrect || 0),
          hintsUsed: currentStats.hintsUsed + (testStats.hints || 0),
          timeSpent: currentStats.timeSpent + (testStats.timeSpent || 0),
          averageScore:
            (currentStats.averageScore * currentStats.testsCompleted +
              (testStats.score || 0)) /
            (currentStats.testsCompleted + 1),
          lastStudyDate: new Date().toISOString(),
        };

        if (statsFirestore.data[0]) {
          await statsFirestore.update(statsFirestore.data[0].id, updatedStats);
        } else {
          await statsFirestore.create(updatedStats);
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
    calculatedStatsCache.current = null;
    setLastSync(new Date());
  }, [statsFirestore, performanceFirestore]);

  const resetStats = useCallback(async (): Promise<OperationResult<void>> => {
    const startTime = Date.now();
    try {
      setIsProcessing(true);

      const deleteOps = performanceFirestore.data.map((perf) => ({
        type: "delete" as const,
        id: perf.id,
      }));

      if (deleteOps.length > 0) {
        await performanceFirestore.batchUpdate(deleteOps);
      }

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
  }, [statsFirestore, performanceFirestore]);

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
    isLoading: statsFirestore.loading || performanceFirestore.loading,
    isProcessing,
    lastSync: lastSync || statsFirestore.lastSync,
    error: statsFirestore.error || performanceFirestore.error,
    fromCache: statsFirestore.fromCache,
    handleTestComplete,
    addTestToHistory,
    recordWordPerformance,
    refreshData,
    resetStats,
    clearHistoryOnly,
    exportData,
    importData,
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
