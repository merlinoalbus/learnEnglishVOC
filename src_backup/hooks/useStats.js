// hooks/useStats.js - Versione Centralizzata e Sincronizzata
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { useNotification } from './useNotification';

export const useStats = () => {
  // ⭐ CENTRALIZZATO: Un solo punto di accesso per entrambi i dati
  const [testHistory, setTestHistory] = useLocalStorage('testHistory', []);
  const [stats, setStats] = useLocalStorage('vocabularyStats', {
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
  });

  const { showNotification } = useNotification();
  
  // ⭐ SISTEMA DI SINCRONIZZAZIONE MIGLIORATO
  const [forceUpdate, setForceUpdate] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // ⭐ FUNZIONE DI REFRESH ROBUSTA
  const refreshData = useCallback(() => {
    if (isProcessing) return; // Evita sovrapposizioni
    
    try {
      setIsProcessing(true);
      
      // Forza rilettura da localStorage
      const freshHistoryStr = localStorage.getItem('testHistory');
      const freshStatsStr = localStorage.getItem('vocabularyStats');
      
      if (freshHistoryStr) {
        const freshHistory = JSON.parse(freshHistoryStr);
        setTestHistory(freshHistory);
      }
      
      if (freshStatsStr) {
        const freshStats = JSON.parse(freshStatsStr);
        setStats(freshStats);
      }
      
      // Forza re-render
      setForceUpdate(prev => prev + 1);
      
      console.log('🔄 Dati aggiornati:', {
        history: freshHistoryStr ? JSON.parse(freshHistoryStr).length : 0,
        statsTests: freshStatsStr ? JSON.parse(freshStatsStr).testsCompleted : 0
      });
      
    } catch (error) {
      console.error('❌ Errore refresh:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [setTestHistory, setStats, isProcessing]);

  // ⭐ FUNZIONE DI SALVATAGGIO SINCRONIZZATO
  const saveDataSync = useCallback((newStats, newHistory) => {
    try {
      setIsProcessing(true);
      
      // Salva entrambi contemporaneamente
      if (newStats) {
        localStorage.setItem('vocabularyStats', JSON.stringify(newStats));
        setStats(newStats);
      }
      
      if (newHistory) {
        localStorage.setItem('testHistory', JSON.stringify(newHistory));
        setTestHistory(newHistory);
      }
      
      // Forza aggiornamento
      setTimeout(() => {
        setForceUpdate(prev => prev + 1);
        setIsProcessing(false);
      }, 50);
      
    } catch (error) {
      console.error('❌ Errore salvataggio sincronizzato:', error);
      setIsProcessing(false);
    }
  }, [setStats, setTestHistory]);

  // Calcola streak di giorni consecutivi
  const calculateStreak = useCallback((dailyProgress) => {
    const today = new Date();
    let streak = 0;
    
    for (let i = 0; i < 365; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      if (dailyProgress[dateStr] && dailyProgress[dateStr].tests > 0) {
        streak++;
      } else if (i === 0) {
        continue;
      } else {
        break;
      }
    }
    
    return streak;
  }, []);

  // ⭐ MIGRAZIONE MIGLIORATA
  const migrateFromTestHistory = useCallback(() => {
    if (testHistory.length === 0) return;

    const migratedStats = {
      totalWords: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      averageScore: 0,
      testsCompleted: testHistory.length,
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
      migrated: true
    };

    // Elabora ogni test nella cronologia
    testHistory.forEach(test => {
      migratedStats.correctAnswers += test.correctWords || 0;
      migratedStats.incorrectAnswers += test.incorrectWords || 0;
      migratedStats.totalWords = Math.max(migratedStats.totalWords, test.totalWords || 0);
      
      const estimatedTime = test.timeSpent || Math.floor(Math.random() * 6) + 5;
      migratedStats.timeSpent += estimatedTime;

      if (test.timestamp) {
        const testDate = new Date(test.timestamp).toISOString().split('T')[0];
        if (!migratedStats.dailyProgress[testDate]) {
          migratedStats.dailyProgress[testDate] = { tests: 0, correct: 0, incorrect: 0 };
        }
        migratedStats.dailyProgress[testDate].tests += 1;
        migratedStats.dailyProgress[testDate].correct += test.correctWords || 0;
        migratedStats.dailyProgress[testDate].incorrect += test.incorrectWords || 0;
        
        if (!migratedStats.lastStudyDate || testDate > migratedStats.lastStudyDate) {
          migratedStats.lastStudyDate = testDate;
        }
      }

      if (test.chapterStats) {
        Object.entries(test.chapterStats).forEach(([chapter, chapterData]) => {
          if (!migratedStats.categoriesProgress[chapter]) {
            migratedStats.categoriesProgress[chapter] = { correct: 0, total: 0 };
          }
          migratedStats.categoriesProgress[chapter].correct += chapterData.correctWords || 0;
          migratedStats.categoriesProgress[chapter].total += chapterData.totalWords || 0;
        });
      }

      const difficulty = test.difficulty || 'medium';
      if (migratedStats.difficultyStats[difficulty]) {
        migratedStats.difficultyStats[difficulty].correct += test.correctWords || 0;
        migratedStats.difficultyStats[difficulty].total += test.totalWords || 0;
      }

      if (test.timestamp) {
        const month = new Date(test.timestamp).toISOString().substring(0, 7);
        if (!migratedStats.monthlyStats[month]) {
          migratedStats.monthlyStats[month] = { tests: 0, correct: 0, incorrect: 0, timeSpent: 0 };
        }
        migratedStats.monthlyStats[month].tests += 1;
        migratedStats.monthlyStats[month].correct += test.correctWords || 0;
        migratedStats.monthlyStats[month].incorrect += test.incorrectWords || 0;
        migratedStats.monthlyStats[month].timeSpent += estimatedTime;
      }
    });

    const totalAnswers = migratedStats.correctAnswers + migratedStats.incorrectAnswers;
    migratedStats.averageScore = totalAnswers > 0 ? (migratedStats.correctAnswers / totalAnswers) * 100 : 0;
    migratedStats.streakDays = calculateStreak(migratedStats.dailyProgress);

    // ⭐ SALVATAGGIO SINCRONIZZATO
    saveDataSync(migratedStats, testHistory);
    showNotification(`✅ Migrati ${testHistory.length} test dalla cronologia!`);
    console.log('✅ Migrazione completata:', migratedStats);
    
  }, [testHistory, calculateStreak, saveDataSync, showNotification]);

  // ⭐ AGGIORNA STATISTICHE DOPO TEST
  const updateTestStats = useCallback((testResults) => {
    const newStats = { ...stats };
    
    newStats.testsCompleted += 1;
    newStats.correctAnswers += testResults.correct;
    newStats.incorrectAnswers += testResults.incorrect;
    newStats.totalWords = Math.max(newStats.totalWords, testResults.totalWords);
    newStats.averageScore = ((newStats.correctAnswers / (newStats.correctAnswers + newStats.incorrectAnswers)) * 100);
    newStats.timeSpent += testResults.timeSpent || 0;
    
    if (testResults.category) {
      if (!newStats.categoriesProgress[testResults.category]) {
        newStats.categoriesProgress[testResults.category] = { correct: 0, total: 0 };
      }
      newStats.categoriesProgress[testResults.category].correct += testResults.correct;
      newStats.categoriesProgress[testResults.category].total += testResults.correct + testResults.incorrect;
    }
    
    const today = new Date().toISOString().split('T')[0];
    if (!newStats.dailyProgress[today]) {
      newStats.dailyProgress[today] = { tests: 0, correct: 0, incorrect: 0 };
    }
    newStats.dailyProgress[today].tests += 1;
    newStats.dailyProgress[today].correct += testResults.correct;
    newStats.dailyProgress[today].incorrect += testResults.incorrect;
    
    newStats.lastStudyDate = today;
    newStats.streakDays = calculateStreak(newStats.dailyProgress);
    
    if (testResults.difficulty) {
      const difficulty = testResults.difficulty.toLowerCase();
      if (newStats.difficultyStats[difficulty]) {
        newStats.difficultyStats[difficulty].correct += testResults.correct;
        newStats.difficultyStats[difficulty].total += testResults.correct + testResults.incorrect;
      }
    }
    
    const currentMonth = new Date().toISOString().substring(0, 7);
    if (!newStats.monthlyStats[currentMonth]) {
      newStats.monthlyStats[currentMonth] = { tests: 0, correct: 0, incorrect: 0, timeSpent: 0 };
    }
    newStats.monthlyStats[currentMonth].tests += 1;
    newStats.monthlyStats[currentMonth].correct += testResults.correct;
    newStats.monthlyStats[currentMonth].incorrect += testResults.incorrect;
    newStats.monthlyStats[currentMonth].timeSpent += testResults.timeSpent || 0;
    
    // ⭐ SALVATAGGIO SINCRONIZZATO
    saveDataSync(newStats, null);
  }, [stats, saveDataSync, calculateStreak]);

  // ⭐ EXPORT COMPLETO MIGLIORATO
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
      
      showNotification(`✅ Backup completo esportato! (${testHistory.length} test + statistiche)`);
    } catch (error) {
      console.error('❌ Errore export:', error);
      showNotification('❌ Errore durante l\'esportazione');
    }
  }, [stats, testHistory, showNotification]);

  // ⭐ IMPORT COMPLETO MIGLIORATO
  const importStats = useCallback((file) => {
    return new Promise((resolve, reject) => {
      if (isProcessing) {
        reject(new Error('Operazione già in corso'));
        return;
      }

      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          setIsProcessing(true);
          const importedData = JSON.parse(e.target.result);
          
          const isCompleteBackup = importedData.version === '2.0' && importedData.testHistory;
          
          // Validazione
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
              showNotification(`✅ Backup completo importato! ${newHistory.length} test ripristinati`);
            } else {
              // Combina cronologie
              const existingIds = new Set(testHistory.map(test => test.id));
              const newTests = (importedData.testHistory || []).filter(test => !existingIds.has(test.id));
              newHistory = [...testHistory, ...newTests].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
              
              // Combina statistiche
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
              
              showNotification(`✅ Dati combinati! +${newTests.length} test aggiunti`);
            }
          } else {
            // Solo statistiche
            if (shouldOverwrite) {
              newStats = { ...importedData.stats, migrated: true };
            } else {
              newStats = { ...stats };
              newStats.correctAnswers += importedData.stats.correctAnswers || 0;
              newStats.incorrectAnswers += importedData.stats.incorrectAnswers || 0;
              newStats.testsCompleted += importedData.stats.testsCompleted || 0;
              newStats.timeSpent += importedData.stats.timeSpent || 0;
              
              const totalAnswers = newStats.correctAnswers + newStats.incorrectAnswers;
              newStats.averageScore = totalAnswers > 0 ? (newStats.correctAnswers / totalAnswers) * 100 : 0;
              newStats.migrated = true;
            }
            showNotification('✅ Statistiche importate!');
          }
          
          // ⭐ SALVATAGGIO SINCRONIZZATO COMPLETO
          saveDataSync(newStats, newHistory);
          
          // ⭐ REFRESH MULTIPLI PER SICUREZZA
          setTimeout(() => {
            refreshData();
            setTimeout(() => refreshData(), 200);
          }, 100);
          
          resolve({ newStats, newHistory });
          
        } catch (error) {
          console.error('❌ Errore import:', error);
          showNotification('❌ Errore durante l\'importazione: file non valido');
          reject(error);
        } finally {
          setIsProcessing(false);
        }
      };
      
      reader.onerror = () => {
        setIsProcessing(false);
        const error = new Error('Errore lettura file');
        showNotification('❌ Errore nella lettura del file');
        reject(error);
      };
      
      reader.readAsText(file);
    });
  }, [stats, testHistory, saveDataSync, refreshData, showNotification, isProcessing]);

  // ⭐ RESET COMPLETO SINCRONIZZATO
  const resetStats = useCallback(() => {
    if (window.confirm('⚠️ ATTENZIONE: Vuoi cancellare TUTTO (statistiche + cronologia)?\nQuesta azione è irreversibile!')) {
      try {
        setIsProcessing(true);
        
        const emptyStats = {
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
          migrated: true
        };
        
        const emptyHistory = [];
        
        // ⭐ CANCELLAZIONE SINCRONIZZATA
        saveDataSync(emptyStats, emptyHistory);
        
        showNotification('✅ Tutti i dati sono stati cancellati!');
        
        // Refresh per sicurezza
        setTimeout(() => refreshData(), 100);
        
      } catch (error) {
        console.error('❌ Errore reset:', error);
        showNotification('❌ Errore durante la cancellazione');
      } finally {
        setIsProcessing(false);
      }
    }
  }, [saveDataSync, refreshData, showNotification]);

  // ⭐ CANCELLA SOLO CRONOLOGIA (mantiene statistiche)
  const clearHistoryOnly = useCallback(() => {
    if (window.confirm('Vuoi cancellare solo la cronologia test? (Le statistiche rimarranno)')) {
      try {
        setIsProcessing(true);
        const emptyHistory = [];
        saveDataSync(null, emptyHistory);
        showNotification('✅ Cronologia cancellata!');
        setTimeout(() => refreshData(), 100);
      } catch (error) {
        console.error('❌ Errore cancellazione cronologia:', error);
        showNotification('❌ Errore durante la cancellazione cronologia');
      } finally {
        setIsProcessing(false);
      }
    }
  }, [saveDataSync, refreshData, showNotification]);

  // ⭐ MIGRAZIONE FORZATA
  const forceMigration = useCallback(() => {
    if (window.confirm(`Vuoi ri-migrare ${testHistory.length} test dalla cronologia?`)) {
      const resetStats = { ...stats, migrated: false };
      saveDataSync(resetStats, null);
      
      setTimeout(() => {
        migrateFromTestHistory();
        setTimeout(() => refreshData(), 200);
      }, 100);
    }
  }, [testHistory, stats, saveDataSync, migrateFromTestHistory, refreshData]);

  // ⭐ AGGIUNGE TEST ALLA CRONOLOGIA (per nuovi test)
  const addTestToHistory = useCallback((testResult) => {
    try {
      const updatedHistory = [testResult, ...testHistory];
      saveDataSync(null, updatedHistory);
      console.log('✅ Test aggiunto alla cronologia:', testResult.id);
    } catch (error) {
      console.error('❌ Errore aggiunta test:', error);
    }
  }, [testHistory, saveDataSync]);

  // ⭐ FIXED: Statistiche calcolate senza forceUpdate nelle dipendenze
  const calculatedStats = useMemo(() => {
    const totalAnswers = stats.correctAnswers + stats.incorrectAnswers;
    const accuracyRate = totalAnswers > 0 ? (stats.correctAnswers / totalAnswers) * 100 : 0;
    
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    });
    
    const weeklyProgress = last7Days.map(date => ({
      date,
      tests: stats.dailyProgress[date]?.tests || 0,
      correct: stats.dailyProgress[date]?.correct || 0,
      incorrect: stats.dailyProgress[date]?.incorrect || 0
    }));
    
    return {
      accuracyRate: Math.round(accuracyRate * 100) / 100,
      totalAnswers,
      weeklyProgress,
      isActiveToday: stats.dailyProgress[new Date().toISOString().split('T')[0]]?.tests > 0,
      avgTimePerTest: stats.testsCompleted > 0 ? Math.round(stats.timeSpent / stats.testsCompleted) : 0
    };
  }, [stats]); // ⭐ FIXED: Rimosso forceUpdate dalle dipendenze

  // ⭐ MIGRAZIONE AUTOMATICA
  useEffect(() => {
    const shouldMigrate = (!stats.migrated && testHistory.length > 0) ||
                         (stats.migrated && testHistory.length > 0 && stats.testsCompleted === 0);
    
    if (shouldMigrate && !isProcessing) {
      console.log('🔄 Migrazione automatica...');
      migrateFromTestHistory();
    }
  }, [testHistory, stats.migrated, stats.testsCompleted, migrateFromTestHistory, isProcessing]);

  // ⭐ LISTENER CROSS-TAB
  useEffect(() => {
    const handleStorageChange = (e) => {
      if ((e.key === 'vocabularyStats' || e.key === 'testHistory') && !isProcessing) {
        console.log('📡 Storage change detected:', e.key);
        setTimeout(() => refreshData(), 50);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshData, isProcessing]);

  return {
    // ⭐ DATI CENTRALIZZATI
    stats,
    testHistory,
    calculatedStats,
    
    // ⭐ OPERAZIONI SINCRONIZZATE
    updateTestStats,
    addTestToHistory,
    exportStats,
    importStats,
    resetStats,
    clearHistoryOnly,
    forceMigration,
    
    // ⭐ UTILITÀ
    refreshData,
    isMigrated: stats.migrated,
    isProcessing,
    forceUpdate
  };
};