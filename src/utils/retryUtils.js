// =====================================================
// 📁 src/utils/retryUtils.js - Advanced Retry & Timeout Utilities
// =====================================================

// =====================================================
// 🔄 EXPONENTIAL BACKOFF RETRY
// =====================================================
export const retryWithBackoff = async (
  operation,
  options = {}
) => {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    exponentialBase = 2,
    jitter = true,
    retryCondition = (error) => true,
    onRetry = null,
    onFinalFailure = null
  } = options;

  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await operation(attempt);
      return result;
    } catch (error) {
      lastError = error;
      
      // Check if we should retry this error
      if (!retryCondition(error)) {
        throw error;
      }
      
      // If this was the last attempt, don't wait
      if (attempt === maxAttempts) {
        if (onFinalFailure) {
          onFinalFailure(error, attempt);
        }
        throw error;
      }
      
      // Calculate delay with exponential backoff
      let delay = Math.min(baseDelay * Math.pow(exponentialBase, attempt - 1), maxDelay);
      
      // Add jitter to prevent thundering herd
      if (jitter) {
        delay += Math.random() * delay * 0.1;
      }
      
      // Call retry callback if provided
      if (onRetry) {
        onRetry(error, attempt, delay);
      }
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

// =====================================================
// ⏱️ TIMEOUT WRAPPER
// =====================================================
export const withTimeout = (operation, timeoutMs, timeoutMessage = 'Operation timed out') => {
  return Promise.race([
    operation(),
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(timeoutMessage));
      }, timeoutMs);
    })
  ]);
};

// =====================================================
// 🎯 SMART RETRY (AI-specific)
// =====================================================
export const smartRetryAI = async (aiOperation, word) => {
  return retryWithBackoff(aiOperation, {
    maxAttempts: 3,
    baseDelay: 2000,
    maxDelay: 8000,
    retryCondition: (error) => {
      // Don't retry API key errors
      if (error.message.includes('API key') || error.message.includes('401')) {
        return false;
      }
      
      // Don't retry quota exceeded
      if (error.message.includes('quota') || error.message.includes('limit')) {
        return false;
      }
      
      // Retry network errors, timeouts, 5xx errors
      return error.message.includes('network') || 
             error.message.includes('timeout') ||
             error.message.includes('fetch') ||
             error.message.includes('5');
    },
    onRetry: (error, attempt, delay) => {
      console.log(`🤖 AI Retry ${attempt}/3 for word "${word}" in ${Math.round(delay)}ms:`, error.message);
    },
    onFinalFailure: (error, attempts) => {
      console.error(`❌ AI Service failed for word "${word}" after ${attempts} attempts:`, error);
    }
  });
};

// =====================================================
// 💾 STORAGE RETRY (localStorage-specific)
// =====================================================
export const smartRetryStorage = async (storageOperation, operationName) => {
  return retryWithBackoff(storageOperation, {
    maxAttempts: 3,
    baseDelay: 500,
    maxDelay: 2000,
    retryCondition: (error) => {
      // Don't retry quota exceeded errors
      if (error.name === 'QuotaExceededError' || error.message.includes('quota')) {
        return false;
      }
      
      // Don't retry security errors
      if (error.message.includes('SecurityError') || error.message.includes('access denied')) {
        return false;
      }
      
      // Retry other localStorage errors
      return error.message.includes('localStorage') || 
             error.message.includes('storage') ||
             error.message.includes('access');
    },
    onRetry: (error, attempt, delay) => {
      console.log(`💾 Storage Retry ${attempt}/3 for "${operationName}" in ${Math.round(delay)}ms:`, error.message);
    },
    onFinalFailure: (error, attempts) => {
      console.error(`❌ Storage operation "${operationName}" failed after ${attempts} attempts:`, error);
    }
  });
};

