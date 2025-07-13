// =====================================================
// 📁 hooks/core/useDebounce.ts - Hook Debouncing Generico
// =====================================================

/**
 * Hook generico per debouncing di valori e operazioni
 * FORNISCE: Debounced values, debounced callbacks, cancellation support
 * UTILIZZATO: Per search, filtering, API calls, expensive operations
 * TYPE-SAFE: Generic support per qualsiasi tipo di dato
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// =====================================================
// 🎯 HOOK INTERFACES
// =====================================================

/**
 * Opzioni configurazione debounce
 */
interface DebounceOptions {
  /** Delay in millisecondi */
  delay: number;
  /** Esegui immediatamente la prima volta */
  leading?: boolean;
  /** Esegui sempre l'ultima volta */
  trailing?: boolean;
  /** Max delay (per evitare infinite delay) */
  maxWait?: number;
}

/**
 * Risultato hook useDebounce
 */
interface DebouncedResult<T> {
  /** Valore debounced */
  debouncedValue: T;
  /** Valore corrente (non debounced) */
  currentValue: T;
  /** Loading/pending state */
  isPending: boolean;
  /** Cancella debounce pending */
  cancel: () => void;
  /** Forza esecuzione immediata */
  flush: () => void;
  /** Update valore manualmente */
  setValue: (value: T) => void;
}

/**
 * Callback debounced con opzioni
 */
interface DebouncedCallback<TArgs extends any[], TReturn> {
  /** Funzione debounced */
  (...args: TArgs): Promise<TReturn>;
  /** Cancella pending execution */
  cancel: () => void;
  /** Esegui immediatamente */
  flush: (...args: TArgs) => Promise<TReturn>;
  /** Pending state */
  isPending: () => boolean;
}

// =====================================================
// 🔄 CORE HOOK: useDebounce
// =====================================================

/**
 * Hook principale per debouncing valori
 * USAGE: const { debouncedValue, isPending, cancel } = useDebounce(searchText, 300);
 */
export function useDebounce<T>(
  value: T,
  delay: number,
  options: Partial<DebounceOptions> = {}
): DebouncedResult<T> {
  const {
    leading = false,
    trailing = true,
    maxWait,
  } = options;

  // ===== STATE =====
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const [currentValue, setCurrentValue] = useState<T>(value);
  const [isPending, setIsPending] = useState<boolean>(false);

  // ===== REFS =====
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCallTimeRef = useRef<number>(0);
  const lastInvokeTimeRef = useRef<number>(0);

  // ===== UTILITY FUNCTIONS =====

  /**
   * Clear tutti i timeout
   */
  const clearTimeouts = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current);
      maxTimeoutRef.current = null;
    }
  }, []);

  /**
   * Invoca callback con valore
   */
  const invokeCallback = useCallback((val: T) => {
    setDebouncedValue(val);
    setIsPending(false);
    lastInvokeTimeRef.current = Date.now();
  }, []);

  /**
   * Esegui debounced update
   */
  const debouncedUpdate = useCallback((val: T) => {
    const now = Date.now();
    lastCallTimeRef.current = now;

    // Leading execution
    if (leading && lastInvokeTimeRef.current === 0) {
      invokeCallback(val);
      return;
    }

    // Clear existing timeout
    clearTimeouts();
    setIsPending(true);

    // Setup main timeout
    timeoutRef.current = setTimeout(() => {
      if (trailing) {
        invokeCallback(val);
      } else {
        setIsPending(false);
      }
    }, delay);

    // Setup max wait timeout se specificato
    if (maxWait && lastInvokeTimeRef.current > 0) {
      const timeSinceLastInvoke = now - lastInvokeTimeRef.current;
      if (timeSinceLastInvoke >= maxWait) {
        invokeCallback(val);
      } else {
        maxTimeoutRef.current = setTimeout(() => {
          invokeCallback(val);
        }, maxWait - timeSinceLastInvoke);
      }
    }
  }, [delay, leading, trailing, maxWait, invokeCallback, clearTimeouts]);

  // ===== CONTROL FUNCTIONS =====

  /**
   * Cancella debounce pending
   */
  const cancel = useCallback(() => {
    clearTimeouts();
    setIsPending(false);
  }, [clearTimeouts]);

  /**
   * Forza esecuzione immediata
   */
  const flush = useCallback(() => {
    if (isPending) {
      clearTimeouts();
      invokeCallback(currentValue);
    }
  }, [isPending, currentValue, clearTimeouts, invokeCallback]);

  /**
   * Set valore manualmente
   */
  const setValue = useCallback((val: T) => {
    setCurrentValue(val);
    debouncedUpdate(val);
  }, [debouncedUpdate]);

  // ===== EFFECTS =====

  /**
   * Update quando value cambia
   */
  useEffect(() => {
    if (currentValue !== value) {
      setCurrentValue(value);
      debouncedUpdate(value);
    }
  }, [value, currentValue, debouncedUpdate]);

  /**
   * Cleanup su unmount
   */
  useEffect(() => {
    return () => {
      clearTimeouts();
    };
  }, [clearTimeouts]);

  // ===== RETURN =====
  return {
    debouncedValue,
    currentValue,
    isPending,
    cancel,
    flush,
    setValue,
  };
}

