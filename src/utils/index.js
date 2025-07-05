// =====================================================
// 📁 src/utils/index.js - Centralized Utility Exports
// =====================================================

// Re-export existing utilities (maintaining compatibility)
export * from './categoryUtils';
export * from './textUtils';

// Export new performance utilities
export * from './performanceUtils';

// =====================================================
// Convenience re-exports for commonly used functions
// =====================================================

// Category utilities (most commonly used)
export { getCategoryStyle, getPredefinedGroups } from './categoryUtils';

// Text utilities (most commonly used)
export { formatNotes, getTestResult } from './textUtils';

// Performance utilities (new, for optimization)
export { 
  memoize, 
  debounce, 
  throttle, 
  deepEqual,
  shallowEqual,
  createSelector
} from './performanceUtils';

// =====================================================
// Additional utility functions (extracted from common patterns in codebase)
// =====================================================

/**
 * Generate unique ID (extracted from word creation pattern)
 * @returns {string} Unique ID
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Safe JSON parse with fallback
 * @param {string} jsonString - JSON string to parse
 * @param {*} fallback - Fallback value if parsing fails
 * @returns {*} Parsed value or fallback
 */
export const safeJSONParse = (jsonString, fallback = null) => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('JSON parse failed:', error);
    return fallback;
  }
};

/**
 * Safe JSON stringify
 * @param {*} value - Value to stringify
 * @param {*} fallback - Fallback if stringify fails
 * @returns {string} JSON string or fallback
 */
export const safeJSONStringify = (value, fallback = '{}') => {
  try {
    return JSON.stringify(value);
  } catch (error) {
    console.warn('JSON stringify failed:', error);
    return fallback;
  }
};

/**
 * Format time duration (extracted from timer logic)
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted time string
 */
export const formatTime = (seconds) => {
  if (!seconds || seconds < 0) return '0:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Format percentage with precision
 * @param {number} value - Value to format as percentage
 * @param {number} total - Total value
 * @param {number} decimals - Decimal places
 * @returns {number} Formatted percentage
 */
export const formatPercentage = (value, total, decimals = 0) => {
  if (!total || total === 0) return 0;
  const percentage = (value / total) * 100;
  return Number(percentage.toFixed(decimals));
};

/**
 * Clamp value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export const clamp = (value, min, max) => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Check if value is empty (null, undefined, empty string, empty array)
 * @param {*} value - Value to check
 * @returns {boolean} True if empty
 */
export const isEmpty = (value) => {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * Pick specific properties from object
 * @param {Object} obj - Source object
 * @param {string[]} keys - Keys to pick
 * @returns {Object} New object with picked properties
 */
export const pick = (obj, keys) => {
  const result = {};
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
};

/**
 * Omit specific properties from object
 * @param {Object} obj - Source object
 * @param {string[]} keys - Keys to omit
 * @returns {Object} New object without omitted properties
 */
export const omit = (obj, keys) => {
  const result = { ...obj };
  keys.forEach(key => {
    delete result[key];
  });
  return result;
};

/**
 * Group array of objects by property
 * @param {Array} array - Array to group
 * @param {string|Function} keyOrFn - Property key or function to group by
 * @returns {Object} Grouped object
 */
export const groupBy = (array, keyOrFn) => {
  return array.reduce((groups, item) => {
    const key = typeof keyOrFn === 'function' ? keyOrFn(item) : item[keyOrFn];
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {});
};

/**
 * Sort array by property with direction
 * @param {Array} array - Array to sort
 * @param {string} property - Property to sort by
 * @param {string} direction - 'asc' or 'desc'
 * @returns {Array} Sorted array
 */
export const sortBy = (array, property, direction = 'asc') => {
  return [...array].sort((a, b) => {
    const aVal = a[property];
    const bVal = b[property];
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};

/**
 * Calculate statistics for array of numbers
 * @param {number[]} numbers - Array of numbers
 * @returns {Object} Statistics object
 */
export const calculateStats = (numbers) => {
  if (!numbers || numbers.length === 0) {
    return { min: 0, max: 0, avg: 0, sum: 0, count: 0 };
  }
  
  const sum = numbers.reduce((acc, num) => acc + num, 0);
  const avg = sum / numbers.length;
  const min = Math.min(...numbers);
  const max = Math.max(...numbers);
  
  return {
    min,
    max,
    avg: Number(avg.toFixed(2)),
    sum,
    count: numbers.length
  };
};

/**
 * Wait for specified time (async sleep)
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} Promise that resolves after delay
 */
export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Create URL-safe slug from string
 * @param {string} text - Text to convert to slug
 * @returns {string} URL-safe slug
 */
export const createSlug = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with dashes
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes
};

/**
 * Capitalize first letter of each word
 * @param {string} text - Text to capitalize
 * @returns {string} Capitalized text
 */
export const capitalizeWords = (text) => {
  return text.replace(/\b\w/g, l => l.toUpperCase());
};

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncate = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};