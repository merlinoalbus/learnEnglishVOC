// =====================================================
// 📁 src/hooks/useStoreBridge.js - Dual-System Testing Bridge
// =====================================================
// Hook per testare coesistenza tra vecchio sistema (contexts) e nuovo (store)

import { useEffect, useMemo, useRef } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useNotification } from '../contexts/NotificationContext';
import { useAppStore } from '../store/AppStore';
import { useNotificationStore } from '../store/NotificationStore';
import { deepEqual, shallowEqual } from '../utils/performanceUtils';

/**
 * Hook bridge che confronta vecchio e nuovo sistema
 * @param {Object} options - Configuration options
 * @returns {Object} Comparison results and unified API
 */
export const useStoreBridge = (options = {}) => {
  const {
    enableComparison = true,
    logDifferences = true,
    useNewSystem = false, // Flag per switchare al nuovo sistema
    autoValidate = true
  } = options;

  // =====================================================
  // Hook dei due sistemi
  // =====================================================

  // Sistema VECCHIO (AppContext + NotificationContext)
  const oldAppSystem = useAppContext();
  const oldNotificationSystem = useNotification();

  // Sistema NUOVO (AppStore + NotificationStore)
  const newAppSystem = useAppStore();
  const newNotificationSystem = useNotificationStore();

  // =====================================================
  // State per tracking differences
  // =====================================================

  const differencesRef = useRef([]);
  const validationHistoryRef = useRef([]);

  // =====================================================
  // Data Comparison Functions
  // =====================================================

  const compareAppData = useMemo(() => {
    if (!enableComparison) return { identical: true, differences: [] };

    const oldData = {
      words: oldAppSystem.words,
      currentView: oldAppSystem.currentView,
      testMode: oldAppSystem.testMode,
      showResults: oldAppSystem.showResults,
      editingWord: oldAppSystem.editingWord,
      showWordsList: oldAppSystem.showWordsList
    };

    const newData = {
      words: newAppSystem.words,
      currentView: newAppSystem.currentView,
      testMode: newAppSystem.testMode,
      showResults: newAppSystem.showResults,
      editingWord: newAppSystem.editingWord,
      showWordsList: newAppSystem.showWordsList
    };

    const differences = [];

    // Compare each property
    Object.keys(oldData).forEach(key => {
      if (!deepEqual(oldData[key], newData[key])) {
        differences.push({
          property: key,
          oldValue: oldData[key],
          newValue: newData[key],
          timestamp: Date.now()
        });
      }
    });

    return {
      identical: differences.length === 0,
      differences,
      oldData,
      newData
    };
  }, [
    enableComparison,
    oldAppSystem.words,
    oldAppSystem.currentView,
    oldAppSystem.testMode,
    oldAppSystem.showResults,
    oldAppSystem.editingWord,
    oldAppSystem.showWordsList,
    newAppSystem.words,
    newAppSystem.currentView,
    newAppSystem.testMode,
    newAppSystem.showResults,
    newAppSystem.editingWord,
    newAppSystem.showWordsList
  ]);

  const compareNotificationData = useMemo(() => {
    if (!enableComparison) return { identical: true, differences: [] };

    const oldNotifications = oldNotificationSystem.notifications || [];
    const newNotifications = newNotificationSystem.notifications || [];

    const differences = [];

    if (oldNotifications.length !== newNotifications.length) {
      differences.push({
        property: 'notifications.length',
        oldValue: oldNotifications.length,
        newValue: newNotifications.length,
        timestamp: Date.now()
      });
    }

    // Compare notification content (simplified)
    if (!shallowEqual(
      oldNotifications.map(n => ({ message: n.message, type: n.type })),
      newNotifications.map(n => ({ message: n.message, type: n.type }))
    )) {
      differences.push({
        property: 'notifications.content',
        oldValue: oldNotifications.map(n => ({ message: n.message, type: n.type })),
        newValue: newNotifications.map(n => ({ message: n.message, type: n.type })),
        timestamp: Date.now()
      });
    }

    return {
      identical: differences.length === 0,
      differences,
      oldNotifications,
      newNotifications
    };
  }, [
    enableComparison,
    oldNotificationSystem.notifications,
    newNotificationSystem.notifications
  ]);

  // =====================================================
  // Logging and Validation
  // =====================================================

  useEffect(() => {
    if (!enableComparison || !logDifferences) return;

    const allDifferences = [
      ...compareAppData.differences,
      ...compareNotificationData.differences
    ];

    if (allDifferences.length > 0) {
      console.warn('🔄 Dual-System Differences Detected:', {
        appDifferences: compareAppData.differences,
        notificationDifferences: compareNotificationData.differences,
        timestamp: new Date().toISOString()
      });

      // Store differences for analysis
      differencesRef.current = [...differencesRef.current, ...allDifferences]
        .slice(-100); // Keep last 100 differences
    }
  }, [
    enableComparison,
    logDifferences,
    compareAppData.differences,
    compareNotificationData.differences
  ]);

  // Auto-validation on key operations
  useEffect(() => {
    if (!autoValidate) return;

    const validation = {
      timestamp: Date.now(),
      appSystemIdentical: compareAppData.identical,
      notificationSystemIdentical: compareNotificationData.identical,
      totalWords: {
        old: oldAppSystem.words.length,
        new: newAppSystem.words.length
      },
      notifications: {
        old: oldNotificationSystem.notifications?.length || 0,
        new: newNotificationSystem.notifications?.length || 0
      }
    };

    validationHistoryRef.current = [...validationHistoryRef.current, validation]
      .slice(-50); // Keep last 50 validations

  }, [
    autoValidate,
    compareAppData.identical,
    compareNotificationData.identical,
    oldAppSystem.words.length,
    newAppSystem.words.length,
    oldNotificationSystem.notifications?.length,
    newNotificationSystem.notifications?.length
  ]);

  // =====================================================
  // Unified API (sistema attivo basato su useNewSystem)
  // =====================================================

  const activeAppSystem = useNewSystem ? newAppSystem : oldAppSystem;
  const activeNotificationSystem = useNewSystem ? newNotificationSystem : oldNotificationSystem;

  // =====================================================
  // Testing Functions
  // =====================================================

  const testDualSystemOperation = async (operationName, operation) => {
    console.log(`🧪 Testing dual-system operation: ${operationName}`);
    
    try {
      // Execute operation on both systems
      const oldSystemResult = await operation(oldAppSystem, oldNotificationSystem);
      const newSystemResult = await operation(newAppSystem, newNotificationSystem);
      
      // Compare results
      const resultsMatch = deepEqual(oldSystemResult, newSystemResult);
      
      const testResult = {
        operationName,
        timestamp: Date.now(),
        resultsMatch,
        oldSystemResult,
        newSystemResult,
        success: true
      };
      
      console.log(`🧪 Test result for ${operationName}:`, testResult);
      return testResult;
      
    } catch (error) {
      const testResult = {
        operationName,
        timestamp: Date.now(),
        resultsMatch: false,
        error: error.message,
        success: false
      };
      
      console.error(`🧪 Test failed for ${operationName}:`, testResult);
      return testResult;
    }
  };

  const validateCurrentState = () => {
    const validation = {
      timestamp: new Date().toISOString(),
      appData: compareAppData,
      notificationData: compareNotificationData,
      summary: {
        totalDifferences: compareAppData.differences.length + compareNotificationData.differences.length,
        systemsInSync: compareAppData.identical && compareNotificationData.identical
      }
    };

    console.log('🔍 Current State Validation:', validation);
    return validation;
  };

  const getDifferenceHistory = () => {
    return differencesRef.current;
  };

  const getValidationHistory = () => {
    return validationHistoryRef.current;
  };

  const clearHistory = () => {
    differencesRef.current = [];
    validationHistoryRef.current = [];
  };

  // =====================================================
  // Performance Monitoring
  // =====================================================

  const performanceMetrics = useMemo(() => {
    const oldSystemMethods = Object.keys(oldAppSystem).filter(key => 
      typeof oldAppSystem[key] === 'function'
    ).length;
    
    const newSystemMethods = Object.keys(newAppSystem).filter(key => 
      typeof newAppSystem[key] === 'function'
    ).length;

    return {
      oldSystem: {
        methodCount: oldSystemMethods,
        wordsCount: oldAppSystem.words.length,
        memoryFootprint: JSON.stringify(oldAppSystem).length
      },
      newSystem: {
        methodCount: newSystemMethods,
        wordsCount: newAppSystem.words.length,
        memoryFootprint: JSON.stringify(newAppSystem).length
      }
    };
  }, [oldAppSystem, newAppSystem]);

  // =====================================================
  // Return Value
  // =====================================================

  return {
    // Active systems (based on useNewSystem flag)
    app: activeAppSystem,
    notifications: activeNotificationSystem,
    
    // System selection
    useNewSystem,
    
    // Raw systems (for direct comparison)
    systems: {
      old: {
        app: oldAppSystem,
        notifications: oldNotificationSystem
      },
      new: {
        app: newAppSystem,
        notifications: newNotificationSystem
      }
    },
    
    // Comparison results
    comparison: {
      app: compareAppData,
      notifications: compareNotificationData,
      identical: compareAppData.identical && compareNotificationData.identical
    },
    
    // Testing utilities
    testDualSystemOperation,
    validateCurrentState,
    getDifferenceHistory,
    getValidationHistory,
    clearHistory,
    
    // Performance insights
    performanceMetrics,
    
    // Debug info
    debug: {
      differencesCount: differencesRef.current.length,
      validationsCount: validationHistoryRef.current.length,
      lastValidation: validationHistoryRef.current[validationHistoryRef.current.length - 1]
    }
  };
};

// =====================================================
// Convenience Hooks
// =====================================================

/**
 * Hook semplificato per usare solo il nuovo sistema
 */
export const useNewSystem = () => {
  return useStoreBridge({ useNewSystem: true, enableComparison: false });
};

/**
 * Hook per testing dual-system con logging esteso
 */
export const useDualSystemTesting = () => {
  return useStoreBridge({ 
    enableComparison: true, 
    logDifferences: true, 
    autoValidate: true 
  });
};

/**
 * Hook per migration graduale (switch facile old/new)
 */
export const useMigrationBridge = (useNew = false) => {
  return useStoreBridge({ 
    useNewSystem: useNew, 
    enableComparison: true,
    logDifferences: false,
    autoValidate: false
  });
};