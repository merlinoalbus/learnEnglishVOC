// hooks/useStats.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { useNotification } from './useNotification';

export const useStats = () => {
  // ⭐ Accesso anche alla cronologia esistente per migrazione E backup completo
  const [testHistory, setTestHistory] = useLocalStorage('testHistory', []);
  
  const [stats, setStats] = useLocalStorage('vocabularyStats', {
    totalWords: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    averageScore: 0,
    testsCompleted: 0,
    timeSpent: 0, // in minuti
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
    migrated: false // ⭐ Flag per sapere se è già stata fatta la migrazione
  });

  const { showNotification } = useNotification();
  
  // ⭐ NUOVO: State per forzare re-render
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // ⭐ PRIMO: Definisci tutte le funzioni utility
  
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
        // Se oggi non hai studiato, controlla ieri
        continue;
      } else {
        break;
      }
    }
    
    return streak;
  }, []);

  // ⭐ MIGLIORATO: Funzione per forzare refresh dei dati più robusta
  const refreshData = useCallback(() => {
    try {
      // Ricarica dati dal localStorage manualmente
      const freshStatsStr = localStorage.getItem('vocabularyStats');
      const freshHistoryStr = localStorage.getItem('testHistory');
      
      console.log('🔄 Refreshing data - localStorage values:', {
        statsExists: !!freshStatsStr,
        historyLength: freshHistoryStr ? JSON.parse(freshHistoryStr).length : 0
      });
      
      if (freshStatsStr) {
        const freshStats = JSON.parse(freshStatsStr);
        setStats(freshStats);
        console.log('📊 Stats updated:', freshStats.testsCompleted, 'tests');
      }
      
      if (freshHistoryStr) {
        const freshHistory = JSON.parse(freshHistoryStr);
        setTestHistory(freshHistory);
        console.log('📅 History updated:', freshHistory.length, 'tests');
      }
      
      // Forza re-render di tutti i componenti dipendenti
      setRefreshTrigger(prev => {
        const newValue = prev + 1;
        console.log('🔄 Refresh trigger:', newValue);
        return newValue;
      });
      
    } catch (error) {
      console.error('❌ Errore durante refresh dati:', error);
      showNotification('Errore durante l\'aggiornamento dei dati');
    }
  }, [setStats, setTestHistory, showNotification]);

  // Salva statistiche
  const saveStats = useCallback((newStats) => {
    setStats(newStats);
  }, [setStats]);

  // Funzione di migrazione da testHistory a stats
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
      // Statistiche generali
      migratedStats.correctAnswers += test.correctWords || 0;
      migratedStats.incorrectAnswers += test.incorrectWords || 0;
      migratedStats.totalWords = Math.max(migratedStats.totalWords, test.totalWords || 0);
      
      // Tempo stimato (se non presente, stima 5-10 minuti per test)
      const estimatedTime = test.timeSpent || Math.floor(Math.random() * 6) + 5;
      migratedStats.timeSpent += estimatedTime;

      // Progresso giornaliero
      if (test.timestamp) {
        const testDate = new Date(test.timestamp).toISOString().split('T')[0];
        if (!migratedStats.dailyProgress[testDate]) {
          migratedStats.dailyProgress[testDate] = { tests: 0, correct: 0, incorrect: 0 };
        }
        migratedStats.dailyProgress[testDate].tests += 1;
        migratedStats.dailyProgress[testDate].correct += test.correctWords || 0;
        migratedStats.dailyProgress[testDate].incorrect += test.incorrectWords || 0;
        
        // Aggiorna ultima data di studio
        if (!migratedStats.lastStudyDate || testDate > migratedStats.lastStudyDate) {
          migratedStats.lastStudyDate = testDate;
        }
      }

      // Progresso per categoria da chapterStats
      if (test.chapterStats) {
        Object.entries(test.chapterStats).forEach(([chapter, chapterData]) => {
          if (!migratedStats.categoriesProgress[chapter]) {
            migratedStats.categoriesProgress[chapter] = { correct: 0, total: 0 };
          }
          migratedStats.categoriesProgress[chapter].correct += chapterData.correctWords || 0;
          migratedStats.categoriesProgress[chapter].total += chapterData.totalWords || 0;
        });
      }

      // Statistiche difficoltà
      const difficulty = test.difficulty || 'medium';
      if (migratedStats.difficultyStats[difficulty]) {
        migratedStats.difficultyStats[difficulty].correct += test.correctWords || 0;
        migratedStats.difficultyStats[difficulty].total += test.totalWords || 0;
      }

      // Statistiche mensili
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

    // Calcola precisione media
    const totalAnswers = migratedStats.correctAnswers + migratedStats.incorrectAnswers;
    migratedStats.averageScore = totalAnswers > 0 ? (migratedStats.correctAnswers / totalAnswers) * 100 : 0;

    // Calcola streak
    migratedStats.streakDays = calculateStreak(migratedStats.dailyProgress);

    // Salva i dati migrati
    localStorage.setItem('vocabularyStats', JSON.stringify(migratedStats));
    setStats(migratedStats);
    
    showNotification(`✅ Migrati ${testHistory.length} test dalla cronologia esistente!`);
    console.log('✅ Migrazione completata:', migratedStats);
    
    // ⭐ NUOVO: Refresh automatico dopo migrazione
    setTimeout(() => {
      refreshData();
    }, 100);
  }, [testHistory, setStats, showNotification, calculateStreak, refreshData]);

  // Aggiorna statistiche dopo un test
  const updateTestStats = useCallback((testResults) => {
    const newStats = { ...stats };
    
    newStats.testsCompleted += 1;
    newStats.correctAnswers += testResults.correct;
    newStats.incorrectAnswers += testResults.incorrect;
    newStats.totalWords = Math.max(newStats.totalWords, testResults.totalWords);
    newStats.averageScore = ((newStats.correctAnswers / (newStats.correctAnswers + newStats.incorrectAnswers)) * 100);
    newStats.timeSpent += testResults.timeSpent || 0;
    
    // Aggiorna progresso categorie
    if (testResults.category) {
      if (!newStats.categoriesProgress[testResults.category]) {
        newStats.categoriesProgress[testResults.category] = { correct: 0, total: 0 };
      }
      newStats.categoriesProgress[testResults.category].correct += testResults.correct;
      newStats.categoriesProgress[testResults.category].total += testResults.correct + testResults.incorrect;
    }
    
    // Aggiorna progresso giornaliero
    const today = new Date().toISOString().split('T')[0];
    if (!newStats.dailyProgress[today]) {
      newStats.dailyProgress[today] = { tests: 0, correct: 0, incorrect: 0 };
    }
    newStats.dailyProgress[today].tests += 1;
    newStats.dailyProgress[today].correct += testResults.correct;
    newStats.dailyProgress[today].incorrect += testResults.incorrect;
    
    // Aggiorna streak
    newStats.lastStudyDate = today;
    newStats.streakDays = calculateStreak(newStats.dailyProgress);
    
    // Aggiorna statistiche difficoltà
    if (testResults.difficulty) {
      const difficulty = testResults.difficulty.toLowerCase();
      if (newStats.difficultyStats[difficulty]) {
        newStats.difficultyStats[difficulty].correct += testResults.correct;
        newStats.difficultyStats[difficulty].total += testResults.correct + testResults.incorrect;
      }
    }
    
    // Aggiorna statistiche mensili
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
    if (!newStats.monthlyStats[currentMonth]) {
      newStats.monthlyStats[currentMonth] = { tests: 0, correct: 0, incorrect: 0, timeSpent: 0 };
    }
    newStats.monthlyStats[currentMonth].tests += 1;
    newStats.monthlyStats[currentMonth].correct += testResults.correct;
    newStats.monthlyStats[currentMonth].incorrect += testResults.incorrect;
    newStats.monthlyStats[currentMonth].timeSpent += testResults.timeSpent || 0;
    
    saveStats(newStats);
  }, [stats, saveStats, calculateStreak]);

  // ⭐ AGGIORNATO: Esporta statistiche E cronologia in JSON
  const exportStats = useCallback(() => {
    try {
      const exportData = {
        // Statistiche avanzate
        stats,
        // Cronologia completa
        testHistory,
        // Metadata
        exportDate: new Date().toISOString(),
        version: '2.0', // Aggiornata per backup completo
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
      console.error('Errore durante l\'esportazione completa:', error);
      showNotification('❌ Errore durante l\'esportazione del backup');
    }
  }, [stats, testHistory, showNotification]);

  // ⭐ AGGIORNATO: Valida i dati di importazione (stats + cronologia)
  const validateImportData = useCallback((data) => {
    if (!data || typeof data !== 'object') return false;
    
    // Valida sempre le statistiche se presenti
    if (data.stats) {
      const requiredFields = [
        'totalWords', 'correctAnswers', 'incorrectAnswers', 
        'averageScore', 'testsCompleted'
      ];
      
      const statsValid = requiredFields.every(field => 
        typeof data.stats[field] === 'number'
      );
      
      if (!statsValid) return false;
    }
    
    // Valida cronologia se presente (backup completo)
    if (data.testHistory) {
      if (!Array.isArray(data.testHistory)) return false;
      
      // Valida ogni test nella cronologia
      const historyValid = data.testHistory.every(test => 
        test && 
        typeof test === 'object' && 
        typeof test.id === 'number' &&
        typeof test.correctWords === 'number' &&
        typeof test.incorrectWords === 'number'
      );
      
      if (!historyValid) return false;
    }
    
    return true;
  }, []);

  // ⭐ NUOVA: Combina cronologie test
  const combineTestHistory = useCallback((existing, imported) => {
    const existingIds = new Set(existing.map(test => test.id));
    const newTests = imported.filter(test => !existingIds.has(test.id));
    
    // Unisci e ordina per timestamp (più recenti prima)
    const combined = [...existing, ...newTests].sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    return combined;
  }, []);

  // Combina statistiche esistenti con quelle importate
  const combineStats = useCallback((existing, imported) => {
    const combined = { ...existing };
    
    // Somma i valori numerici
    combined.totalWords = Math.max(existing.totalWords, imported.totalWords);
    combined.correctAnswers += imported.correctAnswers || 0;
    combined.incorrectAnswers += imported.incorrectAnswers || 0;
    combined.testsCompleted += imported.testsCompleted || 0;
    combined.timeSpent += imported.timeSpent || 0;
    combined.streakDays = Math.max(existing.streakDays, imported.streakDays || 0);
    
    // Ricalcola media
    const totalAnswers = combined.correctAnswers + combined.incorrectAnswers;
    combined.averageScore = totalAnswers > 0 ? (combined.correctAnswers / totalAnswers) * 100 : 0;
    
    // Combina progressi categorie
    Object.entries(imported.categoriesProgress || {}).forEach(([category, progress]) => {
      if (combined.categoriesProgress[category]) {
        combined.categoriesProgress[category].correct += progress.correct || 0;
        combined.categoriesProgress[category].total += progress.total || 0;
      } else {
        combined.categoriesProgress[category] = { ...progress };
      }
    });
    
    // Combina progresso giornaliero
    Object.entries(imported.dailyProgress || {}).forEach(([date, progress]) => {
      if (combined.dailyProgress[date]) {
        combined.dailyProgress[date].tests += progress.tests || 0;
        combined.dailyProgress[date].correct += progress.correct || 0;
        combined.dailyProgress[date].incorrect += progress.incorrect || 0;
      } else {
        combined.dailyProgress[date] = { ...progress };
      }
    });
    
    // Combina statistiche difficoltà
    Object.entries(imported.difficultyStats || {}).forEach(([difficulty, diffStats]) => {
      if (combined.difficultyStats[difficulty]) {
        combined.difficultyStats[difficulty].correct += diffStats.correct || 0;
        combined.difficultyStats[difficulty].total += diffStats.total || 0;
      } else {
        combined.difficultyStats[difficulty] = { ...diffStats };
      }
    });
    
    // Combina statistiche mensili
    Object.entries(imported.monthlyStats || {}).forEach(([month, monthStats]) => {
      if (combined.monthlyStats[month]) {
        combined.monthlyStats[month].tests += monthStats.tests || 0;
        combined.monthlyStats[month].correct += monthStats.correct || 0;
        combined.monthlyStats[month].incorrect += monthStats.incorrect || 0;
        combined.monthlyStats[month].timeSpent += monthStats.timeSpent || 0;
      } else {
        combined.monthlyStats[month] = { ...monthStats };
      }
    });
    
    combined.migrated = true;
    return combined;
  }, []);

  // ⭐ AGGIORNATO: Importa statistiche E cronologia da JSON
  const importStats = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result);
          
          // Riconosci tipo di backup
          const isCompleteBackup = importedData.version === '2.0' && importedData.testHistory;
          const isStatsOnly = importedData.version === '1.0' || !importedData.testHistory;
          
          console.log('Tipo backup rilevato:', isCompleteBackup ? 'Completo' : 'Solo statistiche');
          
          // Validazione dati
          if (!validateImportData(importedData)) {
            throw new Error('Formato dati non valido');
          }
          
          let importMessage = '';
          if (isCompleteBackup) {
            importMessage = `Backup completo rilevato:\n` +
              `• ${importedData.testHistory?.length || 0} test nella cronologia\n` +
              `• ${importedData.stats?.testsCompleted || 0} test nelle statistiche\n\n` +
              `Come vuoi procedere?\n\n` +
              `OK = Sostituisci tutto (cronologia + statistiche)\n` +
              `Annulla = Combina con i dati esistenti`;
          } else {
            importMessage = `Backup statistiche rilevato:\n` +
              `• ${importedData.stats?.testsCompleted || 0} test nelle statistiche\n\n` +
              `Come vuoi procedere?\n\n` +
              `OK = Sostituisci statistiche\n` +
              `Annulla = Combina statistiche`;
          }
          
          const shouldOverwrite = window.confirm(importMessage);
          
          let newStats = stats;
          let newTestHistory = testHistory;
          
          if (isCompleteBackup) {
            // Gestisci backup completo
            if (shouldOverwrite) {
              // Sostituisci tutto
              newStats = { ...importedData.stats, migrated: true };
              newTestHistory = [...(importedData.testHistory || [])];
              showNotification(`✅ Backup completo importato! ${newTestHistory.length} test ripristinati`);
            } else {
              // Combina tutto
              newStats = combineStats(stats, importedData.stats);
              newTestHistory = combineTestHistory(testHistory, importedData.testHistory || []);
              showNotification(`✅ Dati combinati! +${importedData.testHistory?.length || 0} test aggiunti`);
            }
          } else {
            // Gestisci solo statistiche
            if (shouldOverwrite) {
              newStats = { ...importedData.stats, migrated: true };
              showNotification('✅ Statistiche importate e sostituite!');
            } else {
              newStats = combineStats(stats, importedData.stats);
              showNotification('✅ Statistiche combinate con successo!');
            }
          }
          
          // ⭐ MIGLIORATO: Salva i nuovi dati con sincronizzazione forzata
          if (isCompleteBackup) {
            // Salva prima nel localStorage direttamente per essere sicuri
            localStorage.setItem('vocabularyStats', JSON.stringify(newStats));
            localStorage.setItem('testHistory', JSON.stringify(newTestHistory));
            
            // Poi aggiorna gli states
            saveStats(newStats);
            setTestHistory(newTestHistory);
          } else {
            // Solo statistiche
            localStorage.setItem('vocabularyStats', JSON.stringify(newStats));
            saveStats(newStats);
          }
          
          // ⭐ MIGLIORATO: Refresh più robusto con retry
          const doRefresh = () => {
            refreshData();
            // Secondo refresh per essere sicuri
            setTimeout(() => {
              refreshData();
            }, 300);
          };
          
          setTimeout(doRefresh, 100);
          
          resolve({ newStats, newTestHistory });
        } catch (error) {
          console.error('Errore durante l\'importazione:', error);
          showNotification('❌ Errore durante l\'importazione: file non valido');
          reject(error);
        }
      };
      
      reader.onerror = () => {
        const error = new Error('Errore nella lettura del file');
        showNotification('❌ Errore nella lettura del file');
        reject(error);
      };
      
      reader.readAsText(file);
    });
  }, [stats, testHistory, saveStats, setTestHistory, showNotification, validateImportData, combineStats, combineTestHistory, refreshData]);

  // ⭐ MIGLIORATO: Reset statistiche con refresh automatico
  const resetStats = useCallback(() => {
    if (window.confirm('Sei sicuro di voler resettare tutte le statistiche? Questa azione non può essere annullata.')) {
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
      
      // Salva prima nel localStorage direttamente
      localStorage.setItem('vocabularyStats', JSON.stringify(emptyStats));
      
      // Poi aggiorna lo state
      saveStats(emptyStats);
      
      showNotification('Statistiche resettate con successo!');
      
      // ⭐ NUOVO: Forza refresh dopo reset
      setTimeout(() => {
        refreshData();
      }, 100);
    }
  }, [saveStats, showNotification, refreshData]);

  // ⭐ MIGLIORATO: Migrazione manuale con refresh
  const forceMigration = useCallback(() => {
    if (window.confirm(`Vuoi ri-migrare ${testHistory.length} test dalla cronologia? Questo sovrascriverà le statistiche attuali.`)) {
      // Resetta il flag di migrazione e forza la ri-migrazione
      const resetStats = { ...stats, migrated: false };
      
      // Salva prima nel localStorage
      localStorage.setItem('vocabularyStats', JSON.stringify(resetStats));
      setStats(resetStats);
      
      // La migrazione avverrà automaticamente al prossimo render
      setTimeout(() => {
        migrateFromTestHistory();
        // Refresh aggiuntivo dopo migrazione
        setTimeout(() => {
          refreshData();
        }, 200);
      }, 100);
    }
  }, [testHistory, stats, setStats, migrateFromTestHistory, refreshData]);

  // Statistiche calcolate
  const calculatedStats = useMemo(() => {
    const totalAnswers = stats.correctAnswers + stats.incorrectAnswers;
    const accuracyRate = totalAnswers > 0 ? (stats.correctAnswers / totalAnswers) * 100 : 0;
    
    // Calcola andamento settimanale
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
  }, [stats]);

  // ⭐ ALLA FINE: Tutti gli useEffect dopo le definizioni delle funzioni
  
  // ⭐ NUOVO: Listener per cambiamenti localStorage (cross-tab sync)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'vocabularyStats' || e.key === 'testHistory') {
        console.log('📡 Storage change detected:', e.key);
        setTimeout(() => {
          refreshData();
        }, 50);
      }
    };

    // Listener per cambiamenti cross-tab
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [refreshData]);

  // ⭐ MIGLIORATO: Migrazione automatica al primo caricamento
  useEffect(() => {
    // Migra se non è migrato O se c'è una discrepanza tra cronologia e statistiche
    const shouldMigrate = (!stats.migrated && testHistory.length > 0) ||
                         (stats.migrated && testHistory.length > 0 && stats.testsCompleted === 0);
    
    if (shouldMigrate) {
      console.log('🔄 Migrazione automatica dati esistenti...', {
        migrated: stats.migrated,
        historyLength: testHistory.length,
        statsTests: stats.testsCompleted
      });
      migrateFromTestHistory();
    }
  }, [testHistory, stats.migrated, stats.testsCompleted, migrateFromTestHistory]);

  // ⭐ NUOVO: Forza re-render quando cambiano i dati principali
  useEffect(() => {
    // Aggiorna refreshTrigger ogni volta che cambiano stats o testHistory
    console.log('📊 Dati cambiati:', {
      testsCompleted: stats.testsCompleted,
      historyLength: testHistory.length,
      migrated: stats.migrated
    });
    setRefreshTrigger(prev => prev + 1);
  }, [stats.testsCompleted, testHistory.length, stats.correctAnswers, stats.incorrectAnswers]);

  return {
    stats,
    calculatedStats,
    updateTestStats,
    exportStats,
    importStats,
    resetStats,
    forceMigration,
    isMigrated: stats.migrated,
    refreshData,
    refreshTrigger,
    testHistory, // ⭐ NUOVO: Esponi testHistory per evitare duplicazioni
    testHistoryLength: testHistory.length // ⭐ NUOVO: Esponi lunghezza per componenti
  };
};