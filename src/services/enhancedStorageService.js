
// =====================================================
// 📁 src/services/enhancedStorageService.js - Enhanced Storage Service
// =====================================================

import { STORAGE_CONFIG } from '../constants/appConstants';
import { smartRetryStorage, globalOperationManager } from '../utils/retryUtils';

class EnhancedStorageService {
  constructor() {
    this.isAvailable = this.checkStorageAvailability();
    this.keys = STORAGE_CONFIG.keys;
    this.operationQueue = [];
    this.isProcessingQueue = false;
    this.healthStatus = 'unknown';
    this.quotaWarningThreshold = 0.85; // 85% of quota
    this.lastHealthCheck = null;
    this.initializeService();
  }

  initializeService() {
    this.healthStatus = this.isAvailable ? 'healthy' : 'down';
    this.setupPeriodicHealthCheck();
    this.setupQuotaMonitoring();
  }

  // ⭐ ENHANCED STORAGE AVAILABILITY CHECK
  checkStorageAvailability() {
    try {
      const test = '__enhanced_storage_test__';
      localStorage.setItem(test, 'test');
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      console.error('❌ Storage not available:', error.message);
      return false;
    }
  }

  // ⭐ PERIODIC HEALTH CHECK
  setupPeriodicHealthCheck() {
    setInterval(() => {
      this.performHealthCheck();
    }, 30000); // Every 30 seconds
  }

  // ⭐ QUOTA MONITORING
  setupQuotaMonitoring() {
    setInterval(() => {
      this.checkQuotaUsage();
    }, 60000); // Every minute
  }

  async performHealthCheck() {
    try {
      const testKey = '__health_check__';
      const testData = { timestamp: Date.now() };
      
      await this.executeStorageOperation(
        () => {
          localStorage.setItem(testKey, JSON.stringify(testData));
          const retrieved = JSON.parse(localStorage.getItem(testKey));
          localStorage.removeItem(testKey);
          
          if (retrieved.timestamp !== testData.timestamp) {
            throw new Error('Data integrity check failed');
          }
        },
        'Health Check'
      );
      
      this.healthStatus = 'healthy';
      this.lastHealthCheck = Date.now();
    } catch (error) {
      this.healthStatus = error.message.includes('quota') ? 'quota_exceeded' : 'degraded';
    }
  }

  checkQuotaUsage() {
    try {
      const usage = this.getUsageStats();
      const usagePercentage = parseFloat(usage.usagePercentage);
      
      if (usagePercentage > this.quotaWarningThreshold * 100) {
        console.warn(`⚠️ Storage quota warning: ${usagePercentage}% used`);
        
        if (usagePercentage > 95) {
          this.healthStatus = 'quota_exceeded';
          // Trigger automatic cleanup
          this.performAutomaticCleanup();
        }
      }
    } catch (error) {
      console.error('❌ Quota check failed:', error);
    }
  }

  // ⭐ ENHANCED GET with retry logic
  async get(key, defaultValue = null) {
    if (!this.isAvailable) {
      return defaultValue;
    }

    try {
      return await this.executeStorageOperation(
        () => {
          const item = localStorage.getItem(key);
          if (item === null) {
            return defaultValue;
          }
          
          try {
            return JSON.parse(item);
          } catch (parseError) {
            console.warn(`❌ Parse error for key "${key}", returning as string`);
            return item;
          }
        },
        `Get ${key}`
      );
    } catch (error) {
      console.error(`❌ Failed to get "${key}":`, error.message);
      return defaultValue;
    }
  }

  // ⭐ ENHANCED SET with retry and queue
  async set(key, value) {
    if (!this.isAvailable) {
      return false;
    }

    try {
      return await this.executeStorageOperation(
        () => {
          const serializedValue = JSON.stringify(value);
          
          // Check if this operation would exceed quota
          const estimatedSize = (key.length + serializedValue.length) * 2; // UTF-16
          const currentUsage = this.getUsageStats();
          
          if (currentUsage.available < estimatedSize) {
            throw new Error('QuotaExceededError: Not enough space');
          }
          
          localStorage.setItem(key, serializedValue);
          return true;
        },
        `Set ${key}`
      );
    } catch (error) {
      if (error.message.includes('quota') || error.name === 'QuotaExceededError') {
        // Try cleanup and retry once
        const cleanupSuccess = await this.performAutomaticCleanup();
        if (cleanupSuccess) {
          try {
            const serializedValue = JSON.stringify(value);
            localStorage.setItem(key, serializedValue);
            return true;
          } catch (retryError) {
            console.error(`❌ Failed to set "${key}" after cleanup:`, retryError.message);
            return false;
          }
        }
      }
      
      console.error(`❌ Failed to set "${key}":`, error.message);
      return false;
    }
  }

  // ⭐ OPERATION EXECUTOR with retry logic
  async executeStorageOperation(operation, operationName) {
    return await globalOperationManager.execute(
      'storageOperation', 
      operation
    );
  }

  // ⭐ AUTOMATIC CLEANUP with smart strategies
  async performAutomaticCleanup() {
    try {
      let cleanedSpace = 0;
      
      // Strategy 1: Remove temporary and cache data
      const tempKeys = this.getKeysMatching('^(temp_|cache_|backup_)');
      for (const key of tempKeys) {
        const size = this.getItemSize(key);
        localStorage.removeItem(key);
        cleanedSpace += size;
      }
      
      // Strategy 2: Remove old test history (keep only last 50)
      const testHistory = await this.get(this.keys.testHistory, []);
      if (testHistory.length > 50) {
        const trimmedHistory = testHistory.slice(0, 50);
        await this.set(this.keys.testHistory, trimmedHistory);
        cleanedSpace += this.getItemSize(this.keys.testHistory) * 0.5; // Estimate
      }
      
      // Strategy 3: Compress word performance data
      await this.compressWordPerformanceData();
      
      console.log(`🧹 Automatic cleanup freed ~${Math.round(cleanedSpace / 1024)}KB`);
      return cleanedSpace > 0;
    } catch (error) {
      console.error('❌ Automatic cleanup failed:', error);
      return false;
    }
  }

