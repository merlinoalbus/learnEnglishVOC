// =====================================================
// 📁 src/utils/performanceUtils.js - VERSIONE PULITA
// =====================================================
// Solo le utilities effettivamente utilizzate nell'app

/**
 * Memoization utility for expensive function calls
 * ✅ UTILIZZATA in useOptimizedStats e useOptimizedWords
 */
export const memoize = (fn, keyGenerator = (...args) => JSON.stringify(args)) => {
  const cache = new Map();
  
  return (...args) => {
    const key = keyGenerator(...args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    
    // Prevent memory leaks by limiting cache size
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    return result;
  };
};

/**
 * Debounce function to limit rapid function calls
 * ✅ UTILIZZATA nel storageService per salvare dati
 */
export const debounce = (fn, delay = 300) => {
  let timeoutId;
  
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

/**
 * Deep equality check for objects and arrays
 * ✅ UTILIZZATA in useStoreBridge (anche se sarà rimosso, utile per future comparazioni)
 */
export const deepEqual = (a, b) => {
  if (a === b) return true;
  
  if (a == null || b == null) return false;
  
  if (typeof a !== typeof b) return false;
  
  if (typeof a !== 'object') return a === b;
  
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  
  return true;
};

/**
 * Shallow equality check for objects
 * ✅ UTILIZZATA per ottimizzazioni React (useMemo, useCallback)
 */
export const shallowEqual = (a, b) => {
  if (a === b) return true;
  
  if (!a || !b) return false;
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (a[key] !== b[key]) return false;
  }
  
  return true;
};

/**
 * Create a selector function that memoizes based on input equality
 * ✅ UTILIZZATA negli hook per ottimizzazioni useMemo
 */
export const createSelector = (selector, equalityFn = shallowEqual) => {
  let lastArgs;
  let lastResult;
  
  return (...args) => {
    if (!lastArgs || !equalityFn(args, lastArgs)) {
      lastArgs = args;
      lastResult = selector(...args);
    }
    return lastResult;
  };
};

/**
 * Compose multiple functions into one
 * ✅ UTILIZZATA per creare pipeline di trasformazioni nei dati delle statistiche
 */
export const compose = (...fns) => {
  return (value) => fns.reduceRight((acc, fn) => fn(acc), value);
};

/**
 * Pipe multiple functions (left to right composition)
 * ✅ UTILIZZATA per elaborazioni dati in useOptimizedStats
 */
export const pipe = (...fns) => {
  return (value) => fns.reduce((acc, fn) => fn(acc), value);
};

/**
 * Create a function that only executes once
 * ✅ UTILIZZATA per inizializzazioni singole nei hook
 */
export const once = (fn) => {
  let called = false;
  let result;
  
  return (...args) => {
    if (!called) {
      called = true;
      result = fn(...args);
    }
    return result;
  };
};