// =====================================================
// 🌐 NETWORK RETRY (fetch-specific)
// =====================================================
export const smartRetryNetwork = async (networkOperation, url) => {
  return retryWithBackoff(networkOperation, {
    maxAttempts: 3,
    baseDelay: 1500,
    maxDelay: 6000,
    retryCondition: (error) => {
      // Don't retry 4xx client errors (except 408, 429)
      if (error.message.includes('400') || 
          error.message.includes('401') || 
          error.message.includes('403') || 
          error.message.includes('404')) {
        return false;
      }
      
      // Retry timeout and 5xx server errors
      return error.message.includes('timeout') || 
             error.message.includes('network') ||
             error.message.includes('fetch') ||
             error.message.includes('5');
    },
    onRetry: (error, attempt, delay) => {
      console.log(`🌐 Network Retry ${attempt}/3 for "${url}" in ${Math.round(delay)}ms:`, error.message);
    },
    onFinalFailure: (error, attempts) => {
      console.error(`❌ Network operation for "${url}" failed after ${attempts} attempts:`, error);
    }
  });
};

// =====================================================
// 🔄 CIRCUIT BREAKER PATTERN
// =====================================================
export class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.recoveryTimeout = options.recoveryTimeout || 60000; // 1 minute
    this.monitoringPeriod = options.monitoringPeriod || 10000; // 10 seconds
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.successCount = 0;
  }

  async execute(operation) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime < this.recoveryTimeout) {
        throw new Error('Circuit breaker is OPEN - service temporarily unavailable');
      } else {
        this.state = 'HALF_OPEN';
        this.successCount = 0;
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= 3) { // 3 successful calls to close circuit
        this.state = 'CLOSED';
      }
    }
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
      isAvailable: this.state !== 'OPEN'
    };
  }

  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.successCount = 0;
  }
}

// =====================================================
// 🎛️ OPERATION MANAGER WITH RETRIES
// =====================================================
export class OperationManager {
  constructor() {
    this.operations = new Map();
    this.circuitBreakers = new Map();
  }

  // Register an operation with its retry configuration
  registerOperation(name, config = {}) {
    this.operations.set(name, {
      maxAttempts: config.maxAttempts || 3,
      timeout: config.timeout || 30000,
      retryCondition: config.retryCondition || (() => true),
      circuitBreaker: config.useCircuitBreaker ? new CircuitBreaker(config.circuitBreakerOptions) : null,
      ...config
    });
  }

  // Execute an operation with configured retry logic
  async execute(operationName, operation, ...args) {
    const config = this.operations.get(operationName);
    
    if (!config) {
      throw new Error(`Operation "${operationName}" not registered`);
    }

    const wrappedOperation = async () => {
      if (config.timeout) {
        return withTimeout(() => operation(...args), config.timeout, `${operationName} timeout`);
      }
      return operation(...args);
    };

    if (config.circuitBreaker) {
      return config.circuitBreaker.execute(async () => {
        return retryWithBackoff(wrappedOperation, {
          maxAttempts: config.maxAttempts,
          baseDelay: config.baseDelay,
          retryCondition: config.retryCondition,
          onRetry: config.onRetry,
          onFinalFailure: config.onFinalFailure
        });
      });
    } else {
      return retryWithBackoff(wrappedOperation, {
        maxAttempts: config.maxAttempts,
        baseDelay: config.baseDelay,
        retryCondition: config.retryCondition,
        onRetry: config.onRetry,
        onFinalFailure: config.onFinalFailure
      });
    }
  }

  // Get operation status
  getOperationStatus(operationName) {
    const config = this.operations.get(operationName);
    if (!config) return null;

    return {
      name: operationName,
      circuitBreaker: config.circuitBreaker ? config.circuitBreaker.getState() : null,
      config: {
        maxAttempts: config.maxAttempts,
        timeout: config.timeout,
        useCircuitBreaker: !!config.circuitBreaker
      }
    };
  }

  // Reset circuit breaker for an operation
  resetOperation(operationName) {
    const config = this.operations.get(operationName);
    if (config && config.circuitBreaker) {
      config.circuitBreaker.reset();
    }
  }

  // Get all operations status
  getAllStatus() {
    return Array.from(this.operations.keys()).map(name => this.getOperationStatus(name));
  }
}