  // ⭐ COMPRESS WORD PERFORMANCE DATA
  async compressWordPerformanceData() {
    try {
      const wordPerformance = await this.get('wordPerformance', {});
      let compressed = false;
      
      Object.keys(wordPerformance).forEach(wordId => {
        const data = wordPerformance[wordId];
        if (data.attempts && data.attempts.length > 20) {
          // Keep only last 20 attempts
          data.attempts = data.attempts.slice(-20);
          compressed = true;
        }
      });
      
      if (compressed) {
        await this.set('wordPerformance', wordPerformance);
        console.log('📊 Word performance data compressed');
      }
    } catch (error) {
      console.error('❌ Failed to compress word performance data:', error);
    }
  }

  // ⭐ GET ITEM SIZE
  getItemSize(key) {
    try {
      const value = localStorage.getItem(key);
      return value ? (key.length + value.length) * 2 : 0; // UTF-16
    } catch (error) {
      return 0;
    }
  }

  // ⭐ ENHANCED USAGE STATS
  getUsageStats() {
    if (!this.isAvailable) {
      return { used: 0, available: 0, total: 0, critical: true };
    }

    try {
      let used = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        used += (key?.length || 0) + (value?.length || 0);
      }

      used *= 2; // UTF-16 encoding
      const total = 5 * 1024 * 1024; // 5MB typical limit
      const available = total - used;
      const usagePercentage = (used / total) * 100;

      return {
        used,
        available,
        total,
        usedMB: (used / 1024 / 1024).toFixed(2),
        availableMB: (available / 1024 / 1024).toFixed(2),
        usagePercentage: usagePercentage.toFixed(1),
        critical: usagePercentage > 90,
        warning: usagePercentage > 75,
        healthStatus: this.healthStatus,
        lastHealthCheck: this.lastHealthCheck
      };
    } catch (error) {
      return { 
        used: 0, 
        available: 0, 
        total: 0, 
        critical: true, 
        error: error.message 
      };
    }
  }

  // Keep all existing methods for backward compatibility
  remove(key) {
    if (!this.isAvailable) return false;
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      return false;
    }
  }

  clear() {
    if (!this.isAvailable) return false;
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      return false;
    }
  }

  exists(key) {
    if (!this.isAvailable) return false;
    return localStorage.getItem(key) !== null;
  }

  getKeysMatching(pattern) {
    if (!this.isAvailable) return [];
    try {
      const regex = new RegExp(pattern);
      const matchingKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && regex.test(key)) {
          matchingKeys.push(key);
        }
      }
      return matchingKeys;
    } catch (error) {
      return [];
    }
  }

  // App-specific methods with enhanced error handling
  async getWords() {
    const words = await this.get(this.keys.words, null);
    
    if (!words || words.length === 0) {
      // Enhanced fallback search
      const fallbackKeys = [
        'words', 'vocabularyWords', 'vocabulary_words_v1',
        'vocabulary-words', 'app_words', 'vocabWords'
      ];
      
      for (const key of fallbackKeys) {
        const fallbackWords = await this.get(key, null);
        if (fallbackWords && fallbackWords.length > 0) {
          // Migrate to new key
          await this.set(this.keys.words, fallbackWords);
          return fallbackWords;
        }
      }
    }
    
    return words || [];
  }

  async saveWords(words) {
    return await this.set(this.keys.words, words);
  }

  async getStats() {
    return await this.get(this.keys.stats, {
      testsCompleted: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      totalWords: 0,
      streakDays: 0,
      lastStudyDate: null,
      timeSpent: 0,
      categoriesProgress: {},
      hintsUsed: 0
    });
  }

  async saveStats(stats) {
    return await this.set(this.keys.stats, stats);
  }

  async getTestHistory() {
    return await this.get(this.keys.testHistory, []);
  }

  async saveTestHistory(history) {
    return await this.set(this.keys.testHistory, history);
  }

  async getSettings() {
    return await this.get(this.keys.settings, {
      theme: 'light',
      notifications: true,
      autoAdvance: true,
      soundEnabled: true
    });
  }

  async saveSettings(settings) {
    return await this.set(this.keys.settings, settings);
  }

  // ⭐ SERVICE STATUS
  getServiceStatus() {
    return {
      available: this.isAvailable,
      health: this.healthStatus,
      usage: this.getUsageStats(),
      lastHealthCheck: this.lastHealthCheck,
      recommendations: this.getRecommendations()
    };
  }

  getRecommendations() {
    const recommendations = [];
    const usage = this.getUsageStats();
    
    if (!this.isAvailable) {
      recommendations.push('🔒 Storage non disponibile. Verifica impostazioni browser');
    }
    
    if (usage.critical) {
      recommendations.push('💽 Spazio quasi esaurito. Esporta backup ed elimina dati vecchi');
    } else if (usage.warning) {
      recommendations.push('⚠️ Spazio in esaurimento. Considera pulizia dati');
    }
    
    if (this.healthStatus === 'degraded') {
      recommendations.push('🟡 Servizio instabile. Esporta backup preventivo');
    }
    
    return recommendations;
  }
}

const enhancedStorageService = new EnhancedStorageService();

export { enhancedStorageService };
export default { enhancedStorageService };