import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useFirebase } from "../../contexts/FirebaseContext";
import AppConfig from "../../config/appConfig";
import type {
  Test,
  TestResult,
  TestMode,
  TestConfig,
  WordSelectionConfig,
  TimingConfig,
  UIConfig,
  ScoringConfig,
  PerformanceMetrics,
  SpeedTrend,
  PerformancePatterns,
  TestAnalytics,
  TestSummary as TestSummaryType,
  TestExportData,
  HintSystemConfig,
  TestTimeMetrics,
  TimeDistribution,
  TestAnswer,
  TestSession,
  TestWordPool,
  TestHintSystem,
  HintGlobalState,
  HintStatistics,
  FinalScore,
  TestFeedback,
} from "../../types/entities/Test.types";
import type { Word } from "../../types/entities/Word.types";
import type { CreateInput, OperationResult } from "../../types/index";

interface TestStats {
  correct: number;
  incorrect: number;
  hints: number;
}

interface WordTiming {
  wordId: string;
  startTime: number;
  endTime: number;
  timeSpent: number;
  usedHint: boolean;
}

interface TestProgress {
  current: number;
  total: number;
  percentage: number;
  remaining: number;
}

interface TestSummary {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  hintsUsed: number;
  accuracy: number;
  score: number;
  timeSpent: number;
  averageTimePerWord: number;
  wrongWords: Word[];
}

interface TestState {
  // Test state
  testMode: boolean;
  showResults: boolean;
  currentWord: Word | null;
  testWords: Word[];
  usedWordIds: Set<string>;

  // Progress tracking
  stats: TestStats;
  wrongWords: Word[];
  wordTimes: WordTiming[];

  // UI state
  showMeaning: boolean;
  showHint: boolean;
  hintUsedForCurrentWord: boolean;
  isTransitioning: boolean;

  // Test metadata
  testSaved: boolean;
  isInitialized: boolean;
  error: Error | null;
}

interface TestOperations {
  startTest: (words: Word[], config?: Partial<TestConfig>) => void;
  handleAnswer: (isCorrect: boolean) => void;
  resetTest: () => void;
  startNewTest: () => void;
  toggleHint: () => void;
  setShowMeaning: (show: boolean) => void;
}

interface TestGetters {
  getTestProgress: () => TestProgress;
  getTestSummary: () => TestSummary;
}

interface TestHookResult extends TestState, TestOperations, TestGetters {
  hintUsed: boolean;
}

type TestCompleteCallback = (
  testStats: TestStats,
  testWords: Word[],
  wrongWords: Word[]
) => void;

