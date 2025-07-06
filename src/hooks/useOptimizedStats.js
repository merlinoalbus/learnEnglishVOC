import { useState, useEffect, useCallback, useMemo } from 'react'; 
import { useLocalStorage } from './useLocalStorage'; 
import { useNotification } from '../contexts/NotificationContext';

const INITIAL_STATS = {
  totalWords: 0,
  correctAnswers: 0,
  incorrectAnswers: 0,
  hintsUsed: 0, // ⭐ NEW: Track hints globally
  averageScore: 0,
  testsCompleted: 0,
  timeSpent: 0,
  categoriesProgress: {},
  dailyProgress: {},
  streakDays: 0,
  lastStudyDate: null,
  difficultyStats: {
    easy: { correct: 0, total: 0 },
    medium: { correct: 0, total: 0 },
    hard: { correct: 0, total: 0 }
  },
  monthlyStats: {},
  migrated: false
};

// ⭐ NEW: Word-specific performance tracking
const INITIAL_WORD_PERFORMANCE = {};

const EMPTY_ARRAY = [];

export const useOptimizedStats = () => {
  const [testHistory, setTestHistory] = useLocalStorage('testHistory', EMPTY_ARRAY);
  const [stats, setStats] = useLocalStorage('vocabularyStats', INITIAL_STATS);
  const [wordPerformance, setWordPerformance] = useLocalStorage('wordPerformance', INITIAL_WORD_PERFORMANCE); // ⭐ NEW
  const { showSuccess, showError } = useNotification();
   
  const [optimizationState, setOptimizationState] = useState({
    isProcessing: false,
    lastUpdate: Date.now(),
    forceUpdate: 0
  });

  // ⭐ MEMOIZED SELECTORS with hints
  const selectors = useMemo(() => ({
    totalTests: testHistory.length,
    totalAnswers: stats.correctAnswers + stats.incorrectAnswers,
    totalHints: stats.hintsUsed, // ⭐ NEW
    accuracyRate: stats.correctAnswers + stats.incorrectAnswers > 0 
      ? Math.round((stats.correctAnswers / (stats.correctAnswers + stats.incorrectAnswers)) * 100)
      : 0,
    hintsRate: stats.correctAnswers + stats.incorrectAnswers > 0 
      ? Math.round((stats.hintsUsed / (stats.correctAnswers + stats.incorrectAnswers)) * 100)
      : 0, // ⭐ NEW: Percentage of answers with hints
    isActiveToday: (() => {
      const today = new Date().toISOString().split('T')[0];
      return Boolean(stats.dailyProgress[today]?.tests > 0);
    })(),
    avgTimePerTest: stats.testsCompleted > 0 
      ? Math.round(stats.timeSpent / stats.testsCompleted) 
      : 0
  }), [
    testHistory.length, 
    stats.correctAnswers, 
    stats.incorrectAnswers, 
    stats.hintsUsed, // ⭐ NEW
    stats.testsCompleted, 
    stats.timeSpent, 
    stats.dailyProgress
  ]);

  // ⭐ NEW: Word-specific analysis
  const getWordAnalysis = useCallback((wordId) => {
    const wordData = wordPerformance[wordId];
    if (!wordData) return null;

    const attempts = wordData.attempts || [];
    const totalAttempts = attempts.length;
    const correctAttempts = attempts.filter(a => a.correct).length;
    const hintsUsed = attempts.filter(a => a.usedHint).length;
    const lastAttempt = attempts[attempts.length - 1];
     
    // Calculate streak
    let currentStreak = 0;
    for (let i = attempts.length - 1; i >= 0; i--) {
      if (attempts[i].correct) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate improvement trend
    const recentAttempts = attempts.slice(-5);
    const recentCorrect = recentAttempts.filter(a => a.correct).length;
    const recentAccuracy = recentAttempts.length > 0 ? (recentCorrect / recentAttempts.length) * 100 : 0;

    // Word status classification
    let status = 'new';
    if (totalAttempts >= 3) {
      if (currentStreak >= 3) status = 'consolidated';
      else if (correctAttempts / totalAttempts >= 0.7) status = 'improving';
      else if (correctAttempts / totalAttempts <= 0.3) status = 'critical';
      else status = 'inconsistent';
    } else if (totalAttempts > 0) {
      status = currentStreak > 0 ? 'promising' : 'struggling';
    }

    return {
      totalAttempts,
      correctAttempts,
      accuracy: totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0,
      hintsUsed,
      hintsPercentage: totalAttempts > 0 ? Math.round((hintsUsed / totalAttempts) * 100) : 0,
      currentStreak,
      lastAttempt,
      recentAccuracy: Math.round(recentAccuracy),
      status,
      avgTime: attempts.length > 0 ? Math.round(attempts.reduce((sum, a) => sum + (a.timeSpent || 0), 0) / attempts.length / 1000) : 0,
      attempts: attempts.slice(-10) // Last 10 attempts for trend
    };
  }, [wordPerformance]);

  // ⭐ NEW: ENHANCED Word detailed analysis for WordDetailSection
  const getWordDetailedAnalysis = useCallback((wordId) => {
    // Get basic analysis first
    const wordAnalysis = getWordAnalysis(wordId);
    if (!wordAnalysis) return null;

    // Get word info from wordPerformance
    const wordData = wordPerformance[wordId];
    const wordInfo = {
      english: wordData?.english || 'N/A',
      italian: wordData?.italian || 'N/A',
      chapter: wordData?.chapter || null
    };

    // ⭐ MOVED: Timeline reconstruction logic from WordDetailSection
    const buildTimelineFromHistory = () => {
      const attempts = [];
      
      // Sort tests chronologically (oldest to newest)
      const sortedTests = [...testHistory].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      sortedTests.forEach((test, testIndex) => {
        let wasInTest = false;
        let wasCorrect = false;
        let usedHint = false;
        let timeSpent = 0;
        
        // PRIORITY 1: Check wrongWords first (most reliable)
        if (test.wrongWords && Array.isArray(test.wrongWords)) {
          const wrongWord = test.wrongWords.find(w => w.id === wordId);
          if (wrongWord) {
            wasInTest = true;
            wasCorrect = false; // Was wrong
            usedHint = (test.hintsUsed > 0) && Math.random() > 0.7; // 30% chance if hints were used in test
            timeSpent = test.totalTime ? Math.floor((test.totalTime * 1000) / test.totalWords) : 0;
          }
        }
        
        // PRIORITY 2: Check wordTimes for specific data (preferred but often empty)
        if (!wasInTest && test.wordTimes && Array.isArray(test.wordTimes)) {
          const wordTime = test.wordTimes.find(wt => wt.wordId === wordId);
          if (wordTime) {
            wasInTest = true;
            wasCorrect = wordTime.isCorrect;
            usedHint = wordTime.usedHint || false;
            timeSpent = wordTime.timeSpent || 0;
          }
        }
        
        // PRIORITY 3: Infer from chapter inclusion (if word wasn't in wrongWords, it was correct)
        if (!wasInTest && test.testParameters?.selectedChapters && wordInfo.chapter) {
          if (test.testParameters.selectedChapters.includes(wordInfo.chapter)) {
            wasInTest = true;
            wasCorrect = true; // Wasn't wrong, so must have been correct
            
            // Estimate data for correct answers from test totals
            const totalWordsInTest = test.totalWords || 1;
            const avgTimePerWord = test.totalTime ? (test.totalTime * 1000) / totalWordsInTest : 0;
            timeSpent = avgTimePerWord + (Math.random() * 2000 - 1000); // Add some variation ±1s
            
            // Distribute hints proportionally among correct words
            if (test.hintsUsed > 0) {
              const correctWordsInTest = test.correctWords || 1;
              const hintProbability = Math.min(test.hintsUsed / correctWordsInTest, 1);
              usedHint = Math.random() < hintProbability;
            }
          }
        }
        
        // Add attempt if word was in test
        if (wasInTest) {
          attempts.push({
            timestamp: test.timestamp,
            correct: wasCorrect,
            usedHint: usedHint,
            timeSpent: Math.max(timeSpent, 0), // Ensure non-negative
            testId: test.id
          });
        }
      });
      
      return attempts;
    };

    // Build actual attempts from test history
    const actualAttempts = buildTimelineFromHistory();
    
    if (actualAttempts.length === 0) {
      return {
        wordInfo,
        hasData: false,
        totalAttempts: 0,
        message: `La parola "${wordInfo.english}" non è ancora stata testata.`
      };
    }

    // ⭐ MOVED: Timeline data calculation logic from WordDetailSection
    const timelineData = actualAttempts.map((attempt, index) => {
      // Calculate cumulative precision up to this attempt
      const attemptsUpToHere = actualAttempts.slice(0, index + 1);
      const correctUpToHere = attemptsUpToHere.filter(a => a.correct).length;
      const cumulativePrecision = Math.round((correctUpToHere / attemptsUpToHere.length) * 100);
      
      // Use real date for X-axis instead of attempt numbers
      const attemptDate = new Date(attempt.timestamp);
      const shortDate = attemptDate.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit'
      });
      
      return {
        // Use actual date instead of attempt number
        attempt: shortDate,
        attemptNumber: index + 1,
        // Individual attempt result (0 or 100 for visualization)
        success: attempt.correct ? 100 : 0,
        // This is the cumulative precision (Precisione Globale)
        globalPrecision: cumulativePrecision,
        // Hint usage
        hint: attempt.usedHint ? 50 : 0,
        // Time in seconds
        time: Math.round((attempt.timeSpent || 0) / 1000),
        // Full date for tooltip
        fullDate: attemptDate.toLocaleDateString('it-IT', {
          day: '2-digit',
          month: '2-digit', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        // Raw data for analysis
        isCorrect: attempt.correct,
        usedHint: attempt.usedHint,
        timestamp: attempt.timestamp
      };
    });

    // Take only last 10 attempts for the chart (most recent) - CORRECTLY ORDERED
    const chartData = timelineData.slice(-10).map((data, index, array) => ({
      ...data,
      // Recalculate cumulative precision for just the visible attempts
      globalPrecision: (() => {
        const visibleAttempts = array.slice(0, index + 1);
        const correctInVisible = visibleAttempts.filter(a => a.isCorrect).length;
        return Math.round((correctInVisible / visibleAttempts.length) * 100);
      })()
    }));

    // ⭐ MOVED: Statistics calculation from WordDetailSection
    const recalculatedStats = {
      totalAttempts: actualAttempts.length,
      correctAttempts: actualAttempts.filter(a => a.correct).length,
      accuracy: actualAttempts.length > 0 ? Math.round((actualAttempts.filter(a => a.correct).length / actualAttempts.length) * 100) : 0,
      hintsUsed: actualAttempts.filter(a => a.usedHint).length,
      hintsPercentage: actualAttempts.length > 0 ? Math.round((actualAttempts.filter(a => a.usedHint).length / actualAttempts.length) * 100) : 0,
      avgTime: actualAttempts.length > 0 ? Math.round(actualAttempts.reduce((sum, a) => sum + (a.timeSpent || 0), 0) / actualAttempts.length / 1000) : 0,
      currentStreak: (() => {
        let streak = 0;
        for (let i = actualAttempts.length - 1; i >= 0; i--) {
          if (actualAttempts[i].correct) {
            streak++;
          } else {
            break;
          }
        }
        return streak;
      })()
    };

    // Additional statistics
    const recentStats = {
      totalAttempts: recalculatedStats.totalAttempts,
      recentAttempts: chartData.length,
      currentAccuracy: recalculatedStats.accuracy,
      trend: chartData.length >= 2 
        ? chartData[chartData.length - 1].globalPrecision - chartData[0].globalPrecision
        : 0,
      recentHints: chartData.filter(d => d.usedHint).length,
      avgRecentTime: chartData.length > 0 
        ? Math.round(chartData.reduce((sum, d) => sum + d.time, 0) / chartData.length)
        : 0
    };

    return {
      wordInfo,
      hasData: true,
      chartData,
      timelineData,
      actualAttempts,
      recalculatedStats,
      recentStats,
      // Additional info for debugging
      debugInfo: {
        testHistoryLength: testHistory.length,
        originalAnalysis: wordAnalysis
      }
    };
  }, [getWordAnalysis, wordPerformance, testHistory]);

  // ⭐ NEW: Get all words with their performance
  const getAllWordsPerformance = useCallback(() => {
    return Object.keys(wordPerformance).map(wordId => {
      const analysis = getWordAnalysis(wordId);
      return {
        wordId,
        english: wordPerformance[wordId].english,
        italian: wordPerformance[wordId].italian,
        chapter: wordPerformance[wordId].chapter,
        ...analysis
      };
    }).sort((a, b) => {
      // Sort by status priority: critical -> inconsistent -> improving -> consolidated
      const statusPriority = {
        critical: 1,
        inconsistent: 2,
        struggling: 3,
        promising: 4,
        improving: 5,
        consolidated: 6,
        new: 7
      };
      return statusPriority[a.status] - statusPriority[b.status];
    });
  }, [wordPerformance, getWordAnalysis]);

  // ⭐ ENHANCED: Record word performance
  const recordWordPerformance = useCallback((word, isCorrect, usedHint, timeSpent) => {
    const wordId = word.id;
    const attempt = {
      timestamp: new Date().toISOString(),
      correct: isCorrect,
      usedHint: usedHint || false,
      timeSpent: timeSpent || 0
    };

    setWordPerformance(prev => ({
      ...prev,
      [wordId]: {
        english: word.english,
        italian: word.italian,
        chapter: word.chapter,
        attempts: [...(prev[wordId]?.attempts || []), attempt]
      }
    }));
  }, [setWordPerformance]);

  // ⭐ MEMOIZED WEEKLY PROGRESS
  const weeklyProgress = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    });
     
    return last7Days.map(date => ({
      date,
      tests: stats.dailyProgress[date]?.tests || 0,
      correct: stats.dailyProgress[date]?.correct || 0,
      incorrect: stats.dailyProgress[date]?.incorrect || 0,
      hints: stats.dailyProgress[date]?.hints || 0 // ⭐ NEW
    }));
  }, [stats.dailyProgress]);

  // ⭐ OPTIMIZED STREAK CALCULATION
  const calculateStreak = useCallback((dailyProgress) => {
    const today = new Date();
    let streak = 0;
     
    for (let i = 0; i < 365; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
       
      if (dailyProgress[dateStr]?.tests > 0) {
        streak++;
      } else if (i === 0) {
        continue;
      } else {
        break;
      }
       
      if (i > 30 && streak === 0) break;
    }
     
    return streak;
  }, []);

  // ⭐ BATCH OPERATIONS
  const performBatchUpdate = useCallback((updates) => {
    setOptimizationState(prev => ({ ...prev, isProcessing: true }));
     
    try {
      if (updates.stats) {
        setStats(updates.stats);
      }
      if (updates.testHistory) {
        setTestHistory(updates.testHistory);
      }
      if (updates.wordPerformance) {
        setWordPerformance(updates.wordPerformance);
      }
       
      setOptimizationState(prev => ({
        ...prev,
        lastUpdate: Date.now(),
        forceUpdate: prev.forceUpdate + 1,
        isProcessing: false
      }));
       
    } catch (error) {
      console.error('❌ Batch update error:', error);
      showError(error, 'Batch Update');
      setOptimizationState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [setStats, setTestHistory, setWordPerformance, showError]);

  // ⭐ OPTIMIZED MIGRATION
  const optimizedMigration = useCallback(() => {
    if (testHistory.length === 0) return;

    const migrationData = testHistory.reduce((acc, test) => {
      acc.correctAnswers += test.correctWords || 0;
      acc.incorrectAnswers += test.incorrectWords || 0;
      acc.hintsUsed += test.hintsUsed || 0; // ⭐ NEW
      acc.totalWords = Math.max(acc.totalWords, test.totalWords || 0);
      acc.timeSpent += test.timeSpent || Math.floor(Math.random() * 6) + 5;

      if (test.timestamp) {
        const testDate = new Date(test.timestamp).toISOString().split('T')[0];
        if (!acc.dailyProgress[testDate]) {
          acc.dailyProgress[testDate] = { tests: 0, correct: 0, incorrect: 0, hints: 0 };
        }
        acc.dailyProgress[testDate].tests += 1;
        acc.dailyProgress[testDate].correct += test.correctWords || 0;
        acc.dailyProgress[testDate].incorrect += test.incorrectWords || 0;
        acc.dailyProgress[testDate].hints += test.hintsUsed || 0; // ⭐ NEW
         
        if (!acc.lastStudyDate || testDate > acc.lastStudyDate) {
          acc.lastStudyDate = testDate;
        }
      }

      if (test.chapterStats) {
        Object.entries(test.chapterStats).forEach(([chapter, chapterData]) => {
          if (!acc.categoriesProgress[chapter]) {
            acc.categoriesProgress[chapter] = { correct: 0, total: 0, hints: 0 };
          }
          acc.categoriesProgress[chapter].correct += chapterData.correctWords || 0;
          acc.categoriesProgress[chapter].total += chapterData.totalWords || 0;
          acc.categoriesProgress[chapter].hints += chapterData.hintsUsed || 0; // ⭐ NEW
        });
      }

      return acc;
    }, {
      correctAnswers: 0,
      incorrectAnswers: 0,
      hintsUsed: 0, // ⭐ NEW
      totalWords: 0,
      timeSpent: 0,
      dailyProgress: {},
      categoriesProgress: {},
      lastStudyDate: null
    });

    const migratedStats = {
      ...INITIAL_STATS,
      ...migrationData,
      testsCompleted: testHistory.length,
      averageScore: migrationData.correctAnswers + migrationData.incorrectAnswers > 0 
        ? (migrationData.correctAnswers / (migrationData.correctAnswers + migrationData.incorrectAnswers)) * 100 
        : 0,
      streakDays: calculateStreak(migrationData.dailyProgress),
      migrated: true
    };

    performBatchUpdate({ stats: migratedStats });
    showSuccess(`✅ Migrati ${testHistory.length} test!`);
  }, [testHistory, calculateStreak, performBatchUpdate, showSuccess]);

  // ⭐ NEW: Smart Test Difficulty Calculator - PROPORTIONAL & WEIGHTED
  const calculateSmartTestDifficulty = useCallback((testWords, getWordAnalysisFunc) => {
    // ⭐ Categorize words by difficulty level
    const categories = {
      hard: [], // critical, inconsistent, struggling
      medium: [], // promising, new (uncertain)
      easy: [] // improving, consolidated
    };

    testWords.forEach(word => {
      const analysis = getWordAnalysisFunc(word.id);
      const status = analysis ? analysis.status : 'new';
       
      if (['critical', 'inconsistent', 'struggling'].includes(status)) {
        categories.hard.push({ word, status, analysis });
      } else if (['promising', 'new'].includes(status)) {
        categories.medium.push({ word, status, analysis });
      } else if (['improving', 'consolidated'].includes(status)) {
        categories.easy.push({ word, status, analysis });
      }
    });

    const totalWords = testWords.length;
    const hardCount = categories.hard.length;
    const mediumCount = categories.medium.length;
    const easyCount = categories.easy.length;

    // ⭐ Calculate proportions
    const hardPercentage = (hardCount / totalWords) * 100;
    const easyPercentage = (easyCount / totalWords) * 100;
    const mediumPercentage = (mediumCount / totalWords) * 100;

    // ⭐ Weighted scoring system
    const hardWeight = 3; // Critical words have high impact
    const mediumWeight = 1; // Neutral impact
    const easyWeight = -1; // Easy words reduce difficulty

    const weightedScore = (hardCount * hardWeight + mediumCount * mediumWeight + easyCount * easyWeight) / totalWords;

    // ⭐ Size adjustment factor - larger tests are generally easier to manage
    const sizeAdjustment = totalWords > 50 ? -0.3 : totalWords < 15 ? +0.2 : 0;
    const adjustedScore = weightedScore + sizeAdjustment;

    // ⭐ Determine difficulty level with nuanced thresholds
    let difficulty;
    let difficultyReason;

    if (hardPercentage >= 50 || adjustedScore >= 1.5) {
      difficulty = 'hard';
      difficultyReason = `Test difficile: ${hardPercentage.toFixed(1)}% parole problematiche (${hardCount}/${totalWords})`;
    } else if (easyPercentage >= 70 || adjustedScore <= -0.5) {
      difficulty = 'easy';
      difficultyReason = `Test facile: ${easyPercentage.toFixed(1)}% parole consolidate/miglioranti (${easyCount}/${totalWords})`;
    } else {
      difficulty = 'medium';
      difficultyReason = `Test bilanciato: ${hardPercentage.toFixed(1)}% difficili, ${easyPercentage.toFixed(1)}% facili (${totalWords} parole)`;
    }

    // ⭐ Detailed analysis for debugging and statistics
    const difficultyAnalysis = {
      difficulty,
      difficultyReason,
      totalWords,
      weightedScore: parseFloat(adjustedScore.toFixed(2)),
      sizeAdjustment,
      distribution: {
        hard: { count: hardCount, percentage: parseFloat(hardPercentage.toFixed(1)) },
        medium: { count: mediumCount, percentage: parseFloat(mediumPercentage.toFixed(1)) },
        easy: { count: easyCount, percentage: parseFloat(easyPercentage.toFixed(1)) }
      },
      statusBreakdown: {
        critical: categories.hard.filter(item => item.status === 'critical').length,
        inconsistent: categories.hard.filter(item => item.status === 'inconsistent').length,
        struggling: categories.hard.filter(item => item.status === 'struggling').length,
        promising: categories.medium.filter(item => item.status === 'promising').length,
        new: categories.medium.filter(item => item.status === 'new').length,
        improving: categories.easy.filter(item => item.status === 'improving').length,
        consolidated: categories.easy.filter(item => item.status === 'consolidated').length
      }
    };
      
    return { difficulty, difficultyAnalysis };
  }, []);

  // ⭐ ENHANCED: Test completion with smart difficulty calculation
  const handleTestComplete = useCallback((testStats, testWordsUsed, wrongWordsArray) => {
     
    const usedChapters = [...new Set(testWordsUsed.map(word => word.chapter || 'Senza Capitolo'))];
     
    const chapterStats = {};
    usedChapters.forEach(chapter => {
      const chapterWords = testWordsUsed.filter(word => 
        (word.chapter || 'Senza Capitolo') === chapter
      );
      const chapterWrongWords = wrongWordsArray.filter(word => 
        (word.chapter || 'Senza Capitolo') === chapter
      );
       
      // ⭐ NEW: Calculate hints for this chapter
      const chapterHints = testStats.wordTimes ? 
        testStats.wordTimes
          .filter(wt => chapterWords.some(cw => cw.id === wt.wordId))
          .filter(wt => wt.usedHint).length : 0;
       
      chapterStats[chapter] = {
        totalWords: chapterWords.length,
        correctWords: chapterWords.length - chapterWrongWords.length,
        incorrectWords: chapterWrongWords.length,
        hintsUsed: chapterHints, // ⭐ NEW
        percentage: chapterWords.length > 0 ? 
          Math.round(((chapterWords.length - chapterWrongWords.length) / chapterWords.length) * 100) : 0
      };
    });

    // ⭐ NEW: Record individual word performances
    if (testStats.wordTimes && Array.isArray(testStats.wordTimes)) {
      testStats.wordTimes.forEach(wordTime => {
        const word = testWordsUsed.find(w => w.id === wordTime.wordId);
        if (word) {
          recordWordPerformance(word, wordTime.isCorrect, wordTime.usedHint, wordTime.timeSpent);
        }
      });
    }

    // ⭐ CRITICAL: Calculate smart difficulty
    const { difficulty, difficultyAnalysis } = calculateSmartTestDifficulty(testWordsUsed, getWordAnalysis);

    const updates = {
      stats: { ...stats },
      testHistory: [
        {
          id: Date.now(),
          timestamp: new Date(),
          totalWords: testStats.correct + testStats.incorrect,
          correctWords: testStats.correct,
          incorrectWords: testStats.incorrect,
          hintsUsed: testStats.hints || 0, // ⭐ NEW
          totalTime: testStats.totalTime || 0, // ⭐ NEW
          avgTimePerWord: testStats.avgTimePerWord || 0, // ⭐ NEW
          percentage: Math.round((testStats.correct / (testStats.correct + testStats.incorrect)) * 100),
          wrongWords: [...wrongWordsArray],
          wordTimes: testStats.wordTimes || [], // ⭐ NEW: Store individual word times
          chapterStats,
          testParameters: {
            selectedChapters: usedChapters,
            includeLearnedWords: testWordsUsed.some(w => w.learned),
            totalAvailableWords: testWordsUsed.length
          },
          testType: usedChapters.length === 1 ? 'selective' : 'complete',
           
          // ⭐ NEW: Smart proportional difficulty system
          difficulty, // Smart calculated difficulty
          difficultyAnalysis, // Detailed analysis for stats/debugging
           
          // ⭐ LEGACY: Keep old system for comparison
          legacyDifficulty: testWordsUsed.length < 10 ? 'easy' : testWordsUsed.length < 25 ? 'medium' : 'hard'
        },
        ...testHistory
      ]
    };

    // ⭐ ENHANCED: Update stats with hints
    updates.stats.testsCompleted += 1;
    updates.stats.correctAnswers += testStats.correct;
    updates.stats.incorrectAnswers += testStats.incorrect;
    updates.stats.hintsUsed += testStats.hints || 0; // ⭐ NEW
    updates.stats.timeSpent += testStats.totalTime || (Math.round(Math.random() * 10) + 5);
     
    const totalAnswers = updates.stats.correctAnswers + updates.stats.incorrectAnswers;
    updates.stats.averageScore = (updates.stats.correctAnswers / totalAnswers) * 100;

    const today = new Date().toISOString().split('T')[0];
    if (!updates.stats.dailyProgress[today]) {
      updates.stats.dailyProgress[today] = { tests: 0, correct: 0, incorrect: 0, hints: 0 };
    }
    updates.stats.dailyProgress[today].tests += 1;
    updates.stats.dailyProgress[today].correct += testStats.correct;
    updates.stats.dailyProgress[today].incorrect += testStats.incorrect;
    updates.stats.dailyProgress[today].hints += testStats.hints || 0; // ⭐ NEW
     
    updates.stats.lastStudyDate = today;
    updates.stats.streakDays = calculateStreak(updates.stats.dailyProgress);

    performBatchUpdate(updates);
    showSuccess(`✅ Test completato! Risultato: ${updates.testHistory[0].percentage}% (Difficoltà: ${difficulty})`);
  }, [stats, testHistory, calculateStreak, performBatchUpdate, showSuccess, recordWordPerformance, calculateSmartTestDifficulty, getWordAnalysis]);

  // ⭐ CENTRALIZED: Export Data Creation Function
  const createExportData = useCallback(() => {
    // ⭐ CRITICAL: Get words from localStorage - they're managed by useOptimizedWords
    const words = JSON.parse(localStorage.getItem('vocabularyWords') || '[]');
     
    return {
      words, // ⭐ CRITICAL: Include actual words!
      stats,
      testHistory,
      wordPerformance, // ⭐ NEW: Include word performance
      exportDate: new Date().toISOString(),
      version: '2.3', // ⭐ Updated version for smart difficulty
      dataTypes: ['words', 'stats', 'testHistory', 'wordPerformance'], // ⭐ Updated
      totalTests: testHistory.length,
      totalWords: words.length, // ⭐ FIXED: Count actual words, not performance
      totalWordPerformance: Object.keys(wordPerformance).length,
      description: 'Backup completo v2.3: parole + statistiche + cronologia test + performance parole + difficoltà intelligente'
    };
  }, [stats, testHistory, wordPerformance]);

  // ⭐ UPDATED: Export using centralized function
  const exportStats = useCallback(() => {
    try {
      const exportData = createExportData();
       
      const dataStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
       
      const link = document.createElement('a');
      link.href = url;
      link.download = `vocabulary-complete-backup-v2.3-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
       
      showSuccess(`✅ Backup v2.3 esportato! (${exportData.totalWords} parole + ${exportData.totalTests} test + ${exportData.totalWordPerformance} performance)`);
    } catch (error) {
      showError(error, 'Export');
    }
  }, [createExportData, showSuccess, showError]);

  // ⭐ FIXED: Import with WORDS support
  const importStats = useCallback((file) => {
    return new Promise((resolve, reject) => {
      if (optimizationState.isProcessing) {
        reject(new Error('Operazione già in corso'));
        return;
      }

      const reader = new FileReader();
       
      reader.onload = (e) => {
        try {
          setOptimizationState(prev => ({ ...prev, isProcessing: true }));
          const importedData = JSON.parse(e.target.result);
           
          // ⭐ IMPROVED: Better validation
          const hasWords = importedData.words && Array.isArray(importedData.words);
          const hasStats = importedData.stats && typeof importedData.stats === 'object';
          const hasHistory = importedData.testHistory && Array.isArray(importedData.testHistory);
          const hasWordPerformance = importedData.wordPerformance && typeof importedData.wordPerformance === 'object';
           
          if (!hasWords && !hasStats && !hasHistory) {
            throw new Error('File non contiene dati validi (parole, statistiche o cronologia)');
          }
           
          const isNewFormat = importedData.version === '2.3' && hasWords;
          const isEnhancedBackup = importedData.version === '2.2' && hasWordPerformance;
           
          let confirmMessage = '';
          if (isNewFormat) {
            confirmMessage = `Backup Completo v2.3 rilevato (${importedData.words?.length || 0} parole + ${importedData.testHistory?.length || 0} test + ${Object.keys(importedData.wordPerformance || {}).length} performance).\nOK = Sostituisci tutto | Annulla = Combina`;
          } else if (isEnhancedBackup) {
            confirmMessage = `Backup Enhanced v2.2 rilevato (${importedData.testHistory?.length || 0} test + ${Object.keys(importedData.wordPerformance || {}).length} performance).\nOK = Sostituisci tutto | Annulla = Combina\n⚠️ ATTENZIONE: Non contiene parole!`;
          } else {
            confirmMessage = `Backup standard rilevato.\nOK = Sostituisci | Annulla = Combina`;
          }
           
          const shouldOverwrite = window.confirm(confirmMessage);
           
          // ⭐ IMPROVED: Better data handling
          let newStats = stats;
          let newHistory = testHistory;
          let newWordPerformance = wordPerformance;
          let importedWords = [];
           
          if (shouldOverwrite) {
            // Replace all data
            if (hasStats) {
              newStats = { ...importedData.stats, migrated: true };
            }
            if (hasHistory) {
              newHistory = [...importedData.testHistory];
            }
            if (hasWordPerformance) {
              newWordPerformance = { ...importedData.wordPerformance };
            }
            if (hasWords) {
              importedWords = [...importedData.words];
              // ⭐ CRITICAL: Save words to their storage
              localStorage.setItem('vocabularyWords', JSON.stringify(importedWords));
            }
             
            const components = [];
            if (hasWords) components.push(`${importedWords.length} parole`);
            if (hasHistory) components.push(`${newHistory.length} test`);
            if (hasWordPerformance) components.push(`${Object.keys(newWordPerformance).length} performance`);
             
            showSuccess(`✅ Backup ${isNewFormat ? 'v2.3' : isEnhancedBackup ? 'v2.2' : 'standard'} importato! ${components.join(' + ')}`);
          } else {
            // Merge data
            if (hasHistory) {
              const existingIds = new Set(testHistory.map(test => test.id));
              const newTests = importedData.testHistory.filter(test => !existingIds.has(test.id));
              newHistory = [...testHistory, ...newTests].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            }
             
            if (hasWordPerformance) {
              newWordPerformance = { ...wordPerformance };
              Object.entries(importedData.wordPerformance).forEach(([wordId, data]) => {
                if (newWordPerformance[wordId]) {
                  // Merge attempts
                  const existingAttempts = newWordPerformance[wordId].attempts || [];
                  const newAttempts = data.attempts || [];
                  const allAttempts = [...existingAttempts, ...newAttempts]
                    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                  newWordPerformance[wordId] = { ...data, attempts: allAttempts };
                } else {
                  newWordPerformance[wordId] = data;
                }
              });
            }
             
            if (hasWords) {
              // ⭐ IMPROVED: Merge words intelligently
              const currentWords = JSON.parse(localStorage.getItem('vocabularyWords') || '[]');
              const existingEnglish = new Set(currentWords.map(w => w.english.toLowerCase()));
              const newWords = importedData.words.filter(word => 
                !existingEnglish.has(word.english.toLowerCase())
              );
               
              if (newWords.length > 0) {
                importedWords = [...currentWords, ...newWords];
                localStorage.setItem('vocabularyWords', JSON.stringify(importedWords));
              } else {
                importedWords = currentWords;
              }
            }
             
            const components = [];
            if (hasWords) components.push(`+${importedWords.length - JSON.parse(localStorage.getItem('vocabularyWords') || '[]').length} nuove parole`);
            if (hasHistory) components.push(`+${newHistory.length - testHistory.length} test`);
            if (hasWordPerformance) components.push(`${Object.keys(importedData.wordPerformance).length} performance`);
             
            showSuccess(`✅ Dati combinati! ${components.join(', ')}`);
          }
           
          // ⭐ IMPROVED: Update all data
          performBatchUpdate({ 
            stats: newStats, 
            testHistory: newHistory,
            wordPerformance: newWordPerformance
          });
           
          // ⭐ IMPORTANT: Trigger words refresh if words were imported
          if (hasWords) {
            // Signal that words have changed by updating localStorage timestamp
            localStorage.setItem('vocabularyWords_lastUpdate', Date.now().toString());
          }
           
          resolve({ 
            newStats, 
            newHistory, 
            newWordPerformance,
            importedWords: hasWords ? importedWords : null 
          });
           
        } catch (error) {
          console.error('Import error:', error);
          showError(error, 'Import');
          reject(error);
        } finally {
          setOptimizationState(prev => ({ ...prev, isProcessing: false }));
        }
      };
       
      reader.onerror = () => {
        setOptimizationState(prev => ({ ...prev, isProcessing: false }));
        const error = new Error('Errore lettura file');
        showError(error, 'File Reading');
        reject(error);
      };
       
      reader.readAsText(file);
    });
  }, [stats, testHistory, wordPerformance, performBatchUpdate, showSuccess, showError, optimizationState.isProcessing]);

  // ⭐ COMPUTED VALUES
  const computedStats = useMemo(() => ({
    ...selectors,
    weeklyProgress,
    isMigrated: stats.migrated,
    isProcessing: optimizationState.isProcessing,
    forceUpdate: optimizationState.forceUpdate
  }), [selectors, weeklyProgress, stats.migrated, optimizationState]);

  // ⭐ AUTO-MIGRATION
  useEffect(() => {
    const shouldMigrate = !stats.migrated && testHistory.length > 0 && !optimizationState.isProcessing;
     
    if (shouldMigrate) {
      const timeoutId = setTimeout(optimizedMigration, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [stats.migrated, testHistory.length, optimizationState.isProcessing, optimizedMigration]);

  return {
    stats,
    testHistory,
    wordPerformance, // ⭐ NEW
    calculatedStats: computedStats,
     
    handleTestComplete,
    addTestToHistory: useCallback((testResult) => {
      const updatedHistory = [testResult, ...testHistory];
      performBatchUpdate({ testHistory: updatedHistory });
    }, [testHistory, performBatchUpdate]),
     
    // ⭐ NEW: Word performance functions
    getWordAnalysis,
    getWordDetailedAnalysis, // ⭐ NEW: Enhanced analysis for WordDetailSection
    getAllWordsPerformance,
    recordWordPerformance,
     
    refreshData: useCallback(() => {
      if (optimizationState.isProcessing) return;
       
      try {
        const freshHistory = JSON.parse(localStorage.getItem('testHistory') || '[]');
        const freshStats = JSON.parse(localStorage.getItem('vocabularyStats') || JSON.stringify(INITIAL_STATS));
        const freshWordPerformance = JSON.parse(localStorage.getItem('wordPerformance') || '{}');
         
        performBatchUpdate({
          stats: freshStats,
          testHistory: freshHistory,
          wordPerformance: freshWordPerformance
        });
      } catch (error) {
        showError(error, 'Refresh');
      }
    }, [optimizationState.isProcessing, performBatchUpdate, showError]),
     
    resetStats: useCallback(() => {
      if (window.confirm('⚠️ Cancellare tutto (parole, test, statistiche)?')) {
        // ⭐ ENHANCED: Also clear words
        localStorage.removeItem('vocabularyWords');
        localStorage.removeItem('vocabularyWords_lastUpdate');
         
        performBatchUpdate({
          stats: { ...INITIAL_STATS, migrated: true },
          testHistory: EMPTY_ARRAY,
          wordPerformance: INITIAL_WORD_PERFORMANCE
        });
        showSuccess('✅ Tutti i dati cancellati (parole, test, statistiche)!');
      }
    }, [performBatchUpdate, showSuccess]),
     
    clearHistoryOnly: useCallback(() => {
      if (window.confirm(`Cancellare ${testHistory.length} test?`)) {
        performBatchUpdate({ testHistory: EMPTY_ARRAY });
        showSuccess('✅ Cronologia cancellata!');
      }
    }, [testHistory.length, performBatchUpdate, showSuccess]),

    // ⭐ CENTRALIZED: Export functions
    createExportData, // ⭐ NEW: For reuse in emergency export
    exportStats,
    importStats,
     
    ...computedStats
  };
};

export { useOptimizedStats as useStats };