// =====================================================
// 🔄 CALLBACK HOOK: useDebouncedCallback
// =====================================================

/**
 * Hook per debouncing callbacks/functions
 * USAGE: const debouncedSearch = useDebouncedCallback(searchAPI, 300);
 */
export function useDebouncedCallback<TArgs extends any[], TReturn>(
  callback: (...args: TArgs) => TReturn | Promise<TReturn>,
  delay: number,
  options: Partial<DebounceOptions> = {}
): DebouncedCallback<TArgs, TReturn> {
  const {
    leading = false,
    trailing = true,
    maxWait,
  } = options;

  // ===== REFS =====
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCallTimeRef = useRef<number>(0);
  const lastInvokeTimeRef = useRef<number>(0);
  const lastArgsRef = useRef<TArgs | null>(null);
  const pendingPromiseRef = useRef<{
    resolve: (value: TReturn) => void;
    reject: (error: any) => void;
  } | null>(null);

  // Update callback ref
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // ===== UTILITY FUNCTIONS =====

  /**
   * Clear tutti i timeout
   */
  const clearTimeouts = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current);
      maxTimeoutRef.current = null;
    }
  }, []);

  /**
   * Invoca callback originale
   */
  const invokeCallback = useCallback(async (...args: TArgs): Promise<TReturn> => {
    lastInvokeTimeRef.current = Date.now();
    
    try {
      const result = await callbackRef.current(...args);
      return result;
    } catch (error) {
      throw error;
    }
  }, []);

  /**
   * Debounced function
   */
  const debouncedFn = useCallback((...args: TArgs): Promise<TReturn> => {
    return new Promise<TReturn>((resolve, reject) => {
      const now = Date.now();
      lastCallTimeRef.current = now;
      lastArgsRef.current = args;

      // Leading execution
      if (leading && lastInvokeTimeRef.current === 0) {
        invokeCallback(...args)
          .then(resolve)
          .catch(reject);
        return;
      }

      // Store promise resolver per risoluzione successiva
      pendingPromiseRef.current = { resolve, reject };

      // Clear existing timeouts
      clearTimeouts();

      // Setup main timeout
      timeoutRef.current = setTimeout(() => {
        if (trailing && lastArgsRef.current && pendingPromiseRef.current) {
          invokeCallback(...lastArgsRef.current)
            .then(pendingPromiseRef.current.resolve)
            .catch(pendingPromiseRef.current.reject)
            .finally(() => {
              pendingPromiseRef.current = null;
            });
        }
      }, delay);

      // Setup max wait timeout se specificato
      if (maxWait && lastInvokeTimeRef.current > 0) {
        const timeSinceLastInvoke = now - lastInvokeTimeRef.current;
        if (timeSinceLastInvoke >= maxWait) {
          invokeCallback(...args)
            .then(resolve)
            .catch(reject);
          pendingPromiseRef.current = null;
        } else {
          maxTimeoutRef.current = setTimeout(() => {
            if (lastArgsRef.current && pendingPromiseRef.current) {
              invokeCallback(...lastArgsRef.current)
                .then(pendingPromiseRef.current.resolve)
                .catch(pendingPromiseRef.current.reject)
                .finally(() => {
                  pendingPromiseRef.current = null;
                });
            }
          }, maxWait - timeSinceLastInvoke);
        }
      }
    });
  }, [delay, leading, trailing, maxWait, invokeCallback, clearTimeouts]);

  // ===== CONTROL FUNCTIONS =====

  /**
   * Cancella pending execution
   */
  const cancel = useCallback(() => {
    clearTimeouts();
    if (pendingPromiseRef.current) {
      pendingPromiseRef.current.reject(new Error('Debounced call cancelled'));
      pendingPromiseRef.current = null;
    }
  }, [clearTimeouts]);

  /**
   * Esegui immediatamente con last args
   */
  const flush = useCallback((...args: TArgs): Promise<TReturn> => {
    const argsToUse = args.length > 0 ? args : lastArgsRef.current;
    
    if (!argsToUse) {
      return Promise.reject(new Error('No arguments to flush'));
    }

    cancel();
    return invokeCallback(...argsToUse);
  }, [cancel, invokeCallback]);

  /**
   * Check se c'è pending execution
   */
  const isPending = useCallback((): boolean => {
    return pendingPromiseRef.current !== null;
  }, []);

  // ===== CLEANUP =====
  useEffect(() => {
    return () => {
      clearTimeouts();
      if (pendingPromiseRef.current) {
        pendingPromiseRef.current.reject(new Error('Component unmounted'));
      }
    };
  }, [clearTimeouts]);

  // ===== RETURN =====
  const debouncedCallback = debouncedFn as DebouncedCallback<TArgs, TReturn>;
  debouncedCallback.cancel = cancel;
  debouncedCallback.flush = flush;
  debouncedCallback.isPending = isPending;

  return debouncedCallback;
}

