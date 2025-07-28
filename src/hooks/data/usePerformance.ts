import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useFirestore } from "../core/useFirestore";
import { useFirebase } from "../../contexts/FirebaseContext";
import AppConfig from "../../config/appConfig";
import type {
  WordPerformance,
  PerformanceAttempt,
  WordPerformanceAnalysis,
  WordPerformanceStatus,
  GlobalPerformanceStats,
  UpdatePerformanceInput,
  UpdatePerformanceResult,
  PerformanceCategory,
  SimpleTrend,
  WordPerformanceTrends,
  TestDifficultyAnalysis,
} from "../../types/entities/Performance.types";
import type { Word } from "../../types/entities/Word.types";
import type { TestResult } from "../../types/entities/Test.types";
import type {
  CreateInput,
  UpdateInput,
  OperationResult,
} from "../../types/index";
import type { FirestoreError } from "../../types/infrastructure/Firestore.types";

const EMPTY_ARRAY: WordPerformanceAnalysis[] = [];

// Interfaccia estesa per WordPerformance con id e proprietà mancanti
interface WordPerformanceWithId extends WordPerformance {
  id: string;
  wordId: string;
  italian: string;
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  averageResponseTime: number;
  lastAttemptAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Interfaccia estesa per PerformanceAttempt che include timestamp come stringa
interface ExtendedPerformanceAttempt extends PerformanceAttempt {
  timestamp: string; // Override del timestamp da Date a string
}

const INITIAL_GLOBAL_STATS: GlobalPerformanceStats = {
  statusDistribution: {
    new: 0,
    promising: 0,
    struggling: 0,
    consolidated: 0,
    improving: 0,
    critical: 0,
    inconsistent: 0,
  },
  totalWordsTracked: 0,
  averageResponseTime: 0,
  averageAccuracy: 0,
  averageHintUsage: 0,
  wordsNeedingWork: 0,
  masteredWords: 0,
};

interface PerformanceState {
  performances: WordPerformanceWithId[];
  isInitialized: boolean;
  isLoading: boolean;
  isProcessing: boolean;
  lastSync: Date | null;
  error: FirestoreError | null;
  fromCache: boolean;
}

interface PerformanceOperations {
  updateWordPerformance: (
    wordId: string,
    input: UpdatePerformanceInput
  ) => Promise<UpdatePerformanceResult>;

  recordTestResults: (
    testResult: TestResult,
    words: Word[]
  ) => Promise<OperationResult<void>>;

  analyzeWordDifficulty: (
    wordId: string
  ) => Promise<OperationResult<TestDifficultyAnalysis>>;

  bulkUpdatePerformances: (
    updates: Array<{ wordId: string; input: UpdatePerformanceInput }>
  ) => Promise<OperationResult<WordPerformanceWithId[]>>;

  resetWordPerformance: (wordId: string) => Promise<OperationResult<void>>;

  resetAllPerformances: () => Promise<OperationResult<void>>;

  refreshData: () => void;
}

interface PerformanceGetters {
  getWordPerformance: (wordId: string) => WordPerformanceWithId | null;

  getWordAnalysis: (wordId: string) => WordPerformanceAnalysis | null;

  getWordsNeedingWork: (limit?: number) => WordPerformanceAnalysis[];

  getWordsByStatus: (
    status: WordPerformanceStatus
  ) => WordPerformanceAnalysis[];

  getPerformanceTrends: (wordId: string) => WordPerformanceTrends | null;

  getGlobalStats: () => GlobalPerformanceStats;

  getCategorizedWords: () => Record<
    PerformanceCategory["status"],
    WordPerformanceAnalysis[]
  >;

