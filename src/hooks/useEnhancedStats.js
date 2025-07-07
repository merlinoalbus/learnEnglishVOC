// =====================================================
// 📁 src/hooks/useEnhancedStats.js - COMPLETE Enhanced Stats Hook with ALL Original Functions
// =====================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { STORAGE_CONFIG } from '../constants/appConstants';

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

export const useEnhancedStats = () => {
  const [stats, setStats] = useState(INITIAL_STATS);
  const [testHistory, setTestHistory] = useState(EMPTY_ARRAY);
  const [wordPerformance, setWordPerformance] = useState(INITIAL_WORD_PERFORMANCE);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [error, setError] = useState(null);

  const [optimizationState, setOptimizationState] = useState({
    isProcessing: false,
    lastUpdate: Date.now(),
    forceUpdate: 0
  });

  // Helper function to safely get from localStorage
  const safeGetItem = useCallback((key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Error reading ${key}:`, error);
      return defaultValue;
    }
  }, []);

  // Helper function to safely set to localStorage
  const safeSetItem = useCallback((key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
      setError(new Error('Errore nel salvataggio dei dati. Controlla lo spazio disponibile.'));
      return false;
    }
  }, []);

  // ⭐ MEMOIZED SELECTORS with hints (from original) - FIXED
  const selectors = useMemo(() => {
    // ⭐ FIX: Check if stats exists and has required properties
    if (!stats) {
      return {
        totalTests: 0,
        totalAnswers: 0,
        totalHints: 0,
        accuracyRate: 0,
        hintsRate: 0,
        isActiveToday: false,
        avgTimePerTest: 0
      };
    }

    const correctAnswers = stats.correctAnswers || 0;
    const incorrectAnswers = stats.incorrectAnswers || 0;
    const hintsUsed = stats.hintsUsed || 0;
    const testsCompleted = stats.testsCompleted || 0;
    const timeSpent = stats.timeSpent || 0;
    const dailyProgress = stats.dailyProgress || {};

    return {
      totalTests: testHistory.length,
      totalAnswers: correctAnswers + incorrectAnswers,
      totalHints: hintsUsed,
      accuracyRate: correctAnswers + incorrectAnswers > 0 
        ? Math.round((correctAnswers / (correctAnswers + incorrectAnswers)) * 100)
        : 0,
      hintsRate: correctAnswers + incorrectAnswers > 0 
        ? Math.round((hintsUsed / (correctAnswers + incorrectAnswers)) * 100)
        : 0,
      isActiveToday: (() => {
        const today = new Date().toISOString().split('T')[0];
        return Boolean(dailyProgress[today]?.tests > 0);
      })(),
      avgTimePerTest: testsCompleted > 0 
        ? Math.round(timeSpent / testsCompleted) 
        : 0
    };
  }, [
    stats,
    testHistory.length, 
    stats?.correctAnswers, 
    stats?.incorrectAnswers, 
    stats?.hintsUsed,
    stats?.testsCompleted, 
    stats?.timeSpent, 
    stats?.dailyProgress
  ]);

  // ⭐ MEMOIZED WEEKLY PROGRESS (from original) - FIXED
  const weeklyProgress = useMemo(() => {
    // ⭐ FIX: Check if dailyProgress exists
    if (!stats || !stats.dailyProgress) {
      return [];
    }

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
  }, [stats, stats?.dailyProgress]);

  // ⭐ OPTIMIZED STREAK CALCULATION (from original)
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

  // Initialize data from localStorage
  const initializeData = useCallback(async () => {
    if (isInitialized) return;

    setIsLoading(true);
    setError(null);

    try {
      // Load data from localStorage
      const statsData = safeGetItem(STORAGE_CONFIG.keys.stats, INITIAL_STATS);
      const historyData = safeGetItem(STORAGE_CONFIG.keys.testHistory, EMPTY_ARRAY);
      const performanceData = safeGetItem(STORAGE_CONFIG.keys.wordPerformance, INITIAL_WORD_PERFORMANCE);

      setStats(statsData);
      setTestHistory(historyData);
      setWordPerformance(performanceData);
      setIsInitialized(true);
      setLastSync(Date.now());
    } catch (error) {
      console.error('Failed to initialize stats data:', error);
      setError(error);
      // Set defaults on error
      setStats(INITIAL_STATS);
      setTestHistory(EMPTY_ARRAY);
      setWordPerformance(INITIAL_WORD_PERFORMANCE);
      setIsInitialized(true);
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, safeGetItem]);

  // ⭐ BATCH OPERATIONS (from original)
  const performBatchUpdate = useCallback((updates) => {
    setOptimizationState(prev => ({ ...prev, isProcessing: true }));
    
    try {
      if (updates.stats) {
        safeSetItem(STORAGE_CONFIG.keys.stats, updates.stats);
        setStats(updates.stats);
      }
      if (updates.testHistory) {
        safeSetItem(STORAGE_CONFIG.keys.testHistory, updates.testHistory);
        setTestHistory(updates.testHistory);
      }
      if (updates.wordPerformance) {
        safeSetItem(STORAGE_CONFIG.keys.wordPerformance, updates.wordPerformance);
        setWordPerformance(updates.wordPerformance);
      }
      
      setOptimizationState(prev => ({
        ...prev,
        lastUpdate: Date.now(),
        forceUpdate: prev.forceUpdate + 1,
        isProcessing: false
      }));

      setLastSync(Date.now());
      
    } catch (error) {
      console.error('❌ Batch update error:', error);
      setError(error);
      setOptimizationState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [safeSetItem]);

  // ⭐ NEW: Word-specific analysis (COMPLETE from original)
  const getWordAnalysis = useCallback((wordId) => {
    // Ottieni i dati della parola
    const allWords = safeGetItem(STORAGE_CONFIG.keys.words, []);
    const word = allWords.find(w => w.id === wordId);
    
    if (!word) {
      return null;
    }
    
    const wordData = wordPerformance[wordId];
    
    if (!wordData || !wordData.attempts || wordData.attempts.length === 0) {
      return {
        id: wordId,
        english: word.english,
        italian: word.italian,
        chapter: word.chapter || '',
        group: word.group || '',
        sentence: word.sentence || '',
        notes: word.notes || '',
        learned: word.learned || false,
        difficult: word.difficult || false,
        totalAttempts: 0,
        correctAttempts: 0,
        incorrectAttempts: 0,
        accuracy: 0,
        recentAccuracy: 0,
        avgTime: 0,
        hintsUsed: 0,
        hintsPercentage: 0,
        currentStreak: 0,
        lastAttempt: null,
        status: 'new',
        trend: 'neutral',
        difficulty: 'unknown',
        needsWork: true,
        mastered: false,
        attempts: [],
        recommendations: ['Parola mai testata - inizia con un test per vedere le performance']
      };
    }

    const attempts = wordData.attempts || [];
    const totalAttempts = attempts.length;
    const correctAttempts = attempts.filter(a => a.correct).length;
    const hintsUsed = attempts.filter(a => a.usedHint).length;
    const lastAttempt = attempts[attempts.length - 1];
    
    // Calculate streak (from original)
    let currentStreak = 0;
    for (let i = attempts.length - 1; i >= 0; i--) {
      if (attempts[i].correct) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate improvement trend (from original)
    const recentAttempts = attempts.slice(-5);
    const recentCorrect = recentAttempts.filter(a => a.correct).length;
    const recentAccuracy = recentAttempts.length > 0 ? (recentCorrect / recentAttempts.length) * 100 : 0;

    // Word status classification (from original)
    let status = 'new';
    if (totalAttempts >= 3) {
      if (currentStreak >= 3) status = 'consolidated';
      else if (correctAttempts / totalAttempts >= 0.7) status = 'improving';
      else if (correctAttempts / totalAttempts <= 0.3) status = 'critical';
      else status = 'inconsistent';
    } else if (totalAttempts > 0) {
      status = currentStreak > 0 ? 'promising' : 'struggling';
    }

    const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;
    const avgTime = attempts.length > 0 ? Math.round(attempts.reduce((sum, a) => sum + (a.timeSpent || 0), 0) / attempts.length / 1000) : 0;

    return {
      id: wordId,
      english: word.english,
      italian: word.italian,
      chapter: word.chapter || '',
      group: word.group || '',
      sentence: word.sentence || '',
      notes: word.notes || '',
      learned: word.learned || false,
      difficult: word.difficult || false,
      totalAttempts,
      correctAttempts,
      incorrectAttempts: totalAttempts - correctAttempts,
      accuracy,
      hintsUsed,
      hintsPercentage: totalAttempts > 0 ? Math.round((hintsUsed / totalAttempts) * 100) : 0,
      currentStreak,
      lastAttempt,
      recentAccuracy: Math.round(recentAccuracy),
      status,
      avgTime,
      attempts: attempts.slice(-10), // Last 10 attempts for trend
      trend: 'stable', // Can be enhanced
      difficulty: accuracy < 50 ? 'hard' : accuracy < 80 ? 'medium' : 'easy',
      needsWork: accuracy < 70,
      mastered: accuracy >= 90 && currentStreak >= 3,
      recommendations: [] // Can be enhanced
    };
  }, [wordPerformance, safeGetItem]);

  // ⭐ NEW: Get all words with their performance (COMPLETE from original)
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

  // ⭐ ENHANCED: Record word performance (from original)
  const recordWordPerformance = useCallback((word, isCorrect, usedHint, timeSpent) => {
    const wordId = word.id;
    const attempt = {
      timestamp: new Date().toISOString(),
      correct: isCorrect,
      usedHint: usedHint || false,
      timeSpent: timeSpent || 0
    };

    const newPerformance = {
      ...wordPerformance,
      [wordId]: {
        english: word.english,
        italian: word.italian,
        chapter: word.chapter,
        attempts: [...(wordPerformance[wordId]?.attempts || []), attempt]
      }
    };

    setWordPerformance(newPerformance);
    safeSetItem(STORAGE_CONFIG.keys.wordPerformance, newPerformance);
  }, [wordPerformance, safeSetItem]);

  // ⭐ NEW: Smart Test Difficulty Calculator (COMPLETE from original)
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

  // ⭐ ENHANCED: Test completion with smart difficulty calculation (COMPLETE from original)
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
      testStats.wordTimes.forEach(wordTime => {
        const word = testWordsUsed.find(w => w.id === wordTime.wordId);
        if (word) {
          recordWordPerformance(word, wordTime.isCorrect, wordTime.usedHint, wordTime.timeSpent);
        }
      });
    }

    // Calculate smart difficulty
    const { difficulty, difficultyAnalysis } = calculateSmartTestDifficulty(testWordsUsed, getWordAnalysis);

    const testRecord = {
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

    const newStats = { ...stats };
    newStats.testsCompleted += 1;
    newStats.correctAnswers += testStats.correct;
    newStats.incorrectAnswers += testStats.incorrect;
    newStats.hintsUsed += testStats.hints || 0;
    newStats.timeSpent += testStats.totalTime || (Math.round(Math.random() * 10) + 5);
    
    const totalAnswers = newStats.correctAnswers + newStats.incorrectAnswers;
    newStats.averageScore = (newStats.correctAnswers / totalAnswers) * 100;

    const today = new Date().toISOString().split('T')[0];
    if (!newStats.dailyProgress[today]) {
      newStats.dailyProgress[today] = { tests: 0, correct: 0, incorrect: 0, hints: 0 };
    }
    newStats.dailyProgress[today].tests += 1;
    newStats.dailyProgress[today].correct += testStats.correct;
    newStats.dailyProgress[today].incorrect += testStats.incorrect;
    newStats.dailyProgress[today].hints += testStats.hints || 0;
    
    newStats.lastStudyDate = today;
    newStats.streakDays = calculateStreak(newStats.dailyProgress);

    const newHistory = [testRecord, ...testHistory];

    performBatchUpdate({
      stats: newStats,
      testHistory: newHistory
    });

    console.log(`✅ Test completato! Risultato: ${testRecord.percentage}% (Difficoltà: ${difficulty})`);
    return testRecord;
  }, [stats, testHistory, calculateStreak, performBatchUpdate, recordWordPerformance, calculateSmartTestDifficulty, getWordAnalysis]);

  // ⭐ OPTIMIZED MIGRATION (from original)
  const optimizedMigration = useCallback(() => {
    if (testHistory.length === 0) return;

    const migrationData = testHistory.reduce((acc, test) => {
      acc.correctAnswers += test.correctWords || 0;
      acc.incorrectAnswers += test.incorrectWords || 0;
      acc.hintsUsed += test.hintsUsed || 0;
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
        acc.dailyProgress[testDate].hints += test.hintsUsed || 0;
        
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
          acc.categoriesProgress[chapter].hints += chapterData.hintsUsed || 0;
        });
      }

      return acc;
    }, {
      correctAnswers: 0,
      incorrectAnswers: 0,
      hintsUsed: 0,
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
    console.log(`✅ Migrati ${testHistory.length} test!`);
  }, [testHistory, calculateStreak, performBatchUpdate]);

  // ⭐ EXPORT DATA - COMPLETE from original
  const exportData = useCallback(() => {
    try {
      setIsLoading(true);
      
      // Get words from localStorage
      const words = safeGetItem(STORAGE_CONFIG.keys.words, []);

      const exportData = {
        words,
        stats,
        testHistory,
        wordPerformance,
        exportDate: new Date().toISOString(),
        version: '2.4',
        dataTypes: ['words', 'stats', 'testHistory', 'wordPerformance'],
        totalTests: testHistory.length,
        totalWords: words.length,
        totalWordPerformance: Object.keys(wordPerformance).length,
        description: 'Backup completo v2.4: parole + statistiche + cronologia test + performance parole + difficoltà intelligente'
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `vocabulary-complete-backup-v2.4-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log(`✅ Backup v2.4 esportato! (${words.length} parole + ${testHistory.length} test + ${Object.keys(wordPerformance).length} performance)`);
    } catch (error) {
      console.error('❌ Export failed:', error);
      alert(`Errore durante l'esportazione: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [stats, testHistory, wordPerformance, safeGetItem]);

  // ⭐ IMPORT DATA - COMPLETE from original
  const importData = useCallback((jsonString) => {
    try {
      setOptimizationState(prev => ({ ...prev, isProcessing: true }));
      setIsLoading(true);

      const importedData = JSON.parse(jsonString);
      
      const hasWords = importedData.words && Array.isArray(importedData.words);
      const hasStats = importedData.stats && typeof importedData.stats === 'object';
      const hasHistory = importedData.testHistory && Array.isArray(importedData.testHistory);
      const hasWordPerformance = importedData.wordPerformance && typeof importedData.wordPerformance === 'object';
      
      if (!hasWords && !hasStats && !hasHistory) {
        throw new Error('File non contiene dati validi (parole, statistiche o cronologia)');
      }
      
      const isNewFormat = importedData.version === '2.4' && hasWords;
      const isEnhancedBackup = importedData.version === '2.3' && hasWordPerformance;
      
      let confirmMessage = '';
      if (isNewFormat) {
        confirmMessage = `Backup Completo v2.4 rilevato (${importedData.words?.length || 0} parole + ${importedData.testHistory?.length || 0} test + ${Object.keys(importedData.wordPerformance || {}).length} performance).\nOK = Sostituisci tutto | Annulla = Combina`;
      } else if (isEnhancedBackup) {
        confirmMessage = `Backup Enhanced v2.3 rilevato (${importedData.testHistory?.length || 0} test + ${Object.keys(importedData.wordPerformance || {}).length} performance).\nOK = Sostituisci tutto | Annulla = Combina\n⚠️ ATTENZIONE: Non contiene parole!`;
      } else {
        confirmMessage = `Backup standard rilevato.\nOK = Sostituisci | Annulla = Combina`;
      }
      
      const shouldOverwrite = window.confirm(confirmMessage);
      
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
          safeSetItem(STORAGE_CONFIG.keys.words, importedWords);
        }
        
        const components = [];
        if (hasWords) components.push(`${importedWords.length} parole`);
        if (hasHistory) components.push(`${newHistory.length} test`);
        if (hasWordPerformance) components.push(`${Object.keys(newWordPerformance).length} performance`);
        
        console.log(`✅ Backup ${isNewFormat ? 'v2.4' : isEnhancedBackup ? 'v2.3' : 'standard'} importato! ${components.join(' + ')}`);
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
          const currentWords = safeGetItem(STORAGE_CONFIG.keys.words, []);
          const existingEnglish = new Set(currentWords.map(w => w.english.toLowerCase()));
          const newWords = importedData.words.filter(word => 
            !existingEnglish.has(word.english.toLowerCase())
          );
          
          if (newWords.length > 0) {
            importedWords = [...currentWords, ...newWords];
            safeSetItem(STORAGE_CONFIG.keys.words, importedWords);
          } else {
            importedWords = currentWords;
          }
        }
        
        console.log('✅ Dati combinati!');
      }
      
      performBatchUpdate({ 
        stats: newStats, 
        testHistory: newHistory,
        wordPerformance: newWordPerformance
      });
      
      if (hasWords) {
        localStorage.setItem('vocabularyWords_lastUpdate', Date.now().toString());
      }

      alert('✅ Importazione completata con successo!');
      
    } catch (error) {
      console.error('❌ Import failed:', error);
      alert(`Errore durante l'importazione: ${error.message}`);
      throw error;
    } finally {
      setIsLoading(false);
      setOptimizationState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [stats, testHistory, wordPerformance, performBatchUpdate, safeSetItem, safeGetItem]);

  // ⭐ CLEAR TEST HISTORY
  const clearTestHistory = useCallback(() => {
    try {
      setIsLoading(true);
      
      console.log('🗑️ Clearing test history...');
      
      const clearedStats = {
        ...INITIAL_STATS,
        totalWords: stats.totalWords,
        migrated: true
      };

      performBatchUpdate({
        stats: clearedStats,
        testHistory: EMPTY_ARRAY,
        wordPerformance: INITIAL_WORD_PERFORMANCE
      });
      
      console.log('✅ Test history cleared');
      alert('✅ Cronologia test cancellata!');
      
    } catch (error) {
      console.error('❌ Failed to clear test history:', error);
      alert(`Errore durante la cancellazione: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [stats.totalWords, performBatchUpdate]);

  // ⭐ REFRESH DATA from localStorage
  const refreshData = useCallback(() => {
    console.log('🔄 Refreshing data...');
    setIsInitialized(false);
  }, []);

  // ⭐ COMPUTED VALUES (from original) - FIXED
  const computedStats = useMemo(() => {
    // ⭐ FIX: Ensure all values are safe
    return {
      ...selectors,
      weeklyProgress,
      isMigrated: stats?.migrated || false,
      isProcessing: optimizationState.isProcessing,
      forceUpdate: optimizationState.forceUpdate
    };
  }, [selectors, weeklyProgress, stats?.migrated, optimizationState]);

  // Initialize on mount
  useEffect(() => {
    if (!isInitialized) {
      initializeData();
    }
  }, [isInitialized, initializeData]);

  // ⭐ AUTO-MIGRATION (from original) - FIXED
  useEffect(() => {
    // ⭐ FIX: Check if stats exists before accessing properties
    const shouldMigrate = stats && !stats.migrated && testHistory.length > 0 && !optimizationState.isProcessing;
    
    if (shouldMigrate) {
      const timeoutId = setTimeout(optimizedMigration, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [stats?.migrated, testHistory.length, optimizationState.isProcessing, optimizedMigration]);

  return {
    // Data
    stats,
    testHistory,
    wordPerformance,
    calculatedStats: computedStats,
    
    // State
    isInitialized,
    isLoading,
    error,
    lastSync,
    
    // ⭐ COMPLETE: All functions from original
    handleTestComplete,
    exportData,
    importData,
    clearTestHistory,
    refreshData,
    getAllWordsPerformance,
    getWordAnalysis,
    recordWordPerformance,
    
    // Additional functions for compatibility
    addTestToHistory: useCallback((testResult) => {
      const updatedHistory = [testResult, ...testHistory];
      performBatchUpdate({ testHistory: updatedHistory });
    }, [testHistory, performBatchUpdate]),

    resetStats: useCallback(() => {
      if (window.confirm('⚠️ Cancellare tutto (parole, test, statistiche)?')) {
        localStorage.removeItem(STORAGE_CONFIG.keys.words);
        localStorage.removeItem('vocabularyWords_lastUpdate');
        
        performBatchUpdate({
          stats: { ...INITIAL_STATS, migrated: true },
          testHistory: EMPTY_ARRAY,
          wordPerformance: INITIAL_WORD_PERFORMANCE
        });
        console.log('✅ Tutti i dati cancellati (parole, test, statistiche)!');
      }
    }, [performBatchUpdate]),

    clearHistoryOnly: useCallback(() => {
      if (window.confirm(`Cancellare ${testHistory.length} test?`)) {
        performBatchUpdate({ 
          testHistory: EMPTY_ARRAY,
          stats: {
            ...INITIAL_STATS,
            totalWords: stats?.totalWords || 0,
            migrated: true
          }
        });
        console.log('✅ Cronologia cancellata!');
      }
    }, [testHistory.length, performBatchUpdate, stats?.totalWords]),
    
    // Computed values from original
    ...computedStats
  };
};