// =====================================================
// 🌍 GLOBAL OPERATION MANAGER INSTANCE
// =====================================================
export const globalOperationManager = new OperationManager();

// Register common operations
globalOperationManager.registerOperation('aiAnalysis', {
  maxAttempts: 3,
  timeout: 45000,
  baseDelay: 2000,
  useCircuitBreaker: true,
  circuitBreakerOptions: {
    failureThreshold: 3,
    recoveryTimeout: 120000 // 2 minutes for AI service
  },
  retryCondition: (error) => {
    return !error.message.includes('API key') && 
           !error.message.includes('quota') &&
           !error.message.includes('401');
  }
});

globalOperationManager.registerOperation('storageOperation', {
  maxAttempts: 3,
  timeout: 10000,
  baseDelay: 500,
  retryCondition: (error) => {
    return !error.name?.includes('QuotaExceededError') &&
           !error.message.includes('SecurityError');
  }
});

globalOperationManager.registerOperation('networkRequest', {
  maxAttempts: 3,
  timeout: 20000,
  baseDelay: 1500,
  useCircuitBreaker: true,
  circuitBreakerOptions: {
    failureThreshold: 5,
    recoveryTimeout: 60000 // 1 minute for network
  },
  retryCondition: (error) => {
    return !error.message.includes('40') || // Don't retry 4xx except 408, 429
           error.message.includes('408') ||
           error.message.includes('429');
  }
});

// =====================================================
// 🔧 UTILITY FUNCTIONS
// =====================================================

// Debounced retry - prevents rapid repeated attempts
export const debouncedRetry = (operation, delay = 1000) => {
  let timeoutId;
  let lastPromise;

  return (...args) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (lastPromise) {
      return lastPromise;
    }

    return new Promise((resolve, reject) => {
      timeoutId = setTimeout(async () => {
        try {
          lastPromise = operation(...args);
          const result = await lastPromise;
          lastPromise = null;
          resolve(result);
        } catch (error) {
          lastPromise = null;
          reject(error);
        }
      }, delay);
    });
  };
};

// Batch retry - retry multiple operations together
export const batchRetry = async (operations, options = {}) => {
  const {
    maxAttempts = 3,
    failFast = false, // If true, stop on first failure
    retryDelay = 1000
  } = options;

  let attempt = 1;
  let results = new Array(operations.length).fill(null);
  let errors = new Array(operations.length).fill(null);
  let completed = new Array(operations.length).fill(false);

  while (attempt <= maxAttempts && !completed.every(Boolean)) {
    console.log(`📦 Batch retry attempt ${attempt}/${maxAttempts}`);
    
    const promises = operations.map(async (operation, index) => {
      if (completed[index]) return results[index]; // Skip completed operations

      try {
        const result = await operation();
        results[index] = result;
        completed[index] = true;
        errors[index] = null;
        return result;
      } catch (error) {
        errors[index] = error;
        if (failFast) throw error;
        return null;
      }
    });

    await Promise.allSettled(promises);

    if (failFast && errors.some(error => error !== null)) {
      throw errors.find(error => error !== null);
    }

    // If not all completed and we have more attempts, wait before retry
    if (!completed.every(Boolean) && attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
    }

    attempt++;
  }

  return {
    results,
    errors,
    completed,
    successCount: completed.filter(Boolean).length,
    failureCount: completed.length - completed.filter(Boolean).length
  };
};

// Progressive timeout - increase timeout on each retry
export const progressiveTimeout = (baseTimeout, attempt, maxTimeout = baseTimeout * 5) => {
  return Math.min(baseTimeout * Math.pow(1.5, attempt - 1), maxTimeout);
};

export default {
  retryWithBackoff,
  withTimeout,
  smartRetryAI,
  smartRetryStorage,
  smartRetryNetwork,
  CircuitBreaker,
  OperationManager,
  globalOperationManager,
  debouncedRetry,
  batchRetry,
  progressiveTimeout
};