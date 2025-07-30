import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { collection, query, where, getDocs, addDoc, deleteDoc, updateDoc, doc, setDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useFirestore } from "../core/useFirestore";
import { useFirebase } from "../../contexts/FirebaseContext";
import { useAuth } from "../integration/useAuth";
import { useWords } from "./useWords";
import AppConfig from "../../config/appConfig";
import { StatsAnalyticsService } from "../../services/statsAnalyticsService"; // Fixed case sensitivity
import { StatsCalculationService } from "../../services/statsCalculationService";
import ChapterStatsService from "../../services/ChapterStatsService";
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
import type { 
  TestHistoryItem,
  ChapterAnalysisInput,
  ChapterCalculationResult,
  ChapterTrendData
} from "../../types/entities/Test.types";
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
  clearAllStatistics: () => Promise<OperationResult<void>>; // ⭐ NEW: Clear all statistics function
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
  // ⭐ CHAPTER ANALYTICS: Analisi capitoli integrata
  calculateChapterAnalysis: () => ChapterCalculationResult;
  getChapterTrend: (chapterName: string) => ChapterTrendData[];
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
    enableCache: false,
    autoFetch: true,
    debug: process.env.NODE_ENV === "development",
  });
  

  // Manual handling for detailedTestSessions since they don't use firestoreMetadata structure
  const [detailedTestSessions, setDetailedTestSessions] = useState<any[]>([]);
  const [detailedSessionsLoading, setDetailedSessionsLoading] = useState(false);
  const [manualWordPerformances, setManualWordPerformances] = useState<any[]>([]);

  const { isReady } = useFirebase();
  const { user, authUser } = useAuth();
  const { words: wordsData, loading: wordsLoading } = useWords();

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

  // ⭐ CHAPTER ANALYTICS CACHE: Cache per analisi capitoli
  const chapterAnalysisCache = useRef<{
    analysis: ChapterCalculationResult;
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
    usedHint: boolean = false,
    hintsCount: number = 0
  ): PerformanceAttempt => ({
    correct,
    timeSpent,
    timestamp: new Date().toISOString(),
    usedHint,
    hintsCount,
  });

  const createCompleteWordPerformance = (
    wordId: string,
    english: string,
    italian: string = "",
    chapter: string = "",
    attempts: PerformanceAttempt[] = []
  ): WordPerformance => ({
    wordId, // FIXED: usa wordId univoco invece di english
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
          hintsUsed: detailedSession?.totalHintsUsed || testStats.hintsUsed || 0,
          totalTime: testStats.timeSpent || 0,
          avgTimePerWord: testWords.length > 0 ? (testStats.timeSpent || 0) / testWords.length / 1000 : 0,
          wrongWords: wrongWords.map(w => ({
            id: w.id,
            english: w.english,
            italian: w.italian
          })),
          wordTimes: detailedSession?.words?.map((w: any) => ({
            wordId: w.wordId,
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
            
            // ⭐ CORRETTO: Conta hint reali dai detailedSession
            if (detailedSession?.words && Array.isArray(detailedSession.words)) {
              const wordSession = detailedSession.words.find((w: any) => 
                w.wordId === word.id || w.english === word.english
              );
              if (wordSession && wordSession.hintsUsed && wordSession.hintsUsed.length > 0) {
                stats[chapter].hintsUsed += wordSession.hintsUsed.length;
              }
            }
            
            stats[chapter].percentage = stats[chapter].totalWords > 0 ? 
              Math.round((stats[chapter].correctWords / stats[chapter].totalWords) * 100) : 0;
            return stats;
          }, {})
        };

        // FIXED: Assicurati che i dati performance siano freschi prima di processare
        try {
          await performanceFirestore.fetch();
        } catch (error) {
          // Collection performance non esiste ancora - è normale per il primo test
          if (AppConfig.app.environment === "development") {
            // Performance collection will be created on first use
          }
        }

        // Add to history

        for (const word of testWords) {
          const isWrong = wrongWords.some((w) => w.id === word.id);
          
          // ⭐ CORRETTO: Calcola usedHint e hintsCount dai dati reali del detailedSession
          let usedHint = false;
          let hintsCount = 0;
          let actualTimeSpent = 2000; // Fallback tempo ragionevole (2 secondi)
          
          if (detailedSession?.words && Array.isArray(detailedSession.words)) {
            const wordSession = detailedSession.words.find((w: any) => 
              w.wordId === word.id || w.english === word.english
            );
            if (wordSession) {
              const hintsArray = wordSession.hintsUsed || [];
              hintsCount = hintsArray.length || wordSession.totalHintsCount || 0;
              usedHint = hintsCount > 0;
              actualTimeSpent = wordSession.totalTime || actualTimeSpent;
            }
          }
          
          const attempt = createCompletePerformanceAttempt(
            !isWrong,
            actualTimeSpent,
            usedHint,
            hintsCount
          );


          // FIXED: Controlla prima in memoria locale, poi su Firebase  
          const existingPerfMemory = wordPerformance[word.id];
          const existingPerfFirebase = performanceFirestore.data.find((p) => p.id === word.id);
          
          
          if (existingPerfMemory || existingPerfFirebase) {
            // FIXED: Usa i dati più completi (Firebase ha priorità)
            const existingPerf = existingPerfFirebase || existingPerfMemory;
            const existingAttempts = existingPerf.attempts || [];
            const newAttempts = [...existingAttempts, attempt];
            const totalAttempts = newAttempts.length;
            const correctAttempts = newAttempts.filter((a) => a.correct).length;
            
            const updatedPerf: WordPerformance = {
              ...existingPerf,
              attempts: newAttempts,
              // FIXED: Aggiungi calcolo dati cumulativi
              totalAttempts,
              correctAttempts,
              accuracy: (correctAttempts / totalAttempts) * 100,
              averageResponseTime: newAttempts.reduce((sum, a) => sum + a.timeSpent, 0) / totalAttempts,
              lastAttemptAt: new Date(),
              updatedAt: new Date(),
            };

            // FIXED: Aggiorna local state
            setWordPerformance((prev) => ({
              ...prev,
              [word.id]: updatedPerf,
            }));

            // FIXED: Aggiorna o crea su Firebase
            if (existingPerfFirebase) {
              // Update existing performance data
              
              await performanceFirestore.update(word.id, updatedPerf);
            } else {
              // Create new performance record
              await (performanceFirestore.create as any)(updatedPerf, word.id);
            }
          } else {
            // FIXED: Caso completamente nuovo - primo test per questa parola
            // Create new performance for first-time word
            
            const newPerf = createCompleteWordPerformance(
              word.id, // FIXED: passa word.id come primo parametro
              word.english,
              word.italian,
              word.chapter,
              [attempt]
            );
            
            // FIXED: Aggiungi dati cumulativi per nuove performance
            newPerf.totalAttempts = 1;
            newPerf.correctAttempts = attempt.correct ? 1 : 0;
            newPerf.accuracy = attempt.correct ? 100 : 0;
            newPerf.averageResponseTime = attempt.timeSpent;
            newPerf.lastAttemptAt = new Date();
            newPerf.createdAt = new Date();
            newPerf.updatedAt = new Date();

            setWordPerformance((prev) => ({
              ...prev,
              [word.id]: newPerf, // FIXED: usa word.id come chiave
            }));

            await (performanceFirestore.create as any)(newPerf, word.id); // FIXED: Usa word.id come ID documento
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

        // Force refresh removed to avoid circular dependency

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
          // SIMPLIFIED: Non serve più lookup complesso - chiediamo all'utente di passare i dati completi
          throw new Error("Performance not found and word data not provided. Use handleTestComplete instead.");
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

  // Helper function to reload detailed test sessions and update testHistory
  const reloadDetailedSessions = useCallback(async () => {
    try {
      const userId = user?.id || authUser?.uid;
      if (!userId) return;

      const sessionsRef = collection(db, "detailedTestSessions");
      const sessionsQuery = query(sessionsRef, where("userId", "==", userId));
      const sessionsSnapshot = await getDocs(sessionsQuery);

      const sessions: any[] = [];
      sessionsSnapshot.forEach((doc) => {
        sessions.push({ id: doc.id, ...doc.data() });
      });

      setDetailedTestSessions(sessions);

      // Convert to test history format for UI
      const testHistoryItems = sessions.map((session: any) => ({
        id: session.id || session.sessionId,
        timestamp: new Date(session.completedAt || session.timestamp).getTime(),
        percentage: session.accuracy || 0,
        correctWords: session.correctAnswers || 0,
        incorrectWords: session.incorrectAnswers || 0,
        totalWords: session.totalWords || 0,
        totalTime: session.totalTimeSpent || 0,
        hintsUsed: session.totalHintsUsed || 0,
        testMode: session.config?.testMode || 'standard',
        chapters: session.config?.selectedChapters || [],
        wrongWords: session.wrongWords || [],
        wordTimes: [],
        testParameters: session.config || { selectedChapters: [] },
        chapterStats: session.chapterBreakdown || {}
      }));
      setTestHistory(testHistoryItems);
    } catch (error) {
      console.error('Error reloading detailed sessions:', error);
    }
  }, [user?.id, authUser?.uid]);

  const refreshData = useCallback(async () => {
    statsFirestore.refresh();
    performanceFirestore.refresh();
    calculatedStatsCache.current = null;
    setLastSync(new Date());
    
    // Also reload detailed sessions to update testHistory
    await reloadDetailedSessions();
  }, [statsFirestore, performanceFirestore, reloadDetailedSessions]);

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

  // ⭐ FIXED: Clear only CURRENT USER's statistics function
  const clearAllStatistics = useCallback(async (): Promise<OperationResult<void>> => {
    const startTime = Date.now();
    try {
      setIsProcessing(true);
      // Starting clear operation
      
      const currentUserId = authUser?.uid;
      if (!currentUserId) {
        throw new Error('No authenticated user found');
      }
      
      // Clear user statistics
      
      // Delete ONLY current user's performance documents
      const performanceCollection = collection(db, "performance");
      const userPerformanceQuery = query(
        performanceCollection, 
        where("firestoreMetadata.userId", "==", currentUserId)
      );
      const userPerformanceDocs = await getDocs(userPerformanceQuery);
      
      if (userPerformanceDocs.size > 0) {
        for (const docSnapshot of userPerformanceDocs.docs) {
          await deleteDoc(docSnapshot.ref);
        }
      }
      
      // Delete ONLY current user's detailed test sessions
      const sessionsCollection = collection(db, "detailedTestSessions");
      const userSessionsQuery = query(
        sessionsCollection, 
        where("userId", "==", currentUserId)
      );
      const userSessionsDocs = await getDocs(userSessionsQuery);
      
      if (userSessionsDocs.size > 0) {
        for (const docSnapshot of userSessionsDocs.docs) {
          await deleteDoc(docSnapshot.ref);
        }
      }
      
      // Delete ONLY current user's statistics documents
      const statisticsCollection = collection(db, "statistics");
      const userStatsQuery = query(
        statisticsCollection, 
        where("firestoreMetadata.userId", "==", currentUserId)
      );
      const userStatsDocs = await getDocs(userStatsQuery);
      
      if (userStatsDocs.size > 0) {
        for (const docSnapshot of userStatsDocs.docs) {
          await deleteDoc(docSnapshot.ref);
        }
      }
      
      // Clear local state
      setTestHistory([]);
      calculatedStatsCache.current = null;
      setLastSync(new Date());
      
      return {
        success: true,
        metadata: {
          operation: "clearAllStatistics",
          timestamp: new Date(),
          duration: Date.now() - startTime,
        },
      };
    } catch (error) {
      console.error('❌ Error clearing all statistics:', error);
      return {
        success: false,
        error: error as FirestoreError,
        metadata: {
          operation: "clearAllStatistics",
          timestamp: new Date(),
          duration: Date.now() - startTime,
        },
      };
    } finally {
      setIsProcessing(false);
    }
  }, [authUser]);

  const exportData = useCallback((): ComprehensiveStatisticsExportData => {
    const wordPerformanceAnalyses = getAllWordsPerformance();
    return analyticsService.createComprehensiveExportData(
      currentStats,
      testHistory,
      wordPerformanceAnalyses
    );
  }, [currentStats, testHistory, analyticsService]);

  const importDataInternal = useCallback(
    async (
      data: ComprehensiveStatisticsExportData
    ): Promise<OperationResult<void>> => {
      const startTime = Date.now();
      try {
        setIsProcessing(true);

        if (data.statistics && data.statistics !== null) {
          // Import statistics with setDoc to overwrite existing
          for (const stat of (Array.isArray(data.statistics) ? data.statistics : [data.statistics])) {
            if (!stat.id) continue;
            const docRef = doc(db, "statistics", stat.id);
            const docData = {
              ...stat,
              firestoreMetadata: {
                ...(stat.firestoreMetadata || {}),
                userId: user?.id || 'current-user'
              }
            };
            await setDoc(docRef, docData);
          }
        }

        if (data.sourceData?.testResults && data.sourceData.testResults.length > 0) {
          const sessions = data.sourceData.testResults.filter(s => (s as any).id || (s as any).sessionId);
          
          // Process each document one by one with delay to avoid timeout
          for (let i = 0; i < sessions.length; i++) {
            const testSession = sessions[i];
            const session = testSession as any;
            const docId = session.id || session.sessionId;
            const docRef = doc(db, "detailedTestSessions", docId);
            await setDoc(docRef, { 
              ...session, 
              deleted: false,
              userId: user?.id || 'current-user'
            });
            
            // Minimal delay only every 10 documents to avoid rate limiting
            if ((i + 1) % 10 === 0 && i < sessions.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 50));
            }
          }
        }

        if (data.sourceData?.wordPerformances && data.sourceData.wordPerformances.length > 0) {
          const performances = data.sourceData.wordPerformances.filter(p => p.id);
          
          // Process each document one by one with delay to avoid timeout
          for (let i = 0; i < performances.length; i++) {
            const analysis = performances[i];
            try {
              const docRef = doc(db, "performance", analysis.id);
              // Preserve existing firestoreMetadata and add current userId
              const docData = {
                ...analysis,
                firestoreMetadata: {
                  ...((analysis as any).firestoreMetadata || {}),
                  userId: user?.id || 'current-user',
                  updatedAt: new Date()
                }
              };
              await setDoc(docRef, docData);
            } catch (error) {
              // Skip failed docs
            }
            
            // Minimal delay only every 10 documents to avoid rate limiting
            if ((i + 1) % 10 === 0 && i < performances.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 50));
            }
          }
        }

        // Clear all caches and reload data
        calculatedStatsCache.current = null;
        setWordPerformance({});
        setTestHistory([]);
        setLastSync(new Date());
        
        // Force complete refresh
        performanceFirestore.refresh();
        statsFirestore.refresh();
        
        // Force complete data reload
        const reloadAllData = async () => {
          const userId = user?.id || 'current-user';
          
          // Reload detailed test sessions
          const sessionsRef = collection(db, "detailedTestSessions");
          const sessionsQuery = query(sessionsRef, where("userId", "==", userId));
          const sessionsSnapshot = await getDocs(sessionsQuery);
          const sessions = sessionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setDetailedTestSessions(sessions);
          
          // Convert to test history format for UI
          const testHistoryItems = sessions.map((session: any) => ({
            id: session.id || session.sessionId,
            timestamp: new Date(session.completedAt || session.timestamp).getTime(),
            percentage: session.accuracy || 0,
            correctWords: session.correctAnswers || 0,
            incorrectWords: session.incorrectAnswers || 0,
            hintsUsed: session.totalHintsUsed || 0,
            totalTime: session.totalTimeSpent || 0,
            avgTimePerWord: session.averageTimePerWord || 0,
            totalWords: session.totalWords || 0,
            difficulty: 'medium' as const,
            testType: 'normal' as const,
            wrongWords: session.wrongWords || [],
            wordTimes: [],
            testParameters: session.config || { selectedChapters: [] },
            chapterStats: session.chapterBreakdown || {}
          }));
          setTestHistory(testHistoryItems);
          
          // Refresh Firestore hooks
          await performanceFirestore.refresh();
          await statsFirestore.refresh();
          
          // Clear caches
          calculatedStatsCache.current = null;
          setLastSync(new Date());
        };
        
        setTimeout(reloadAllData, 1000);

        return {
          success: true,
          metadata: {
            operation: "importData",
            timestamp: new Date(),
            duration: Date.now() - startTime,
          },
        };
      } catch (error) {
        throw error;
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

  // ⭐ WRAPPER: Import function without timeout
  const importData = useCallback(
    async (data: ComprehensiveStatisticsExportData): Promise<OperationResult<void>> => {
      try {
        // Call internal function directly without useAsyncOperation timeout
        return await importDataInternal(data);
      } catch (error) {
        return {
          success: false,
          error: error as FirestoreError,
          metadata: {
            operation: "importData",
            timestamp: new Date(),
            duration: 0,
          },
        };
      }
    },
    [importDataInternal]
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
      
      // ⭐ PULITO: Ora usa i dati reali dagli attempts (fix applicato a handleTestComplete)
      const hintsUsed = perf.attempts.filter((a) => a.usedHint).length;
      
      const averageTime =
        totalAttempts > 0
          ? perf.attempts.reduce((sum, a) => sum + a.timeSpent, 0) /
            totalAttempts
          : 0;

      return {
        id: perf.wordId, // ID della parola (stesso di document Firebase)
        english: perf.english,
        italian: perf.italian || "",
        chapter: perf.chapter || "",
        group: "",
        sentences: "",
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
      return analyses.find((analysis) => analysis.id === wordId) || null; // FIXED: confronta con wordId
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
        // CRITICAL FIX: Use wordId as key to match with word.id, not english
        const key = perf.wordId || perf.id; // wordId is preferred, fallback to document id
        performanceMap[key] = perf;
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
            // CRITICAL FIX: Use wordId as key to match with word.id in handleTestComplete
            const key = data.wordId || doc.id; // wordId is preferred, fallback to document id
            performanceMap[key] = wordPerformance;
          }
        });
        
        setManualWordPerformances(performances);
        setWordPerformance(performanceMap);
        
        // Performance data loaded
        
        if (sessions.length > 0) {
          // Convert to TestHistoryItem format
          const testResults: TestHistoryItem[] = sessions.map(session => {
            // 🔍 MAPPING CORRETTO: chapterBreakdown -> chapterStats
            const chapterStats: any = {};
            if (session.chapterBreakdown) {
              Object.entries(session.chapterBreakdown).forEach(([chapter, breakdown]: [string, any]) => {
                chapterStats[chapter] = {
                  correctWords: breakdown.correct || 0,
                  incorrectWords: breakdown.incorrect || 0,
                  totalWords: (breakdown.correct || 0) + (breakdown.incorrect || 0),
                  hintsUsed: breakdown.hintsUsed || 0,
                  percentage: (breakdown.correct || 0) > 0 
                    ? Math.round(((breakdown.correct || 0) / ((breakdown.correct || 0) + (breakdown.incorrect || 0))) * 100)
                    : 0
                };
              });
            }
            
            
            return {
              id: session.sessionId || session.id,
              timestamp: session.completedAt || session.startedAt,
              percentage: session.accuracy || 0,
              correctWords: session.correctAnswers || 0,
              incorrectWords: session.incorrectAnswers || 0,
              totalWords: session.totalWords || 0,
              hintsUsed: session.totalHintsUsed || 0,
              totalTime: session.totalTimeSpent || 0,
              avgTimePerWord: session.averageTimePerWord || 0,
              chapterStats, // ⭐ FIXED: mapping corretto
              difficulty: 'medium',
              testType: 'normal',
              wrongWords: [],
              wordTimes: [],
              testParameters: { selectedChapters: [] }
            };
          });

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

  // ⭐ CHAPTER ANALYTICS: Implementazione delle funzioni mancanti
  const chapterStatsService = useMemo(() => new ChapterStatsService(), []);
  
  const calculateChapterAnalysis = useCallback((): ChapterCalculationResult => {
    if (!testHistory || !wordsData) {
      return {
        analysis: { processedData: [], chapterDetailedHistory: {} },
        overviewStats: { totalChapters: 0, testedChapters: 0, bestEfficiency: 0, averageCompletion: 0, averageAccuracy: 0 },
        topChapters: [],
        strugglingChapters: [],
        analytics: { processedData: [] },
        sessionStats: { totalSessions: 0, avgWordsPerSession: 0, avgTimePerWord: 0, preferredTimeSlot: 'N/A', sessionIntensity: { intensive: 0, medium: 0, light: 0 } }
      };
    }
    
    // ⭐ CORRETTO: Converte WordPerformance in WordPerformanceAnalysis
    const wordPerformancesArray = getAllWordsPerformance(); // Già convertite nel formato corretto
    
    return chapterStatsService.calculateChapterAnalysis({
      testHistory,
      words: wordsData,
      wordPerformances: wordPerformancesArray,
      detailedSessions: detailedTestSessions
    });
  }, [testHistory, wordsData, getAllWordsPerformance, chapterStatsService]);
  
  const getChapterTrend = useCallback((chapterName: string): ChapterTrendData[] => {
    if (!testHistory || !wordsData) {
      return [];
    }
    
    const wordPerformancesArray = getAllWordsPerformance();
    const { analysis } = chapterStatsService.calculateChapterAnalysis({
      testHistory,
      words: wordsData,
      wordPerformances: wordPerformancesArray,
      detailedSessions: detailedTestSessions
    });
    
    return chapterStatsService.calculateChapterTrend(chapterName, analysis.chapterDetailedHistory);
  }, [testHistory, wordsData, getAllWordsPerformance, chapterStatsService]);

  // 🧹 CLEAR ALL DATA ON LOGOUT AND RELOAD ON LOGIN
  useEffect(() => {
    const handleLogout = () => {
      setDetailedTestSessions([]);
      setTestHistory([]);
      setWordPerformance({});
      setManualWordPerformances([]);
      calculatedStatsCache.current = null;
      chapterAnalysisCache.current = null;
    };

    const handleLogin = () => {
      // Force reload manual data after login
      if (isReady && (user?.id || authUser?.uid)) {
        const loadData = async () => {
          setDetailedSessionsLoading(true);
          try {
            const userId = user?.id || authUser?.uid;
            
            // Load detailedTestSessions
            const sessionsRef = collection(db, "detailedTestSessions");
            const sessionsQuery = query(sessionsRef, where("userId", "==", userId));
            const sessionsSnapshot = await getDocs(sessionsQuery);
            
            const sessions: any[] = [];
            sessionsSnapshot.forEach((doc) => {
              const data = doc.data();
              if (!data.deleted && !data.firestoreMetadata?.deleted) {
                sessions.push({ id: doc.id, ...data });
              }
            });
            
            setDetailedTestSessions(sessions);
          } catch (error) {
            console.error('Error loading data after login:', error);
          } finally {
            setDetailedSessionsLoading(false);
          }
        };
        
        setTimeout(loadData, 200);
      }
    };

    window.addEventListener('userLogout', handleLogout);
    window.addEventListener('userLogin', handleLogin);
    
    return () => {
      window.removeEventListener('userLogout', handleLogout);
      window.removeEventListener('userLogin', handleLogin);
    };
  }, [isReady, user?.id, authUser?.uid]);

  return {
    stats: currentStats,
    testHistory,
    wordPerformance,
    isInitialized,
    isLoading: statsFirestore.loading || performanceFirestore.loading || detailedSessionsLoading || wordsLoading,
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
    clearAllStatistics, // ⭐ NEW: Clear all statistics function
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
    // ⭐ CHAPTER ANALYTICS: Analisi capitoli integrate
    calculateChapterAnalysis,
    getChapterTrend,
    // Bonifica
  };
};

export default useStats;
