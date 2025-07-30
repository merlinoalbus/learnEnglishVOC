// =====================================================
// 📁 hooks/core/useAsyncOperation.ts - Hook Operazioni Asincrone
// =====================================================

/**
 * Hook per gestione stato operazioni asincrone tipizzate
 * FORNISCE: Loading/error/success states, retry logic, cancellation, progress
 * UTILIZZATO: Per API calls, file operations, data processing
 * TYPE-SAFE: Generic support per input/output types
 */

import { useState, useCallback, useRef, useEffect } from 'react';

// =====================================================
// 🎯 TYPES & INTERFACES
// =====================================================

/**
 * Stati possibili operazione asincrona
 */
export type AsyncOperationStatus = 
  | 'idle'      // Non avviata
  | 'pending'   // In corso
  | 'success'   // Completata con successo
  | 'error'     // Fallita
  | 'cancelled' // Cancellata
  | 'retrying'; // In retry

/**
 * Configurazione retry logic
 */
export interface RetryConfig {
  /** Numero massimo tentativi */
  maxAttempts: number;
  /** Delay base tra tentativi (ms) */
  baseDelay: number;
  /** Exponential backoff multiplier */
  backoffMultiplier: number;
  /** Max delay tra tentativi (ms) */
  maxDelay: number;
  /** Funzione per determinare se retry */
  shouldRetry?: (error: Error, attempt: number) => boolean;
  /** Callback before retry */
  onRetry?: (error: Error, attempt: number) => void;
}

/**
 * Configurazione progress tracking
 */
export interface ProgressConfig {
  /** Track progress (0-100) */
  trackProgress: boolean;
  /** Update progress callback */
  onProgress?: (progress: number) => void;
  /** Progress step size */
  stepSize?: number;
}

/**
 * Configurazione timeout
 */
export interface TimeoutConfig {
  /** Timeout operazione (ms) */
  timeout: number;
  /** Callback su timeout */
  onTimeout?: () => void;
}

/**
 * Configurazione completa hook
 */
export interface AsyncOperationConfig {
  /** Configurazione retry */
  retry?: Partial<RetryConfig>;
  /** Configurazione progress */
  progress?: Partial<ProgressConfig>;
  /** Configurazione timeout */
  timeout?: Partial<TimeoutConfig>;
  /** Cancellation support */
  enableCancellation?: boolean;
  /** Auto-reset dopo successo */
  autoReset?: boolean;
  /** Reset delay (ms) se autoReset = true */
  autoResetDelay?: number;
  /** Debug mode */
  debug?: boolean;
}

/**
 * Metadata operazione
 */
export interface OperationMetadata {
  /** Timestamp inizio */
  startTime: Date | null;
  /** Timestamp fine */
  endTime: Date | null;
  /** Durata operazione (ms) */
  duration: number | null;
  /** Numero tentativo corrente */
  currentAttempt: number;
  /** Errori precedenti */
  previousErrors: Error[];
  /** Cancellation reason */
  cancellationReason?: string;
}

/**
 * Risultato operazione asincrona
 */
export interface AsyncOperationResult<TResult, TError = Error> {
  /** Dati risultato */
  data: TResult | null;
  /** Errore operazione */
  error: TError | null;
  /** Stato operazione */
  status: AsyncOperationStatus;
  /** Loading state */
  loading: boolean;
  /** Progress (0-100) */
  progress: number;
  /** Metadata operazione */
  metadata: OperationMetadata;
}

/**
 * Funzione cancellation token
 */
export interface CancellationToken {
  /** Flag cancellazione */
  isCancelled: boolean;
  /** Ragione cancellazione */
  reason?: string;
  /** Promise che risolve quando cancellato */
  promise: Promise<void>;
  /** Callback di cancellazione */
  cancel: (reason?: string) => void;
}

// =====================================================
// 🔄 CORE HOOK: useAsyncOperation
// =====================================================

/**
 * Hook principale per operazioni asincrone
 * USAGE: const { execute, data, loading, error, retry, cancel } = useAsyncOperation(asyncFn);
 */
