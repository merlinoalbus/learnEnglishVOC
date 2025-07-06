
// =====================================================
// 📁 src/hooks/useEnhancedStats.js - Enhanced Stats Hook with Error Handling
// =====================================================

import { useState, useEffect, useCallback } from 'react';
import { useStorageLoading } from './useLoadingState';
import { enhancedStorageService } from '../services/enhancedStorageService';
import { useNotification } from '../contexts/NotificationContext';
import { retryWithBackoff } from '../utils/retryUtils';

export const useEnhancedStats = () => {
  const [stats, setStats] = useState(null);
  const [testHistory, setTestHistory] = useState([]);
  const [wordPerformance, setWordPerformance] = useState({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  
  const storageLoading = useStorageLoading();
  const { showError, showSuccess, showWarning } = useNotification();

  // ⭐ INITIALIZE DATA with error recovery
  const initializeData = useCallback(async () => {
    if (isInitialized) return;

    try {
      storageLoading.startLoading('Caricamento dati utente');
      
      const [statsData, historyData, performanceData] = await Promise.all([
        retryWithBackoff(() => enhancedStorageService.getStats(), {
          maxAttempts: 3,
          baseDelay: 500,
          retryCondition: (error) => !error.message.includes('SecurityError')
        }),
        retryWithBackoff(() => enhancedStorageService.getTestHistory(), {
          maxAttempts: 3,
          baseDelay: 500
        }),
        retryWithBackoff(() => enhancedStorageService.get('wordPerformance', {}), {
          maxAttempts: 3,
          baseDelay: 500
        })
      ]);

      setStats(statsData);
      setTestHistory(historyData);
      setWordPerformance(performanceData);
      setIsInitialized(true);
      setLastSync(Date.now());
      
      storageLoading.stopLoading();
    } catch (error) {
      console.error('❌ Failed to initialize stats data:', error);
      
      // Provide default data on error
      setStats({
        testsCompleted: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        hintsUsed: 0,
        timeSpent: 0,
        totalWords: 0,
        streakDays: 0
      });
      setTestHistory([]);
      setWordPerformance({});
      setIsInitialized(true);
      
      storageLoading.setError(error, false);
      showError(error, 'Data Initialization');
    }
  }, [isInitialized, storageLoading, showError]);

  // ⭐ SAVE DATA with retry logic
  const saveData = useCallback(async (newStats, newHistory, newPerformance) => {
    try {
      storageLoading.startLoading('Salvataggio dati');
      
      const saveOperations = [];
      
      if (newStats) {
        saveOperations.push(() => enhancedStorageService.saveStats(newStats));
      }
      
      if (newHistory) {
        saveOperations.push(() => enhancedStorageService.saveTestHistory(newHistory));
      }
      
      if (newPerformance) {
        saveOperations.push(() => enhancedStorageService.set('wordPerformance', newPerformance));
      }

      // Execute all save operations with retry
      await Promise.all(saveOperations.map(op => 
        retryWithBackoff(op, {
          maxAttempts: 2,
          baseDelay: 200,
          retryCondition: (error) => !error.name?.includes('QuotaExceededError')
        })
      ));

      // Update state only after successful save
      if (newStats) setStats(newStats);
      if (newHistory) setTestHistory(newHistory);
      if (newPerformance) setWordPerformance(newPerformance);
      
      setLastSync(Date.now());
      storageLoading.stopLoading();
      
    } catch (error) {
      console.error('❌ Failed to save data:', error);
      storageLoading.setError(error, true);
      
      if (error.message.includes('quota')) {
        showWarning('💽 Spazio di archiviazione esaurito. Esporta backup ed elimina dati vecchi.');
      } else {
        showError(error, 'Data Save');
      }
      throw error;
    }
  }, [storageLoading, showError, showWarning]);

  // ⭐ HANDLE TEST COMPLETION with enhanced error handling
  const handleTestComplete = useCallback(async (testStats, testWordsUsed, wrongWordsArray) => {
    try {
      // Create test record
      const testRecord = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        totalWords: testStats.correct + testStats.incorrect,
        correctWords: testStats.correct,
        incorrectWords: testStats.incorrect,
        hintsUsed: testStats.hints || 0,
        totalTime: testStats.totalTime || 0,
        percentage: Math.round((testStats.correct / (testStats.correct + testStats.incorrect)) * 100),
        wrongWords: [...wrongWordsArray],
        wordTimes: testStats.wordTimes || [],
        difficulty: testStats.difficulty || 'medium'
      };

      // Update stats
      const newStats = {
        ...stats,
        testsCompleted: stats.testsCompleted + 1,
        correctAnswers: stats.correctAnswers + testStats.correct,
        incorrectAnswers: stats.incorrectAnswers + testStats.incorrect,
        hintsUsed: (stats.hintsUsed || 0) + (testStats.hints || 0),
        timeSpent: stats.timeSpent + (testStats.totalTime || 300), // Default 5 minutes if no time
        lastStudyDate: new Date().toISOString().split('T')[0]
      };

      // Recalculate average score
      const totalAnswers = newStats.correctAnswers + newStats.incorrectAnswers;
      newStats.averageScore = totalAnswers > 0 ? (newStats.correctAnswers / totalAnswers) * 100 : 0;

      // Update test history
      const newHistory = [testRecord, ...testHistory].slice(0, 100); // Keep last 100 tests

      // Update word performance
      const newPerformance = { ...wordPerformance };
      if (testStats.wordTimes && Array.isArray(testStats.wordTimes)) {
        testStats.wordTimes.forEach(wordTime => {
          const word = testWordsUsed.find(w => w.id === wordTime.wordId);
          if (word) {
            if (!newPerformance[word.id]) {
              newPerformance[word.id] = {
                english: word.english,
                italian: word.italian,
                chapter: word.chapter,
                attempts: []
              };
            }
            
            newPerformance[word.id].attempts.push({
              timestamp: testRecord.timestamp,
              correct: wordTime.isCorrect,
              usedHint: wordTime.usedHint || false,
              timeSpent: wordTime.timeSpent || 0
            });

            // Keep only last 50 attempts per word
            if (newPerformance[word.id].attempts.length > 50) {
              newPerformance[word.id].attempts = newPerformance[word.id].attempts.slice(-50);
            }
          }
        });
      }

      // Save all data
      await saveData(newStats, newHistory, newPerformance);
      
      showSuccess(`✅ Test completato! Risultato: ${testRecord.percentage}%`);
      
      return testRecord;
    } catch (error) {
      console.error('❌ Failed to complete test:', error);
      showError(error, 'Test Completion');
      throw error;
    }
  }, [stats, testHistory, wordPerformance, saveData, showSuccess, showError]);

  // ⭐ EXPORT DATA with enhanced error handling
  const exportData = useCallback(async () => {
    try {
      storageLoading.startLoading('Preparazione backup completo');
      
      // Get fresh data
      const [currentStats, currentHistory, currentPerformance, words] = await Promise.all([
        enhancedStorageService.getStats(),
        enhancedStorageService.getTestHistory(),
        enhancedStorageService.get('wordPerformance', {}),
        enhancedStorageService.getWords()
      ]);

      const exportData = {
        words,
        stats: currentStats,
        testHistory: currentHistory,
        wordPerformance: currentPerformance,
        exportDate: new Date().toISOString(),
        version: '2.4', // Enhanced version
        storageStatus: enhancedStorageService.getServiceStatus(),
        dataIntegrity: {
          wordsCount: words.length,
          testsCount: currentHistory.length,
          performanceCount: Object.keys(currentPerformance).length,
          lastSync: lastSync
        }
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `vocabulary-enhanced-backup-v2.4-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      storageLoading.stopLoading();
      showSuccess(`✅ Backup Enhanced v2.4 esportato! (${words.length} parole + ${currentHistory.length} test)`);
      
    } catch (error) {
      storageLoading.setError(error, false);
      showError(error, 'Export Data');
    }
  }, [storageLoading, showSuccess, showError, lastSync]);

  // ⭐ IMPORT DATA with enhanced validation
  const importData = useCallback(async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          storageLoading.startLoading('Importazione dati');
          
          const importedData = JSON.parse(e.target.result);
          
          // Enhanced validation
          const validation = {
            hasWords: importedData.words && Array.isArray(importedData.words),
            hasStats: importedData.stats && typeof importedData.stats === 'object',
            hasHistory: importedData.testHistory && Array.isArray(importedData.testHistory),
            hasPerformance: importedData.wordPerformance && typeof importedData.wordPerformance === 'object',
            version: importedData.version || 'unknown',
            isEnhanced: importedData.version && parseFloat(importedData.version) >= 2.4
          };
          
          if (!validation.hasWords && !validation.hasStats && !validation.hasHistory) {
            throw new Error('File non contiene dati validi');
          }
          
          const shouldOverwrite = window.confirm(
            `Importare ${validation.isEnhanced ? 'Enhanced ' : ''}backup v${validation.version}?\n` +
            `${validation.hasWords ? `${importedData.words.length} parole` : 'Nessuna parola'}\n` +
            `${validation.hasHistory ? `${importedData.testHistory.length} test` : 'Nessun test'}\n` +
            `${validation.hasPerformance ? `${Object.keys(importedData.wordPerformance).length} performance` : 'Nessuna performance'}\n\n` +
            `OK = Sostituisci tutto | Annulla = Combina`
          );
          
          let newStats = stats;
          let newHistory = testHistory;
          let newPerformance = wordPerformance;
          
          if (shouldOverwrite) {
            // Replace all data
            if (validation.hasStats) newStats = importedData.stats;
            if (validation.hasHistory) newHistory = importedData.testHistory;
            if (validation.hasPerformance) newPerformance = importedData.wordPerformance;
            
            if (validation.hasWords) {
              await enhancedStorageService.saveWords(importedData.words);
            }
          } else {
            // Merge data intelligently
            if (validation.hasHistory) {
              const existingIds = new Set(testHistory.map(test => test.id));
              const newTests = importedData.testHistory.filter(test => !existingIds.has(test.id));
              newHistory = [...testHistory, ...newTests].sort((a, b) => 
                new Date(b.timestamp) - new Date(a.timestamp)
              ).slice(0, 200); // Keep last 200 tests
            }
            
            if (validation.hasPerformance) {
              newPerformance = { ...wordPerformance };
              Object.entries(importedData.wordPerformance).forEach(([wordId, data]) => {
                if (newPerformance[wordId]) {
                  // Merge attempts
                  const existingAttempts = newPerformance[wordId].attempts || [];
                  const importedAttempts = data.attempts || [];
                  const allAttempts = [...existingAttempts, ...importedAttempts]
                    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
                    .slice(-50); // Keep last 50
                  
                  newPerformance[wordId] = { ...data, attempts: allAttempts };
                } else {
                  newPerformance[wordId] = data;
                }
              });
            }
            
            if (validation.hasWords) {
              const currentWords = await enhancedStorageService.getWords();
              const existingEnglish = new Set(currentWords.map(w => w.english.toLowerCase()));
              const newWords = importedData.words.filter(word => 
                !existingEnglish.has(word.english.toLowerCase())
              );
              
              if (newWords.length > 0) {
                await enhancedStorageService.saveWords([...currentWords, ...newWords]);
              }
            }
          }
          
          // Save updated data
          await saveData(newStats, newHistory, newPerformance);
          
          storageLoading.stopLoading();
          showSuccess(`✅ Dati importati con successo! (v${validation.version})`);
          resolve({ newStats, newHistory, newPerformance });
          
        } catch (error) {
          storageLoading.setError(error, false);
          showError(error, 'Import Data');
          reject(error);
        }
      };
      
      reader.onerror = () => {
        const error = new Error('Errore lettura file');
        showError(error, 'File Reading');
        reject(error);
      };
      
      reader.readAsText(file);
    });
  }, [stats, testHistory, wordPerformance, storageLoading, saveData, showSuccess, showError]);

  // ⭐ REFRESH DATA from storage
  const refreshData = useCallback(async () => {
    try {
      storageLoading.startLoading('Aggiornamento dati');
      
      const [newStats, newHistory, newPerformance] = await Promise.all([
        enhancedStorageService.getStats(),
        enhancedStorageService.getTestHistory(),
        enhancedStorageService.get('wordPerformance', {})
      ]);
      
      setStats(newStats);
      setTestHistory(newHistory);
      setWordPerformance(newPerformance);
      setLastSync(Date.now());
      
      storageLoading.stopLoading();
      showSuccess('✅ Dati aggiornati');
    } catch (error) {
      storageLoading.setError(error, true);
      showError(error, 'Refresh Data');
    }
  }, [storageLoading, showSuccess, showError]);

  // ⭐ GET SERVICE STATUS
  const getServiceStatus = useCallback(() => {
    const storageStatus = enhancedStorageService.getServiceStatus();
    
    return {
      storage: storageStatus,
      data: {
        initialized: isInitialized,
        lastSync,
        statsLoaded: !!stats,
        historyCount: testHistory.length,
        performanceCount: Object.keys(wordPerformance).length
      },
      health: storageStatus.health,
      recommendations: [
        ...storageStatus.recommendations,
        ...(Date.now() - lastSync > 300000 ? ['🔄 Considera aggiornamento dati (5+ minuti fa)'] : [])
      ]
    };
  }, [isInitialized, lastSync, stats, testHistory, wordPerformance]);

  // Initialize on mount
  useEffect(() => {
    initializeData();
  }, [initializeData]);

  // Auto-refresh every 5 minutes if app is visible
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && isInitialized) {
        refreshData();
      }
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [isInitialized, refreshData]);

  return {
    // Data
    stats,
    testHistory,
    wordPerformance,
    
    // State
    isInitialized,
    lastSync,
    ...storageLoading,
    
    // Actions
    handleTestComplete,
    refreshData,
    exportData,
    importData,
    
    // Status
    getServiceStatus,
    
    // Computed values
    totalTests: testHistory.length,
    totalAnswers: stats ? stats.correctAnswers + stats.incorrectAnswers : 0,
    accuracyRate: stats && stats.correctAnswers + stats.incorrectAnswers > 0 
      ? Math.round((stats.correctAnswers / (stats.correctAnswers + stats.incorrectAnswers)) * 100)
      : 0,
    hintsRate: stats && stats.correctAnswers + stats.incorrectAnswers > 0 
      ? Math.round(((stats.hintsUsed || 0) / (stats.correctAnswers + stats.incorrectAnswers)) * 100)
      : 0
  };
};
