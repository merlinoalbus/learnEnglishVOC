import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { useNotification } from '../contexts/NotificationContext';

const INITIAL_STATS = {
  totalWords: 0,
  correctAnswers: 0,
  incorrectAnswers: 0,
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

const EMPTY_ARRAY = [];

export const useOptimizedStats = () => {
  const [testHistory, setTestHistory] = useLocalStorage('testHistory', EMPTY_ARRAY);
  const [stats, setStats] = useLocalStorage('vocabularyStats', INITIAL_STATS);
  const { showSuccess, showError } = useNotification();
  
  const [optimizationState, setOptimizationState] = useState({
    isProcessing: false,
    lastUpdate: Date.now(),
    forceUpdate: 0
  });

  // ⭐ MEMOIZED SELECTORS
  const selectors = useMemo(() => ({
    totalTests: testHistory.length,
    totalAnswers: stats.correctAnswers + stats.incorrectAnswers,
    accuracyRate: stats.correctAnswers + stats.incorrectAnswers > 0 
      ? Math.round((stats.correctAnswers / (stats.correctAnswers + stats.incorrectAnswers)) * 100)
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
    stats.testsCompleted, 
    stats.timeSpent, 
    stats.dailyProgress
  ]);

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
      incorrect: stats.dailyProgress[date]?.incorrect || 0
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
  }, [setStats, setTestHistory, showError]);

  // ⭐ OPTIMIZED MIGRATION
  const optimizedMigration = useCallback(() => {
    if (testHistory.length === 0) return;

    const migrationData = testHistory.reduce((acc, test) => {
      acc.correctAnswers += test.correctWords || 0;
      acc.incorrectAnswers += test.incorrectWords || 0;
      acc.totalWords = Math.max(acc.totalWords, test.totalWords || 0);
      acc.timeSpent += test.timeSpent || Math.floor(Math.random() * 6) + 5;

      if (test.timestamp) {
        const testDate = new Date(test.timestamp).toISOString().split('T')[0];
        if (!acc.dailyProgress[testDate]) {
          acc.dailyProgress[testDate] = { tests: 0, correct: 0, incorrect: 0 };
        }
        acc.dailyProgress[testDate].tests += 1;
        acc.dailyProgress[testDate].correct += test.correctWords || 0;
        acc.dailyProgress[testDate].incorrect += test.incorrectWords || 0;
        
        if (!acc.lastStudyDate || testDate > acc.lastStudyDate) {
          acc.lastStudyDate = testDate;
        }
      }

      if (test.chapterStats) {
        Object.entries(test.chapterStats).forEach(([chapter, chapterData]) => {
          if (!acc.categoriesProgress[chapter]) {
            acc.categoriesProgress[chapter] = { correct: 0, total: 0 };
          }
          acc.categoriesProgress[chapter].correct += chapterData.correctWords || 0;
          acc.categoriesProgress[chapter].total += chapterData.totalWords || 0;
        });
      }

      return acc;
    }, {
      correctAnswers: 0,
      incorrectAnswers: 0,
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

  // ⭐ OPTIMIZED TEST COMPLETION
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
      
      chapterStats[chapter] = {
        totalWords: chapterWords.length,
        correctWords: chapterWords.length - chapterWrongWords.length,
        incorrectWords: chapterWrongWords.length,
        percentage: chapterWords.length > 0 ? 
          Math.round(((chapterWords.length - chapterWrongWords.length) / chapterWords.length) * 100) : 0
      };
    });

    const updates = {
      stats: { ...stats },
      testHistory: [
        {
          id: Date.now(),
          timestamp: new Date(),
          totalWords: testStats.correct + testStats.incorrect,
          correctWords: testStats.correct,
          incorrectWords: testStats.incorrect,
          percentage: Math.round((testStats.correct / (testStats.correct + testStats.incorrect)) * 100),
          wrongWords: [...wrongWordsArray],
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

    // Update stats
    updates.stats.testsCompleted += 1;
    updates.stats.correctAnswers += testStats.correct;
    updates.stats.incorrectAnswers += testStats.incorrect;
    updates.stats.timeSpent += Math.round(Math.random() * 10) + 5;
    
    const totalAnswers = updates.stats.correctAnswers + updates.stats.incorrectAnswers;
    updates.stats.averageScore = (updates.stats.correctAnswers / totalAnswers) * 100;

    const today = new Date().toISOString().split('T')[0];
    if (!updates.stats.dailyProgress[today]) {
      updates.stats.dailyProgress[today] = { tests: 0, correct: 0, incorrect: 0 };
    }
    updates.stats.dailyProgress[today].tests += 1;
    updates.stats.dailyProgress[today].correct += testStats.correct;
    updates.stats.dailyProgress[today].incorrect += testStats.incorrect;
    
    updates.stats.lastStudyDate = today;
    updates.stats.streakDays = calculateStreak(updates.stats.dailyProgress);

    performBatchUpdate(updates);
    showSuccess(`✅ Test completato! Risultato: ${updates.testHistory[0].percentage}%`);
  }, [stats, testHistory, calculateStreak, performBatchUpdate, showSuccess]);

  // ⭐ EXPORT/IMPORT FUNCTIONS
  const exportStats = useCallback(() => {
    try {
      const exportData = {
        stats,
        testHistory,
        exportDate: new Date().toISOString(),
        version: '2.0',
        dataTypes: ['stats', 'testHistory'],
        totalTests: testHistory.length,
        description: 'Backup completo: statistiche avanzate + cronologia test'
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `vocabulary-complete-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showSuccess(`✅ Backup esportato! (${testHistory.length} test + statistiche)`);
    } catch (error) {
      showError(error, 'Export');
    }
  }, [stats, testHistory, showSuccess, showError]);

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
          
          const isCompleteBackup = importedData.version === '2.0' && importedData.testHistory;
          
          if (!importedData.stats && !importedData.testHistory) {
            throw new Error('Dati non validi');
          }
          
          const shouldOverwrite = window.confirm(
            isCompleteBackup 
              ? `Backup completo rilevato (${importedData.testHistory?.length || 0} test).\nOK = Sostituisci tutto | Annulla = Combina`
              : `Backup statistiche rilevato.\nOK = Sostituisci | Annulla = Combina`
          );
          
          let newStats = stats;
          let newHistory = testHistory;
          
          if (isCompleteBackup) {
            if (shouldOverwrite) {
              newStats = { ...importedData.stats, migrated: true };
              newHistory = [...(importedData.testHistory || [])];
              showSuccess(`✅ Backup completo importato! ${newHistory.length} test ripristinati`);
            } else {
              const existingIds = new Set(testHistory.map(test => test.id));
              const newTests = (importedData.testHistory || []).filter(test => !existingIds.has(test.id));
              newHistory = [...testHistory, ...newTests].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
              
              newStats = { ...stats };
              if (importedData.stats) {
                newStats.correctAnswers += importedData.stats.correctAnswers || 0;
                newStats.incorrectAnswers += importedData.stats.incorrectAnswers || 0;
                newStats.testsCompleted += importedData.stats.testsCompleted || 0;
                newStats.timeSpent += importedData.stats.timeSpent || 0;
                
                const totalAnswers = newStats.correctAnswers + newStats.incorrectAnswers;
                newStats.averageScore = totalAnswers > 0 ? (newStats.correctAnswers / totalAnswers) * 100 : 0;
                newStats.migrated = true;
              }
              
              showSuccess(`✅ Dati combinati! +${newTests.length} test aggiunti`);
            }
          }
          
          performBatchUpdate({ stats: newStats, testHistory: newHistory });
          resolve({ newStats, newHistory });
          
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
  }, [stats, testHistory, performBatchUpdate, showSuccess, showError, optimizationState.isProcessing]);

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
    calculatedStats: computedStats,
    
    handleTestComplete,
    addTestToHistory: useCallback((testResult) => {
      const updatedHistory = [testResult, ...testHistory];
      performBatchUpdate({ testHistory: updatedHistory });
    }, [testHistory, performBatchUpdate]),
    
    refreshData: useCallback(() => {
      if (optimizationState.isProcessing) return;
      
      try {
        const freshHistory = JSON.parse(localStorage.getItem('testHistory') || '[]');
        const freshStats = JSON.parse(localStorage.getItem('vocabularyStats') || JSON.stringify(INITIAL_STATS));
        
        performBatchUpdate({
          stats: freshStats,
          testHistory: freshHistory
        });
      } catch (error) {
        showError(error, 'Refresh');
      }
    }, [optimizationState.isProcessing, performBatchUpdate, showError]),
    
    resetStats: useCallback(() => {
      if (window.confirm('⚠️ Cancellare tutto?')) {
        performBatchUpdate({
          stats: { ...INITIAL_STATS, migrated: true },
          testHistory: EMPTY_ARRAY
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
// ⭐ EXPORT ALIAS per compatibilità
export { useOptimizedStats as useStats };