// =====================================================
// 🔍 SEARCH HOOK: useDebouncedSearch
// =====================================================

/**
 * Hook specializzato per search con debouncing
 * USAGE: const { searchTerm, results, isSearching, search } = useDebouncedSearch(searchAPI, 300);
 */
export function useDebouncedSearch<TResult>(
  searchFunction: (query: string) => Promise<TResult[]>,
  delay: number = 300,
  options: {
    minLength?: number;
    immediate?: boolean;
    keepPreviousResults?: boolean;
  } = {}
) {
  const {
    minLength = 1,
    immediate = false,
    keepPreviousResults = false,
  } = options;

  // ===== STATE =====
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [results, setResults] = useState<TResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // ===== DEBOUNCED SEARCH FUNCTION =====
  const debouncedSearch = useDebouncedCallback(
    async (query: string): Promise<TResult[]> => {
      if (query.length < minLength) {
        return [];
      }

      setIsSearching(true);
      setError(null);

      try {
        const searchResults = await searchFunction(query);
        setResults(searchResults);
        return searchResults;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Search failed');
        setError(error);
        
        if (!keepPreviousResults) {
          setResults([]);
        }
        
        throw error;
      } finally {
        setIsSearching(false);
      }
    },
    delay,
    { trailing: true }
  );

  // ===== SEARCH FUNCTION =====
  const search = useCallback(async (query: string): Promise<TResult[]> => {
    setSearchTerm(query);
    
    if (query.length < minLength) {
      setResults([]);
      setIsSearching(false);
      setError(null);
      return [];
    }

    return debouncedSearch(query);
  }, [minLength, debouncedSearch]);

  // ===== IMMEDIATE SEARCH EFFECT =====
  useEffect(() => {
    if (immediate && searchTerm) {
      search(searchTerm);
    }
  }, [immediate, searchTerm, search]);

  // ===== CONTROL FUNCTIONS =====
  const clear = useCallback(() => {
    setSearchTerm('');
    setResults([]);
    setIsSearching(false);
    setError(null);
    debouncedSearch.cancel();
  }, [debouncedSearch]);

  const cancel = useCallback(() => {
    debouncedSearch.cancel();
    setIsSearching(false);
  }, [debouncedSearch]);

  // ===== RETURN =====
  return {
    /** Term di ricerca corrente */
    searchTerm,
    /** Risultati search */
    results,
    /** Loading state */
    isSearching: isSearching || debouncedSearch.isPending(),
    /** Errore search */
    error,
    /** Funzione per avviare search */
    search,
    /** Clear tutto */
    clear,
    /** Cancel search pending */
    cancel,
    /** Set search term direttamente */
    setSearchTerm: (term: string) => {
      setSearchTerm(term);
      if (immediate) {
        search(term);
      }
    },
  };
}

// =====================================================
// 📝 FORM HOOK: useDebouncedValue
// =====================================================

/**
 * Hook semplificato per form inputs con debouncing
 * USAGE: const [value, debouncedValue, setValue] = useDebouncedValue('', 300);
 */
export function useDebouncedValue<T>(
  initialValue: T,
  delay: number
): [T, T, (value: T) => void] {
  const [value, setValue] = useState<T>(initialValue);
  const { debouncedValue } = useDebounce(value, delay);

  return [value, debouncedValue, setValue];
}

// =====================================================
// 🎛️ ASYNC HOOK: useDebouncedAsync
// =====================================================

/**
 * Hook per operazioni asincrone debounced con loading state
 * USAGE: const { execute, loading, result, error } = useDebouncedAsync(asyncFn, 300);
 */
export function useDebouncedAsync<TArgs extends any[], TResult>(
  asyncFunction: (...args: TArgs) => Promise<TResult>,
  delay: number,
  options: Partial<DebounceOptions> = {}
) {
  // ===== STATE =====
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<TResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // ===== DEBOUNCED FUNCTION =====
  const debouncedFn = useDebouncedCallback(
    async (...args: TArgs): Promise<TResult> => {
      setLoading(true);
      setError(null);

      try {
        const result = await asyncFunction(...args);
        setResult(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Async operation failed');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    delay,
    options
  );

  // ===== CONTROL FUNCTIONS =====
  const clear = useCallback(() => {
    setResult(null);
    setError(null);
    setLoading(false);
    debouncedFn.cancel();
  }, [debouncedFn]);

  // ===== RETURN =====
  return {
    /** Esegui operazione asincrona */
    execute: debouncedFn,
    /** Loading state */
    loading: loading || debouncedFn.isPending(),
    /** Risultato operazione */
    result,
    /** Errore operazione */
    error,
    /** Clear state */
    clear,
    /** Cancel pending operation */
    cancel: debouncedFn.cancel,
  };
}

export default useDebounce;