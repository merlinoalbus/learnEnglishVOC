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

  // ⭐ ENHANCED: Test completion with word tracking
  const handleTestComplete = useCallback((testStats, testWordsUsed, wrongWordsArray) => {
    console.log('📊 handleTestComplete called with:', { testStats, testWordsUsed: testWordsUsed.length, wrongWords: wrongWordsArray.length });

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
          difficulty: testWordsUsed.length < 10 ? 'easy' : testWordsUsed.length < 25 ? 'medium' : 'hard'
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

    console.log('📊 Updating stats with:', updates.stats);
    performBatchUpdate(updates);
    showSuccess(`✅ Test completato! Risultato: ${updates.testHistory[0].percentage}%`);
  }, [stats, testHistory, calculateStreak, performBatchUpdate, showSuccess, recordWordPerformance]);

  // ⭐ EXPORT/IMPORT FUNCTIONS (enhanced)
  const exportStats = useCallback(() => {
    try {
      const exportData = {
        stats,
        testHistory,
        wordPerformance, // ⭐ NEW: Include word performance
        exportDate: new Date().toISOString(),
        version: '2.1', // ⭐ Updated version
        dataTypes: ['stats', 'testHistory', 'wordPerformance'],
        totalTests: testHistory.length,
        totalWords: Object.keys(wordPerformance).length,
        description: 'Backup completo v2.1: statistiche avanzate + cronologia test + performance parole'
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `vocabulary-complete-backup-v2.1-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showSuccess(`✅ Backup v2.1 esportato! (${testHistory.length} test + ${Object.keys(wordPerformance).length} parole)`);
    } catch (error) {
      showError(error, 'Export');
    }
  }, [stats, testHistory, wordPerformance, showSuccess, showError]);

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
          
          const isEnhancedBackup = importedData.version === '2.1' && importedData.wordPerformance;
          
          if (!importedData.stats && !importedData.testHistory) {
            throw new Error('Dati non validi');
          }
          
          const shouldOverwrite = window.confirm(
            isEnhancedBackup 
              ? `Backup Enhanced v2.1 rilevato (${importedData.testHistory?.length || 0} test + ${Object.keys(importedData.wordPerformance || {}).length} parole).\nOK = Sostituisci tutto | Annulla = Combina`
              : `Backup standard rilevato.\nOK = Sostituisci | Annulla = Combina`
          );
          
          let newStats = stats;
          let newHistory = testHistory;
          let newWordPerformance = wordPerformance;
          
          if (isEnhancedBackup) {
            if (shouldOverwrite) {
              newStats = { ...importedData.stats, migrated: true };
              newHistory = [...(importedData.testHistory || [])];
              newWordPerformance = { ...importedData.wordPerformance };
              showSuccess(`✅ Backup Enhanced importato! ${newHistory.length} test + ${Object.keys(newWordPerformance).length} parole`);
            } else {
              // Combine data
              const existingIds = new Set(testHistory.map(test => test.id));
              const newTests = (importedData.testHistory || []).filter(test => !existingIds.has(test.id));
              newHistory = [...testHistory, ...newTests].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
              
              // Merge word performance
              newWordPerformance = { ...wordPerformance };
              Object.entries(importedData.wordPerformance || {}).forEach(([wordId, data]) => {
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
              
              showSuccess(`✅ Dati combinati! +${newTests.length} test, ${Object.keys(importedData.wordPerformance || {}).length} parole performance`);
            }
          }
          
          performBatchUpdate({ 
            stats: newStats, 
            testHistory: newHistory,
            wordPerformance: newWordPerformance
          });
          resolve({ newStats, newHistory, newWordPerformance });
          
        } catch (error) {
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
      if (window.confirm('⚠️ Cancellare tutto?')) {
        performBatchUpdate({
          stats: { ...INITIAL_STATS, migrated: true },
          testHistory: EMPTY_ARRAY,
          wordPerformance: INITIAL_WORD_PERFORMANCE
        });
        showSuccess('✅ Tutti i dati cancellati!');
      }
    }, [performBatchUpdate, showSuccess]),
    
    clearHistoryOnly: useCallback(() => {
      if (window.confirm(`Cancellare ${testHistory.length} test?`)) {
        performBatchUpdate({ testHistory: EMPTY_ARRAY });
        showSuccess('✅ Cronologia cancellata!');
      }
    }, [testHistory.length, performBatchUpdate, showSuccess]),

    exportStats,
    importStats,
    
    ...computedStats
  };
};

export { useOptimizedStats as useStats };