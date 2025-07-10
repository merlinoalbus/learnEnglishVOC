// =====================================================
// 📁 src/hooks/useOptimizedStats.ts - HOOK CON CALCOLI STATISTICI CORRETTI
// =====================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ComputedChapterStats,
    ComputedGlobalStats,
    ComputedWordAnalysis,
    DATA_VERSION,
    DEFAULT_STATS_CONFIG,
    DetailedWordResponse,
    OptimizedStatsReturn,
    OptimizedTestResult,
    OptimizedWord,
    StatsCalculationConfig,
    STORAGE_KEYS,
    TestDifficulty,
    TestType
} from '../types/optimized';

export const useOptimizedStats = (
  config: Partial<StatsCalculationConfig> = {}
): OptimizedStatsReturn => {
  const finalConfig = { ...DEFAULT_STATS_CONFIG, ...config };
  
  // ⭐ STATE MANAGEMENT
  const [allTests, setAllTests] = useState<OptimizedTestResult[]>([]);
  const [allWords, setAllWords] = useState<OptimizedWord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastCalculated, setLastCalculated] = useState<string | null>(null);

  // ⭐ SAFE STORAGE OPERATIONS
  const safeGetItem = useCallback(<T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) as T : defaultValue;
    } catch (error) {
      console.warn(`Error reading ${key}:`, error);
      return defaultValue;
    }
  }, []);

  const safeSetItem = useCallback(<T>(key: string, value: T): boolean => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
      setError(new Error('Errore nel salvataggio dei dati'));
      return false;
    }
  }, []);

  // ⭐ CORE CALCULATION: Global Stats
  const calculateGlobalStats = useCallback((tests: OptimizedTestResult[]): ComputedGlobalStats => {
    if (tests.length === 0) {
      return {
        totalTests: 0,
        totalWordsAnswered: 0,
        totalCorrectAnswers: 0,
        totalIncorrectAnswers: 0,
        totalHintsUsed: 0,
        totalTimeSpent: 0,
        globalAccuracy: 0,
        avgTestAccuracy: 0,
        avgTimePerWord: 0,
        avgTimePerTest: 0,
        avgHintsPerTest: 0,
        avgHintsPerWord: 0,
        hintsEfficiency: 0,
        currentStreak: 0,
        bestStreak: 0,
        lastStudyDate: null,
        studyFrequency: 0,
        improvementTrend: 0,
        difficultyDistribution: {
          easy: { count: 0, avgAccuracy: 0, avgTime: 0 },
          medium: { count: 0, avgAccuracy: 0, avgTime: 0 },
          hard: { count: 0, avgAccuracy: 0, avgTime: 0 }
        },
        testTypeStats: {} as any,
        lastCalculated: new Date().toISOString(),
        dataVersion: DATA_VERSION
      };
    }

    // ⭐ CALCOLI PRECISI DAI DATI REALI
    const totalTests = tests.length;
    let totalWordsAnswered = 0;
    let totalCorrectAnswers = 0;
    let totalIncorrectAnswers = 0;
    let totalHintsUsed = 0;
    let totalTimeSpent = 0;

    // ⭐ CRITICAL: Aggregazione dai dati dettagliati
    tests.forEach(test => {
      // Conta dalle risposte dettagliate (fonte di verità)
      const correctCount = test.rightWords?.length || 0;
      const incorrectCount = test.wrongWords?.length || 0;
      const testWordsTotal = correctCount + incorrectCount;
      
      totalWordsAnswered += testWordsTotal;
      totalCorrectAnswers += correctCount;
      totalIncorrectAnswers += incorrectCount;
      
      // Aiuti dai dati dettagliati
      const testHints = (test.rightWords || []).reduce((sum, w) => sum + (w.hintsUsed || 0), 0) +
                       (test.wrongWords || []).reduce((sum, w) => sum + (w.hintsUsed || 0), 0);
      totalHintsUsed += testHints;
      
      // Tempo dai dati dettagliati
      const testTime = (test.rightWords || []).reduce((sum, w) => sum + (w.timeResponse || 0), 0) +
                      (test.wrongWords || []).reduce((sum, w) => sum + (w.timeResponse || 0), 0);
      totalTimeSpent += testTime;
    });

    // ⭐ METRICHE CALCOLATE
    const globalAccuracy = totalWordsAnswered > 0 ? 
      Math.round((totalCorrectAnswers / totalWordsAnswered) * 100) : 0;
    
    const avgTestAccuracy = tests.length > 0 ? 
      Math.round(tests.reduce((sum, test) => sum + (test.percentage || 0), 0) / tests.length) : 0;
    
    const avgTimePerWord = totalWordsAnswered > 0 ? 
      Math.round(totalTimeSpent / totalWordsAnswered) : 0;
    
    const avgTimePerTest = tests.length > 0 ? 
      Math.round(totalTimeSpent / tests.length) : 0;
    
    const avgHintsPerTest = tests.length > 0 ? 
      Math.round((totalHintsUsed / tests.length) * 10) / 10 : 0;
    
    const avgHintsPerWord = totalWordsAnswered > 0 ? 
      Math.round((totalHintsUsed / totalWordsAnswered) * 100) / 100 : 0;
    
    const hintsEfficiency = totalWordsAnswered > 0 ? 
      Math.max(0, 100 - Math.round((totalHintsUsed / totalWordsAnswered) * 100)) : 100;

    // ⭐ STREAK CALCULATION
    const sortedTests = [...tests].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    const threshold = 75; // Soglia per considerare un test "buono"
    
    sortedTests.forEach(test => {
      if ((test.percentage || 0) >= threshold) {
        tempStreak++;
        bestStreak = Math.max(bestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    });
    
    // Current streak (dalla fine)
    for (let i = sortedTests.length - 1; i >= 0; i--) {
      if ((sortedTests[i].percentage || 0) >= threshold) {
        currentStreak++;
      } else {
        break;
      }
    }

    // ⭐ LAST STUDY DATE
    const lastStudyDate = tests.length > 0 ? 
      new Date(Math.max(...tests.map(t => new Date(t.timestamp).getTime())))
        .toISOString().split('T')[0] : null;

    // ⭐ STUDY FREQUENCY (tests per week)
    const studyFrequency = (() => {
      if (tests.length < 2) return 0;
      const firstTest = new Date(tests[0].timestamp);
      const lastTest = new Date(tests[tests.length - 1].timestamp);
      const daysDiff = (lastTest.getTime() - firstTest.getTime()) / (1000 * 60 * 60 * 24);
      const weeksDiff = daysDiff / 7;
      return weeksDiff > 0 ? Math.round((tests.length / weeksDiff) * 10) / 10 : 0;
    })();

    // ⭐ IMPROVEMENT TREND
    const improvementTrend = (() => {
      if (tests.length < 6) return 0;
      const recent = tests.slice(-5);
      const previous = tests.slice(-10, -5);
      const recentAvg = recent.reduce((sum, t) => sum + (t.percentage || 0), 0) / recent.length;
      const previousAvg = previous.length > 0 ? 
        previous.reduce((sum, t) => sum + (t.percentage || 0), 0) / previous.length : recentAvg;
      return Math.round((recentAvg - previousAvg) * 10) / 10;
    })();

    // ⭐ DIFFICULTY DISTRIBUTION
    const difficultyDistribution = {
      easy: { count: 0, avgAccuracy: 0, avgTime: 0 },
      medium: { count: 0, avgAccuracy: 0, avgTime: 0 },
      hard: { count: 0, avgAccuracy: 0, avgTime: 0 }
    };

    const difficultyGroups: Record<TestDifficulty, OptimizedTestResult[]> = {
      easy: [],
      medium: [],
      hard: []
    };

    tests.forEach(test => {
      const difficulty = test.difficulty || 'medium';
      difficultyGroups[difficulty].push(test);
    });

    Object.entries(difficultyGroups).forEach(([difficulty, testGroup]) => {
      if (testGroup.length > 0) {
        const avgAccuracy = Math.round(
          testGroup.reduce((sum, t) => sum + (t.percentage || 0), 0) / testGroup.length
        );
        const avgTime = Math.round(
          testGroup.reduce((sum, t) => sum + (t.avgTimePerWord || 0), 0) / testGroup.length
        );
        
        difficultyDistribution[difficulty as TestDifficulty] = {
          count: testGroup.length,
          avgAccuracy,
          avgTime
        };
      }
    });

    // ⭐ TEST TYPE STATS
    const testTypeStats: Record<TestType, any> = {} as any;
    const typeGroups: Record<string, OptimizedTestResult[]> = {};

    tests.forEach(test => {
      const type = test.testType || 'complete';
      if (!typeGroups[type]) typeGroups[type] = [];
      typeGroups[type].push(test);
    });

    Object.entries(typeGroups).forEach(([type, testGroup]) => {
      if (testGroup.length > 0) {
        const avgAccuracy = Math.round(
          testGroup.reduce((sum, t) => sum + (t.percentage || 0), 0) / testGroup.length
        );
        const avgTime = Math.round(
          testGroup.reduce((sum, t) => sum + (t.totalTime || 0), 0) / testGroup.length
        );
        const avgHints = Math.round(
          testGroup.reduce((sum, t) => sum + (t.hintsUsed || 0), 0) / testGroup.length * 10
        ) / 10;
        
        testTypeStats[type as TestType] = {
          count: testGroup.length,
          avgAccuracy,
          avgTime,
          avgHints
        };
      }
    });

    return {
      totalTests,
      totalWordsAnswered,
      totalCorrectAnswers,
      totalIncorrectAnswers,
      totalHintsUsed,
      totalTimeSpent,
      globalAccuracy,
      avgTestAccuracy,
      avgTimePerWord,
      avgTimePerTest,
      avgHintsPerTest,
      avgHintsPerWord,
      hintsEfficiency,
      currentStreak,
      bestStreak,
      lastStudyDate,
      studyFrequency,
      improvementTrend,
      difficultyDistribution,
      testTypeStats,
      lastCalculated: new Date().toISOString(),
      dataVersion: DATA_VERSION
    };
  }, [finalConfig]);

  // ⭐ CORE CALCULATION: Chapter Stats
  const calculateChapterStats = useCallback((
    tests: OptimizedTestResult[], 
    words: OptimizedWord[]
  ): ComputedChapterStats[] => {
    const chapterMap = new Map<string, ComputedChapterStats>();

    // ⭐ Initialize chapters from words
    words.forEach(word => {
      const chapter = word.chapter || 'Senza Capitolo';
      if (!chapterMap.has(chapter)) {
        chapterMap.set(chapter, {
          chapter,
          totalWordsInChapter: 0,
          testedWords: 0,
          uniqueWordsTested: 0,
          totalAttempts: 0,
          correctAttempts: 0,
          incorrectAttempts: 0,
          accuracy: 0,
          totalTimeSpent: 0,
          avgTimePerWord: 0,
          totalHintsUsed: 0,
          hintsPerWord: 0,
          hintsEfficiency: 0,
          firstTestDate: null,
          lastTestDate: null,
          improvementTrend: 0,
          wordsDistribution: {
            learned: 0,
            difficult: 0,
            mastered: 0,
            struggling: 0
          }
        });
      }
      
      const chapterStats = chapterMap.get(chapter)!;
      chapterStats.totalWordsInChapter++;
      
      // Update word distribution
      if (word.learned) chapterStats.wordsDistribution.learned++;
      if (word.difficult) chapterStats.wordsDistribution.difficult++;
    });

    // ⭐ Process test data
    const chapterWordAttempts = new Map<string, Set<string>>();
    
    tests.forEach(test => {
      const testDate = test.timestamp;
      
      // Process all word responses in this test
      const allResponses = [...(test.rightWords || []), ...(test.wrongWords || [])];
      
      allResponses.forEach(response => {
        const word = words.find(w => w.id === response.wordId);
        if (!word) return;
        
        const chapter = word.chapter || 'Senza Capitolo';
        const chapterStats = chapterMap.get(chapter);
        if (!chapterStats) return;

        // Track unique words tested
        if (!chapterWordAttempts.has(chapter)) {
          chapterWordAttempts.set(chapter, new Set());
        }
        chapterWordAttempts.get(chapter)!.add(response.wordId);

        // Update attempt counters
        chapterStats.totalAttempts++;
        if (response.isCorrect) {
          chapterStats.correctAttempts++;
        } else {
          chapterStats.incorrectAttempts++;
        }

        // Update time and hints
        chapterStats.totalTimeSpent += response.timeResponse || 0;
        chapterStats.totalHintsUsed += response.hintsUsed || 0;

        // Update date range
        if (!chapterStats.firstTestDate || testDate < chapterStats.firstTestDate) {
          chapterStats.firstTestDate = testDate;
        }
        if (!chapterStats.lastTestDate || testDate > chapterStats.lastTestDate) {
          chapterStats.lastTestDate = testDate;
        }
      });
    });

    // ⭐ Finalize calculations
    chapterMap.forEach((chapterStats, chapter) => {
      const uniqueWords = chapterWordAttempts.get(chapter)?.size || 0;
      chapterStats.uniqueWordsTested = uniqueWords;
      chapterStats.testedWords = chapterStats.totalAttempts; // Total attempts on chapter words

      // Calculate derived metrics
      if (chapterStats.totalAttempts > 0) {
        chapterStats.accuracy = Math.round(
          (chapterStats.correctAttempts / chapterStats.totalAttempts) * 100
        );
        
        chapterStats.avgTimePerWord = Math.round(
          chapterStats.totalTimeSpent / chapterStats.totalAttempts
        );
        
        chapterStats.hintsPerWord = Math.round(
          (chapterStats.totalHintsUsed / chapterStats.totalAttempts) * 100
        ) / 100;
        
        chapterStats.hintsEfficiency = Math.max(0, 100 - Math.round(
          (chapterStats.totalHintsUsed / chapterStats.totalAttempts) * 100
        ));
      }

      // Calculate improvement trend (if enough data)
      const chapterTests = tests.filter(test => {
        const hasChapterWords = [...(test.rightWords || []), ...(test.wrongWords || [])]
          .some(response => {
            const word = words.find(w => w.id === response.wordId);
            return word && (word.chapter || 'Senza Capitolo') === chapter;
          });
        return hasChapterWords;
      });

      if (chapterTests.length >= 6) {
        const recent = chapterTests.slice(-3);
        const previous = chapterTests.slice(-6, -3);
        
        const recentAvg = recent.reduce((sum, test) => {
          const chapterWords = [...(test.rightWords || []), ...(test.wrongWords || [])]
            .filter(response => {
              const word = words.find(w => w.id === response.wordId);
              return word && (word.chapter || 'Senza Capitolo') === chapter;
            });
          const chapterCorrect = chapterWords.filter(r => r.isCorrect).length;
          return sum + (chapterWords.length > 0 ? (chapterCorrect / chapterWords.length) * 100 : 0);
        }, 0) / recent.length;

        const previousAvg = previous.reduce((sum, test) => {
          const chapterWords = [...(test.rightWords || []), ...(test.wrongWords || [])]
            .filter(response => {
              const word = words.find(w => w.id === response.wordId);
              return word && (word.chapter || 'Senza Capitolo') === chapter;
            });
          const chapterCorrect = chapterWords.filter(r => r.isCorrect).length;
          return sum + (chapterWords.length > 0 ? (chapterCorrect / chapterWords.length) * 100 : 0);
        }, 0) / previous.length;

        chapterStats.improvementTrend = Math.round((recentAvg - previousAvg) * 10) / 10;
      }
    });

    return Array.from(chapterMap.values());
  }, []);

  // ⭐ CORE CALCULATION: Word Analysis
  const calculateWordAnalyses = useCallback((
    tests: OptimizedTestResult[], 
    words: OptimizedWord[]
  ): ComputedWordAnalysis[] => {
    return words.map(word => {
      // ⭐ Collect all attempts for this word from all tests
      const allAttempts: DetailedWordResponse[] = [];
      
      tests.forEach(test => {
        const wordAttempts = [...(test.rightWords || []), ...(test.wrongWords || [])]
          .filter(response => response.wordId === word.id);
        allAttempts.push(...wordAttempts);
      });

      // ⭐ Sort attempts chronologically
      allAttempts.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      if (allAttempts.length === 0) {
        // ⭐ No attempts - return default analysis
        return {
          wordId: word.id,
          english: word.english,
          italian: word.italian,
          chapter: word.chapter || null,
          group: word.group || null,
          totalAttempts: 0,
          correctAttempts: 0,
          incorrectAttempts: 0,
          accuracy: 0,
          recentAccuracy: 0,
          consistencyScore: 0,
          totalTimeSpent: 0,
          avgTimePerAttempt: 0,
          fastestTime: 0,
          slowestTime: 0,
          timeImprovement: 0,
          totalHintsUsed: 0,
          hintsPerAttempt: 0,
          hintsDecreasingTrend: 0,
          independence: 100,
          currentStreak: 0,
          bestStreak: 0,
          learningVelocity: 0,
          retentionScore: 0,
          firstAttempt: null,
          lastAttempt: null,
          daysSinceFirst: 0,
          daysSinceLast: 0,
          proficiencyLevel: 'beginner',
          needsWork: true,
          isWellMastered: false,
          recommendedAction: 'study_more',
          recentAttempts: []
        };
      }

      // ⭐ BASIC COUNTERS
      const totalAttempts = allAttempts.length;
      const correctAttempts = allAttempts.filter(a => a.isCorrect).length;
      const incorrectAttempts = totalAttempts - correctAttempts;
      const accuracy = Math.round((correctAttempts / totalAttempts) * 100);

      // ⭐ RECENT ACCURACY (last 5 attempts)
      const recentAttempts = allAttempts.slice(-finalConfig.recentWindow);
      const recentCorrect = recentAttempts.filter(a => a.isCorrect).length;
      const recentAccuracy = Math.round((recentCorrect / recentAttempts.length) * 100);

      // ⭐ CONSISTENCY SCORE (based on standard deviation)
      const recentAccuracies = allAttempts.slice(-finalConfig.consistencyWindow)
        .map(a => a.isCorrect ? 100 : 0) as number[];
      const mean = recentAccuracies.reduce((sum: number, val: number) => sum + val, 0) / recentAccuracies.length;
      const variance = recentAccuracies.reduce((sum: number, val: number) => sum + Math.pow(val - mean, 2), 0) / recentAccuracies.length;
      const consistencyScore = Math.max(0, 100 - Math.sqrt(variance));

      // ⭐ TIMING ANALYSIS
      const times = allAttempts.map(a => a.timeResponse || 0).filter(t => t > 0);
      const totalTimeSpent = times.reduce((sum, time) => sum + time, 0);
      const avgTimePerAttempt = times.length > 0 ? Math.round(totalTimeSpent / times.length) : 0;
      const fastestTime = times.length > 0 ? Math.min(...times) : 0;
      const slowestTime = times.length > 0 ? Math.max(...times) : 0;
      
      // Time improvement (compare first half vs second half)
      const timeImprovement = (() => {
        if (times.length < 4) return 0;
        const half = Math.floor(times.length / 2);
        const firstHalf = times.slice(0, half);
        const secondHalf = times.slice(-half);
        const firstAvg = firstHalf.reduce((sum, t) => sum + t, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, t) => sum + t, 0) / secondHalf.length;
        return Math.round(((firstAvg - secondAvg) / firstAvg) * 100);
      })();

      // ⭐ HINTS ANALYSIS
      const totalHintsUsed = allAttempts.reduce((sum, a) => sum + (a.hintsUsed || 0), 0);
      const hintsPerAttempt = Math.round((totalHintsUsed / totalAttempts) * 100) / 100;
      
      // Hints decreasing trend
      const hintsDecreasingTrend = (() => {
        if (allAttempts.length < 4) return 0;
        const half = Math.floor(allAttempts.length / 2);
        const firstHalf = allAttempts.slice(0, half);
        const secondHalf = allAttempts.slice(-half);
        const firstHints = firstHalf.reduce((sum, a) => sum + (a.hintsUsed || 0), 0) / firstHalf.length;
        const secondHints = secondHalf.reduce((sum, a) => sum + (a.hintsUsed || 0), 0) / secondHalf.length;
        return Math.round(((firstHints - secondHints) / Math.max(firstHints, 0.1)) * 100);
      })();

      const independence = Math.max(0, 100 - Math.round((totalHintsUsed / totalAttempts) * 100));

      // ⭐ STREAKS
      let currentStreak = 0;
      let bestStreak = 0;
      let tempStreak = 0;

      allAttempts.forEach(attempt => {
        if (attempt.isCorrect) {
          tempStreak++;
          bestStreak = Math.max(bestStreak, tempStreak);
        } else {
          tempStreak = 0;
        }
      });

      // Current streak from the end
      for (let i = allAttempts.length - 1; i >= 0; i--) {
        if (allAttempts[i].isCorrect) {
          currentStreak++;
        } else {
          break;
        }
      }

      // ⭐ LEARNING PATTERNS
      const learningVelocity = (() => {
        if (allAttempts.length < 6) return 0;
        const firstThird = allAttempts.slice(0, Math.floor(allAttempts.length / 3));
        const lastThird = allAttempts.slice(-Math.floor(allAttempts.length / 3));
        const firstAccuracy = firstThird.filter(a => a.isCorrect).length / firstThird.length * 100;
        const lastAccuracy = lastThird.filter(a => a.isCorrect).length / lastThird.length * 100;
        return Math.round((lastAccuracy - firstAccuracy) * 10) / 10;
      })();

      const retentionScore = (() => {
        if (allAttempts.length < 3) return 0;
        // Score based on maintaining accuracy over time
        const windows = [];
        for (let i = 2; i < allAttempts.length; i += 2) {
          const window = allAttempts.slice(Math.max(0, i - 2), i + 1);
          const windowAccuracy = window.filter(a => a.isCorrect).length / window.length;
          windows.push(windowAccuracy);
        }
        const avgRetention = windows.reduce((sum, acc) => sum + acc, 0) / windows.length;
        return Math.round(avgRetention * 100);
      })();

      // ⭐ TEMPORAL DATA
      const firstAttempt = allAttempts[0].timestamp;
      const lastAttempt = allAttempts[allAttempts.length - 1].timestamp;
      const daysSinceFirst = Math.floor(
        (Date.now() - new Date(firstAttempt).getTime()) / (1000 * 60 * 60 * 24)
      );
      const daysSinceLast = Math.floor(
        (Date.now() - new Date(lastAttempt).getTime()) / (1000 * 60 * 60 * 24)
      );

      // ⭐ CLASSIFICATION
      const proficiencyLevel = (() => {
        if (accuracy >= 90 && currentStreak >= 5) return 'expert';
        if (accuracy >= 80 && currentStreak >= 3) return 'advanced';
        if (accuracy >= 60) return 'intermediate';
        return 'beginner';
      })() as ComputedWordAnalysis['proficiencyLevel'];

      const needsWork = accuracy < 70 || hintsPerAttempt > 0.5 || daysSinceLast > 14;
      const isWellMastered = accuracy >= finalConfig.masteryThreshold && 
                           currentStreak >= 3 && 
                           independence >= 90;

      const recommendedAction = (() => {
        if (isWellMastered) return 'maintain';
        if (accuracy >= 80 && avgTimePerAttempt > 10000) return 'practice_speed';
        if (accuracy >= 70) return 'review_occasionally';
        return 'study_more';
      })() as ComputedWordAnalysis['recommendedAction'];

      return {
        wordId: word.id,
        english: word.english,
        italian: word.italian,
        chapter: word.chapter || null,
        group: word.group || null,
        totalAttempts,
        correctAttempts,
        incorrectAttempts,
        accuracy,
        recentAccuracy,
        consistencyScore: Math.round(consistencyScore),
        totalTimeSpent,
        avgTimePerAttempt,
        fastestTime,
        slowestTime,
        timeImprovement,
        totalHintsUsed,
        hintsPerAttempt,
        hintsDecreasingTrend,
        independence,
        currentStreak,
        bestStreak,
        learningVelocity,
        retentionScore,
        firstAttempt,
        lastAttempt,
        daysSinceFirst,
        daysSinceLast,
        proficiencyLevel,
        needsWork,
        isWellMastered,
        recommendedAction,
        recentAttempts: allAttempts.slice(-10)
      };
    });
  }, [finalConfig]);

  // ⭐ MEMOIZED COMPUTED VALUES
  const globalStats = useMemo(() => calculateGlobalStats(allTests), [allTests, calculateGlobalStats]);
  const chapterStats = useMemo(() => calculateChapterStats(allTests, allWords), [allTests, allWords, calculateChapterStats]);
  const wordAnalyses = useMemo(() => calculateWordAnalyses(allTests, allWords), [allTests, allWords, calculateWordAnalyses]);

  // ⭐ LOAD DATA ON MOUNT
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const tests = safeGetItem<OptimizedTestResult[]>(STORAGE_KEYS.optimizedTests, []);
        const words = safeGetItem<OptimizedWord[]>(STORAGE_KEYS.optimizedWords, []);
        const lastCalc = safeGetItem<string | null>(STORAGE_KEYS.lastCalculated, null);
        
        setAllTests(tests);
        setAllWords(words);
        setLastCalculated(lastCalc);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [safeGetItem]);

  // ⭐ ACTIONS
  const recalculateStats = useCallback(() => {
    const now = new Date().toISOString();
    setLastCalculated(now);
    safeSetItem(STORAGE_KEYS.lastCalculated, now);
  }, [safeSetItem]);

  const addTestResult = useCallback((testResult: OptimizedTestResult) => {
    const newTests = [...allTests, testResult];
    setAllTests(newTests);
    safeSetItem(STORAGE_KEYS.optimizedTests, newTests);
    recalculateStats();
  }, [allTests, safeSetItem, recalculateStats]);

  const removeTestResult = useCallback((testId: string) => {
    const newTests = allTests.filter(test => test.id !== testId);
    setAllTests(newTests);
    safeSetItem(STORAGE_KEYS.optimizedTests, newTests);
    recalculateStats();
  }, [allTests, safeSetItem, recalculateStats]);

  // ⭐ GETTERS
  const getWordAnalysis = useCallback((wordId: string): ComputedWordAnalysis | null => {
    return wordAnalyses.find(analysis => analysis.wordId === wordId) || null;
  }, [wordAnalyses]);

  const getChapterStats = useCallback((chapter: string): ComputedChapterStats | null => {
    return chapterStats.find(stats => stats.chapter === chapter) || null;
  }, [chapterStats]);

  // ⭐ FILTERED GETTERS
  const getStatsByDateRange = useCallback((startDate: string, endDate: string): ComputedGlobalStats => {
    const filteredTests = allTests.filter(test => {
      const testDate = test.timestamp.split('T')[0];
      return testDate >= startDate && testDate <= endDate;
    });
    return calculateGlobalStats(filteredTests);
  }, [allTests, calculateGlobalStats]);

  const getStatsByTestType = useCallback((testType: TestType): ComputedGlobalStats => {
    const filteredTests = allTests.filter(test => test.testType === testType);
    return calculateGlobalStats(filteredTests);
  }, [allTests, calculateGlobalStats]);

  const getStatsByDifficulty = useCallback((difficulty: TestDifficulty): ComputedGlobalStats => {
    const filteredTests = allTests.filter(test => test.difficulty === difficulty);
    return calculateGlobalStats(filteredTests);
  }, [allTests, calculateGlobalStats]);

  // ⭐ EXPORT/IMPORT
  const exportOptimizedData = useCallback((): string => {
    const exportData = {
      tests: allTests,
      words: allWords,
      globalStats,
      chapterStats,
      wordAnalyses,
      exportDate: new Date().toISOString(),
      dataVersion: DATA_VERSION,
      config: finalConfig
    };
    return JSON.stringify(exportData, null, 2);
  }, [allTests, allWords, globalStats, chapterStats, wordAnalyses, finalConfig]);

  const importOptimizedData = useCallback((jsonString: string) => {
    try {
      const importedData = JSON.parse(jsonString);
      
      if (importedData.tests) {
        setAllTests(importedData.tests);
        safeSetItem(STORAGE_KEYS.optimizedTests, importedData.tests);
      }
      
      if (importedData.words) {
        setAllWords(importedData.words);
        safeSetItem(STORAGE_KEYS.optimizedWords, importedData.words);
      }
      
      recalculateStats();
    } catch (err) {
      setError(new Error('Errore durante l\'importazione dei dati'));
    }
  }, [safeSetItem, recalculateStats]);

  return {
    // ⭐ COMPUTED DATA
    globalStats,
    chapterStats,
    wordAnalyses,
    
    // ⭐ RAW DATA
    allTests,
    allWords,
    
    // ⭐ STATE
    isLoading,
    error,
    lastCalculated,
    dataVersion: DATA_VERSION,
    
    // ⭐ ACTIONS
    recalculateStats,
    getWordAnalysis,
    getChapterStats,
    addTestResult,
    removeTestResult,
    
    // ⭐ FILTERED GETTERS
    getStatsByDateRange,
    getStatsByTestType,
    getStatsByDifficulty,
    
    // ⭐ EXPORT/IMPORT
    exportOptimizedData,
    importOptimizedData
  };
};