  getRecommendedWords: (count?: number) => WordPerformanceAnalysis[];
}

interface PerformanceAnalytics {
  globalPerformanceStats: GlobalPerformanceStats;
  wordLevelInsights: WordPerformanceAnalysis[];
  performanceDistribution: Record<WordPerformanceStatus, number>;
  trendsAnalysis: {
    improving: number;
    declining: number;
    stable: number;
  };
}

interface PerformanceResult
  extends PerformanceState,
    PerformanceOperations,
    PerformanceGetters {
  analytics: PerformanceAnalytics;
}

export const usePerformance = (): PerformanceResult => {
  // Firebase hook
  const performanceFirestore = useFirestore<WordPerformanceWithId>({
    collection: "performance",
    realtime: false,
    enableCache: true,
    autoFetch: false,
    syncWithLocalStorage: true,
    localStorageKey: "vocabularyPerformance",
    debug: AppConfig.app.environment === "development",
  });

  const { isReady } = useFirebase();

  // Local state
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Performance optimization
  const analyticsCache = useRef<{
    analytics: PerformanceAnalytics;
    timestamp: number;
  } | null>(null);
  const ANALYTICS_CACHE_TTL = 15000; // 15 seconds

  // Initialize when Firebase is ready
  useEffect(() => {
    if (isReady && !isInitialized) {
      initializePerformance();
    }
  }, [isReady, isInitialized]);

  // Initialize performance tracking
  const initializePerformance = useCallback(async () => {
    try {
      setIsProcessing(true);

      // Migration from localStorage if available
      const savedPerformance = localStorage.getItem("vocabularyPerformance");
      if (savedPerformance && performanceFirestore.data.length === 0) {
        try {
          const parsedPerformance = JSON.parse(savedPerformance);
          if (
            Array.isArray(parsedPerformance) &&
            parsedPerformance.length > 0
          ) {
            // Migrate to Firebase
            const migrationOps = parsedPerformance.map((perf: any) => ({
              type: "create" as const,
              data: {
                english: perf.english,
                wordId: perf.english,
                italian: perf.italian || "",
                attempts:
                  perf.attempts?.map((attempt: any) => ({
                    ...attempt,
                    timestamp: attempt.timestamp || new Date().toISOString(),
                  })) || [],
                totalAttempts: perf.totalAttempts || 0,
                correctAttempts: perf.correctAttempts || 0,
                accuracy: perf.accuracy || 0,
                averageResponseTime: perf.averageResponseTime || 0,
                lastAttemptAt: perf.lastAttemptAt
                  ? new Date(perf.lastAttemptAt)
                  : new Date(),
                createdAt: perf.createdAt
                  ? new Date(perf.createdAt)
                  : new Date(),
                updatedAt: new Date(),
              },
            }));

            await performanceFirestore.batchUpdate(migrationOps);

            // Clear from localStorage after migration
            localStorage.removeItem("vocabularyPerformance");

            if (AppConfig.app.environment === "development") {
              console.log(
                `📊 Migrated ${parsedPerformance.length} performance records to Firebase`
              );
            }
          }
        } catch (error) {
          console.warn("Failed to migrate performance data:", error);
        }
      }

      setIsInitialized(true);
      setLastSync(new Date());

      if (AppConfig.app.environment === "development") {
        console.log("📊 usePerformance initialized with Firebase");
      }
    } catch (error) {
      console.error("Failed to initialize performance:", error);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Calculate word performance status
  const calculateWordStatus = useCallback(
    (performance: WordPerformanceWithId): WordPerformanceStatus => {
      const totalAttempts = performance.attempts.length;
      const correctAttempts = performance.attempts.filter(
        (a) => a.correct
      ).length;
      const accuracy =
        totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;
      const averageResponseTime =
        totalAttempts > 0
          ? performance.attempts.reduce((sum, a) => sum + a.timeSpent, 0) /
            totalAttempts
          : 0;

      if (totalAttempts === 0) return "new";
      if (totalAttempts < 3) return "promising";
      if (accuracy >= 90 && averageResponseTime <= 3000) return "consolidated";
      if (
        accuracy >= 70 &&
        performance.attempts.slice(-5).every((a) => a.correct)
      ) {
        return "improving";
      }
      if (
        accuracy < 40 ||
        performance.attempts.slice(-3).every((a) => !a.correct)
      ) {
        return "critical";
      }
      if (accuracy < 60) return "struggling";

      // Check for inconsistency (high variance in recent attempts)
      const recentAttempts = performance.attempts.slice(-10);
      if (recentAttempts.length >= 5) {
        const correctCount = recentAttempts.filter((a) => a.correct).length;
        const inconsistencyRatio =
          Math.abs(correctCount - recentAttempts.length / 2) /
          recentAttempts.length;
        if (inconsistencyRatio < 0.3) return "inconsistent";
      }

      return "promising";
    },
    []
  );

  // Update word performance
  const updateWordPerformance = useCallback(
    async (
      wordId: string,
      input: UpdatePerformanceInput
    ): Promise<UpdatePerformanceResult> => {
      try {
        setIsProcessing(true);

        const existingPerformance = performanceFirestore.data.find(
          (p) => p.english === wordId
        );

        const newAttempt: ExtendedPerformanceAttempt = {
          correct: input.isCorrect,
          timeSpent: input.timeSpent,
          timestamp: new Date().toISOString(),
          usedHint: false,
        };

        let updatedPerformance: WordPerformanceWithId;

        if (existingPerformance) {
          // Update existing performance
          const newAttempts = [...existingPerformance.attempts, newAttempt];
          const totalAttempts = newAttempts.length;
          const correctAttempts = newAttempts.filter((a) => a.correct).length;

          const updatedData = {
            attempts: newAttempts,
            totalAttempts,
            correctAttempts,
            accuracy: (correctAttempts / totalAttempts) * 100,
            averageResponseTime:
              newAttempts.reduce((sum, a) => sum + a.timeSpent, 0) /
              totalAttempts,
            lastAttemptAt: new Date(),
            updatedAt: new Date(),
          };

          updatedPerformance = await performanceFirestore.update(
            existingPerformance.id,
            updatedData
          );
        } else {
          // Create new performance record
          const newPerformanceData: Omit<WordPerformanceWithId, "id"> = {
            english: wordId,
            wordId: wordId,
            italian: "", // This should be populated from word data
            attempts: [newAttempt],
            totalAttempts: 1,
            correctAttempts: input.isCorrect ? 1 : 0,
            accuracy: input.isCorrect ? 100 : 0,
            averageResponseTime: input.timeSpent,
            lastAttemptAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          updatedPerformance = await performanceFirestore.create(
            newPerformanceData
          );
        }

        // Clear analytics cache
        analyticsCache.current = null;
        setLastSync(new Date());

        return {
          success: true,
          updatedPerformance,
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
        };
      } finally {
        setIsProcessing(false);
      }
    },
    [
      performanceFirestore.data,
      performanceFirestore.update,
      performanceFirestore.create,
    ]
  );

  // Record test results
  const recordTestResults = useCallback(
    async (
      testResult: TestResult,
      words: Word[]
    ): Promise<OperationResult<void>> => {
      const startTime = Date.now();

      try {
        setIsProcessing(true);

        // Usa timeSpent dalla sessione invece di duration
        const totalTime =
          testResult.completedSession?.timeMetrics?.totalTestTime || 0;
        const averageTimePerWord =
          words.length > 0 ? totalTime / words.length : 0;

        const updates: Array<{
          wordId: string;
          input: UpdatePerformanceInput;
        }> = [];

        // Process each word
        for (const word of words) {
          // Controllo se la parola è tra quelle sbagliate usando l'analytics o il fallback sui wrongWords
          const wasCorrect =
            !testResult.analytics?.insights?.some(
              (insight: any) =>
                insight.type === "weakness" && insight.data?.wordId === word.id
            ) &&
            !testResult.exportData?.detailedAnswers?.some(
              (answer: any) =>
                answer.word?.id === word.id && !answer.result?.correct
            );

          updates.push({
            wordId: word.english,
            input: {
              word: {
                english: word.english,
                italian: word.italian,
                chapter: word.chapter || "",
                id: word.id,
              },
              isCorrect: wasCorrect,
              timeSpent: averageTimePerWord,
              usedHint: false,
            },
          });
        }

        // Bulk update performances
        await bulkUpdatePerformances(updates);

        return {
          success: true,
          metadata: {
            operation: "recordTestResults",
            timestamp: new Date(),
            duration: Date.now() - startTime,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error as FirestoreError,
          metadata: {
            operation: "recordTestResults",
            timestamp: new Date(),
            duration: Date.now() - startTime,
          },
        };
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  // Bulk update performances
  const bulkUpdatePerformances = useCallback(
    async (
      updates: Array<{ wordId: string; input: UpdatePerformanceInput }>
    ): Promise<OperationResult<WordPerformanceWithId[]>> => {
      const startTime = Date.now();

      try {
        setIsProcessing(true);

        const updatedPerformances: WordPerformanceWithId[] = [];

        // Process updates in batches to avoid overwhelming Firebase
        const batchSize = 10;
        for (let i = 0; i < updates.length; i += batchSize) {
          const batch = updates.slice(i, i + batchSize);

          const batchPromises = batch.map(async ({ wordId, input }) => {
            const result = await updateWordPerformance(wordId, input);
            if (result.updatedPerformance) {
              updatedPerformances.push(
                result.updatedPerformance as WordPerformanceWithId
              );
            }
            return result;
          });

          await Promise.all(batchPromises);
        }

        // Clear cache
        analyticsCache.current = null;
        setLastSync(new Date());

        return {
          success: true,
          data: updatedPerformances,
          metadata: {
            operation: "bulkUpdatePerformances",
            timestamp: new Date(),
            duration: Date.now() - startTime,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error as FirestoreError,
          metadata: {
            operation: "bulkUpdatePerformances",
            timestamp: new Date(),
            duration: Date.now() - startTime,
          },
        };
      } finally {
        setIsProcessing(false);
      }
    },
    [updateWordPerformance]
  );

  // Analyze word difficulty
  const analyzeWordDifficulty = useCallback(
    async (
      wordId: string
    ): Promise<OperationResult<TestDifficultyAnalysis>> => {
      const startTime = Date.now();

      try {
        const performance = performanceFirestore.data.find(
          (p) => p.english === wordId
        );

        if (!performance || performance.attempts.length === 0) {
          return {
            success: false,
            error: {
              code: "not-found" as any,
              message: "No performance data available for this word",
              operation: "analyze-difficulty" as any,
              recoverable: false,
              timestamp: new Date(),
            } as any,
            metadata: {
              operation: "analyzeWordDifficulty",
              timestamp: new Date(),
              duration: Date.now() - startTime,
            },
          };
        }

        // Calculate difficulty based on multiple factors
        const correctAttempts = performance.attempts.filter(
          (a) => a.correct
        ).length;
        const totalAttempts = performance.attempts.length;
        const accuracy = (correctAttempts / totalAttempts) * 100;
        const averageResponseTime =
          performance.attempts.reduce((sum, a) => sum + a.timeSpent, 0) /
          totalAttempts;

        const accuracyScore = accuracy / 100;
        const speedScore = Math.max(0, 1 - averageResponseTime / 10000); // 10s = 0 score
        const consistencyScore =
          totalAttempts >= 5
            ? 1 - Math.abs(accuracy - 50) / 50 // More consistent around average
            : 0.5;

        const weightedScore =
          accuracyScore * 0.5 + speedScore * 0.3 + consistencyScore * 0.2;

        let difficultyCategory: "easy" | "medium" | "hard";
        let difficultyReason: string;

        if (weightedScore >= 0.7) {
          difficultyCategory = "easy";
          difficultyReason = "High accuracy and quick response times";
        } else if (weightedScore >= 0.4) {
          difficultyCategory = "medium";
          difficultyReason = "Moderate performance with room for improvement";
        } else {
          difficultyCategory = "hard";
          difficultyReason =
            "Low accuracy or slow response times indicate difficulty";
        }

        // Calculate distribution
        const totalWords = performanceFirestore.data.length;
        const hardWords = performanceFirestore.data.filter((p) => {
          const correctAttempts = p.attempts.filter((a) => a.correct).length;
          const totalAttempts = p.attempts.length;
          const accuracy =
            totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;
          const avgTime =
            totalAttempts > 0
              ? p.attempts.reduce((sum, a) => sum + a.timeSpent, 0) /
                totalAttempts
              : 0;
          const score =
            (accuracy / 100) * 0.5 +
            Math.max(0, 1 - avgTime / 10000) * 0.3 +
            0.1;
          return score < 0.4;
        }).length;

        const easyWords = performanceFirestore.data.filter((p) => {
          const correctAttempts = p.attempts.filter((a) => a.correct).length;
          const totalAttempts = p.attempts.length;
          const accuracy =
            totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;
          const avgTime =
            totalAttempts > 0
              ? p.attempts.reduce((sum, a) => sum + a.timeSpent, 0) /
                totalAttempts
              : 0;
          const score =
            (accuracy / 100) * 0.5 +
            Math.max(0, 1 - avgTime / 10000) * 0.3 +
            0.1;
          return score >= 0.7;
        }).length;

        const mediumWords = totalWords - hardWords - easyWords;

        const analysis: TestDifficultyAnalysis = {
          difficulty: difficultyCategory,
          difficultyReason,
          weightedScore,
          totalWords,
          sizeAdjustment: 1.0, // Corretto: numero invece di stringa
          distribution: {
            hard: {
              count: hardWords,
              percentage:
                totalWords > 0 ? Math.round((hardWords / totalWords) * 100) : 0,
            },
            medium: {
              count: mediumWords,
              percentage:
                totalWords > 0
                  ? Math.round((mediumWords / totalWords) * 100)
                  : 0,
            },
            easy: {
              count: easyWords,
              percentage:
                totalWords > 0 ? Math.round((easyWords / totalWords) * 100) : 0,
            },
          },
          statusBreakdown: {
            // Corretto: aggiunge tutte le proprietà richieste
            new: performanceFirestore.data.filter(
              (p) => p.attempts.length === 0
            ).length,
            promising: performanceFirestore.data.filter(
              (p) => p.attempts.length < 3
            ).length,
            struggling: performanceFirestore.data.filter((p) => {
              const correctAttempts = p.attempts.filter(
                (a) => a.correct
              ).length;
              const totalAttempts = p.attempts.length;
              const accuracy =
                totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;
              return accuracy < 60;
            }).length,
            improving: performanceFirestore.data.filter((p) => {
              const correctAttempts = p.attempts.filter(
                (a) => a.correct
              ).length;
              const totalAttempts = p.attempts.length;
              const accuracy =
                totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;
              return accuracy >= 60 && accuracy < 80;
            }).length,
            consolidated: performanceFirestore.data.filter((p) => {
              const correctAttempts = p.attempts.filter(
                (a) => a.correct
              ).length;
              const totalAttempts = p.attempts.length;
              const accuracy =
                totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;
              return accuracy >= 80;
            }).length,
            critical: performanceFirestore.data.filter((p) => {
              const correctAttempts = p.attempts.filter(
                (a) => a.correct
              ).length;
              const totalAttempts = p.attempts.length;
              const accuracy =
                totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;
              return accuracy < 40;
            }).length,
            inconsistent: 0, // Placeholder per calcolo più complesso
          },
        };

        return {
          success: true,
          data: analysis,
          metadata: {
            operation: "analyzeWordDifficulty",
            timestamp: new Date(),
            duration: Date.now() - startTime,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error as FirestoreError,
          metadata: {
            operation: "analyzeWordDifficulty",
            timestamp: new Date(),
            duration: Date.now() - startTime,
          },
        };
      }
    },
    [performanceFirestore.data]
  );

  // Reset word performance
  const resetWordPerformance = useCallback(
    async (wordId: string): Promise<OperationResult<void>> => {
      const startTime = Date.now();

      try {
        const performance = performanceFirestore.data.find(
          (p) => p.english === wordId
        );

        if (!performance) {
          return {
            success: false,
            error: {
              code: "firestore/not-found" as any,
              message: "Performance record not found",
              operation: "delete" as any,
              recoverable: false,
              timestamp: new Date(),
            },
            metadata: {
              operation: "resetWordPerformance",
              timestamp: new Date(),
              duration: Date.now() - startTime,
            },
          };
        }

        await performanceFirestore.remove(performance.id);

        analyticsCache.current = null;
        setLastSync(new Date());

        return {
          success: true,
          metadata: {
            operation: "resetWordPerformance",
            timestamp: new Date(),
            duration: Date.now() - startTime,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error as FirestoreError,
          metadata: {
            operation: "resetWordPerformance",
            timestamp: new Date(),
            duration: Date.now() - startTime,
          },
        };
      }
    },
    [performanceFirestore.data, performanceFirestore.remove]
  );

  // Reset all performances
  const resetAllPerformances = useCallback(async (): Promise<
    OperationResult<void>
  > => {
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

      analyticsCache.current = null;
      setLastSync(new Date());

      return {
        success: true,
        metadata: {
          operation: "resetAllPerformances",
          timestamp: new Date(),
          duration: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error as FirestoreError,
        metadata: {
          operation: "resetAllPerformances",
          timestamp: new Date(),
          duration: Date.now() - startTime,
        },
      };
    } finally {
      setIsProcessing(false);
    }
  }, [performanceFirestore.data, performanceFirestore.batchUpdate]);

  // Refresh data
  const refreshData = useCallback(() => {
    performanceFirestore.fetch(); // Corretto: fetch invece di refetch
    analyticsCache.current = null;
    setLastSync(new Date());
  }, [performanceFirestore.fetch]);

  // Get word performance
  const getWordPerformance = useCallback(
    (wordId: string): WordPerformanceWithId | null => {
      return (
        performanceFirestore.data.find((p) => p.english === wordId) || null
      );
    },
    [performanceFirestore.data]
  );

  // Get word analysis
  const getWordAnalysis = useCallback(
    (wordId: string): WordPerformanceAnalysis | null => {
      const performance = getWordPerformance(wordId);
      if (!performance) return null;

      const status = calculateWordStatus(performance);
      const totalAttempts = performance.attempts.length;
      const correctAttempts = performance.attempts.filter(
        (a) => a.correct
      ).length;
      const incorrectAttempts = totalAttempts - correctAttempts;
      const accuracy =
        totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;
      const hintsUsed = performance.attempts.filter((a) => a.usedHint).length;

      return {
        // Corretto: aggiunge tutte le proprietà mancanti
        id: performance.id,
        english: performance.english,
        italian: performance.italian || "",
        chapter: performance.chapter || "",
        group: "",
        sentence: "",
        notes: "",
        learned: false,
        difficult: false,
        status,
        attempts: performance.attempts,
        totalAttempts,
        correctAttempts,
        incorrectAttempts,
        accuracy: Math.round(accuracy),
        hintsUsed,
        hintsPercentage:
          totalAttempts > 0 ? Math.round((hintsUsed / totalAttempts) * 100) : 0,
        currentStreak: 0, // Da calcolare basandosi sui tentativi più recenti
        lastAttempt:
          performance.attempts.length > 0
            ? performance.attempts[performance.attempts.length - 1]
            : {
                correct: false,
                timeSpent: 0,
                timestamp: new Date().toISOString(),
                usedHint: false,
              },
        recentAccuracy: Math.round(accuracy), // Semplificato
        avgTime: Math.round(performance.averageResponseTime / 1000), // Convertito in secondi
        trend: "stable" as const,
        difficulty: accuracy < 50 ? "hard" : accuracy < 80 ? "medium" : "easy",
        needsWork: accuracy < 70,
        mastered: accuracy >= 90,
        hasPerformanceData: totalAttempts > 0,
        recommendations: [],
      };
    },
    [getWordPerformance, calculateWordStatus]
  );

  // Get words needing work
  const getWordsNeedingWork = useCallback(
    (limit = 10): WordPerformanceAnalysis[] => {
      const analyses = performanceFirestore.data
        .map((perf) => getWordAnalysis(perf.english))
        .filter(
          (analysis): analysis is WordPerformanceAnalysis => analysis !== null
        )
        .filter(
          (analysis) =>
            analysis.status === "struggling" ||
            analysis.status === "critical" ||
            analysis.status === "inconsistent"
        )
        .sort((a, b) => {
          // Sort by urgency: critical > struggling > inconsistent
          const urgencyOrder = { critical: 3, struggling: 2, inconsistent: 1 };
          return (
            urgencyOrder[b.status as keyof typeof urgencyOrder] -
            urgencyOrder[a.status as keyof typeof urgencyOrder]
          );
        });

      return analyses.slice(0, limit);
    },
    [performanceFirestore.data, getWordAnalysis]
  );

  // Get words by status
  const getWordsByStatus = useCallback(
    (status: WordPerformanceStatus): WordPerformanceAnalysis[] => {
      return performanceFirestore.data
        .map((perf) => getWordAnalysis(perf.english))
        .filter(
          (analysis): analysis is WordPerformanceAnalysis =>
            analysis !== null && analysis.status === status
        );
    },
    [performanceFirestore.data, getWordAnalysis]
  );

  // Get performance trends
  const getPerformanceTrends = useCallback(
    (wordId: string): WordPerformanceTrends | null => {
      const performance = getWordPerformance(wordId);
      if (!performance || performance.attempts.length < 5) return null;

      const recentAttempts = performance.attempts.slice(-10);
      const olderAttempts = performance.attempts.slice(0, -10);

      if (olderAttempts.length === 0) return null;

      const recentAccuracy =
        recentAttempts.filter((a) => a.correct).length / recentAttempts.length;
      const olderAccuracy =
        olderAttempts.filter((a) => a.correct).length / olderAttempts.length;

      const recentSpeed =
        recentAttempts.reduce((sum, a) => sum + a.timeSpent, 0) /
        recentAttempts.length;
      const olderSpeed =
        olderAttempts.reduce((sum, a) => sum + a.timeSpent, 0) /
        olderAttempts.length;

      const speedTrend: SimpleTrend = {
        direction:
          recentSpeed < olderSpeed
            ? "improving"
            : recentSpeed > olderSpeed
            ? "declining"
            : "stable",
        sampleSize: recentAttempts.length,
        confidence: Math.min(90, performance.attempts.length * 10), // More attempts = higher confidence
      };

      const accuracyTrend: SimpleTrend = {
        direction:
          recentAccuracy > olderAccuracy
            ? "improving"
            : recentAccuracy < olderAccuracy
            ? "declining"
            : "stable",
        sampleSize: recentAttempts.length,
        confidence: Math.min(90, performance.attempts.length * 10),
      };

      const hintTrend: SimpleTrend = {
        direction: "stable", // Semplificato per ora
        sampleSize: recentAttempts.length,
        confidence: 50,
      };

      return {
        accuracyTrend,
        speedTrend,
        hintTrend,
        analysisperiod: 30, // Last 30 attempts or days
      };
    },
    [getWordPerformance]
  );

  // Get global stats
  const getGlobalStats = useCallback((): GlobalPerformanceStats => {
    const analyses = performanceFirestore.data
      .map((perf) => getWordAnalysis(perf.english))
      .filter(
        (analysis): analysis is WordPerformanceAnalysis => analysis !== null
      );

    const statusDistribution: Record<WordPerformanceStatus, number> = {
      new: 0,
      promising: 0,
      struggling: 0,
      consolidated: 0,
      improving: 0,
      critical: 0,
      inconsistent: 0,
    };

    analyses.forEach((analysis) => {
      statusDistribution[analysis.status]++;
    });

    const averageResponseTime =
      analyses.length > 0
        ? analyses.reduce((sum, analysis) => {
            return sum + analysis.avgTime * 1000; // Convertito da secondi a millisecondi
          }, 0) / analyses.length
        : 0;

    const averageAccuracy =
      analyses.length > 0
        ? analyses.reduce((sum, analysis) => sum + analysis.accuracy, 0) /
          analyses.length
        : 0;

    const averageHintUsage =
      analyses.length > 0
        ? analyses.reduce(
            (sum, analysis) => sum + analysis.hintsPercentage,
            0
          ) / analyses.length
        : 0;

    const wordsNeedingWork =
      statusDistribution.struggling +
      statusDistribution.critical +
      statusDistribution.inconsistent;

    const masteredWords = analyses.filter(
      (analysis) => analysis.mastered
    ).length;

    return {
      statusDistribution,
      totalWordsTracked: analyses.length,
      averageResponseTime: Math.round(averageResponseTime),
      averageAccuracy: Math.round(averageAccuracy),
      averageHintUsage: Math.round(averageHintUsage),
      wordsNeedingWork,
      masteredWords,
    };
  }, [performanceFirestore.data, getWordAnalysis]);

  // Get categorized words
  const getCategorizedWords = useCallback((): Record<
    WordPerformanceStatus,
    WordPerformanceAnalysis[]
  > => {
    const analyses = performanceFirestore.data
      .map((perf) => getWordAnalysis(perf.english))
      .filter(
        (analysis): analysis is WordPerformanceAnalysis => analysis !== null
      );

    const categorized: Record<
      WordPerformanceStatus,
      WordPerformanceAnalysis[]
    > = {
      new: [],
      promising: [],
      struggling: [],
      consolidated: [],
      improving: [],
      critical: [],
      inconsistent: [],
    };

    analyses.forEach((analysis) => {
      categorized[analysis.status].push(analysis);
    });

    return categorized;
  }, [performanceFirestore.data, getWordAnalysis]);

  // Get recommended words for practice
  const getRecommendedWords = useCallback(
    (count = 5): WordPerformanceAnalysis[] => {
      const wordsNeedingWork = getWordsNeedingWork(count * 2);
      const improvingWords = getWordsByStatus("improving");

      // Mix of words needing work and improving words
      const recommended = [
        ...wordsNeedingWork.slice(0, Math.ceil(count * 0.7)),
        ...improvingWords.slice(0, Math.floor(count * 0.3)),
      ];

      return recommended.slice(0, count);
    },
    [getWordsNeedingWork, getWordsByStatus]
  );

  // Analytics with caching
  const analytics = useMemo<PerformanceAnalytics>(() => {
    const now = Date.now();

    if (
      analyticsCache.current &&
      now - analyticsCache.current.timestamp < ANALYTICS_CACHE_TTL
    ) {
      return analyticsCache.current.analytics;
    }

    const globalPerformanceStats = getGlobalStats();
    const wordLevelInsights = performanceFirestore.data
      .map((perf) => getWordAnalysis(perf.english))
      .filter(
        (analysis): analysis is WordPerformanceAnalysis => analysis !== null
      );

    const performanceDistribution = globalPerformanceStats.statusDistribution;

    // Calculate trends
    const improving =
      performanceDistribution.improving + performanceDistribution.promising;
    const declining =
      performanceDistribution.struggling + performanceDistribution.critical;
    const stable =
      performanceDistribution.consolidated +
      performanceDistribution.inconsistent;

    const analyticsData: PerformanceAnalytics = {
      globalPerformanceStats,
      wordLevelInsights,
      performanceDistribution,
      trendsAnalysis: {
        improving,
        declining,
        stable,
      },
    };

    analyticsCache.current = { analytics: analyticsData, timestamp: now };
    return analyticsData;
  }, [performanceFirestore.data, getGlobalStats, getWordAnalysis]);

  return {
    // State
    performances: performanceFirestore.data,
    isInitialized,
    isLoading: performanceFirestore.loading,
    isProcessing,
    lastSync: lastSync || performanceFirestore.lastSync,
    error: performanceFirestore.error,
    fromCache: performanceFirestore.fromCache,

    // Operations
    updateWordPerformance,
    recordTestResults,
    analyzeWordDifficulty,
    bulkUpdatePerformances,
    resetWordPerformance,
    resetAllPerformances,
    refreshData,

    // Getters
    getWordPerformance,
    getWordAnalysis,
    getWordsNeedingWork,
    getWordsByStatus,
    getPerformanceTrends,
    getGlobalStats,
    getCategorizedWords,
    getRecommendedWords,

    // Analytics
    analytics,
  };
};

export default usePerformance;