export function useAsyncOperation<TArgs extends any[], TResult, TError = Error>(
  operation: (...args: TArgs) => Promise<TResult>,
  config: AsyncOperationConfig = {}
): {
  /** Dati risultato */
  data: TResult | null;
  /** Errore corrente */
  error: TError | null;
  /** Stato operazione */
  status: AsyncOperationStatus;
  /** Loading state */
  loading: boolean;
  /** Progress (0-100) */
  progress: number;
  /** Metadata operazione */
  metadata: OperationMetadata;
  /** Esegui operazione */
  execute: (...args: TArgs) => Promise<TResult>;
  /** Retry operazione con stessi args */
  retry: () => Promise<TResult>;
  /** Cancella operazione */
  cancel: (reason?: string) => void;
  /** Reset stato */
  reset: () => void;
  /** Check se può fare retry */
  canRetry: boolean;
} {
  // ===== CONFIGURATION =====
  const {
    retry: retryConfig = {},
    progress: progressConfig = {},
    timeout: timeoutConfig = {},
    enableCancellation = true,
    autoReset = false,
    autoResetDelay = 3000,
    debug = false,
  } = config;

  const finalRetryConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    backoffMultiplier: 2,
    maxDelay: 30000,
    shouldRetry: (error, attempt) => attempt < 3,
    ...retryConfig,
  };

  const finalProgressConfig: ProgressConfig = {
    trackProgress: false,
    stepSize: 10,
    ...progressConfig,
  };

  const finalTimeoutConfig: TimeoutConfig = {
    timeout: timeoutConfig?.timeout === 0 ? 0 : (timeoutConfig?.timeout || 30000),
    ...timeoutConfig,
  };

  // ===== STATE =====
  const [data, setData] = useState<TResult | null>(null);
  const [error, setError] = useState<TError | null>(null);
  const [status, setStatus] = useState<AsyncOperationStatus>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [metadata, setMetadata] = useState<OperationMetadata>({
    startTime: null,
    endTime: null,
    duration: null,
    currentAttempt: 0,
    previousErrors: [],
  });

  // ===== REFS =====
  const operationRef = useRef(operation);
  const lastArgsRef = useRef<TArgs | null>(null);
  const cancellationTokenRef = useRef<CancellationToken | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoResetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update operation ref
  useEffect(() => {
    operationRef.current = operation;
  }, [operation]);

  // ===== UTILITY FUNCTIONS =====

  /**
   * Crea cancellation token
   */
  const createCancellationToken = useCallback((): CancellationToken => {
    let cancelFn: (reason?: string) => void;
    
    const promise = new Promise<void>((resolve) => {
      cancelFn = (reason?: string) => {
        token.isCancelled = true;
        token.reason = reason;
        resolve();
      };
    });

    const token: CancellationToken = {
      isCancelled: false,
      reason: undefined,
      promise,
      cancel: (reason?: string) => cancelFn(reason),
    };

    return token;
  }, []);

  /**
   * Calcola delay per retry con exponential backoff
   */
  const calculateRetryDelay = useCallback((attempt: number): number => {
    const delay = finalRetryConfig.baseDelay * Math.pow(finalRetryConfig.backoffMultiplier, attempt - 1);
    return Math.min(delay, finalRetryConfig.maxDelay);
  }, [finalRetryConfig]);

  /**
   * Update progress
   */
  const updateProgress = useCallback((newProgress: number) => {
    const clampedProgress = Math.max(0, Math.min(100, newProgress));
    setProgress(clampedProgress);
    
    if (finalProgressConfig.onProgress) {
      finalProgressConfig.onProgress(clampedProgress);
    }
  }, [finalProgressConfig]);

  /**
   * Update metadata
   */
  const updateMetadata = useCallback((updates: Partial<OperationMetadata>) => {
    setMetadata(prev => {
      const updated = { ...prev, ...updates };
      
      // Calcola duration se abbiamo start e end time
      if (updated.startTime && updated.endTime) {
        updated.duration = updated.endTime.getTime() - updated.startTime.getTime();
      }
      
      return updated;
    });
  }, []);

  /**
   * Reset stato completo
   */
  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setStatus('idle');
    setProgress(0);
    setMetadata({
      startTime: null,
      endTime: null,
      duration: null,
      currentAttempt: 0,
      previousErrors: [],
    });

    // Clear timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (autoResetTimeoutRef.current) {
      clearTimeout(autoResetTimeoutRef.current);
      autoResetTimeoutRef.current = null;
    }

    // Cancel operation se in corso
    if (cancellationTokenRef.current && !cancellationTokenRef.current.isCancelled) {
      cancellationTokenRef.current.cancel('reset');
    }

    lastArgsRef.current = null;

    // Debug logging removed
  }, [debug]);

  // ===== CORE EXECUTION LOGIC =====

  /**
   * Esegui operazione con retry logic
   */
  const executeWithRetry = useCallback(async (
    args: TArgs,
    attempt: number = 1
  ): Promise<TResult> => {
    const startTime = new Date();
    
    // Update metadata per questo tentativo
    updateMetadata({
      startTime,
      currentAttempt: attempt,
    });

    // Debug logging removed

    try {
      // Setup cancellation token
      if (enableCancellation) {
        cancellationTokenRef.current = createCancellationToken();
      }

      // Setup timeout
      if (finalTimeoutConfig.timeout > 0) {
        timeoutRef.current = setTimeout(() => {
          const timeoutError = new Error(`Operation timed out after ${finalTimeoutConfig.timeout}ms`);
          
          if (finalTimeoutConfig.onTimeout) {
            finalTimeoutConfig.onTimeout();
          }
          
          if (cancellationTokenRef.current && !cancellationTokenRef.current.isCancelled) {
            cancellationTokenRef.current.cancel('timeout');
          }
          
          throw timeoutError;
        }, finalTimeoutConfig.timeout);
      }

      // Progress tracking setup
      if (finalProgressConfig.trackProgress) {
        updateProgress(10); // Initial progress
      }

      // Execute operation
      const result = await operationRef.current(...args);

      // Check cancellation
      if (cancellationTokenRef.current?.isCancelled) {
        throw new Error(`Operation cancelled: ${cancellationTokenRef.current.reason || 'unknown'}`);
      }

      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Complete progress
      if (finalProgressConfig.trackProgress) {
        updateProgress(100);
      }

      // Update metadata
      const endTime = new Date();
      updateMetadata({
        endTime,
        duration: endTime.getTime() - startTime.getTime(),
      });

      // Debug logging removed

      return result;

    } catch (error) {
      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      const operationError = error as TError;

      // Debug logging removed

      // Update metadata con errore
      updateMetadata({
        endTime: new Date(),
        previousErrors: [...metadata.previousErrors, operationError as Error],
      });

      // Check se dobbiamo fare retry
      const shouldRetry = attempt < finalRetryConfig.maxAttempts && 
                         finalRetryConfig.shouldRetry!(operationError as Error, attempt);

      if (shouldRetry && (!cancellationTokenRef.current?.isCancelled)) {
        // Callback pre-retry
        if (finalRetryConfig.onRetry) {
          finalRetryConfig.onRetry(operationError as Error, attempt);
        }

        setStatus('retrying');

        // Wait delay prima del retry
        const retryDelay = calculateRetryDelay(attempt);
        await new Promise(resolve => setTimeout(resolve, retryDelay));

        // Check cancellation dopo delay
        if (cancellationTokenRef.current?.isCancelled) {
          throw new Error(`Operation cancelled during retry: ${cancellationTokenRef.current.reason}`);
        }

        // Recursive retry
        return executeWithRetry(args, attempt + 1);
      }

      // No more retries, throw error
      throw operationError;
    }
  }, [
    finalRetryConfig,
    finalTimeoutConfig,
    finalProgressConfig,
    enableCancellation,
    debug,
    updateMetadata,
    updateProgress,
    createCancellationToken,
    calculateRetryDelay,
    metadata.previousErrors,
  ]);

  /**
   * Execute operation principale
   */
  const execute = useCallback(async (...args: TArgs): Promise<TResult> => {
    // Reset stato precedente
    setError(null);
    setStatus('pending');
    setProgress(finalProgressConfig.trackProgress ? 0 : 0);
    
    // Store args per retry
    lastArgsRef.current = args;

    try {
      const result = await executeWithRetry(args);
      
      setData(result);
      setStatus('success');
      
      // Auto-reset se abilitato
      if (autoReset) {
        autoResetTimeoutRef.current = setTimeout(() => {
          reset();
        }, autoResetDelay);
      }

      return result;

    } catch (error) {
      const operationError = error as TError;
      
      setError(operationError);
      
      // Determina status finale
      if (cancellationTokenRef.current?.isCancelled) {
        setStatus('cancelled');
        updateMetadata({ 
          cancellationReason: cancellationTokenRef.current.reason 
        });
      } else {
        setStatus('error');
      }

      throw operationError;
    }
  }, [
    finalProgressConfig.trackProgress,
    executeWithRetry,
    autoReset,
    autoResetDelay,
    reset,
    updateMetadata,
  ]);

  /**
   * Retry con stessi args
   */
  const retry = useCallback(async (): Promise<TResult> => {
    if (!lastArgsRef.current) {
      throw new Error('No previous arguments to retry with');
    }

    // Debug logging removed

    return execute(...lastArgsRef.current);
  }, [execute, debug]);

  /**
   * Cancel operazione
   */
  const cancel = useCallback((reason?: string) => {
    if (cancellationTokenRef.current && !cancellationTokenRef.current.isCancelled) {
      cancellationTokenRef.current.cancel(reason || 'manual cancellation');
      
      // Debug logging removed
    }
  }, [debug]);

  // ===== COMPUTED VALUES =====
  const loading = status === 'pending' || status === 'retrying';
  const canRetry = status === 'error' && lastArgsRef.current !== null;

  // ===== CLEANUP =====
  useEffect(() => {
    return () => {
      // Cancel ongoing operation
      if (cancellationTokenRef.current && !cancellationTokenRef.current.isCancelled) {
        cancellationTokenRef.current.cancel('component unmount');
      }

      // Clear timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      if (autoResetTimeoutRef.current) {
        clearTimeout(autoResetTimeoutRef.current);
      }
    };
  }, []);

  // ===== RETURN =====
  return {
    data,
    error,
    status,
    loading,
    progress,
    metadata,
    execute,
    retry,
    cancel,
    reset,
    canRetry,
  };
}

