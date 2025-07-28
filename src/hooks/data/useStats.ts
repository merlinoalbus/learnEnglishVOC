import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { collection, query, where, getDocs, addDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useFirestore } from "../core/useFirestore";
import { useFirebase } from "../../contexts/FirebaseContext";
import { useAuth } from "../integration/useAuth";
import { useWords } from "./useWords";
import AppConfig from "../../config/appConfig";
import { StatsAnalyticsService } from "../../services/statsAnalyticsService"; // Fixed case sensitivity
import { StatsCalculationService } from "../../services/statsCalculationService";
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
import type { TestHistoryItem } from "../../types/entities/Test.types";
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

const EMPTY_ARRAY: TestHistoryItem[] = [];
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
  testHistory: TestHistoryItem[];
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
  addTestToHistory: (testResult: TestHistoryItem) => Promise<OperationResult<void>>;
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
  // Bonifica
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
  // ⭐ NUOVO: Statistiche corrette calcolate dal service
  correctStatsData: {
    testCompletati: number;
    paroleStudiate: number;
    mediaCorretta: number;
    recordScore: number;
    aiutiTotali: number;
    maxHintsPercentage: number;
  };
  detailedSessions: any[];
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
  

  // Manual handling for detailedTestSessions since they don't use firestoreMetadata structure
  const [detailedTestSessions, setDetailedTestSessions] = useState<any[]>([]);
  const [detailedSessionsLoading, setDetailedSessionsLoading] = useState(false);
  const [manualWordPerformances, setManualWordPerformances] = useState<any[]>([]);

  const { isReady } = useFirebase();
  const { user, authUser } = useAuth();
  const { words: wordsData } = useWords();

  const [testHistory, setTestHistory] = useState<TestHistoryItem[]>(EMPTY_ARRAY);
  const [wordPerformance, setWordPerformance] = useState<
    Record<string, WordPerformance>
  >(INITIAL_WORD_PERFORMANCE);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const calculatedStatsCache = useRef<{
    stats: AggregatedCalculatedStatistics;
    timestamp: number;
  } | null>(null);


  // Get the most recent statistics document
  const currentStats = statsFirestore.data.length > 0 
    ? statsFirestore.data.sort((a, b) => {
        const aDate = new Date(a.lastStudyDate || 0);
        const bDate = new Date(b.lastStudyDate || 0);
        return bDate.getTime() - aDate.getTime();
      })[0]
    : {
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

        // Create a TestHistoryItem from the test data
        const testResult: TestHistoryItem = {
          id: `test_${Date.now()}`,
          timestamp: Date.now(),
          percentage: testStats.percentage || 0,
          correctWords: testStats.correctAnswers || 0,
          incorrectWords: testStats.incorrectAnswers || 0,
          hintsUsed: testStats.hintsUsed || 0,
          totalTime: testStats.timeSpent || 0,
          avgTimePerWord: testWords.length > 0 ? (testStats.timeSpent || 0) / testWords.length / 1000 : 0,
          wrongWords: wrongWords.map(w => ({
            id: w.id,
            english: w.english,
            italian: w.italian
          })),
          wordTimes: detailedSession?.words?.map((w: any) => ({
            wordId: w.word?.id,
            time: w.totalTime
          })) || [],
          testParameters: {
            selectedChapters: Array.from(new Set(testWords.map(w => w.chapter).filter((ch): ch is string => Boolean(ch))))
          },
          totalWords: testWords.length,
          difficulty: testWords.length > 20 ? 'hard' : testWords.length > 10 ? 'medium' : 'easy',
          testType: 'normal',
          chapterStats: testWords.reduce((stats: any, word) => {
            const chapter = word.chapter || 'Senza Capitolo';
            if (!stats[chapter]) {
              stats[chapter] = {
                totalWords: 0,
                correctWords: 0,
                incorrectWords: 0,
                hintsUsed: 0,
                percentage: 0
              };
            }
            stats[chapter].totalWords++;
            if (wrongWords.find(w => w.id === word.id)) {
              stats[chapter].incorrectWords++;
            } else {
              stats[chapter].correctWords++;
            }
            stats[chapter].percentage = stats[chapter].totalWords > 0 ? 
              Math.round((stats[chapter].correctWords / stats[chapter].totalWords) * 100) : 0;
            return stats;
          }, {})
        };

        // Add to history

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
                testResultId: testResult.id,
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
              
              // Direct save to detailedTestSessions collection
              const docRef = await addDoc(collection(db, "detailedTestSessions"), cleanedSession);
              
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
    async (testResult: TestHistoryItem): Promise<OperationResult<void>> => {
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
          // Convert TestResult[] to TestHistoryItem[]
          const testHistoryItems: TestHistoryItem[] = data.sourceData.testResults.map(result => ({
            id: result.testId,
            timestamp: Date.now(),
            percentage: result.finalScore?.total || 0,
            correctWords: result.completedSession?.progress?.performance?.correctAnswers || 0,
            incorrectWords: result.completedSession?.progress?.performance?.incorrectAnswers || 0,
            hintsUsed: result.completedSession?.hintSystem?.globalState?.totalHintsUsed || 0,
            totalTime: result.completedSession?.timeMetrics?.totalTestTime || 0,
            avgTimePerWord: result.completedSession?.timeMetrics?.averageQuestionTime || 0,
            totalWords: result.completedSession?.progress?.basic?.totalQuestions || 0,
            difficulty: 'medium',
            testType: 'normal',
            wrongWords: [],
            wordTimes: [],
            testParameters: { selectedChapters: [] },
            chapterStats: {}
          }));
          setTestHistory(testHistoryItems);
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
      return {
        success: true,
        data: detailedTestSessions,
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
  }, [detailedTestSessions]);

  const getDetailedSessionById = useCallback(async (sessionId: string): Promise<OperationResult<any>> => {
    const startTime = Date.now();
    try {
      const session = detailedTestSessions.find((s: any) => s.sessionId === sessionId);
      
      if (!session) {
        return {
          success: false,
          error: { message: "Session not found", code: "not-found" as any, operation: "read" as any, recoverable: false, timestamp: new Date() } as FirestoreError,
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
  }, [detailedTestSessions]);

  const deleteDetailedSession = useCallback(async (sessionId: string): Promise<OperationResult<void>> => {
    const startTime = Date.now();
    try {
      // This function is kept for compatibility but actual deletion should be done through admin interface
      return {
        success: false,
        error: { message: "Delete not implemented in client", code: "not-found" as any, operation: "delete" as any, recoverable: false, timestamp: new Date() } as FirestoreError,
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
  }, []);

  const exportDetailedSessions = useCallback(async (): Promise<OperationResult<any[]>> => {
    const startTime = Date.now();
    try {
      // Export only user's own data 
      const exportData = detailedTestSessions.map((session: any) => ({
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
  }, [detailedTestSessions]);


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
        hasPerformanceData: totalAttempts > 0,
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

  // ⭐ NUOVO: Calcolo statistiche corrette dal service
  const correctStatsData = useMemo(() => {
    if (detailedTestSessions.length === 0 && manualWordPerformances.length === 0) {
      return {
        testCompletati: 0,
        paroleStudiate: 0,
        mediaCorretta: 0,
        recordScore: 0,
        aiutiTotali: 0,
        maxHintsPercentage: 0
      };
    }

    const result = StatsCalculationService.calculateStats(detailedTestSessions, manualWordPerformances);
    
    // Debug log
    StatsCalculationService.logCalculationDetails(detailedTestSessions, manualWordPerformances, result);
    
    return result;
  }, [detailedTestSessions, manualWordPerformances]);

  useEffect(() => {
    if (performanceFirestore.data.length > 0) {
      const performanceMap: Record<string, WordPerformance> = {};
      performanceFirestore.data.forEach((perf) => {
        performanceMap[perf.english] = perf;
      });
      setWordPerformance(performanceMap);
    }
  }, [performanceFirestore.data, performanceFirestore.loading, performanceFirestore.error, user?.id, authUser?.uid]);

  // Manual fetch for detailedTestSessions and performance
  useEffect(() => {
    if (!isReady || (!user?.id && !authUser?.uid) || detailedSessionsLoading) return;
    
    const loadData = async () => {
      setDetailedSessionsLoading(true);
      try {
        const userId = user?.id || authUser?.uid;
        
        // 1. Load detailedTestSessions
        const sessionsRef = collection(db, "detailedTestSessions");
        const sessionsQuery = query(sessionsRef, where("userId", "==", userId));
        const sessionsSnapshot = await getDocs(sessionsQuery);
        
        const sessions: any[] = [];
        sessionsSnapshot.forEach((doc) => {
          const data = doc.data();
          // FILTRA SOLO SESSIONI NON CANCELLATE
          if (!data.deleted && !data.firestoreMetadata?.deleted) {
            sessions.push({ id: doc.id, ...data });
          }
        });
        
        setDetailedTestSessions(sessions);
        
        // 2. Load performance data
        const performanceRef = collection(db, "performance");
        const performanceQuery = query(performanceRef, where("firestoreMetadata.userId", "==", userId));
        const performanceSnapshot = await getDocs(performanceQuery);
        
        const performances: any[] = [];
        const performanceMap: Record<string, WordPerformance> = {};
        
        performanceSnapshot.forEach((doc) => {
          const data = doc.data();
          // FILTRA SOLO DOCUMENTI NON CANCELLATI
          if (data.firestoreMetadata?.deleted !== true) {
            // Trova la parola corrispondente per aggiungere il flag learned
            const correspondingWord = wordsData.find((word: any) => 
              word.id === data.wordId || word.english === data.english
            );
            
            const performanceWithLearned = {
              ...data,
              learned: correspondingWord?.learned || false
            };
            
            performances.push({ id: doc.id, ...performanceWithLearned });
            
            // Create proper WordPerformance object
            const wordPerformance: WordPerformance = {
              wordId: data.wordId || '',
              english: data.english || '',
              italian: data.italian || '',
              chapter: data.chapter,
              attempts: data.attempts || [],
              updatedAt: data.updatedAt,
              firestoreMetadata: data.firestoreMetadata
            };
            performanceMap[data.english] = wordPerformance;
          }
        });
        
        setManualWordPerformances(performances);
        setWordPerformance(performanceMap);
        
        // Performance data loaded
        
        if (sessions.length > 0) {
          // Convert to TestHistoryItem format
          const testResults: TestHistoryItem[] = sessions.map(session => ({
            id: session.sessionId || session.id,
            timestamp: session.completedAt || session.startedAt,
            percentage: session.accuracy || 0,
            correctWords: session.correctAnswers || 0,
            incorrectWords: session.incorrectAnswers || 0,
            totalWords: session.totalWords || 0,
            hintsUsed: session.totalHintsUsed || 0,
            totalTime: session.totalTimeSpent || 0,
            avgTimePerWord: session.averageTimePerWord || 0,
            chapterStats: session.chapterBreakdown || {},
            difficulty: 'medium',
            testType: 'normal',
            wrongWords: [],
            wordTimes: [],
            testParameters: { selectedChapters: [] }
          }));

          setTestHistory(testResults);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setDetailedSessionsLoading(false);
      }
    };
    
    loadData();
  }, [isReady, user?.id, authUser?.uid, wordsData]);


  return {
    stats: currentStats,
    testHistory,
    wordPerformance,
    isInitialized,
    isLoading: statsFirestore.loading || performanceFirestore.loading || detailedSessionsLoading,
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
    // ⭐ NUOVO: Dati corretti
    correctStatsData,
    detailedSessions: detailedTestSessions,
    // Bonifica
  };
};

export default useStats;
