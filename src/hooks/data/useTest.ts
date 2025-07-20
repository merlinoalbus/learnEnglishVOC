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
  gameHintsUsed?: string[]; // Per tracciare gli aiuti della modalità gioco
}

// Enhanced tracking per modalità gioco
interface DetailedGameHint {
  type: 'synonym' | 'antonym' | 'context';
  content: string;
  requestedAt: Date;
  timeFromWordStart: number; // millisecondi dall'inizio della parola
  sequenceOrder: number; // ordine nell'uso degli hint (1, 2, 3...)
}

interface DetailedWordSession {
  wordId: string;
  english: string;
  italian: string;
  chapter?: string;
  
  // Timing dettagliato
  wordShownAt: Date;
  cardFlippedAt?: Date; // quando l'utente ha girato la card o timeout
  answerDeclaredAt?: Date; // quando ha risposto
  thinkingTime?: number; // tempo prima di girare card
  evaluationTime?: number; // tempo dopo aver visto traduzione
  totalTime: number;
  
  // Hint dettagliato
  hintsUsed: DetailedGameHint[];
  totalHintsCount: number;
  
  // Risultato
  result: 'correct' | 'incorrect' | 'timeout';
  isCorrect: boolean;
  
  // Context
  testPosition: number; // posizione nel test (1-based)
  timeExpired: boolean; // se è scaduto il timer
  
  // Confidence (per future implementazioni)
  userConfidence?: 1 | 2 | 3 | 4 | 5;
}

interface DetailedTestSession {
  sessionId: string;
  userId?: string;
  startedAt: Date;
  completedAt?: Date;
  
  // Configurazione test
  config: TestConfig;
  
  // Words e risultati dettagliati
  words: DetailedWordSession[];
  wrongWords: DetailedWordSession[]; // Parole sbagliate con tutti i dettagli
  
  // Statistiche aggregate
  totalWords: number;
  correctAnswers: number;
  incorrectAnswers: number;
  timeoutAnswers: number;
  totalHintsUsed: number;
  totalTimeSpent: number;
  averageTimePerWord: number;
  accuracy: number;
  
  // Analisi per livelli
  chapterBreakdown: Record<string, {
    correct: number;
    incorrect: number;
    totalTime: number;
    hintsUsed: number;
  }>;
  
  // Analisi session
  performanceTrend: number[]; // accuracy per posizione
  speedTrend: number[]; // velocità per posizione
  hintUsagePattern: number[]; // hint per posizione
  
  // Metadata
  deviceInfo?: string;
  sessionMetadata?: Record<string, any>;
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
  
  // Enhanced properties for TestResults compatibility
  correct?: number;
  incorrect?: number;
  hints?: number;
  totalTime?: number;
  avgTimePerWord?: number;
  maxTimePerWord?: number;
  minTimePerWord?: number;
  totalRecordedTime?: number;
  total?: number;
  answered?: number;
  percentage?: number;
}

interface GameModeHints {
  synonym?: string[];
  antonym?: string[];
  context?: string[];
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

  // Game mode hints system
  gameHints: GameModeHints;
  totalHintsUsed: number;
  hintsUsedThisWord: number;
  testConfig: any; // Configurazione test dalla TestSelector

  // Enhanced tracking per tutti i test
  currentWordSession: DetailedWordSession | null;
  detailedSession: DetailedTestSession | null;
  currentWordStartTime: Date | null;
  hintSequenceCounter: number;

  // Test metadata
  testSaved: boolean;
  isInitialized: boolean;
  error: Error | null;
}

interface TestOperations {
  startTest: (words: Word[], config?: any) => void;
  handleAnswer: (isCorrect: boolean, isTimeout?: boolean) => void;
  resetTest: () => void;
  startNewTest: () => void;
  toggleHint: () => void;
  setShowMeaning: (show: boolean) => void;
  handleGameHintRequest: (type: 'synonym' | 'antonym' | 'context') => void;
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
  wrongWords: Word[],
  detailedSession?: DetailedTestSession | null
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

  // Game mode hints system
  const [gameHints, setGameHints] = useState<GameModeHints>({});
  const [totalHintsUsed, setTotalHintsUsed] = useState<number>(0);
  const [hintsUsedThisWord, setHintsUsedThisWord] = useState<number>(0);
  const [testConfig, setTestConfig] = useState<any>(null);

  // Enhanced tracking per tutti i test
  const [currentWordSession, setCurrentWordSession] = useState<DetailedWordSession | null>(null);
  const [detailedSession, setDetailedSession] = useState<DetailedTestSession | null>(null);
  const [currentWordStartTime, setCurrentWordStartTime] = useState<Date | null>(null);
  const [hintSequenceCounter, setHintSequenceCounter] = useState<number>(0);
  