// =====================================================
// 🔄 SPECIALIZED HOOKS
// =====================================================

/**
 * Hook per operazioni con progress tracking
 * USAGE: const { execute, progress, loading } = useAsyncWithProgress(uploadFile);
 */
export function useAsyncWithProgress<TArgs extends any[], TResult>(
  operation: (...args: TArgs) => Promise<TResult>,
  onProgress?: (progress: number) => void
) {
  return useAsyncOperation(operation, {
    progress: {
      trackProgress: true,
      onProgress,
      stepSize: 5,
    },
  });
}

/**
 * Hook per operazioni con retry automatico
 * USAGE: const { execute, loading, error } = useAsyncWithRetry(apiCall, { maxAttempts: 5 });
 */
export function useAsyncWithRetry<TArgs extends any[], TResult>(
  operation: (...args: TArgs) => Promise<TResult>,
  retryConfig?: Partial<RetryConfig>
) {
  return useAsyncOperation(operation, {
    retry: {
      maxAttempts: 3,
      baseDelay: 1000,
      backoffMultiplier: 2,
      ...retryConfig,
    },
  });
}

/**
 * Hook per operazioni con timeout
 * USAGE: const { execute, loading } = useAsyncWithTimeout(longRunningTask, 10000);
 */
export function useAsyncWithTimeout<TArgs extends any[], TResult>(
  operation: (...args: TArgs) => Promise<TResult>,
  timeout: number,
  onTimeout?: () => void
) {
  return useAsyncOperation(operation, {
    timeout: {
      timeout,
      onTimeout,
    },
  });
}