export const useTest = (
  onTestComplete?: TestCompleteCallback
): TestHookResult => {
  const { isReady } = useFirebase();

  // Core test state
  const [testMode, setTestMode] = useState<boolean>(false);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [testWords, setTestWords] = useState<Word[]>([]);
  const [usedWordIds, setUsedWordIds] = useState<Set<string>>(new Set());

  // Progress tracking
  const [stats, setStats] = useState<TestStats>({
    correct: 0,
    incorrect: 0,
    hints: 0,
  });
  const [wrongWords, setWrongWords] = useState<Word[]>([]);
  const [wordTimes, setWordTimes] = useState<WordTiming[]>([]);

  // UI state
  const [showMeaning, setShowMeaning] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [hintUsedForCurrentWord, setHintUsedForCurrentWord] =
    useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  // Test metadata
  const [testSaved, setTestSaved] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Refs for timing
  const testStartTimeRef = useRef<number | null>(null);
  const wordStartTimeRef = useRef<number | null>(null);

  // Initialize when Firebase is ready
  useEffect(() => {
    if (isReady && !isInitialized) {
      setIsInitialized(true);
      if (AppConfig.app.environment === "development") {
        console.log("🧪 useTest initialized with Firebase");
      }
    }
  }, [isReady, isInitialized]);

  // Create complete HintSystemConfig
  const createHintSystemConfig = (
    config?: Partial<HintSystemConfig>
  ): HintSystemConfig => ({
    enabled: true,
    maxHintsPerQuestion: 2,
    cooldownBetweenHints: 0,
    availableHintTypes: ["sentence", "synonym"],
    hintCosts: {
      sentence: 1,
      synonym: 1,
    },
    ...config,
  });

  // Create complete TestTimeMetrics
  const createTestTimeMetrics = (
    totalTime: number,
    wordTimes: WordTiming[]
  ): TestTimeMetrics => ({
    totalTestTime: totalTime,
    averageQuestionTime:
      wordTimes.length > 0 ? totalTime / wordTimes.length : 0,
    fastestQuestion:
      wordTimes.length > 0 ? Math.min(...wordTimes.map((w) => w.timeSpent)) : 0,
    slowestQuestion:
      wordTimes.length > 0 ? Math.max(...wordTimes.map((w) => w.timeSpent)) : 0,
    timeDistribution: {
      byCategory: {},
      byDifficulty: {},
      percentiles: {
        p25: 0,
        p50: 0,
        p75: 0,
        p90: 0,
      },
    },
    speedTrend: createSpeedTrend(0),
  });

  // Create complete SpeedTrend
  const createSpeedTrend = (changePercentage: number = 0): SpeedTrend => ({
    direction: "stable",
    changePercentage,
    dataPoints: [],
  });

  // Create complete WordSelectionConfig
  const createWordSelectionConfig = (
    config?: Partial<WordSelectionConfig>
  ): WordSelectionConfig => ({
    categories: [],
    chapters: [],
    unlearnedOnly: false,
    difficultOnly: false,
    randomOrder: true,
    selectionStrategy: "random",
    ...config,
  });

  // Create complete TimingConfig
  const createTimingConfig = (
    config?: Partial<TimingConfig>
  ): TimingConfig => ({
    autoAdvance: true,
    showTimer: false,
    autoAdvanceDelay: 1000,
    showMeaning: false,
    meaningDisplayDuration: 2000,
    wordTimeLimit: 30000,
    ...config,
  });

  // Create complete UIConfig
  const createUIConfig = (config?: Partial<UIConfig>): UIConfig => ({
    theme: "light",
    animations: true,
    sounds: false,
    showDetailedProgress: true,
    showRealTimeStats: true,
    ...config,
  });

  // Create complete ScoringConfig
  const createScoringConfig = (
    config?: Partial<ScoringConfig>
  ): ScoringConfig => ({
    accuracyWeight: 0.7,
    speedWeight: 0.3,
    streakBonus: 0.1,
    hintPenalty: 2,
    thresholds: {
      excellent: 90,
      good: 80,
      average: 70,
    },
    ...config,
  });

  // Create complete PerformanceMetrics
  const createPerformanceMetrics = (
    correctAnswers: number,
    totalQuestions: number
  ): PerformanceMetrics => ({
    correctAnswers,
    currentAccuracy:
      totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0,
    incorrectAnswers: totalQuestions - correctAnswers,
    currentStreak: 0,
    bestStreak: 0,
    efficiency: totalQuestions > 0 ? correctAnswers / totalQuestions : 0,
    currentScore:
      totalQuestions > 0
        ? Math.round((correctAnswers / totalQuestions) * 100)
        : 0,
  });

  // Create complete PerformancePatterns
  const createPerformancePatterns = (): PerformancePatterns => ({
    timePatterns: {
      totalTestTime: 0,
      averageQuestionTime: 0,
      fastestQuestion: 0,
      slowestQuestion: 0,
      timeDistribution: {
        byCategory: {},
        byDifficulty: {},
        percentiles: {
          p25: 0,
          p50: 0,
          p75: 0,
          p90: 0,
        },
      },
      speedTrend: createSpeedTrend(),
    },
    accuracyPatterns: {
      overallAccuracy: 0,
      accuracyByPosition: [],
      accuracyTrend: createSpeedTrend(),
      difficultWordsBias: 0,
    },
    hintPatterns: {
      usage: {
        sentence: 0,
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
  });

  // Create complete TestSession
  const createTestSession = (
    totalTime: number,
    wordTimes: WordTiming[],
    finalStats: TestStats,
    testWords: Word[],
    wrongWords: Word[]
  ): TestSession => ({
    currentQuestion: null,
    timeMetrics: createTestTimeMetrics(totalTime, wordTimes),
    progress: {
      basic: {
        totalQuestions: testWords.length,
        questionsAnswered: finalStats.correct + finalStats.incorrect,
        currentQuestion: finalStats.correct + finalStats.incorrect,
        questionsRemaining: 0,
        completionPercentage: 100,
      },
      performance: createPerformanceMetrics(
        finalStats.correct,
        testWords.length
      ),
      predictions: {
        predictedFinalAccuracy:
          testWords.length > 0
            ? (finalStats.correct / testWords.length) * 100
            : 0,
        confidence: 0.8,
        estimatedTimeToCompletion: 0,
        predictedFinalScore:
          testWords.length > 0
            ? Math.round((finalStats.correct / testWords.length) * 100)
            : 0,
      },
      milestones: [],
    },
    wordPool: {
      allWords: testWords,
      usedWords: testWords,
      incorrectWords: wrongWords,
      remainingWords: [],
      currentIndex: testWords.length,
      selectionStrategy: "random",
    },
    answerHistory: [],
    hintSystem: {
      globalState: {
        totalHintsUsed: finalStats.hints,
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
      config: createHintSystemConfig(),
      statistics: {
        usage: {
          sentence: finalStats.hints,
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
  });

  // Create complete TestSummary for export
  const createTestSummaryForExport = (
    testId: string,
    duration: number,
    finalStats: TestStats,
    testWords: Word[]
  ): TestSummaryType => ({
    testId,
    duration,
    totalQuestions: testWords.length,
    correctAnswers: finalStats.correct,
    accuracy:
      testWords.length > 0
        ? Math.round((finalStats.correct / testWords.length) * 100)
        : 0,
    hintsUsed: finalStats.hints,
    averageTime:
      testWords.length > 0 ? Math.round(duration / testWords.length) : 0,
    score:
      testWords.length > 0
        ? Math.round((finalStats.correct / testWords.length) * 100)
        : 0,
    category:
      testWords.length > 0
        ? finalStats.correct / testWords.length >= 0.9
          ? "excellent"
          : finalStats.correct / testWords.length >= 0.8
          ? "good"
          : finalStats.correct / testWords.length >= 0.7
          ? "average"
          : "poor"
        : "poor",
  });

  // Create complete TestAnalytics for export
  const createTestAnalyticsForExport = (): TestAnalytics => ({
    insights: [],
    performancePatterns: createPerformancePatterns(),
    recommendations: [],
  });

  // Start test
  const startTest = useCallback(
    (words: Word[], config?: Partial<TestConfig>) => {
      try {
        if (!words || words.length === 0) {
          throw new Error("No words available for test");
        }

        // Apply test configuration with complete types
        const testConfig: TestConfig = {
          mode: "normal",
          hints: createHintSystemConfig(),
          wordSelection: createWordSelectionConfig(config?.wordSelection),
          timing: createTimingConfig(config?.timing),
          ui: createUIConfig(config?.ui),
          scoring: createScoringConfig(config?.scoring),
        };

        // Filter words based on configuration
        let filteredWords = [...words];

        if (testConfig.wordSelection.unlearnedOnly) {
          filteredWords = filteredWords.filter((word) => !word.learned);
        }

        // Randomize order if specified
        if (testConfig.wordSelection.randomOrder) {
          filteredWords = [...filteredWords].sort(() => Math.random() - 0.5);
        }

        // Limit word count (default to all words if not specified)
        const selectedWords = filteredWords;

        // Initialize test state
        setTestWords(selectedWords);
        setTestMode(true);
        setShowResults(false);
        setStats({ correct: 0, incorrect: 0, hints: 0 });
        setWrongWords([]);
        setWordTimes([]);
        setUsedWordIds(new Set());
        setTestSaved(false);
        setShowMeaning(false);
        setShowHint(false);
        setHintUsedForCurrentWord(false);
        setIsTransitioning(false);
        setError(null);

        // Set timing
        testStartTimeRef.current = Date.now();
        wordStartTimeRef.current = Date.now();

        // Start with first word
        if (selectedWords.length > 0) {
          setCurrentWord(selectedWords[0]);
          setUsedWordIds(new Set([selectedWords[0].id]));
        }

        if (AppConfig.app.environment === "development") {
          console.log(`🧪 Test started with ${selectedWords.length} words`);
        }
      } catch (err) {
        const error = err as Error;
        setError(error);
        console.error("Failed to start test:", error);
      }
    },
    []
  );

  // Record word timing
  const recordWordTime = useCallback(() => {
    if (!currentWord || !wordStartTimeRef.current) return;

    const endTime = Date.now();
    const timeSpent = endTime - wordStartTimeRef.current;

    const wordTiming: WordTiming = {
      wordId: currentWord.id,
      startTime: wordStartTimeRef.current,
      endTime,
      timeSpent,
      usedHint: hintUsedForCurrentWord,
    };

    setWordTimes((prev) => [...prev, wordTiming]);
    wordStartTimeRef.current = Date.now(); // Reset for next word
  }, [currentWord, hintUsedForCurrentWord]);

  // Get next word
  const nextWord = useCallback(() => {
    const availableWords = testWords.filter(
      (word) => !usedWordIds.has(word.id)
    );

    if (availableWords.length === 0) {
      setCurrentWord(null);
      return;
    }

    const nextWord =
      availableWords[Math.floor(Math.random() * availableWords.length)];
    setCurrentWord(nextWord);
    setUsedWordIds((prev) => new Set([...prev, nextWord.id]));
    setShowMeaning(false);
    setShowHint(false);
    setHintUsedForCurrentWord(false);
    setIsTransitioning(false);
    wordStartTimeRef.current = Date.now();
  }, [testWords, usedWordIds]);

  // Save test results
  const saveTestResultsWithStats = useCallback(
    (finalStats: TestStats) => {
      if (testSaved) return;

      recordWordTime(); // Record final word time

      const totalTime = testStartTimeRef.current
        ? Date.now() - testStartTimeRef.current
        : 0;

      // Create TestResult with ONLY the 4 required properties + missing ones
      const testResult: TestResult = {
        userId: "current-user",
        testId: `test_${Date.now()}`,
        config: {
          mode: "normal",
          hints: createHintSystemConfig(),
          wordSelection: createWordSelectionConfig(),
          timing: createTimingConfig(),
          ui: createUIConfig(),
          scoring: createScoringConfig(),
        },
        finalScore: {
          total:
            testWords.length > 0
              ? Math.round((finalStats.correct / testWords.length) * 100)
              : 0,
          category:
            testWords.length > 0
              ? finalStats.correct / testWords.length >= 0.9
                ? "excellent"
                : finalStats.correct / testWords.length >= 0.8
                ? "good"
                : finalStats.correct / testWords.length >= 0.7
                ? "average"
                : "poor"
              : "poor",
          breakdown: {
            accuracy:
              testWords.length > 0
                ? (finalStats.correct / testWords.length) * 100
                : 0,
            speed: 50, // Valore di default
            efficiency:
              testWords.length > 0
                ? (finalStats.correct / testWords.length) * 100
                : 0,
            consistency: 50, // Valore di default
            bonus: 0,
            penalties: finalStats.hints * 2, // Penalità per hints usati
          },
        },
        feedback: {
          tone:
            finalStats.correct / testWords.length >= 0.8
              ? "celebratory"
              : "encouraging",
          color:
            finalStats.correct / testWords.length >= 0.8
              ? "#22c55e"
              : "#3b82f6",
          wordsToReview: wrongWords.map((w) => w.english),
          message: "Great job!",
          icon: "check",
          nextGoals: ["Keep practicing"],
        },
        completedSession: createTestSession(
          totalTime,
          wordTimes,
          finalStats,
          testWords,
          wrongWords
        ),
        analytics: {
          insights: [],
          performancePatterns: createPerformancePatterns(),
          recommendations: [],
        },
        exportData: {
          summary: createTestSummaryForExport(
            `test_${Date.now()}`,
            totalTime,
            finalStats,
            testWords
          ),
          detailedAnswers: [] as TestAnswer[],
          analytics: createTestAnalyticsForExport(),
          exportedAt: new Date(),
          format: "json",
        },
      };

      // Call the callback if provided
      if (onTestComplete) {
        onTestComplete(finalStats, testWords, wrongWords);
      }

      setTestSaved(true);

      if (AppConfig.app.environment === "development") {
        console.log("🧪 Test completed:", testResult);
      }
    },
    [
      testSaved,
      testWords,
      wrongWords,
      onTestComplete,
      recordWordTime,
      wordTimes,
    ]
  );

  // Toggle hint
  const toggleHint = useCallback(() => {
    setShowHint((prev) => {
      const newShowHint = !prev;
      if (newShowHint && !hintUsedForCurrentWord) {
        setHintUsedForCurrentWord(true);
      }
      return newShowHint;
    });
  }, [hintUsedForCurrentWord]);

  // Handle answer
  const handleAnswer = useCallback(
    (isCorrect: boolean) => {
      if (!currentWord) return;

      recordWordTime();

      // Update stats
      const newStats: TestStats = {
        correct: stats.correct + (isCorrect ? 1 : 0),
        incorrect: stats.incorrect + (isCorrect ? 0 : 1),
        hints: stats.hints + (hintUsedForCurrentWord ? 1 : 0),
      };

      setStats(newStats);

      // Track wrong words
      if (!isCorrect && currentWord) {
        const wrongWord = {
          ...currentWord,
          usedHint: hintUsedForCurrentWord,
        };
        setWrongWords((prev) => [...prev, wrongWord]);
      }

      // Check if test is complete
      const totalAnswered = newStats.correct + newStats.incorrect;
      const isLastQuestion = totalAnswered >= testWords.length;

      if (isLastQuestion) {
        saveTestResultsWithStats(newStats);
        setTestMode(false);
        setShowResults(true);
        setCurrentWord(null);
      } else {
        // Show meaning briefly, then move to next word
        setIsTransitioning(true);
        setTimeout(
          () => {
            nextWord();
          },
          showMeaning ? 1000 : 600
        );
      }
    },
    [
      currentWord,
      stats,
      testWords.length,
      hintUsedForCurrentWord,
      showMeaning,
      recordWordTime,
      saveTestResultsWithStats,
      nextWord,
    ]
  );

  // Reset test
  const resetTest = useCallback(() => {
    // Save current test if not already saved
    if (!testSaved && (stats.correct > 0 || stats.incorrect > 0)) {
      saveTestResultsWithStats(stats);
    }

    // Reset all state
    setTestMode(false);
    setShowResults(false);
    setCurrentWord(null);
    setUsedWordIds(new Set());
    setWrongWords([]);
    setShowMeaning(false);
    setShowHint(false);
    setHintUsedForCurrentWord(false);
    setStats({ correct: 0, incorrect: 0, hints: 0 });
    setTestWords([]);
    setTestSaved(false);
    setWordTimes([]);
    setIsTransitioning(false);
    setError(null);

    // Reset timing refs
    testStartTimeRef.current = null;
    wordStartTimeRef.current = null;

    if (AppConfig.app.environment === "development") {
      console.log("🧪 Test reset");
    }
  }, [stats, testSaved, saveTestResultsWithStats]);

  // Start new test with same words
  const startNewTest = useCallback(() => {
    setShowResults(false);
    setWrongWords([]);
    setTestSaved(false);
    setStats({ correct: 0, incorrect: 0, hints: 0 });
    setUsedWordIds(new Set());
    setCurrentWord(null);
    setWordTimes([]);
    setIsTransitioning(false);
    setError(null);

    // Restart with same test words
    startTest(testWords);
  }, [testWords, startTest]);

  // Get test progress
  const getTestProgress = useCallback((): TestProgress => {
    const totalAnswered = stats.correct + stats.incorrect;
    const total = testWords.length;

    return {
      current: totalAnswered,
      total,
      percentage: total > 0 ? Math.round((totalAnswered / total) * 100) : 0,
      remaining: total - totalAnswered,
    };
  }, [stats.correct, stats.incorrect, testWords.length]);

  // Get test summary
  const getTestSummary = useCallback((): TestSummary => {
    const totalQuestions = testWords.length;
    const totalAnswered = stats.correct + stats.incorrect;
    const accuracy =
      totalAnswered > 0 ? (stats.correct / totalAnswered) * 100 : 0;
    const score =
      totalQuestions > 0
        ? Math.round((stats.correct / totalQuestions) * 100)
        : 0;

    const totalTime = testStartTimeRef.current
      ? Date.now() - testStartTimeRef.current
      : wordTimes.reduce((sum, timing) => sum + timing.timeSpent, 0);

    const averageTimePerWord =
      totalAnswered > 0 ? totalTime / totalAnswered : 0;

    return {
      totalQuestions,
      correctAnswers: stats.correct,
      incorrectAnswers: stats.incorrect,
      hintsUsed: stats.hints,
      accuracy: Math.round(accuracy),
      score,
      timeSpent: totalTime,
      averageTimePerWord: Math.round(averageTimePerWord),
      wrongWords,
    };
  }, [testWords.length, stats, wrongWords, wordTimes]);

  // Computed values for performance optimization
  const progressData = useMemo(() => getTestProgress(), [getTestProgress]);
  const summaryData = useMemo(() => getTestSummary(), [getTestSummary]);

  return {
    // State
    testMode,
    showResults,
    currentWord,
    testWords,
    usedWordIds,
    stats,
    wrongWords,
    wordTimes,
    showMeaning,
    showHint,
    hintUsedForCurrentWord,
    isTransitioning,
    testSaved,
    isInitialized,
    error,

    // Operations
    startTest,
    handleAnswer,
    resetTest,
    startNewTest,
    toggleHint,
    setShowMeaning,

    // Getters
    getTestProgress: useCallback(() => progressData, [progressData]),
    getTestSummary: useCallback(() => summaryData, [summaryData]),

    // Alias for AppContext compatibility
    hintUsed: hintUsedForCurrentWord,
  };
};

export default useTest;
