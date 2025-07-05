
// =====================================================
// 📁 src/services/enhancedStorageService.js - Enhanced Storage with Real Keys
// =====================================================

import { STORAGE_CONFIG } from '../constants/appConstants';

/**
 * 🔧 Enhanced storage service that uses YOUR REAL localStorage keys
 * with intelligent fallback and data migration
 */
class EnhancedStorageService {
  constructor() {
    this.isAvailable = this.checkStorageAvailability();
    this.keys = STORAGE_CONFIG.keys;
    this.dataCache = new Map();
  }

  checkStorageAvailability() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, 'test');
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * ⭐ SMART GET: Tries main key, then fallbacks, with caching
   */
  get(keyType, defaultValue = null) {
    if (!this.isAvailable) {
      return defaultValue;
    }

    // Check cache first
    const cacheKey = `${keyType}_${Date.now()}`;
    if (this.dataCache.has(keyType)) {
      const cached = this.dataCache.get(keyType);
      if (Date.now() - cached.timestamp < 30000) { // 30 second cache
        return cached.data;
      }
    }

    try {
      const mainKey = this.keys[keyType];
      const fallbackKeys = this.keys.fallback?.[keyType] || [];
      
      // Try main key first
      let data = this.tryGetFromKey(mainKey, defaultValue);
      
      // If main key is empty/null, try fallback keys
      if ((data === null || (Array.isArray(data) && data.length === 0) || 
           (typeof data === 'object' && Object.keys(data).length === 0)) && 
          fallbackKeys.length > 0) {
        
        console.log(`⚠️ Main key "${mainKey}" empty, trying fallbacks:`, fallbackKeys);
        
        for (const fallbackKey of fallbackKeys) {
          const fallbackData = this.tryGetFromKey(fallbackKey, null);
          if (fallbackData !== null && 
              (!Array.isArray(fallbackData) || fallbackData.length > 0) &&
              (typeof fallbackData !== 'object' || Object.keys(fallbackData).length > 0)) {
            
            console.log(`✅ Found data in fallback key "${fallbackKey}"`);
            
            // Migrate data to main key
            this.set(keyType, fallbackData);
            data = fallbackData;
            break;
          }
        }
      }

      // Cache the result
      this.dataCache.set(keyType, {
        data,
        timestamp: Date.now()
      });

      return data;
      
    } catch (error) {
      console.error(`❌ Error getting ${keyType}:`, error);
      return defaultValue;
    }
  }

  /**
   * Try to get data from a specific key
   */
  tryGetFromKey(key, defaultValue) {
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue;
      }
      
      try {
        return JSON.parse(item);
      } catch (parseError) {
        return item; // Return as string if not JSON
      }
    } catch (error) {
      return defaultValue;
    }
  }

  /**
   * ⭐ SMART SET: Sets to main key and clears cache
   */
  set(keyType, value) {
    if (!this.isAvailable) {
      return false;
    }

    try {
      const mainKey = this.keys[keyType];
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(mainKey, serializedValue);
      
      // Update timestamp
      if (this.keys.meta?.lastUpdate) {
        localStorage.setItem(this.keys.meta.lastUpdate, Date.now().toString());
      }
      
      // Clear cache
      this.dataCache.delete(keyType);
      
      console.log(`✅ Saved ${keyType} to ${mainKey}`);
      return true;
    } catch (error) {
      console.error(`❌ Error setting ${keyType}:`, error);
      return false;
    }
  }

  /**
   * App-specific getters using REAL keys
   */
  getWords() {
    return this.get('words', []);
  }

  saveWords(words) {
    return this.set('words', words);
  }

  getStats() {
    return this.get('stats', {
      testsCompleted: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      totalWords: 0,
      streakDays: 0,
      lastStudyDate: null,
      timeSpent: 0,
      categoriesProgress: {}
    });
  }

  saveStats(stats) {
    return this.set('stats', stats);
  }

  getTestHistory() {
    return this.get('testHistory', []);
  }

  saveTestHistory(history) {
    return this.set('testHistory', history);
  }

  getWordPerformance() {
    return this.get('wordPerformance', {});
  }

  saveWordPerformance(performance) {
    return this.set('wordPerformance', performance);
  }

  getSettings() {
    return this.get('settings', {
      theme: 'light',
      notifications: true,
      autoAdvance: true,
      soundEnabled: true
    });
  }

  saveSettings(settings) {
    return this.set('settings', settings);
  }

  /**
   * Debug: Get all data summary
   */
  getDataSummary() {
    return {
      words: this.getWords().length,
      stats: Object.keys(this.getStats()).length,
      testHistory: this.getTestHistory().length,
      wordPerformance: Object.keys(this.getWordPerformance()).length,
      settings: Object.keys(this.getSettings()).length
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.dataCache.clear();
  }
}

// Create and export singleton instance
const enhancedStorageService = new EnhancedStorageService();

export { enhancedStorageService };
export default enhancedStorageService;