/**
 * Hook per operazioni cancellabili
 * USAGE: const { execute, cancel, status } = useCancellableAsync(downloadFile);
 */
export function useCancellableAsync<TArgs extends any[], TResult>(
  operation: (...args: TArgs) => Promise<TResult>
) {
  return useAsyncOperation(operation, {
    enableCancellation: true,
  });
}

/**
 * Hook per operazioni multiple parallele
 * USAGE: const { executeAll, results, loading } = useParallelAsync([fn1, fn2, fn3]);
 */
export function useParallelAsync<TResult>(
  operations: Array<() => Promise<TResult>>
) {
  const [results, setResults] = useState<Array<TResult | Error>>([]);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(0);

  const executeAll = useCallback(async (): Promise<Array<TResult | Error>> => {
    setLoading(true);
    setCompleted(0);
    setResults([]);

    const promises = operations.map(async (operation, index) => {
      try {
        const result = await operation();
        setCompleted(prev => prev + 1);
        return result;
      } catch (error) {
        setCompleted(prev => prev + 1);
        return error as Error;
      }
    });

    const allResults = await Promise.all(promises);
    setResults(allResults);
    setLoading(false);
    
    return allResults;
  }, [operations]);

  const progress = operations.length > 0 ? (completed / operations.length) * 100 : 0;

  return {
    executeAll,
    results,
    loading,
    progress,
    completed,
    total: operations.length,
  };
}

/**
 * Hook per operazioni con debouncing integrato
 * USAGE: const { execute, loading } = useDebouncedAsync(saveData, 500);
 */
export function useDebouncedAsync<TArgs extends any[], TResult>(
  operation: (...args: TArgs) => Promise<TResult>,
  delay: number = 300
) {
  const asyncOp = useAsyncOperation(operation);
  const [debouncedExecute, setDebouncedExecute] = useState<(...args: TArgs) => Promise<TResult>>();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const debouncedFn = (...args: TArgs): Promise<TResult> => {
      return new Promise((resolve, reject) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          asyncOp.execute(...args).then(resolve).catch(reject);
        }, delay);
      });
    };

    setDebouncedExecute(() => debouncedFn);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [operation, delay, asyncOp]);

  return {
    ...asyncOp,
    execute: debouncedExecute || asyncOp.execute,
  };
}

export default useAsyncOperation;