  // ⭐ CRITICAL FIX: Use ref to track hints in real-time, avoiding React state delays
  const currentWordHintsRef = useRef<any[]>([]);

  // Test metadata
  const [testSaved, setTestSaved] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Refs for timing
  const testStartTimeRef = useRef<number | null>(null);
  const wordStartTimeRef = useRef<number | null>(null);
  const detailedSessionRef = useRef<DetailedTestSession | null>(null);

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

  // Generate hint for game mode con estrazione casuale
  const generateGameHint = useCallback((type: 'synonym' | 'antonym' | 'context'): string | null => {
    if (!currentWord) return null;
    
    const usedHints = gameHints[type] || [];
    let availableHints: string[] = [];
    
    switch (type) {
      case 'synonym':
        availableHints = currentWord.synonyms || [];
        break;
      case 'antonym':
        availableHints = currentWord.antonyms || [];
        break;
      case 'context':
        availableHints = currentWord.sentences || [];
        break;
      default:
        return null;
    }
    
    // Filtra gli hint già usati
    const remainingHints = availableHints.filter(hint => !usedHints.includes(hint));
    
    if (remainingHints.length === 0) {
      return null; // Nessun hint disponibile
    }
    
    // Estrai casualmente un hint tra quelli rimanenti
    const randomIndex = Math.floor(Math.random() * remainingHints.length);
    return remainingHints[randomIndex];
  }, [currentWord, gameHints]);

  // Handle game hint request con supporto click multipli
  const handleGameHintRequest = useCallback((type: 'synonym' | 'antonym' | 'context') => {
    if (!currentWord || !testConfig) {
      if (AppConfig.app.environment === "development") {
        console.log('🚫 Mancano currentWord o testConfig:', { currentWord: !!currentWord, testConfig: !!testConfig });
      }
      return;
    }
    
    // Controlla i limiti di configurazione
    const { hintsMode, maxHintsPerWord, maxTotalHints, enableTotalHintsLimit } = testConfig;
    
    if (AppConfig.app.environment === "development") {
      console.log('🔍 INIZIO CONTROLLO LIMITI - Configurazione completa:', {
        hintsMode,
        maxHintsPerWord,
        maxTotalHints,
        enableTotalHintsLimit,
        configCompleto: testConfig
      });
    }
    
    if (hintsMode === 'disabled') {
      if (AppConfig.app.environment === "development") {
        console.log('🚫 Suggerimenti disabilitati');
      }
      return;
    }
    
    // Calcola hintsUsedThisWord correnti
    const currentHintsThisWord = Object.values(gameHints).reduce((total, hints) => total + (hints?.length || 0), 0);
    
    // Debug logging dettagliato
    if (AppConfig.app.environment === "development") {
      console.log(`🔍 Debug limiti - Tipo richiesto: ${type}`);
      console.log(`🔍 Hint correnti questa parola: ${currentHintsThisWord}`);
      console.log(`🔍 Limit per parola: ${maxHintsPerWord}`);
      console.log(`🔍 Hint totali usati: ${totalHintsUsed}`);
      console.log(`🔍 Limite totale: ${maxTotalHints}`);
      console.log(`🔍 Modalità: ${hintsMode} (tipo: ${typeof hintsMode})`);
      console.log(`🔍 enableTotalHintsLimit: ${enableTotalHintsLimit}`);
      console.log(`🔍 Condizione limite parola: hintsMode === 'limited' && maxHintsPerWord && currentHintsThisWord >= maxHintsPerWord`);
      console.log(`🔍 Valori: ${hintsMode === 'limited'} && ${!!maxHintsPerWord} && ${currentHintsThisWord >= maxHintsPerWord}`);
      console.log(`🔍 Condizione limite totale: hintsMode === 'limited' && enableTotalHintsLimit && maxTotalHints && totalHintsUsed >= maxTotalHints`);
      console.log(`🔍 Valori: ${hintsMode === 'limited'} && ${enableTotalHintsLimit} && ${!!maxTotalHints} && ${totalHintsUsed >= maxTotalHints}`);
    }
    
    // Controlla limite per parola PRIMA di aggiungere il nuovo hint
    if (hintsMode === 'limited' && maxHintsPerWord && currentHintsThisWord >= maxHintsPerWord) {
      if (AppConfig.app.environment === "development") {
        console.log(`🚫 LIMITE PER PAROLA RAGGIUNTO: ${currentHintsThisWord}/${maxHintsPerWord} - BLOCCO RICHIESTA`);
      }
      return;
    }
    
    // Controlla limite totale PRIMA di aggiungere il nuovo hint
    if (hintsMode === 'limited' && enableTotalHintsLimit && maxTotalHints && totalHintsUsed >= maxTotalHints) {
      if (AppConfig.app.environment === "development") {
        console.log(`🚫 LIMITE TOTALE RAGGIUNTO: ${totalHintsUsed}/${maxTotalHints} - BLOCCO RICHIESTA`);
      }
      return;
    }
    
    // Genera un nuovo aiuto casuale
    const newHint = generateGameHint(type);
    if (!newHint) {
      if (AppConfig.app.environment === "development") {
        console.log(`🚫 Nessun suggerimento disponibile per ${type}`);
      }
      return;
    }
    
    if (AppConfig.app.environment === "development") {
      console.log(`✅ LIMITI OK - Procedo con l'aggiunta del hint: ${newHint}`);
    }
    
    // Create detailed hint tracking
    const now = new Date();
    const timeFromStart = currentWordStartTime ? now.getTime() - currentWordStartTime.getTime() : 0;
    const sequenceOrder = hintSequenceCounter + 1;
    
    const detailedHint: DetailedGameHint = {
      type,
      content: newHint,
      requestedAt: now,
      timeFromWordStart: timeFromStart,
      sequenceOrder
    };
    
    // Update current word session with hint details
    // ⭐ CRITICAL FIX: Update ref immediately (synchronous)
    currentWordHintsRef.current = [...currentWordHintsRef.current, detailedHint];
    
    if (currentWordSession) {
      setCurrentWordSession(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          hintsUsed: [...prev.hintsUsed, detailedHint],
          totalHintsCount: prev.totalHintsCount + 1
        };
      });
    }
    
