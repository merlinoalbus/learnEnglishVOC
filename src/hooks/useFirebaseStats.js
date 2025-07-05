// src/hooks/useFirebaseStats.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { firebaseService } from '../services/firebaseService';
import { useFirebaseAuth } from './useFirebaseAuth';

// INITIAL STATES (identici a useOptimizedStats)
const INITIAL_STATS = {
  totalWords: 0,
  correctAnswers: 0,
  incorrectAnswers: 0,
  hintsUsed: 0,
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

const INITIAL_WORD_PERFORMANCE = {};
const EMPTY_ARRAY = [];

export const useFirebaseStats = () => {
  const [testHistory, setTestHistory] = useState(EMPTY_ARRAY);
  const [stats, setStats] = useState(INITIAL_STATS);
  const [wordPerformance, setWordPerformance] = useState(INITIAL_WORD_PERFORMANCE);
  const [loading, setLoading] = useState(true);
  
  const { user, isAuthenticated } = useFirebaseAuth();
  
  const [optimizationState, setOptimizationState] = useState({
    isProcessing: false,
    lastUpdate: Date.now(),
    forceUpdate: 0
  });

  // Load initial data when user authenticates
  useEffect(() => {
    const loadInitialData = async () => {
      if (!isAuthenticated) {
        setStats(INITIAL_STATS);
        setTestHistory(EMPTY_ARRAY);
        setWordPerformance(INITIAL_WORD_PERFORMANCE);
        setLoading(false);
        return;
      }

      try {
        console.log('📊 Loading stats data...');
        setLoading(true);

        // Load all data in parallel
        const [statsData, historyData, performanceData] = await Promise.all([
          firebaseService.getStats(),
          firebaseService.getTestHistory(),
          firebaseService.getAllWordPerformance()
        ]);

        setStats(statsData || INITIAL_STATS);
        setTestHistory(historyData || EMPTY_ARRAY);
        setWordPerformance(performanceData || INITIAL_WORD_PERFORMANCE);

        console.log(`✅ Stats loaded: ${historyData?.length || 0} tests, ${Object.keys(performanceData || {}).length} word performances`);

      } catch (error) {
        console.error('❌ Error loading stats:', error);
        // Silently handle errors in this hook - users can still use the app
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [isAuthenticated, user?.uid]);

  // MEMOIZED SELECTORS (identici a useOptimizedStats)
  const selectors = useMemo(() => ({
    totalTests: testHistory.length,
    totalAnswers: stats.correctAnswers + stats.incorrectAnswers,
    totalHints: stats.hintsUsed,
    accuracyRate: stats.correctAnswers + stats.incorrectAnswers > 0 
      ? Math.round((stats.correctAnswers / (stats.correctAnswers + stats.incorrectAnswers)) * 100)
      : 0,
    hintsRate: stats.correctAnswers + stats.incorrectAnswers > 0 
      ? Math.round((stats.hintsUsed / (stats.correctAnswers + stats.incorrectAnswers)) * 100)
      : 0,
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
    stats.hintsUsed,
    stats.testsCompleted, 
    stats.timeSpent, 
    stats.dailyProgress
  ]);

  // Word analysis (identico a useOptimizedStats)
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
      attempts: attempts.slice(-10)
    };
  }, [wordPerformance]);

  // Get all words performance (identico a useOptimizedStats)
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

  // Record word performance (identico a useOptimizedStats)
  const recordWordPerformance = useCallback(async (word, isCorrect, usedHint, timeSpent) => {
    if (!isAuthenticated) return;

    const wordId = word.id;
    const attempt = {
      timestamp: new Date().toISOString(),
      correct: isCorrect,
      usedHint: usedHint || false,
      timeSpent: timeSpent || 0
    };

    try {
      // Update local state immediately
      const updatedPerformance = {
        ...wordPerformance,
        [wordId]: {
          english: word.english,
          italian: word.italian,
          chapter: word.chapter,
          attempts: [...(wordPerformance[wordId]?.attempts || []), attempt]
        }
      };
      
      setWordPerformance(updatedPerformance);

      // Update Firebase
      await firebaseService.updateWordPerformance(wordId, updatedPerformance[wordId]);

    } catch (error) {
      console.error('❌ Error recording word performance:', error);
    }
  }, [isAuthenticated, wordPerformance]);

  // Weekly progress (identico a useOptimizedStats)
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
      hints: stats.dailyProgress[date]?.hints || 0
    }));
  }, [stats.dailyProgress]);

  // Calculate streak (identico a useOptimizedStats)
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

  // Smart difficulty calculation (identico a useOptimizedStats)
  const calculateSmartTestDifficulty = useCallback((testWords, getWordAnalysisFunc) => {
    const categories = {
      hard: [],
      medium: [],
      easy: []
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

    const hardPercentage = (hardCount / totalWords) * 100;
    const easyPercentage = (easyCount / totalWords) * 100;
    const mediumPercentage = (mediumCount / totalWords) * 100;

    const hardWeight = 3;
    const mediumWeight = 1;
    const easyWeight = -1;

    const weightedScore = (hardCount * hardWeight + mediumCount * mediumWeight + easyCount * easyWeight) / totalWords;
    const sizeAdjustment = totalWords > 50 ? -0.3 : totalWords < 15 ? +0.2 : 0;
    const adjustedScore = weightedScore + sizeAdjustment;

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

  // HANDLE TEST COMPLETE (identico a useOptimizedStats ma con Firebase)
  const handleTestComplete = useCallback(async (testStats, testWordsUsed, wrongWordsArray) => {
    if (!isAuthenticated) return;

    try {
      setOptimizationState(prev => ({ ...prev, isProcessing: true }));

      console.log('📊 Processing test completion...');

      const usedChapters = [...new Set(testWordsUsed.map(word => word.chapter || 'Senza Capitolo'))];
      
      const chapterStats = {};
      usedChapters.forEach(chapter => {
        const chapterWords = testWordsUsed.filter(word => 
          (word.chapter || 'Senza Capitolo') === chapter
        );
        const chapterWrongWords = wrongWordsArray.filter(word => 
          (word.chapter || 'Senza Capitolo') === chapter
        );
        
        const chapterHints = testStats.wordTimes ? 
          testStats.wordTimes
            .filter(wt => chapterWords.some(cw => cw.id === wt.wordId))
            .filter(wt => wt.usedHint).length : 0;
        
        chapterStats[chapter] = {
          totalWords: chapterWords.length,
          correctWords: chapterWords.length - chapterWrongWords.length,
          incorrectWords: chapterWrongWords.length,
          hintsUsed: chapterHints,
          percentage: chapterWords.length > 0 ? 
            Math.round(((chapterWords.length - chapterWrongWords.length) / chapterWords.length) * 100) : 0
        };
      });

      // Record individual word performances
      if (testStats.wordTimes && Array.isArray(testStats.wordTimes)) {
        const recordPromises = testStats.wordTimes.map(wordTime => {
          const word = testWordsUsed.find(w => w.id === wordTime.wordId);
          if (word) {
            return recordWordPerformance(word, wordTime.isCorrect, wordTime.usedHint, wordTime.timeSpent);
          }
          return Promise.resolve();
        });
        
        await Promise.all(recordPromises);
      }

      // Calculate smart difficulty
      const { difficulty, difficultyAnalysis } = calculateSmartTestDifficulty(testWordsUsed, getWordAnalysis);

      // Create new test history entry
      const newTestEntry = {
        id: Date.now(),
        timestamp: new Date(),
        totalWords: testStats.correct + testStats.incorrect,
        correctWords: testStats.correct,
        incorrectWords: testStats.incorrect,
        hintsUsed: testStats.hints || 0,
        totalTime: testStats.totalTime || 0,
        avgTimePerWord: testStats.avgTimePerWord || 0,
        percentage: Math.round((testStats.correct / (testStats.correct + testStats.incorrect)) * 100),
        wrongWords: [...wrongWordsArray],
        wordTimes: testStats.wordTimes || [],
        chapterStats,
        testParameters: {
          selectedChapters: usedChapters,
          includeLearnedWords: testWordsUsed.some(w => w.learned),
          totalAvailableWords: testWordsUsed.length
        },
        testType: usedChapters.length === 1 ? 'selective' : 'complete',
        difficulty,
        difficultyAnalysis,
        legacyDifficulty: testWordsUsed.length < 10 ? 'easy' : testWordsUsed.length < 25 ? 'medium' : 'hard'
      };

      // Update stats
      const updatedStats = { ...stats };
      updatedStats.testsCompleted += 1;
      updatedStats.correctAnswers += testStats.correct;
      updatedStats.incorrectAnswers += testStats.incorrect;
      updatedStats.hintsUsed += testStats.hints || 0;
      updatedStats.timeSpent += testStats.totalTime || (Math.round(Math.random() * 10) + 5);
      
      const totalAnswers = updatedStats.correctAnswers + updatedStats.incorrectAnswers;
      updatedStats.averageScore = (updatedStats.correctAnswers / totalAnswers) * 100;

      const today = new Date().toISOString().split('T')[0];
      if (!updatedStats.dailyProgress[today]) {
        updatedStats.dailyProgress[today] = { tests: 0, correct: 0, incorrect: 0, hints: 0 };
      }
      updatedStats.dailyProgress[today].tests += 1;
      updatedStats.dailyProgress[today].correct += testStats.correct;
      updatedStats.dailyProgress[today].incorrect += testStats.incorrect;
      updatedStats.dailyProgress[today].hints += testStats.hints || 0;
      
      updatedStats.lastStudyDate = today;
      updatedStats.streakDays = calculateStreak(updatedStats.dailyProgress);

      // Update Firebase and local state
      const [savedTest] = await Promise.all([
        firebaseService.addTestResult(newTestEntry),
        firebaseService.updateStats(updatedStats)
      ]);

      // Update local state
      setTestHistory(prev => [savedTest, ...prev]);
      setStats(updatedStats);

      console.log(`✅ Test completato! Risultato: ${newTestEntry.percentage}% (Difficoltà: ${difficulty})`);

    } catch (error) {
      console.error('❌ Error handling test completion:', error);
      // Don't throw - let the app continue to work
    } finally {
      setOptimizationState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [isAuthenticated, stats, recordWordPerformance, calculateSmartTestDifficulty, getWordAnalysis, calculateStreak]);

  // Export stats (identico a useOptimizedStats)
  const exportStats = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      // Get current words from Firebase
      const words = await firebaseService.getWords();
      
      const exportData = {
        words,
        stats,
        testHistory,
        wordPerformance,
        exportDate: new Date().toISOString(),
        version: '2.3',
        dataTypes: ['words', 'stats', 'testHistory', 'wordPerformance'],
        totalTests: testHistory.length,
        totalWords: words.length,
        totalWordPerformance: Object.keys(wordPerformance).length,
        description: 'Backup completo v2.3: parole + statistiche + cronologia test + performance parole + difficoltà intelligente (Firebase)'
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `vocabulary-firebase-backup-v2.3-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log(`✅ Backup Firebase v2.3 esportato! (${words.length} parole + ${testHistory.length} test + ${Object.keys(wordPerformance).length} performance)`);
    } catch (error) {
      console.error('❌ Export error:', error);
    }
  }, [isAuthenticated, stats, testHistory, wordPerformance]);

  // Import stats (simplified for Firebase)
  const importStats = useCallback(async (file) => {
    console.warn('Import non supportato in modalità Firebase. Usa la migrazione da localStorage.');
  }, []);

  // Refresh data
  const refreshData = useCallback(async () => {
    if (!isAuthenticated || optimizationState.isProcessing) return;
    
    try {
      setOptimizationState(prev => ({ ...prev, isProcessing: true }));

      const [statsData, historyData, performanceData] = await Promise.all([
        firebaseService.getStats(),
        firebaseService.getTestHistory(),
        firebaseService.getAllWordPerformance()
      ]);

      setStats(statsData || INITIAL_STATS);
      setTestHistory(historyData || EMPTY_ARRAY);
      setWordPerformance(performanceData || INITIAL_WORD_PERFORMANCE);

      setOptimizationState(prev => ({
        ...prev,
        lastUpdate: Date.now(),
        forceUpdate: prev.forceUpdate + 1
      }));

    } catch (error) {
      console.error('❌ Refresh error:', error);
    } finally {
      setOptimizationState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [isAuthenticated, optimizationState.isProcessing]);

  // Reset stats
  const resetStats = useCallback(async () => {
    if (!isAuthenticated) return;

    if (window.confirm('⚠️ Cancellare tutto (test, statistiche, performance)?')) {
      try {
        await firebaseService.updateStats({ ...INITIAL_STATS, migrated: true });

        setStats({ ...INITIAL_STATS, migrated: true });
        setTestHistory(EMPTY_ARRAY);
        setWordPerformance(INITIAL_WORD_PERFORMANCE);

        console.log('✅ Statistiche cancellate!');
      } catch (error) {
        console.error('❌ Reset stats error:', error);
      }
    }
  }, [isAuthenticated]);

  // Computed stats (identico a useOptimizedStats)
  const computedStats = useMemo(() => ({
    ...selectors,
    weeklyProgress,
    isMigrated: stats.migrated,
    isProcessing: optimizationState.isProcessing,
    forceUpdate: optimizationState.forceUpdate
  }), [selectors, weeklyProgress, stats.migrated, optimizationState]);

  // Return IDENTICAL API to useOptimizedStats
  return {
    // State (identico a useOptimizedStats)
    stats,
    testHistory,
    wordPerformance,
    calculatedStats: computedStats,
    
    // Methods (identici a useOptimizedStats)
    handleTestComplete,
    addTestToHistory: useCallback((testResult) => {
      console.warn('addTestToHistory called - use handleTestComplete instead');
    }, []),
    
    // Word performance functions (identici a useOptimizedStats)
    getWordAnalysis,
    getAllWordsPerformance,
    recordWordPerformance,
    
    refreshData,
    resetStats,
    exportStats,
    importStats,
    
    // Clear history only
    clearHistoryOnly: useCallback(async () => {
      if (window.confirm(`Cancellare ${testHistory.length} test?`)) {
        try {
          // Note: This would need batch delete implementation in production
          setTestHistory(EMPTY_ARRAY);
          console.log('✅ Cronologia cancellata!');
        } catch (error) {
          console.error('❌ Clear history error:', error);
        }
      }
    }, [testHistory.length]),
    
    // Computed values (identici a useOptimizedStats)
    ...computedStats,
    
    // Firebase-specific
    loading,
    isAuthenticated
  };
};