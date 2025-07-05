// =====================================================
// 📁 src/utils/index.js - EXPORTS PULITI
// =====================================================

// ✅ Re-export utilities effettivamente utilizzate
export * from './categoryUtils';
export * from './textUtils';

// ✅ Export performance utilities utilizzate
export { 
  memoize, 
  debounce, 
  deepEqual,
  shallowEqual,
  createSelector,
  compose,
  pipe,
  once
} from './performanceUtils';

// =====================================================
// ✅ Convenience re-exports (utilizzati ovunque)
// =====================================================

export { getCategoryStyle, getPredefinedGroups } from './categoryUtils';
export { formatNotes, getTestResult } from './textUtils';

// =====================================================
// ✅ Core utility functions (utilizzate nell'app)
// =====================================================

/**
 * Generate unique ID
 * ✅ UTILIZZATA per generare ID delle parole
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Safe JSON parse with fallback
 * ✅ UTILIZZATA nel storageService
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
 * ✅ UTILIZZATA nel storageService
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
 * Format time duration
 * ✅ UTILIZZATA in TestView e statistiche
 */
export const formatTime = (seconds) => {
  if (!seconds || seconds < 0) return '0:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Format percentage with precision
 * ✅ UTILIZZATA nelle statistiche e nei risultati test
 */
export const formatPercentage = (value, total, decimals = 0) => {
  if (!total || total === 0) return 0;
  const percentage = (value / total) * 100;
  return Number(percentage.toFixed(decimals));
};

/**
 * Check if value is empty
 * ✅ UTILIZZATA nelle validazioni
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
 * ✅ UTILIZZATA per filtrare dati export/import
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
 * Group array of objects by property
 * ✅ UTILIZZATA per raggruppare parole per capitolo
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
 * ✅ UTILIZZATA per ordinare parole e statistiche
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
 * ✅ UTILIZZATA nelle statistiche avanzate
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
 * ✅ UTILIZZATA in operazioni asincrone
 */
export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Capitalize first letter of each word
 * ✅ UTILIZZATA per formattare testi
 */
export const capitalizeWords = (text) => {
  return text.replace(/\b\w/g, l => l.toUpperCase());
};

/**
 * Truncate text with ellipsis
 * ✅ UTILIZZATA per testi lunghi nelle card
 */
export const truncate = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};