    // Aggiungi il nuovo hint alla lista per questo tipo (UI)
    setGameHints(prev => ({
      ...prev,
      [type]: [...(prev[type] || []), newHint]
    }));
    setTotalHintsUsed(prev => prev + 1);
    setHintsUsedThisWord(prev => prev + 1);
    setHintSequenceCounter(prev => prev + 1);
    
    if (AppConfig.app.environment === "development") {
      console.log(`💡 Aiuto ${type} fornito: ${newHint}`);
      console.log(`💡 Nuovi contatori - Parola: ${currentHintsThisWord + 1}, Totale: ${totalHintsUsed + 1}`);
      console.log(`📊 Detailed hint tracked: ${JSON.stringify(detailedHint)}`);
    }
  }, [currentWord, testConfig, gameHints, totalHintsUsed, generateGameHint, currentWordStartTime, currentWordSession, hintSequenceCounter]);

  // Reset hints when word changes
  const resetWordHints = useCallback(() => {
    setGameHints({});
    setHintsUsedThisWord(0);
  }, []);

  // Start test
  const startTest = useCallback(
    (words: Word[], config?: any) => {
      try {
        if (!words || words.length === 0) {
          throw new Error("No words available for test");
        }

        // Salva la configurazione del test per uso nelle funzioni hint
        setTestConfig(config || {});

        // Apply test configuration with complete types
        const testConfigInternal: TestConfig = {
          mode: "normal",
          hints: createHintSystemConfig(),
          wordSelection: createWordSelectionConfig(config?.wordSelection),
          timing: createTimingConfig(config?.timing),
          ui: createUIConfig(config?.ui),
          scoring: createScoringConfig(config?.scoring),
        };

        // Filter words based on configuration
        let filteredWords = [...words];

        if (testConfigInternal.wordSelection.unlearnedOnly) {
          filteredWords = filteredWords.filter((word) => !word.learned);
        }

        // NON randomizziamo l'ordine qui - lo facciamo durante l'estrazione
        // per garantire che ogni parola sia estratta una volta sola
        const selectedWords = filteredWords;

        // Initialize test state
        setTestWords(selectedWords);
        setTestMode(true);
        setShowResults(false);
        setStats({ 
          correct: 0, 
          incorrect: 0, 
          hints: 0
        });
        setWrongWords([]);
        setWordTimes([]);
        setUsedWordIds(new Set());
        setTestSaved(false);
        setShowMeaning(false);
        setShowHint(false);
        setHintUsedForCurrentWord(false);
        setIsTransitioning(false);
        setError(null);

        // Initialize enhanced test session tracking
        const sessionId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newDetailedSession: DetailedTestSession = {
          sessionId,
          startedAt: new Date(),
          config: config || {},
          words: [],
          wrongWords: [],
          totalWords: selectedWords.length,
          correctAnswers: 0,
          incorrectAnswers: 0,
          timeoutAnswers: 0,
          totalHintsUsed: 0,
          totalTimeSpent: 0,
          averageTimePerWord: 0,
          accuracy: 0,
          chapterBreakdown: {},
          performanceTrend: [],
          speedTrend: [],
          hintUsagePattern: [],
        };
        setDetailedSession(newDetailedSession);
        detailedSessionRef.current = newDetailedSession; // Sync ref with state
        setCurrentWordSession(null);
        setCurrentWordStartTime(null);
        setHintSequenceCounter(0);

        // Reset game mode hints
        setGameHints({});
        setTotalHintsUsed(0);
        setHintsUsedThisWord(0);

        // Set timing
        testStartTimeRef.current = Date.now();
        wordStartTimeRef.current = Date.now();

        // Estrai la prima parola casualmente
        if (selectedWords.length > 0) {
          const randomIndex = Math.floor(Math.random() * selectedWords.length);
          const firstWord = selectedWords[randomIndex];
          setCurrentWord(firstWord);
          setUsedWordIds(new Set([firstWord.id]));
          
          // Create currentWordSession for the first word (like in nextWord)
          const now = new Date();
          const firstWordSession: DetailedWordSession = {
            wordId: firstWord.id,
            english: firstWord.english,
            italian: firstWord.italian,
            chapter: firstWord.chapter || '',
            wordShownAt: now,
            totalTime: 0,
            hintsUsed: [],
            totalHintsCount: 0,
            result: 'timeout', // Will be updated when answered
            isCorrect: false,
            testPosition: 1,
            timeExpired: false,
          };
          
          setCurrentWordSession(firstWordSession);
          setCurrentWordStartTime(now);
          setHintSequenceCounter(0);
          currentWordHintsRef.current = []; // Reset ref for first word
          
          if (AppConfig.app.environment === "development") {
            console.log(`🎮 Prima parola estratta: ${firstWord.english} (${selectedWords.length - 1} rimanenti)`);
          }
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

  // Record word timing con supporto per aiuti modalità gioco
  const recordWordTime = useCallback((gameHintsUsed: string[] = [], isTimeout: boolean = false) => {
    if (!currentWord || !wordStartTimeRef.current) return;

    const endTime = Date.now();
    const rawTimeSpent = endTime - wordStartTimeRef.current;
    
    // ⭐ CRITICAL FIX: Clamp time to timer limit for timeout scenarios
    const timeSpent = isTimeout ? 
      Math.min(rawTimeSpent, (testConfig?.maxTimePerWord || 10) * 1000) : 
      rawTimeSpent;

    // Ottieni tutti gli aiuti usati dalla modalità gioco attuale
    const currentGameHintsUsed = Object.entries(gameHints).flatMap(([type, hints]) => 
      (hints || []).map((hint: string) => `${type}: ${hint}`)
    );

    const wordTiming: WordTiming = {
      wordId: currentWord.id,
      startTime: wordStartTimeRef.current,
      endTime,
      timeSpent,
      usedHint: hintUsedForCurrentWord || currentGameHintsUsed.length > 0,
      gameHintsUsed: currentGameHintsUsed,
    };

    setWordTimes((prev) => [...prev, wordTiming]);
    wordStartTimeRef.current = Date.now(); // Reset for next word
  }, [currentWord, hintUsedForCurrentWord, gameHints, testConfig]);

  // Get next word (estrazione casuale, una volta sola per parola)
  const nextWord = useCallback(() => {
    const availableWords = testWords.filter(
      (word) => !usedWordIds.has(word.id)
    );

    if (availableWords.length === 0) {
      setCurrentWord(null);
      return;
    }

    // Estrazione casuale dalla lista delle parole disponibili
    const randomIndex = Math.floor(Math.random() * availableWords.length);
    const selectedWord = availableWords[randomIndex];
    
    setCurrentWord(selectedWord);
    setUsedWordIds((prev) => new Set([...prev, selectedWord.id]));
    setShowMeaning(false);
    setShowHint(false);
    setHintUsedForCurrentWord(false);
    setIsTransitioning(false);
    wordStartTimeRef.current = Date.now();

    // Initialize detailed word session tracking
    const now = new Date();
    const currentPosition = usedWordIds.size + 1; // 1-based position
    
    const newWordSession: DetailedWordSession = {
      wordId: selectedWord.id,
      english: selectedWord.english,
      italian: selectedWord.italian,
      chapter: selectedWord.chapter,
      wordShownAt: now,
      totalTime: 0,
      hintsUsed: [],
      totalHintsCount: 0,
      result: 'timeout', // Will be updated when answered
      isCorrect: false,
      testPosition: currentPosition,
      timeExpired: false,
    };
    
    setCurrentWordSession(newWordSession);
    setCurrentWordStartTime(now);
    setHintSequenceCounter(0);
    currentWordHintsRef.current = []; // Reset ref for new word

    // Reset hints for the NEW word (not the completed one)
    if (AppConfig.app.environment === "development") {
      console.log("🔄 RESET HINTS in nextWord() for new word:", selectedWord.english);
    }
    console.log(`🧹 RESET HINTS chiamato da nextWord() per: ${selectedWord.english}`);
    console.trace("Stack trace del reset hints");
    setHintsUsedThisWord(0);
    setGameHints({});
    currentWordHintsRef.current = []; // Reset ref too

    if (AppConfig.app.environment === "development") {
      console.log(`🎮 Parola estratta: ${selectedWord.english} (${availableWords.length - 1} rimanenti)`);
    }
  }, [testWords, usedWordIds]);

  // Save test results
  const saveTestResultsWithStats = useCallback(
    (finalStats: TestStats, finalDetailedSession?: DetailedTestSession) => {
      if (testSaved) return;

      recordWordTime([], false); // Record final word time (not timeout for final save)

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
        onTestComplete(finalStats, testWords, wrongWords, finalDetailedSession || detailedSession);
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
      detailedSession,
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
    (isCorrect: boolean, isTimeout: boolean = false) => {
      if (!currentWord) return;

      recordWordTime([], isTimeout);

      // Complete current word session tracking
      const now = new Date();
      
      // Debug logging for timeout cases
      if (isTimeout) {
        console.log("🔍 TIMEOUT DEBUG:", {
          currentWord: currentWord?.english,
          currentWordSession: currentWordSession,
          currentWordStartTime: currentWordStartTime,
          showMeaning: showMeaning,
          isTimeout,
          isCorrect
        });
      }
      
      // Debug timeout scenario
      if (isTimeout && AppConfig.app.environment === "development") {
        console.log("🔍 TIMEOUT ANALYSIS:", {
          currentWordSession: currentWordSession?.english,
          hintsInSession: currentWordSession?.totalHintsCount,
          hintsInGameHints: Object.values(gameHints).reduce((total, hints) => total + (hints?.length || 0), 0),
          hintsUsedThisWord,
          currentWordIsNull: !currentWordSession
        });
      }

      // ⭐ CRITICAL FIX: Use ref data (synchronous, immediate) instead of state (async, delayed)
      const finalCurrentWordSession = currentWordSession; 
      const actualHintsUsed = currentWordHintsRef.current; // Use ref instead of state
      const actualHintsCount = actualHintsUsed.length;
      
      console.log("🎯 FINAL HINT CALCULATION (USING REF DATA):", {
        actualHintsUsed,
        actualHintsCount,
        fromState: {
          sessionHints: finalCurrentWordSession?.hintsUsed || [],
          sessionHintsCount: finalCurrentWordSession?.hintsUsed?.length || 0
        },
        fromCounters: {
          hintsUsedThisWord,
          gameHintsCount: Object.values(gameHints).reduce((total: number, hints: any) => total + (hints?.length || 0), 0)
        },
        isTimeout,
        currentWordEnglish: currentWord?.english
      });

      const completedWordSession: DetailedWordSession | null = finalCurrentWordSession ? {
        ...finalCurrentWordSession,
        cardFlippedAt: finalCurrentWordSession.cardFlippedAt || (showMeaning ? finalCurrentWordSession.cardFlippedAt : now), // Keep first flip time
        answerDeclaredAt: now,
        totalTime: currentWordStartTime ? (
          isTimeout ? 
            // For timeout: clamp to timer limit in milliseconds
            (testConfig?.maxTimePerWord || 10) * 1000 : 
            // For normal answers: actual time
            now.getTime() - currentWordStartTime.getTime()
        ) : 0,
        thinkingTime: showMeaning && finalCurrentWordSession.cardFlippedAt ? 
          finalCurrentWordSession.cardFlippedAt.getTime() - finalCurrentWordSession.wordShownAt.getTime() : 
          (currentWordStartTime ? (
            isTimeout ? 
              // For timeout: clamp to timer limit in milliseconds
              (testConfig?.maxTimePerWord || 10) * 1000 : 
              // For normal answers: actual time
              now.getTime() - currentWordStartTime.getTime()
          ) : 0),
        evaluationTime: showMeaning && finalCurrentWordSession.cardFlippedAt ? 
          now.getTime() - finalCurrentWordSession.cardFlippedAt.getTime() : 0,
        result: (isTimeout ? 'timeout' : (isCorrect ? 'correct' : 'incorrect')) as 'correct' | 'incorrect' | 'timeout',
        isCorrect,
        timeExpired: isTimeout,
        // ⭐ CRITICAL FIX: Use actual hints data from ref (synchronous)
        hintsUsed: actualHintsUsed,
        totalHintsCount: actualHintsCount
      } : (
        // Fallback: create session if currentWordSession is null (should not happen, but safety net)
        console.log("⚠️ FALLBACK: Creating completedWordSession because currentWordSession is null"),
        console.log("🔍 FALLBACK DEBUG:", {
          actualHintsUsed,
          actualHintsCount,
          currentWord: currentWord?.english,
          isTimeout
        }),
        currentWord ? {
          wordId: currentWord.id,
          english: currentWord.english,
          italian: currentWord.italian,
          chapter: currentWord.chapter,
          wordShownAt: currentWordStartTime || now,
          cardFlippedAt: showMeaning ? now : (isTimeout ? now : undefined), // Set cardFlippedAt for timeout too
          answerDeclaredAt: now,
          thinkingTime: currentWordStartTime ? (
            isTimeout ? 
              // For timeout: clamp to timer limit in milliseconds
              (testConfig?.maxTimePerWord || 10) * 1000 : 
              // For normal answers: actual time
              now.getTime() - currentWordStartTime.getTime()
          ) : (isTimeout ? (testConfig?.maxTimePerWord || 10) * 1000 : 0),
          evaluationTime: showMeaning ? 0 : 0, // Could be enhanced later
          totalTime: currentWordStartTime ? (
            isTimeout ? 
              // For timeout: clamp to timer limit in milliseconds
              (testConfig?.maxTimePerWord || 10) * 1000 : 
              // For normal answers: actual time
              now.getTime() - currentWordStartTime.getTime()
          ) : (isTimeout ? (testConfig?.maxTimePerWord || 10) * 1000 : 0),
          hintsUsed: actualHintsUsed, // Use actual hints data
          totalHintsCount: actualHintsCount, // Use actual count
          result: (isTimeout ? 'timeout' : (isCorrect ? 'correct' : 'incorrect')) as 'correct' | 'incorrect' | 'timeout',
          isCorrect,
          testPosition: usedWordIds.size + 1, // Fix position calculation
          timeExpired: isTimeout,
        } : null
      );

      // Use the actual hints count from the real data
      const gameHintsCount = actualHintsCount;
      
      // Update detailed session with completed word
      if (detailedSessionRef.current && completedWordSession) {
        // Update ref directly to avoid state sync issues
        const currentSession = detailedSessionRef.current;
        
        const updatedWords = [...currentSession.words, completedWordSession];
        const updatedWrongWords = isCorrect ? currentSession.wrongWords : [...currentSession.wrongWords, completedWordSession];
        const newCorrect = currentSession.correctAnswers + (isCorrect ? 1 : 0);
        const newIncorrect = currentSession.incorrectAnswers + (isCorrect ? 0 : 1);
        const newTimeouts = currentSession.timeoutAnswers + (isTimeout ? 1 : 0);
        const newTotalTime = currentSession.totalTimeSpent + completedWordSession.totalTime;
        
        // Update chapter breakdown
        const chapter = completedWordSession.chapter || 'no-chapter';
        const currentChapterStats = currentSession.chapterBreakdown[chapter] || {
          correct: 0,
          incorrect: 0,
          totalTime: 0,
          hintsUsed: 0,
        };
        
        const updatedChapterBreakdown = {
          ...currentSession.chapterBreakdown,
          [chapter]: {
            correct: currentChapterStats.correct + (isCorrect ? 1 : 0),
            incorrect: currentChapterStats.incorrect + (isCorrect ? 0 : 1),
            totalTime: currentChapterStats.totalTime + completedWordSession.totalTime,
            hintsUsed: currentChapterStats.hintsUsed + completedWordSession.totalHintsCount,
          }
        };
        
        const updatedSession = {
          ...currentSession,
          words: updatedWords,
          wrongWords: updatedWrongWords,
          correctAnswers: newCorrect,
          incorrectAnswers: newIncorrect,
          timeoutAnswers: newTimeouts,
          totalHintsUsed: currentSession.totalHintsUsed + completedWordSession.totalHintsCount,
          totalTimeSpent: newTotalTime,
          averageTimePerWord: updatedWords.length > 0 ? newTotalTime / updatedWords.length : 0,
          accuracy: updatedWords.length > 0 ? (newCorrect / updatedWords.length) * 100 : 0,
          chapterBreakdown: updatedChapterBreakdown,
          performanceTrend: [...currentSession.performanceTrend, isCorrect ? 1 : 0],
          speedTrend: [...currentSession.speedTrend, completedWordSession.totalTime],
          hintUsagePattern: [...currentSession.hintUsagePattern, completedWordSession.totalHintsCount],
        };
        
        // Update both ref and state
        detailedSessionRef.current = updatedSession;
        setDetailedSession(updatedSession);
      }

      // Update stats (use pre-calculated gameHintsCount)
      const newStats: TestStats = {
        correct: stats.correct + (isCorrect ? 1 : 0),
        incorrect: stats.incorrect + (isCorrect ? 0 : 1),
        hints: stats.hints + (hintUsedForCurrentWord ? 1 : 0) + gameHintsCount,
      };

      setStats(newStats);

      // Track wrong words
      if (!isCorrect && currentWord) {
        const wrongWord = {
          ...currentWord,
          usedHint: hintUsedForCurrentWord || Object.values(gameHints).some(hints => hints && hints.length > 0),
        };
        setWrongWords((prev) => [...prev, wrongWord]);
      }

      // Check if test is complete
      const totalAnswered = newStats.correct + newStats.incorrect;
      const isLastQuestion = totalAnswered >= testWords.length;

      if (isLastQuestion) {
        // Complete detailed session using ref data
        if (detailedSessionRef.current) {
          // Use the ref data which should have all the words
          const finalDetailedSession = {
            ...detailedSessionRef.current,
            completedAt: new Date(),
          };
          
          // Log detailed test session for statistics
          if (AppConfig.app.environment === "development") {
            console.log("🎯 Test Session Completed:", finalDetailedSession);
          }
          
          // Update state with final session
          setDetailedSession(finalDetailedSession);
          
          // Save with the complete session from ref
          saveTestResultsWithStats(newStats, finalDetailedSession);
        } else {
          saveTestResultsWithStats(newStats);
        }
        
        setTestMode(false);
        setShowResults(true);
        setCurrentWord(null);
      } else if (!isTimeout) {
        // Show meaning briefly, ensure card is face-down, then move to next word
        setIsTransitioning(true);
        
        if (showMeaning) {
          // If meaning is showing, wait a bit then flip to face-down
          setTimeout(() => {
            setShowMeaning(false); // Flip to face-down
            setTimeout(() => {
              nextWord();
            }, 400); // Wait for flip animation
          }, 800); // Show meaning for a bit
        } else {
          // If already face-down, move immediately
          setTimeout(() => {
            nextWord();
          }, 300);
        }
      } else {
        // For timeout: ensure card is face-down before moving to next word
        if (AppConfig.app.environment === "development") {
          console.log("⏱️ TIMEOUT: Ensuring card is face-down before next word");
        }
        setIsTransitioning(true);
        setShowMeaning(false); // Ensure card is face-down
        setTimeout(() => {
          nextWord();
        }, 300); // Short delay for animation
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
      gameHints,
      currentWordSession,
      detailedSession,
      currentWordStartTime,
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
    setStats({ 
      correct: 0, 
      incorrect: 0, 
      hints: 0
    });
    setTestWords([]);
    setTestSaved(false);
    setWordTimes([]);
    setIsTransitioning(false);
    setError(null);

    // Reset game mode hints
    setGameHints({});
    setTotalHintsUsed(0);
    setHintsUsedThisWord(0);
    setTestConfig(null);

    // Reset timing refs
    testStartTimeRef.current = null;
    wordStartTimeRef.current = null;

    // Reset enhanced tracking
    setDetailedSession(null);
    detailedSessionRef.current = null;
    setCurrentWordSession(null);
    setCurrentWordStartTime(null);
    setHintSequenceCounter(0);

    if (AppConfig.app.environment === "development") {
      console.log("🧪 Test reset");
    }
  }, [stats, testSaved, saveTestResultsWithStats]);

  // Start new test with same words
  const startNewTest = useCallback(() => {
    setShowResults(false);
    setWrongWords([]);
    setTestSaved(false);
    setStats({ 
      correct: 0, 
      incorrect: 0, 
      hints: 0
    });
    setUsedWordIds(new Set());
    setCurrentWord(null);
    setWordTimes([]);
    setIsTransitioning(false);
    setError(null);

    // Reset game mode hints
    setGameHints({});
    setTotalHintsUsed(0);
    setHintsUsedThisWord(0);

    // Restart with same test words and config
    startTest(testWords, testConfig);
  }, [testWords, testConfig, startTest]);

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
    // Use DetailedTestSession data if available, otherwise fallback to legacy stats
    if (detailedSessionRef.current && detailedSessionRef.current.words.length > 0) {
      const session = detailedSessionRef.current;
      const totalQuestions = session.totalWords;
      const totalAnswered = session.correctAnswers + session.incorrectAnswers; // timeoutAnswers già inclusi in incorrectAnswers
      const accuracy = session.accuracy;
      const score = totalQuestions > 0 ? Math.round((session.correctAnswers / totalQuestions) * 100) : 0;

      return {
        totalQuestions,
        correctAnswers: session.correctAnswers,
        incorrectAnswers: session.incorrectAnswers, // timeoutAnswers già inclusi
        hintsUsed: session.totalHintsUsed,
        accuracy: Math.round(accuracy),
        score,
        timeSpent: session.totalTimeSpent,
        averageTimePerWord: Math.round(session.averageTimePerWord),
        wrongWords: session.wrongWords.map(wordSession => ({
          id: wordSession.wordId,
          english: wordSession.english,
          italian: wordSession.italian,
          chapter: wordSession.chapter,
          usedHint: wordSession.totalHintsCount > 0,
          // Default Word properties
          learned: false,
          difficult: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          // Optional properties
          notes: undefined,
          group: undefined,
          pronunciation: undefined,
          sentences: []
        })),
        // Enhanced properties from DetailedTestSession
        correct: session.correctAnswers,
        incorrect: session.incorrectAnswers, // timeoutAnswers già inclusi
        hints: session.totalHintsUsed,
        totalTime: Math.round(session.totalTimeSpent / 1000), // Convert to seconds
        avgTimePerWord: Math.round(session.averageTimePerWord / 1000), // Convert to seconds
        maxTimePerWord: session.speedTrend.length > 0 ? Math.round(Math.max(...session.speedTrend) / 1000) : 0,
        minTimePerWord: session.speedTrend.length > 0 ? Math.round(Math.min(...session.speedTrend) / 1000) : 0,
        totalRecordedTime: Math.round(session.totalTimeSpent / 1000), // Convert to seconds
        total: session.totalWords,
        answered: totalAnswered,
        percentage: Math.round(accuracy)
      };
    }

    // Fallback to legacy stats calculation
    const totalQuestions = testWords.length;
    const totalAnswered = stats.correct + stats.incorrect;
    const accuracy = totalAnswered > 0 ? (stats.correct / totalAnswered) * 100 : 0;
    const score = totalQuestions > 0 ? Math.round((stats.correct / totalQuestions) * 100) : 0;

    const totalTime = testStartTimeRef.current
      ? Date.now() - testStartTimeRef.current
      : wordTimes.reduce((sum, timing) => sum + timing.timeSpent, 0);

    const averageTimePerWord = totalAnswered > 0 ? totalTime / totalAnswered : 0;

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
      // Enhanced properties (legacy fallback)
      correct: stats.correct,
      incorrect: stats.incorrect,
      hints: stats.hints,
      totalTime: Math.round(totalTime / 1000),
      avgTimePerWord: Math.round(averageTimePerWord / 1000),
      maxTimePerWord: 0,
      minTimePerWord: 0,
      totalRecordedTime: Math.round(totalTime / 1000),
      total: totalQuestions,
      answered: totalAnswered,
      percentage: Math.round(accuracy)
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

    // Game mode hints state
    gameHints,
    totalHintsUsed,
    hintsUsedThisWord,
    testConfig,

    // Enhanced tracking per tutti i test
    currentWordSession,
    detailedSession,
    currentWordStartTime,
    hintSequenceCounter,

    // Operations
    startTest,
    handleAnswer,
    resetTest,
    startNewTest,
    toggleHint,
    setShowMeaning: useCallback((show: boolean) => {
      // ⭐ CRITICAL FIX: Record card flip timestamp ONLY on first flip
      if (show && !showMeaning && currentWordSession) {
        setCurrentWordSession(prev => {
          if (!prev || prev.cardFlippedAt) return prev; // Don't override if already set
          return {
            ...prev,
            cardFlippedAt: new Date()
          };
        });
      }
      setShowMeaning(show);
    }, [showMeaning, currentWordSession]),
    handleGameHintRequest,

    // Getters
    getTestProgress: useCallback(() => progressData, [progressData]),
    getTestSummary: useCallback(() => {
      // Always get fresh data, don't use memoized version for critical results
      return getTestSummary();
    }, [getTestSummary]),

    // Alias for AppContext compatibility
    hintUsed: hintUsedForCurrentWord,
  };
};

export default useTest;
