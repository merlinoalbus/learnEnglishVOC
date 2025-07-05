// =====================================================
// 📁 src/utils/performanceUtils.js - Performance Optimization Helpers
// =====================================================

/**
 * Memoization utility for expensive function calls
 * @param {Function} fn - Function to memoize
 * @param {Function} keyGenerator - Optional key generator function
 * @returns {Function} Memoized function
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
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (fn, delay = 300) => {
  let timeoutId;
  
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

/**
 * Throttle function to limit function calls per time period
 * @param {Function} fn - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = (fn, limit = 100) => {
  let inThrottle;
  
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Deep equality check for objects and arrays
 * @param {*} a - First value
 * @param {*} b - Second value
 * @returns {boolean} True if deeply equal
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
 * @param {Object} a - First object
 * @param {Object} b - Second object
 * @returns {boolean} True if shallowly equal
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
 * Useful for React useMemo and useCallback optimizations
 * @param {Function} selector - Selector function
 * @param {Function} equalityFn - Equality function (default: shallowEqual)
 * @returns {Function} Memoized selector
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
 * Create a stable reference to an object if its contents haven't changed
 * Useful for React dependency arrays
 * @param {Object} obj - Object to stabilize
 * @param {Function} equalityFn - Equality function
 * @returns {Object} Stable object reference
 */
export const useStableReference = (obj, equalityFn = shallowEqual) => {
  let stableRef = obj;
  
  return (newObj) => {
    if (!equalityFn(stableRef, newObj)) {
      stableRef = newObj;
    }
    return stableRef;
  };
};

/**
 * Batch multiple state updates to prevent excessive re-renders
 * @param {Function[]} updates - Array of update functions
 * @param {number} delay - Batch delay in milliseconds
 */
export const batchUpdates = (updates, delay = 0) => {
  if (delay === 0) {
    // Immediate batch using React's automatic batching
    updates.forEach(update => update());
  } else {
    // Delayed batch
    setTimeout(() => {
      updates.forEach(update => update());
    }, delay);
  }
};

/**
 * Create a performance monitor for function execution
 * @param {string} name - Monitor name
 * @returns {Object} Performance monitor
 */
export const createPerformanceMonitor = (name) => {
  const measurements = [];
  
  return {
    start() {
      return performance.now();
    },
    
    end(startTime) {
      const duration = performance.now() - startTime;
      measurements.push(duration);
      
      // Keep only last 100 measurements
      if (measurements.length > 100) {
        measurements.shift();
      }
      
      return duration;
    },
    
    getStats() {
      if (measurements.length === 0) {
        return { avg: 0, min: 0, max: 0, count: 0 };
      }
      
      const avg = measurements.reduce((sum, val) => sum + val, 0) / measurements.length;
      const min = Math.min(...measurements);
      const max = Math.max(...measurements);
      
      return {
        name,
        avg: Number(avg.toFixed(2)),
        min: Number(min.toFixed(2)),
        max: Number(max.toFixed(2)),
        count: measurements.length
      };
    },
    
    reset() {
      measurements.length = 0;
    }
  };
};

/**
 * Measure function execution time
 * @param {Function} fn - Function to measure
 * @param {string} name - Measurement name
 * @returns {Function} Wrapped function with timing
 */
export const measurePerformance = (fn, name = 'function') => {
  const monitor = createPerformanceMonitor(name);
  
  return (...args) => {
    const startTime = monitor.start();
    const result = fn(...args);
    const duration = monitor.end(startTime);
    
    if (duration > 16) { // Log slow operations (>16ms = 60fps threshold)
      console.warn(`⚠️ Slow operation "${name}": ${duration.toFixed(2)}ms`);
    }
    
    return result;
  };
};

/**
 * Create a function that only executes once
 * @param {Function} fn - Function to execute once
 * @returns {Function} Function that only executes once
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

/**
 * Create a lazy-loaded value
 * @param {Function} factory - Factory function to create value
 * @returns {Function} Function that returns lazily created value
 */
export const lazy = (factory) => {
  let value;
  let created = false;
  
  return () => {
    if (!created) {
      value = factory();
      created = true;
    }
    return value;
  };
};

/**
 * Compose multiple functions into one
 * @param {...Function} fns - Functions to compose
 * @returns {Function} Composed function
 */
export const compose = (...fns) => {
  return (value) => fns.reduceRight((acc, fn) => fn(acc), value);
};

/**
 * Pipe multiple functions (left to right composition)
 * @param {...Function} fns - Functions to pipe
 * @returns {Function} Piped function
 */
export const pipe = (...fns) => {
  return (value) => fns.reduce((acc, fn) => fn(acc), value);
};

/**
 * Create a cache with TTL (Time To Live)
 * @param {number} ttl - Time to live in milliseconds
 * @returns {Object} Cache object
 */
export const createTTLCache = (ttl = 300000) => { // 5 minutes default
  const cache = new Map();
  
  const isExpired = (timestamp) => Date.now() - timestamp > ttl;
  
  return {
    get(key) {
      const entry = cache.get(key);
      if (!entry) return undefined;
      
      if (isExpired(entry.timestamp)) {
        cache.delete(key);
        return undefined;
      }
      
      return entry.value;
    },
    
    set(key, value) {
      cache.set(key, {
        value,
        timestamp: Date.now()
      });
    },
    
    has(key) {
      const entry = cache.get(key);
      if (!entry) return false;
      
      if (isExpired(entry.timestamp)) {
        cache.delete(key);
        return false;
      }
      
      return true;
    },
    
    delete(key) {
      return cache.delete(key);
    },
    
    clear() {
      cache.clear();
    },
    
    cleanup() {
      for (const [key, entry] of cache.entries()) {
        if (isExpired(entry.timestamp)) {
          cache.delete(key);
        }
      }
    },
    
    size() {
      this.cleanup(); // Clean expired entries first
      return cache.size;
    }
  };
};

/**
 * React-specific: Create stable callback reference
 * @param {Function} callback - Callback function
 * @param {Array} deps - Dependencies array
 * @returns {Function} Stable callback reference
 */
export const createStableCallback = (callback, deps = []) => {
  let memoizedCallback = callback;
  let lastDeps = deps;
  
  return (...args) => {
    if (!shallowEqual(deps, lastDeps)) {
      memoizedCallback = callback;
      lastDeps = deps;
    }
    return memoizedCallback(...args);
  };
};

/**
 * Virtual scrolling utility for large lists
 * @param {Array} items - All items
 * @param {number} containerHeight - Container height in pixels
 * @param {number} itemHeight - Individual item height in pixels
 * @param {number} scrollTop - Current scroll position
 * @returns {Object} Visible items and positioning
 */
export const calculateVirtualItems = (items, containerHeight, itemHeight, scrollTop) => {
  const totalHeight = items.length * itemHeight;
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length - 1
  );
  
  const visibleItems = items.slice(startIndex, endIndex + 1).map((item, index) => ({
    ...item,
    index: startIndex + index,
    offsetTop: (startIndex + index) * itemHeight
  }));
  
  return {
    visibleItems,
    totalHeight,
    startIndex,
    endIndex
  };
};