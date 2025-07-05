// =====================================================
// 📁 src/services/storageService.js - Optimized localStorage Wrapper
// =====================================================

import { STORAGE_CONFIG } from '../constants/appConstants';

/**
 * Enhanced localStorage service with error handling, compression, and backup functionality
 * Estratto e ottimizzato dalla logica esistente nel codebase
 */
class StorageService {
  constructor() {
    this.isAvailable = this.checkStorageAvailability();
    this.keys = STORAGE_CONFIG.keys;
  }

  /**
   * Check if localStorage is available
   * @returns {boolean}
   */
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
   * Get item from localStorage with parsing
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if key doesn't exist
   * @returns {*} Parsed value or default
   */
  get(key, defaultValue = null) {
    if (!this.isAvailable) {
      return defaultValue;
    }

    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue;
      }
      
      // Try to parse JSON, fallback to string if it fails
      try {
        return JSON.parse(item);
      } catch (parseError) {
        return item; // Return as string if JSON parsing fails
      }
    } catch (error) {
      return defaultValue;
    }
  }

  /**
   * Set item in localStorage with stringification
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   * @returns {boolean} Success status
   */
  set(key, value) {
    if (!this.isAvailable) {
      return false;
    }

    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
      return true;
    } catch (error) {
      // Handle quota exceeded error
      if (error.name === 'QuotaExceededError') {
        this.cleanup();
        
        // Try again after cleanup
        try {
          const serializedValue = JSON.stringify(value);
          localStorage.setItem(key, serializedValue);
          return true;
        } catch (retryError) {
          return false;
        }
      }
      return false;
    }
  }

  /**
   * Remove item from localStorage
   * @param {string} key - Storage key
   * @returns {boolean} Success status
   */
  remove(key) {
    if (!this.isAvailable) {
      return false;
    }

    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear all localStorage data
   * @returns {boolean} Success status
   */
  clear() {
    if (!this.isAvailable) {
      return false;
    }

    try {
      localStorage.clear();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get multiple items at once
   * @param {string[]} keys - Array of keys to retrieve
   * @returns {Object} Object with key-value pairs
   */
  getMultiple(keys) {
    const result = {};
    keys.forEach(key => {
      result[key] = this.get(key);
    });
    return result;
  }

  /**
   * Set multiple items at once
   * @param {Object} items - Object with key-value pairs to set
   * @returns {boolean} Success status
   */
  setMultiple(items) {
    try {
      Object.entries(items).forEach(([key, value]) => {
        if (!this.set(key, value)) {
          throw new Error(`Failed to set key: ${key}`);
        }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if key exists in storage
   * @param {string} key - Storage key
   * @returns {boolean}
   */
  exists(key) {
    if (!this.isAvailable) {
      return false;
    }
    return localStorage.getItem(key) !== null;
  }

  /**
   * Get all keys that match a pattern
   * @param {string} pattern - Pattern to match (regex string)
   * @returns {string[]} Array of matching keys
   */
  getKeysMatching(pattern) {
    if (!this.isAvailable) {
      return [];
    }

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

  /**
   * Get storage usage information
   * @returns {Object} Storage usage stats
   */
  getUsageStats() {
    if (!this.isAvailable) {
      return { used: 0, available: 0, total: 0 };
    }

    try {
      let used = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        used += (key?.length || 0) + (value?.length || 0);
      }

      // Estimate total available space (varies by browser)
      const total = 5 * 1024 * 1024; // 5MB typical limit
      const available = total - used;

      return {
        used,
        available,
        total,
        usedMB: (used / 1024 / 1024).toFixed(2),
        availableMB: (available / 1024 / 1024).toFixed(2),
        usagePercentage: ((used / total) * 100).toFixed(1)
      };
    } catch (error) {
      return { used: 0, available: 0, total: 0 };
    }
  }

  /**
   * Cleanup old or large items to free space
   * @returns {boolean} Success status
   */
  cleanup() {
    if (!this.isAvailable) {
      return false;
    }

    try {
      // Get all items with their sizes
      const items = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        const size = (key?.length || 0) + (value?.length || 0);
        
        items.push({ key, size, value });
      }

      // Sort by size (largest first)
      items.sort((a, b) => b.size - a.size);

      // Remove items that are not essential (avoid app critical keys)
      const criticalKeys = Object.values(this.keys);
      let cleaned = false;

      for (const item of items) {
        if (!criticalKeys.includes(item.key)) {
          // Check if it's an old backup or temporary data
          if (item.key.includes('backup_') || item.key.includes('temp_') || item.key.includes('cache_')) {
            localStorage.removeItem(item.key);
            cleaned = true;
          }
        }
      }

      return cleaned;
    } catch (error) {
      return false;
    }
  }

  /**
   * Create a backup of critical data
   * @returns {Object|null} Backup data or null if failed
   */
  createBackup() {
    if (!this.isAvailable) {
      return null;
    }

    try {
      const backup = {};
      const criticalKeys = Object.values(this.keys);
      
      criticalKeys.forEach(key => {
        const data = this.get(key);
        if (data !== null) {
          backup[key] = data;
        }
      });

      backup._timestamp = Date.now();
      backup._version = '2.0.0';
      
      return backup;
    } catch (error) {
      return null;
    }
  }

  /**
   * Restore from backup data
   * @param {Object} backupData - Backup data to restore
   * @returns {boolean} Success status
   */
  restoreFromBackup(backupData) {
    if (!this.isAvailable || !backupData) {
      return false;
    }

    try {
      // Validate backup data
      if (!backupData._timestamp || !backupData._version) {
        throw new Error('Invalid backup data format');
      }

      // Restore each item
      Object.entries(backupData).forEach(([key, value]) => {
        if (!key.startsWith('_')) { // Skip metadata
          this.set(key, value);
        }
      });

      return true;
    } catch (error) {
      return false;
    }
  }

  // =====================================================
  // App-specific helper methods (extracted from existing code)
  // =====================================================

  /**
   * Get vocabulary words (replaces direct localStorage access in app)
   * @returns {Array} Array of word objects
   */
  getWords() {
    // Try new key first, then fallback to possible old keys
    let words = this.get(this.keys.words, null);
    
    if (!words || words.length === 0) {
      // Try common alternative keys that might be used by existing app
      const fallbackKeys = [
        'words', 
        'vocabularyWords', 
        'vocabulary_words_v1',
        'vocabulary-words',
        'app_words',
        'vocabWords'
      ];
      
      for (const key of fallbackKeys) {
        words = this.get(key, null);
        if (words && words.length > 0) {
          // Migrate to new key
          this.set(this.keys.words, words);
          break;
        }
      }
      
      // If still nothing, check raw localStorage for any key containing "word"
      if (!words || words.length === 0) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.toLowerCase().includes('word')) {
            try {
              const data = JSON.parse(localStorage.getItem(key));
              if (Array.isArray(data) && data.length > 0 && data[0].english && data[0].italian) {
                words = data;
                // Migrate to new key
                this.set(this.keys.words, words);
                break;
              }
            } catch (e) {
              // Ignore parsing errors
            }
          }
        }
      }
    }
    
    return words || [];
  }

  /**
   * Save vocabulary words
   * @param {Array} words - Array of word objects
   * @returns {boolean} Success status
   */
  saveWords(words) {
    return this.set(this.keys.words, words);
  }

  /**
   * Get app statistics
   * @returns {Object} Stats object
   */
  getStats() {
    let stats = this.get(this.keys.stats, null);
    
    if (!stats || Object.keys(stats).length === 0) {
      // Try fallback keys for stats
      const fallbackKeys = ['stats', 'vocabulary_stats_v1', 'app_stats', 'vocabularyStats'];
      
      for (const key of fallbackKeys) {
        stats = this.get(key, null);
        if (stats && Object.keys(stats).length > 0) {
          // Migrate to new key
          this.set(this.keys.stats, stats);
          break;
        }
      }
    }
    
    // Return with defaults merged
    return {
      testsCompleted: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      totalWords: 0,
      streakDays: 0,
      lastStudyDate: null,
      timeSpent: 0,
      categoriesProgress: {},
      ...stats
    };
  }

  /**
   * Save app statistics
   * @param {Object} stats - Stats object
   * @returns {boolean} Success status
   */
  saveStats(stats) {
    return this.set(this.keys.stats, stats);
  }

  /**
   * Get test history
   * @returns {Array} Array of test history objects
   */
  getTestHistory() {
    let history = this.get(this.keys.testHistory, null);
    
    if (!history || history.length === 0) {
      // Try fallback keys for test history
      const fallbackKeys = ['testHistory', 'vocabulary_test_history_v1', 'test_history', 'vocabHistory'];
      
      for (const key of fallbackKeys) {
        history = this.get(key, null);
        if (history && history.length > 0) {
          // Migrate to new key
          this.set(this.keys.testHistory, history);
          break;
        }
      }
    }
    
    return history || [];
  }

  /**
   * Save test history
   * @param {Array} history - Array of test history objects
   * @returns {boolean} Success status
   */
  saveTestHistory(history) {
    return this.set(this.keys.testHistory, history);
  }

  /**
   * Get app settings
   * @returns {Object} Settings object
   */
  getSettings() {
    return this.get(this.keys.settings, {
      theme: 'light',
      notifications: true,
      autoAdvance: true,
      soundEnabled: true
    });
  }

  /**
   * Save app settings
   * @param {Object} settings - Settings object
   * @returns {boolean} Success status
   */
  saveSettings(settings) {
    return this.set(this.keys.settings, settings);
  }
}

// Create and export singleton instance
const storageService = new StorageService();

export { storageService };
export default storageService;